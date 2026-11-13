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
  signature?: string;
  source: 'CLIENT_VERIFY' | 'WEBHOOK';
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
        },
      },
    },
  });

  if (!paymentOrder) {
    throw { status: 404, message: 'Payment order record not found in database' };
  }

  const { appointment } = paymentOrder;
  const { start, end } = normalizeDateRange(appointment.appointmentDate);
  const dateStr = start.toISOString().slice(0, 10);

  // 4. Record or update PaymentAttempt
  await prisma.paymentAttempt.upsert({
    where: { razorpayPaymentId: paymentId },
    create: {
      paymentOrderId: paymentOrder.id,
      razorpayPaymentId: paymentId,
      status: 'CAPTURED',
      amountPaise: Number(razorpayPayment.amount),
      currency: razorpayPayment.currency,
      method: razorpayPayment.method,
      bank: razorpayPayment.bank,
      wallet: razorpayPayment.wallet,
      vpa: razorpayPayment.vpa,
    },
    update: {
      status: 'CAPTURED',
      amountPaise: Number(razorpayPayment.amount),
    },
  });

  // 5. Check if appointment was already confirmed (IDEMPOTENT SUCCESS)
  if (appointment.status === 'BOOKED') {
    if (paymentOrder.confirmedPaymentId === paymentId) {
      return {
        isAlreadyConfirmed: true,
        appointment,
        queueNumber: appointment.queueNumber,
        bookingReference: appointment.bookingReference,
      };
    }

    // Edge case: DUPLICATE CAPTURED PAYMENT for an already confirmed appointment!
    // Trigger automated 100% refund for the duplicate charge
    const idempotencyKey = `dup_ref_${paymentId}`;
    await prisma.refundRecord.create({
      data: {
        appointmentId: appointment.id,
        paymentOrderId: paymentOrder.id,
        idempotencyKey,
        amountPaise: Number(razorpayPayment.amount),
        reason: 'DUPLICATE_PAYMENT_CAPTURED_FOR_ALREADY_BOOKED_APPOINTMENT',
        status: 'INITIATED',
      },
    });

    return {
      isDuplicatePayment: true,
      message: 'Duplicate payment detected. Full refund scheduled automatically.',
      appointment,
    };
  }

  // ── STEP 6: Execute Atomic Confirmation under Canonical Advisory Lock ──
  const confirmationResult = await prisma.$transaction(async (tx) => {
    // Acquire single unified advisory lock for (doctorId, date)
    const lockKey = `clinicflow:slot:${appointment.doctorId}:${dateStr}`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    // Row-lock target appointment
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

    if (targetAppointment.status === 'BOOKED') {
      return { appointment: targetAppointment, alreadyConfirmed: true };
    }

    // ── Check Late Payment Capacity ──
    const isExpired = targetAppointment.paymentExpiresAt && targetAppointment.paymentExpiresAt <= new Date();
    if (isExpired) {
      // Re-verify availability capacity before honoring late payment
      const activeCount = await tx.appointment.count({
        where: {
          doctorId: targetAppointment.doctorId,
          appointmentDate: { gte: start, lt: end },
          status: { in: ['BOOKED', 'CHECKED_IN', 'WAITING', 'IN_CONSULTATION'] },
        },
      });

      const slot = await tx.doctorAvailability.findFirst({
        where: {
          doctorId: targetAppointment.doctorId,
          isAvailable: true,
        },
      });

      if (slot && activeCount >= slot.maxAppointments) {
        // OVERCAPACITY: Mark PAYMENT_EXPIRED and schedule full refund
        await tx.appointment.update({
          where: { id: targetAppointment.id },
          data: { status: 'PAYMENT_EXPIRED' },
        });

        await tx.refundRecord.create({
          data: {
            appointmentId: targetAppointment.id,
            paymentOrderId: paymentOrder.id,
            idempotencyKey: `overcap_ref_${paymentId}`,
            amountPaise: paymentOrder.grossAmountPaise,
            reason: 'PAYMENT_RECEIVED_AFTER_EXPIRY_SLOT_OVERCAPACITY',
            status: 'INITIATED',
          },
        });

        throw {
          status: 409,
          message: 'Payment received after reservation expired and slot is now full. A full 100% refund has been initiated.',
        };
      }
    }

    // ── Compute Sequential Queue Number Atomically ──
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
    const durationMinutes = 15;
    const scheduledTime = new Date(targetAppointment.appointmentTime.getTime() + (nextQueueNumber - 1) * durationMinutes * 60 * 1000);

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

    // Update Appointment to BOOKED
    const updatedAppointment = await tx.appointment.update({
      where: { id: targetAppointment.id },
      data: {
        status: 'BOOKED',
        queueNumber: nextQueueNumber,
        scheduledTime,
        estimatedTime: scheduledTime,
        paymentExpiresAt: null, // Clear hold
        guestCheckoutTokenHash: null, // Revoke temporary checkout session
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

    // Update PaymentOrder status to SUCCESS
    await tx.paymentOrder.update({
      where: { id: paymentOrder.id },
      data: {
        status: 'SUCCESS',
        confirmedPaymentId: paymentId,
      },
    });

    // Create DoctorSettlementLedger record (PENDING_COMPLETION until consultation finishes)
    await tx.doctorSettlementLedger.create({
      data: {
        doctorId: updatedAppointment.doctorId,
        appointmentId: updatedAppointment.id,
        paymentOrderId: paymentOrder.id,
        allocatedAmountPaise: paymentOrder.doctorSharePaise,
        settlementStatus: 'PENDING_COMPLETION',
      },
    });

    return {
      appointment: updatedAppointment,
      rawGuestToken,
      nextQueueNumber,
    };
  });

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

