import { prisma } from '../../db/db.js';
import {
  fetchRazorpayPayment,
  verifyPaymentSignature,
} from './razorpay.service.js';
import {
  combineDateAndTime,
  getLiveQueueSnapshot,
  normalizeDateRange,
  recalculateQueue,
} from '../queue.service.js';
import { emitQueueUpdated, getRealtimeServer } from '../realtime.service.js';
import { getUserDisplayName } from '../../utils/userDisplay.js';
import { createNotification } from '../notification.service.js';
import {
  sendGuestAppointmentConfirmationEmail,
} from '../email/index.js';
import crypto from 'node:crypto';

export interface ConfirmPaymentParams {
  orderId: string;
  paymentId: string;
  signature?: string | undefined;
  source: 'CLIENT_VERIFY' | 'WEBHOOK';
  patientId?: string | undefined; // For patient auth verification
  guestCheckoutToken?: string | undefined; // For guest checkout cookie verification
}

export const confirmAppointmentPayment = async (params: ConfirmPaymentParams) => {
  const { orderId, paymentId, signature, source } = params;

  // 1. Verify payment signature if triggered from client callback
  if (source === 'CLIENT_VERIFY') {
    if (!signature) {
      throw { status: 400, message: 'Payment signature is required for client verification' };
    }
    const isValidSignature = verifyPaymentSignature({ orderId, paymentId, signature });
    if (!isValidSignature) {
      throw { status: 400, message: 'Invalid payment signature' };
    }
  }

  // 2. Query Razorpay directly to assert payment is captured
  const razorpayPayment = await fetchRazorpayPayment(paymentId);
  if (!razorpayPayment) {
    throw { status: 404, message: 'Payment record not found on payment gateway' };
  }

  if (razorpayPayment.status !== 'captured') {
    throw {
      status: 400,
      message: `Payment is not captured. Current status: ${razorpayPayment.status}`,
    };
  }

  // 2a. Validate that this payment belongs to the expected order
  if (razorpayPayment.order_id !== orderId) {
    throw { status: 400, message: 'Payment does not match the expected Razorpay order ID' };
  }

  // 3. Find the associated PaymentOrder in database
  const paymentOrder = await prisma.paymentOrder.findUnique({
    where: { razorpayOrderId: orderId },
    include: {
      appointment: {
        include: {
          doctor: { include: { user: true } },
          patient: { include: { user: true } },
          paymentOrders: { select: { id: true } },
        },
      },
    },
  });

  if (!paymentOrder) {
    throw { status: 404, message: 'Payment order record not found in database' };
  }

  const { appointment } = paymentOrder;

  // 3b. Verify authorization context
  if (source === 'CLIENT_VERIFY') {
    if (appointment.isGuest) {
      if (!params.guestCheckoutToken) {
        throw { status: 401, message: 'Guest checkout session is missing or expired' };
      }
      const tokenHash = crypto.createHash('sha256').update(params.guestCheckoutToken).digest('hex');
      if (
        !appointment.guestCheckoutTokenHash ||
        appointment.guestCheckoutTokenHash !== tokenHash ||
        (appointment.guestCheckoutTokenExpiry && appointment.guestCheckoutTokenExpiry < new Date())
      ) {
        throw { status: 403, message: 'Invalid or expired guest checkout session' };
      }
    } else if (params.patientId && appointment.patientId) {
      if (appointment.patientId !== params.patientId) {
        throw { status: 403, message: 'Unauthorized: Booking does not belong to this patient' };
      }
    }
  }

  const { start, end } = normalizeDateRange(appointment.appointmentDate);
  const dateStr = start.toISOString().slice(0, 10);

  // 3a. Validate amount and currency against stored order — never trust gateway amounts blindly
  const gatewayAmountPaise = Number(razorpayPayment.amount);
  if (gatewayAmountPaise !== paymentOrder.grossAmountPaise) {
    // Amount mismatch: captured payment does not match what was ordered.
    // Record the attempt and create a refund record — do NOT confirm the appointment.
    await _recordCapturedAttemptAndScheduleRefund({
      paymentOrderId: paymentOrder.id,
      appointmentId: appointment.id,
      paymentId,
      razorpayPayment,
      refundIdempotencyKey: `amount_mismatch_ref_${paymentId}`,
      refundReason: `AMOUNT_MISMATCH: expected ${paymentOrder.grossAmountPaise} paise, got ${gatewayAmountPaise} paise`,
      refundAmountPaise: gatewayAmountPaise,
    });
    throw {
      status: 400,
      message: 'Payment amount does not match the expected order amount. A full refund has been initiated.',
    };
  }

  const gatewayCurrency = (razorpayPayment as any).currency as string | undefined;
  if (gatewayCurrency && gatewayCurrency !== paymentOrder.currency) {
    await _recordCapturedAttemptAndScheduleRefund({
      paymentOrderId: paymentOrder.id,
      appointmentId: appointment.id,
      paymentId,
      razorpayPayment,
      refundIdempotencyKey: `currency_mismatch_ref_${paymentId}`,
      refundReason: `CURRENCY_MISMATCH: expected ${paymentOrder.currency}, got ${gatewayCurrency}`,
      refundAmountPaise: gatewayAmountPaise,
    });
    throw {
      status: 400,
      message: 'Payment currency does not match the expected currency. A full refund has been initiated.',
    };
  }

  // ── STEP 4: Enter Advisory Lock Transaction for All Idempotency + Confirmation Logic ──
  //
  // The lock must be acquired BEFORE the duplicate/idempotency checks so that two
  // concurrent requests for the same payment don't both pass through simultaneously.
  const confirmationResult = await prisma.$transaction(async (tx) => {
    // Acquire single unified advisory lock for (doctorId, date)
    const lockKey = `clinicflow:slot:${appointment.doctorId}:${dateStr}`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    // Row-lock + re-read appointment to get the latest status
    const targetAppointment = await tx.appointment.findUnique({
      where: { id: appointment.id },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });

    if (!targetAppointment) {
      throw { status: 404, message: 'Appointment record not found' };
    }

    // Re-read payment order to get latest confirmedPaymentId
    const currentPaymentOrder = await tx.paymentOrder.findUnique({
      where: { id: paymentOrder.id },
    });

    if (!currentPaymentOrder) {
      throw { status: 404, message: 'Payment order not found' };
    }

    // ── 4a: Idempotent success (this payment already confirmed this appointment) ──
    if (
      targetAppointment.status === 'BOOKED' &&
      currentPaymentOrder.confirmedPaymentId === paymentId
    ) {
      return { appointment: targetAppointment, alreadyConfirmed: true };
    }

    // ── 4b: Appointment BOOKED by a DIFFERENT payment → duplicate captured payment ──
    if (targetAppointment.status === 'BOOKED') {
      // Record attempt for audit
      await tx.paymentAttempt.upsert({
        where: { razorpayPaymentId: paymentId },
        create: {
          paymentOrderId: currentPaymentOrder.id,
          razorpayPaymentId: paymentId,
          status: 'CAPTURED',
          amountPaise: gatewayAmountPaise,
          currency: (razorpayPayment as any).currency || 'INR',
          method: razorpayPayment.method,
          bank: razorpayPayment.bank,
          wallet: razorpayPayment.wallet,
          vpa: razorpayPayment.vpa,
        },
        update: {
          status: 'CAPTURED',
          amountPaise: gatewayAmountPaise,
        },
      });

      // Create a durable duplicate-refund record (idempotent upsert via unique key)
      const dupIdempotencyKey = `dup_ref_${paymentId}`;
      const existingRefund = await tx.refundRecord.findUnique({
        where: { idempotencyKey: dupIdempotencyKey },
      });

      if (!existingRefund) {
        await tx.refundRecord.create({
          data: {
            appointmentId: targetAppointment.id,
            paymentOrderId: currentPaymentOrder.id,
            idempotencyKey: dupIdempotencyKey,
            amountPaise: gatewayAmountPaise,
            reason: 'DUPLICATE_PAYMENT_CAPTURED_FOR_ALREADY_BOOKED_APPOINTMENT',
            status: 'INITIATED',
          },
        });
      }

      return { appointment: targetAppointment, isDuplicatePayment: true };
    }

    // ── 4c: Appointment expired or cancelled — cannot confirm ──
    if (
      targetAppointment.status === 'PAYMENT_EXPIRED' ||
      targetAppointment.status === 'CANCELLED'
    ) {
      // Check if a refund record already exists for this payment
      const expiredIdempotencyKey = `expired_ref_${paymentId}`;
      const existingRefund = await tx.refundRecord.findUnique({
        where: { idempotencyKey: expiredIdempotencyKey },
      });

      if (!existingRefund) {
        await tx.paymentAttempt.upsert({
          where: { razorpayPaymentId: paymentId },
          create: {
            paymentOrderId: currentPaymentOrder.id,
            razorpayPaymentId: paymentId,
            status: 'CAPTURED',
            amountPaise: gatewayAmountPaise,
            currency: (razorpayPayment as any).currency || 'INR',
            method: razorpayPayment.method,
            bank: razorpayPayment.bank,
            wallet: razorpayPayment.wallet,
            vpa: razorpayPayment.vpa,
          },
          update: { status: 'CAPTURED', amountPaise: gatewayAmountPaise },
        });

        await tx.refundRecord.create({
          data: {
            appointmentId: targetAppointment.id,
            paymentOrderId: currentPaymentOrder.id,
            idempotencyKey: expiredIdempotencyKey,
            amountPaise: gatewayAmountPaise,
            reason: `PAYMENT_RECEIVED_FOR_${targetAppointment.status}_APPOINTMENT`,
            status: 'INITIATED',
          },
        });
      }

      return { appointment: targetAppointment, refundInitiated: true, appointmentStatus: targetAppointment.status };
    }

    // ── 4d: Check late payment on PENDING_PAYMENT appointment ──
    // Even if the reservation isn't expired, the slot might have been oversold
    // while this payment was in-flight. Always verify capacity under the lock.
    const isExpired =
      targetAppointment.paymentExpiresAt &&
      targetAppointment.paymentExpiresAt <= new Date();

    // Find the specific availability slot that was used for this appointment.
    // We filter by doctorId and also confirm it still exists and is active.
    // We use the appointmentTime to find the matching slot's day configuration.
    const confirmedActiveCount = await tx.appointment.count({
      where: {
        doctorId: targetAppointment.doctorId,
        appointmentDate: { gte: start, lt: end },
        status: { in: ['BOOKED', 'CHECKED_IN', 'WAITING', 'IN_CONSULTATION'] },
      },
    });

    // Find the slot by doctorId. This is best-effort: if the schedule was
    // deleted, we still proceed (the slot was valid at booking time).
    const availabilitySlot = await tx.doctorAvailability.findFirst({
      where: {
        doctorId: targetAppointment.doctorId,
        isAvailable: true,
        startTime: {
          // Match by time-of-day (HH:MM) stored in availability
          equals: targetAppointment.appointmentTime.toISOString().slice(11, 16),
        },
      },
    });

    // Fall back to any slot for this doctor if exact match fails
    const anySlot = availabilitySlot ?? (await tx.doctorAvailability.findFirst({
      where: { doctorId: targetAppointment.doctorId, isAvailable: true },
    }));

    const maxCapacity = anySlot?.maxAppointments ?? 999;

    if (isExpired && confirmedActiveCount >= maxCapacity) {
      // OVERCAPACITY after expiry: commit PAYMENT_EXPIRED + refund record,
      // then RETURN (do NOT throw) so the transaction commits.
      await tx.appointment.update({
        where: { id: targetAppointment.id },
        data: { status: 'PAYMENT_EXPIRED' },
      });

      const overcapKey = `overcap_ref_${paymentId}`;
      const existingOvercapRefund = await tx.refundRecord.findUnique({
        where: { idempotencyKey: overcapKey },
      });

      if (!existingOvercapRefund) {
        await tx.refundRecord.create({
          data: {
            appointmentId: targetAppointment.id,
            paymentOrderId: currentPaymentOrder.id,
            idempotencyKey: overcapKey,
            amountPaise: paymentOrder.grossAmountPaise,
            reason: 'PAYMENT_RECEIVED_AFTER_EXPIRY_SLOT_OVERCAPACITY',
            status: 'INITIATED',
          },
        });
      }

      return {
        appointment: { ...targetAppointment, status: 'PAYMENT_EXPIRED' as const },
        overcapacityRefundInitiated: true,
      };
    }

    // ── 4e: Record PaymentAttempt ──
    await tx.paymentAttempt.upsert({
      where: { razorpayPaymentId: paymentId },
      create: {
        paymentOrderId: currentPaymentOrder.id,
        razorpayPaymentId: paymentId,
        status: 'CAPTURED',
        amountPaise: gatewayAmountPaise,
        currency: (razorpayPayment as any).currency || 'INR',
        method: razorpayPayment.method,
        bank: razorpayPayment.bank,
        wallet: razorpayPayment.wallet,
        vpa: razorpayPayment.vpa,
      },
      update: {
        status: 'CAPTURED',
        amountPaise: gatewayAmountPaise,
      },
    });

    // ── 4f: Compute Sequential Queue Number Atomically ──
    const lastIssued = await tx.appointment.aggregate({
      where: {
        doctorId: targetAppointment.doctorId,
        appointmentDate: { gte: start, lt: end },
        queueNumber: { not: null },
      },
      _max: { queueNumber: true },
    });
    const nextQueueNumber = (lastIssued._max.queueNumber ?? 0) + 1;

    // Calculate scheduled time from queue number
    const durationMinutes = anySlot?.consultationDuration ?? 15;
    const scheduledTime = new Date(
      targetAppointment.appointmentTime.getTime() +
        (nextQueueNumber - 1) * durationMinutes * 60 * 1000,
    );

    // Generate secure booking reference and guest management token if guest
    let guestTokenHash: string | null = null;
    let rawGuestToken: string | null = null;
    let bookingReference = targetAppointment.bookingReference;

    if (targetAppointment.isGuest) {
      rawGuestToken = crypto.randomBytes(32).toString('hex');
      guestTokenHash = crypto.createHash('sha256').update(rawGuestToken).digest('hex');
      const timestampPart = Date.now().toString(36).toUpperCase();
      const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
      bookingReference = `CF-${timestampPart}-${randomPart}`;
    }

    // ── 4g: Update Appointment to BOOKED ──
    const updatedAppointment = await tx.appointment.update({
      where: { id: targetAppointment.id },
      data: {
        status: 'BOOKED',
        queueNumber: nextQueueNumber,
        scheduledTime,
        estimatedTime: scheduledTime,
        paymentExpiresAt: null,                  // Clear hold
        guestCheckoutTokenHash: null,            // Revoke temporary checkout session
        guestCheckoutTokenExpiry: null,
        guestTokenHash: guestTokenHash || targetAppointment.guestTokenHash,
        bookingReference: bookingReference || targetAppointment.bookingReference,
        confirmedPaymentOrderId: paymentOrder.id,
      },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });

    // ── 4h: Update PaymentOrder status to SUCCESS ──
    await tx.paymentOrder.update({
      where: { id: currentPaymentOrder.id },
      data: {
        status: 'SUCCESS',
        confirmedPaymentId: paymentId,
      },
    });

    // ── 4i: Create DoctorSettlementLedger record ──
    await tx.doctorSettlementLedger.create({
      data: {
        doctorId: updatedAppointment.doctorId,
        appointmentId: updatedAppointment.id,
        paymentOrderId: currentPaymentOrder.id,
        allocatedAmountPaise: currentPaymentOrder.doctorSharePaise,
        settlementStatus: 'PENDING_COMPLETION',
      },
    });

    return {
      appointment: updatedAppointment,
      rawGuestToken,
      nextQueueNumber,
    };
  });

  // ── Handle non-confirmation results (all branches committed successfully) ──
  if ('alreadyConfirmed' in confirmationResult && confirmationResult.alreadyConfirmed) {
    const apt = confirmationResult.appointment;
    return {
      isAlreadyConfirmed: true,
      success: true,
      message: 'Payment already verified and appointment confirmed',
      appointmentId: apt.id,
      queueNumber: apt.queueNumber,
      bookingReference: apt.bookingReference,
    };
  }

  if ('isDuplicatePayment' in confirmationResult && confirmationResult.isDuplicatePayment) {
    return {
      isDuplicatePayment: true,
      message: 'Duplicate payment detected. Full refund has been scheduled.',
      appointmentId: confirmationResult.appointment.id,
    };
  }

  if ('refundInitiated' in confirmationResult && confirmationResult.refundInitiated) {
    return {
      refundInitiated: true,
      message: `Appointment is ${confirmationResult.appointmentStatus?.toLowerCase()}. Full refund has been scheduled.`,
      appointmentId: confirmationResult.appointment.id,
    };
  }

  if ('overcapacityRefundInitiated' in confirmationResult && confirmationResult.overcapacityRefundInitiated) {
    return {
      overcapacityRefund: true,
      message: 'Slot is now at capacity. Full refund has been initiated.',
      appointmentId: confirmationResult.appointment.id,
    };
  }

  // ── Post-Confirmation Async Side Effects (Queue Recalc, Realtime & Emails) ──
  const finalAppointment = confirmationResult.appointment;

  await recalculateQueue(finalAppointment.doctorId, finalAppointment.appointmentDate).catch(() => {});

  // Socket.IO updates
  const io = getRealtimeServer();
  if (io) {
    const snapshot = await getLiveQueueSnapshot(finalAppointment.doctorId, finalAppointment.appointmentDate);
    io.to(`queue:doctor:${finalAppointment.doctorId}:${dateStr}`).emit('queue:snapshot', snapshot);
    io.to(`queue:doctor:${finalAppointment.doctorId}:${dateStr}`).emit('queue:patient-added', finalAppointment);
  }

  // Doctor & Patient Notifications
  if (finalAppointment.patient) {
    await createNotification({
      recipientId: finalAppointment.patient.userId,
      type: 'APPOINTMENT_BOOKED',
      title: 'Appointment Confirmed & Paid',
      message: `Your appointment with Dr. ${getUserDisplayName(finalAppointment.doctor.user)} is confirmed. Queue #${finalAppointment.queueNumber}.`,
      entityType: 'appointment',
      entityId: finalAppointment.id,
      metadata: { queueNumber: finalAppointment.queueNumber, paymentId },
    }).catch(() => {});
  }

  await createNotification({
    recipientId: finalAppointment.doctor.userId,
    type: 'APPOINTMENT_BOOKED',
    priority: finalAppointment.urgency === 'URGENT' ? 'HIGH' : 'NORMAL',
    title: 'New Paid Appointment',
    message: `${finalAppointment.guestName || (finalAppointment.patient ? getUserDisplayName(finalAppointment.patient.user) : 'Patient')} paid & booked Queue #${finalAppointment.queueNumber}.`,
    entityType: 'appointment',
    entityId: finalAppointment.id,
    metadata: { queueNumber: finalAppointment.queueNumber, paymentId },
  }).catch(() => {});

  // Send guest confirmation email with permanent management link if guest
  if (finalAppointment.isGuest && finalAppointment.guestEmail && confirmationResult.rawGuestToken) {
    const dateFormatted = finalAppointment.appointmentDate.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
    const timeFormatted = finalAppointment.scheduledTime
      ? finalAppointment.scheduledTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' })
      : finalAppointment.appointmentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });

    await sendGuestAppointmentConfirmationEmail({
      to: finalAppointment.guestEmail,
      patientName: finalAppointment.guestName || 'Patient',
      doctorName: getUserDisplayName(finalAppointment.doctor.user),
      department: finalAppointment.doctor.department,
      appointmentDate: dateFormatted,
      appointmentTime: timeFormatted,
      queueNumber: finalAppointment.queueNumber!,
      bookingReference: finalAppointment.bookingReference || 'N/A',
      managementToken: confirmationResult.rawGuestToken,
    }).catch((err) => console.warn('[PaymentConfirmation] Guest email failed:', err));
  }

  return {
    success: true,
    message: 'Payment verified and appointment confirmed',
    appointmentId: finalAppointment.id,
    queueNumber: finalAppointment.queueNumber,
    bookingReference: finalAppointment.bookingReference,
    managementToken: confirmationResult.rawGuestToken,
  };
};

