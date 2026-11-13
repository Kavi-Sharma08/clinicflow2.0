import { type Request, type Response } from 'express';
import { prisma } from '../../db/db.js';
import { createBookingPaymentOrder } from '../../services/payment/paymentOrder.service.js';
import { paymentConfig } from '../../config/payment.config.js';

export const createPatientPaymentOrderController = async (req: Request, res: Response) => {
  try {
    const { availabilityId, appointmentDate, notes, urgency } = req.body as {
      availabilityId?: string;
      appointmentDate?: string;
      notes?: string;
      urgency?: 'ROUTINE' | 'URGENT';
    };

    const userId = req.user!.id;

    if (!availabilityId || typeof availabilityId !== 'string') {
      return res.status(400).json({ success: false, message: 'availabilityId is required' });
    }
    if (!appointmentDate || typeof appointmentDate !== 'string') {
      return res.status(400).json({ success: false, message: 'appointmentDate is required' });
    }

    // Resolve patient profile
    let patientProfile = await prisma.patientProfile.findUnique({ where: { userId } });
    if (!patientProfile) {
      patientProfile = await prisma.patientProfile.create({
        data: { userId, patientId: `PT-${Date.now().toString(36).toUpperCase()}` },
      });
    }

    // Get doctor availability slot to identify doctorId
    const slot = await prisma.doctorAvailability.findUnique({
      where: { id: availabilityId },
      select: { doctorId: true },
    });

    if (!slot) {
      return res.status(404).json({ success: false, message: 'Availability slot not found' });
    }

    const orderData = await createBookingPaymentOrder({
      doctorId: slot.doctorId,
      availabilityId,
      appointmentDate,
      patientId: patientProfile.id,
      isGuest: false,
      notes,
      urgency,
    });

    return res.status(201).json({
      success: true,
      message: 'Payment order created and slot held for 10 minutes',
      data: orderData,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Create patient payment order error:', error);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

export const createGuestPaymentOrderController = async (req: Request, res: Response) => {
  try {
    const {
      doctorId,
      availabilityId,
      appointmentDate,
      guestName,
      guestPhone,
      guestEmail,
      notes,
      urgency,
    } = req.body as {
      doctorId?: string;
      availabilityId?: string;
      appointmentDate?: string;
      guestName?: string;
      guestPhone?: string;
      guestEmail?: string;
      notes?: string;
      urgency?: 'ROUTINE' | 'URGENT';
    };

    if (!doctorId || typeof doctorId !== 'string') {
      return res.status(400).json({ success: false, message: 'doctorId is required' });
    }
    if (!availabilityId || typeof availabilityId !== 'string') {
      return res.status(400).json({ success: false, message: 'availabilityId is required' });
    }
    if (!appointmentDate || typeof appointmentDate !== 'string') {
      return res.status(400).json({ success: false, message: 'appointmentDate is required' });
    }
    if (!guestName || typeof guestName !== 'string' || !guestName.trim()) {
      return res.status(400).json({ success: false, message: 'Guest full name is required' });
    }
    if (!guestPhone || typeof guestPhone !== 'string' || !guestPhone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const orderData = await createBookingPaymentOrder({
      doctorId,
      availabilityId,
      appointmentDate,
      isGuest: true,
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      guestEmail: guestEmail?.trim() || undefined,
      notes,
      urgency,
    });

    // Set HttpOnly guest checkout session cookie for secure refresh/retry handling
    if (orderData.guestCheckoutToken) {
      res.cookie('guest_checkout_session', orderData.guestCheckoutToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: paymentConfig.reservationExpiryMs,
        path: '/api/public/payments',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Payment order created and slot held for 10 minutes',
      data: orderData,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Create guest payment order error:', error);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

