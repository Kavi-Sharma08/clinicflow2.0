import crypto from 'node:crypto';
import { prisma } from '../../db/db.js';
import { calculateCommission, paymentConfig } from '../../config/payment.config.js';
import { createRazorpayOrder, fetchRazorpayOrderByReceipt } from './razorpay.service.js';
import { combineDateAndTime, normalizeDateRange } from '../queue.service.js';

export interface CreatePaymentOrderInput {
  doctorId: string;
  availabilityId: string;
  appointmentDate: string; // ISO date string
  patientId?: string | undefined; // For authenticated patients
  isGuest?: boolean | undefined;
  guestName?: string | undefined;
  guestPhone?: string | undefined;
  guestEmail?: string | undefined;
  notes?: string | undefined;
  urgency?: 'ROUTINE' | 'URGENT' | undefined;
}

export const createBookingPaymentOrder = async (input: CreatePaymentOrderInput) => {
  const parsedDate = new Date(input.appointmentDate);
  if (Number.isNaN(parsedDate.getTime())) {
    throw { status: 400, message: 'Invalid appointment date' };
  }

  const { start, end } = normalizeDateRange(parsedDate);
  const dateStr = start.toISOString().slice(0, 10);

  // ── STEP 1: Fast Atomic Reservation with Advisory Lock ──────────────────
  const reservationResult = await prisma.$transaction(async (tx) => {
    // 1. Acquire transaction advisory lock scoped to (doctorId, date)
    const lockKey = `clinicflow:slot:${input.doctorId}:${dateStr}`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    // 2. Validate availability slot
    const availability = await tx.doctorAvailability.findUnique({
      where: { id: input.availabilityId },
      include: { doctor: { include: { user: true } } },
    });

    if (!availability || !availability.isAvailable || availability.doctorId !== input.doctorId) {
      throw { status: 404, message: 'Doctor availability slot not found or unavailable' };
    }

    // 3. For authenticated patients, prevent duplicate active booking on same date
    if (input.patientId) {
      const existingBooking = await tx.appointment.findFirst({
        where: {
          doctorId: input.doctorId,
          patientId: input.patientId,
          appointmentDate: { gte: start, lt: end },
          status: { in: ['BOOKED', 'CHECKED_IN', 'WAITING', 'IN_CONSULTATION'] },
        },
      });

      if (existingBooking) {
        throw { status: 409, message: 'You already have an active appointment with this doctor on this date' };
      }
    }

    // 4. Count active capacity (Confirmed + unexpired PENDING_PAYMENT holds)
    const now = new Date();
    const activeCount = await tx.appointment.count({
      where: {
        doctorId: input.doctorId,
        appointmentDate: { gte: start, lt: end },
        OR: [
          { status: { in: ['BOOKED', 'CHECKED_IN', 'WAITING', 'IN_CONSULTATION'] } },
          {
            status: 'PENDING_PAYMENT',
            paymentExpiresAt: { gt: now },
          },
        ],
      },
    });

    if (activeCount >= availability.maxAppointments) {
      throw { status: 409, message: 'This slot is fully booked' };
    }

    // 5. Calculate consultation slot timing
    const durationMinutes = availability.consultationDuration ?? 15;
    const slotStartTime = combineDateAndTime(start, availability.startTime);

    // 6. Calculate integer paise amounts & 5% platform commission
    const grossPaise = Math.round(Number(availability.doctor.consultationFee) * 100);
    const feeCalculation = calculateCommission(grossPaise);

    // 7. Security token for guest checkout sessions (if guest)
    let guestCheckoutToken: string | null = null;
    let guestCheckoutTokenHash: string | null = null;
    let guestCheckoutTokenExpiry: Date | null = null;

    if (input.isGuest) {
      guestCheckoutToken = crypto.randomBytes(32).toString('hex');
      guestCheckoutTokenHash = crypto.createHash('sha256').update(guestCheckoutToken).digest('hex');
      guestCheckoutTokenExpiry = new Date(Date.now() + paymentConfig.reservationExpiryMs);
    }

    const paymentExpiresAt = new Date(Date.now() + paymentConfig.reservationExpiryMs);

    // 8. Create Appointment in PENDING_PAYMENT state with NULL queueNumber
    const appointment = await tx.appointment.create({
      data: {
        doctorId: input.doctorId,
        patientId: input.patientId || null,
        isGuest: Boolean(input.isGuest),
        guestName: input.guestName || null,
        guestPhone: input.guestPhone || null,
        guestEmail: input.guestEmail || null,
        appointmentDate: start,
        appointmentTime: slotStartTime,
        scheduledTime: slotStartTime,
        estimatedTime: slotStartTime,
        queueNumber: null, // Nullable! Assigned strictly upon payment confirmation
        status: 'PENDING_PAYMENT',
        urgency: input.urgency === 'URGENT' ? 'URGENT' : 'ROUTINE',
        consultationFee: availability.doctor.consultationFee,
        notes: input.notes?.trim() || null,
        paymentExpiresAt,
        guestCheckoutTokenHash,
        guestCheckoutTokenExpiry,
      },
      include: {
        doctor: { include: { user: true } },
      },
    });

    // 9. Persist Order Intent in DB (Temporary placeholder orderId until gateway call)
    const intentOrderId = `intent_${appointment.id}_${Date.now()}`;
    const paymentOrder = await tx.paymentOrder.create({
      data: {
        appointmentId: appointment.id,
        razorpayOrderId: intentOrderId,
        receipt: appointment.id.slice(0, 40),
        grossAmountPaise: feeCalculation.grossAmountPaise,
        currency: feeCalculation.currency,
        commissionRateBps: feeCalculation.commissionRateBps,
        platformFeePaise: feeCalculation.platformFeePaise,
        doctorSharePaise: feeCalculation.doctorSharePaise,
        status: 'PENDING',
      },
    });

    return {
      appointment,
      paymentOrder,
      feeCalculation,
      guestCheckoutToken,
      paymentExpiresAt,
    };
  });

  // ── STEP 2: Gateway Call Outside DB Transaction ─────────────────────────
  try {
    const razorpayOrder = await createRazorpayOrder({
      amountPaise: reservationResult.feeCalculation.grossAmountPaise,
      currency: reservationResult.feeCalculation.currency,
      receipt: reservationResult.appointment.id,
      notes: {
        appointmentId: reservationResult.appointment.id,
        doctorId: input.doctorId,
        isGuest: String(Boolean(input.isGuest)),
      },
    });

    // ── STEP 3: Update PaymentOrder with Real Gateway Order ID ───────────
    await prisma.paymentOrder.update({
      where: { id: reservationResult.paymentOrder.id },
      data: {
        razorpayOrderId: razorpayOrder.id,
      },
    });

    return {
      appointmentId: reservationResult.appointment.id,
      orderId: razorpayOrder.id,
      amountPaise: reservationResult.feeCalculation.grossAmountPaise,
      currency: reservationResult.feeCalculation.currency,
      keyId: paymentConfig.razorpay.keyId,
      expiresAt: reservationResult.paymentExpiresAt.toISOString(),
      guestCheckoutToken: reservationResult.guestCheckoutToken,
      doctor: {
        id: reservationResult.appointment.doctor.id,
        fullName: `${reservationResult.appointment.doctor.user.firstName} ${reservationResult.appointment.doctor.user.lastName || ''}`.trim(),
        department: reservationResult.appointment.doctor.department,
        consultationFee: Number(reservationResult.appointment.doctor.consultationFee),
      },
    };
  } catch (error) {
    // If Razorpay order creation fails, release the slot immediately
    console.error('[PaymentOrderService] Razorpay order creation failed:', error);
    await prisma.appointment.update({
      where: { id: reservationResult.appointment.id },
      data: { status: 'PAYMENT_EXPIRED' },
    }).catch(() => {});

    throw { status: 502, message: 'Payment gateway currently unavailable. Please try again shortly.' };
  }
};