// ── Private helper: record a captured attempt and create a refund record (outside tx) ──
async function _recordCapturedAttemptAndScheduleRefund(opts: {
  paymentOrderId: string;
  appointmentId: string;
  paymentId: string;
  razorpayPayment: Awaited<ReturnType<typeof fetchRazorpayPayment>>;
  refundIdempotencyKey: string;
  refundReason: string;
  refundAmountPaise: number;
}) {
  const { paymentOrderId, appointmentId, paymentId, razorpayPayment, refundIdempotencyKey, refundReason, refundAmountPaise } = opts;

  await prisma.$transaction(async (tx) => {
    await tx.paymentAttempt.upsert({
      where: { razorpayPaymentId: paymentId },
      create: {
        paymentOrderId,
        razorpayPaymentId: paymentId,
        status: 'CAPTURED',
        amountPaise: refundAmountPaise,
        currency: (razorpayPayment as any).currency || 'INR',
        method: razorpayPayment.method,
        bank: razorpayPayment.bank,
        wallet: razorpayPayment.wallet,
        vpa: razorpayPayment.vpa,
      },
      update: { status: 'CAPTURED', amountPaise: refundAmountPaise },
    });

    const existing = await tx.refundRecord.findUnique({ where: { idempotencyKey: refundIdempotencyKey } });
    if (!existing) {
      await tx.refundRecord.create({
        data: {
          appointmentId,
          paymentOrderId,
          idempotencyKey: refundIdempotencyKey,
          amountPaise: refundAmountPaise,
          reason: refundReason,
          status: 'INITIATED',
        },
      });
    }
  });
}
