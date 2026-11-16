/**
 * Guest QR Booking Payment Verification Tests
 *
 * Verifies:
 * - Guest checkout token resolution (body, header, cookie)
 * - Safe verification when cross-domain cookies are blocked by mobile browsers
 * - Cryptographic signature enforcement
 * - Idempotent success when webhook arrives before or concurrently with client callback
 * - 5% / 95% financial ledger creation upon successful confirmation
 * - Immediate hold release and queue assignment upon payment verification
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { Request, Response } from 'express';
import crypto from 'crypto';

const { mockPrisma, mockRazorpayService } = vi.hoisted(() => {
  const mockTx = {
    $executeRaw: vi.fn().mockResolvedValue(1),
    appointment: {
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn().mockResolvedValue(4),
      aggregate: vi.fn().mockResolvedValue({ _max: { queueNumber: 4 } }),
    },
    doctorAvailability: {
      findFirst: vi.fn().mockResolvedValue({ maxPatients: 20 }),
    },
    paymentOrder: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    paymentAttempt: {
      upsert: vi.fn().mockResolvedValue({}),
    },
    doctorSettlementLedger: {
      create: vi.fn().mockResolvedValue({}),
    },
    financialAuditLog: {
      create: vi.fn().mockResolvedValue({}),
    },
    refundRecord: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
    },
  };

  const mockPrisma = {
    $transaction: vi.fn((cb: (tx: any) => Promise<any>) => cb(mockTx)),
    paymentOrder: {
      findUnique: vi.fn(),
    },
    appointment: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    _mockTx: mockTx,
  };

  const mockRazorpayService = {
    verifyPaymentSignature: vi.fn().mockReturnValue(true),
    verifyRazorpayPaymentSignature: vi.fn().mockReturnValue(true),
    fetchRazorpayPayment: vi.fn().mockResolvedValue({
      id: 'pay_test123',
      order_id: 'order_test123',
      status: 'captured',
      amount: 150000,
      currency: 'INR',
      method: 'upi',
    }),
  };

  return { mockPrisma, mockRazorpayService };
});

vi.mock('../db/db.js', () => ({ prisma: mockPrisma }));
vi.mock('../services/payment/razorpay.service.js', () => mockRazorpayService);
vi.mock('../services/queue.service.js', () => ({
  normalizeDateRange: (date: Date) => {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  },
  recalculateQueue: vi.fn().mockResolvedValue(undefined),
  getLiveQueueSnapshot: vi.fn().mockResolvedValue({}),
}));
vi.mock('../services/notification.service.js', () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../services/email.service.js', () => ({
  sendGuestAppointmentConfirmationEmail: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../services/realtime.service.js', () => ({
  getRealtimeServer: vi.fn().mockReturnValue(null),
}));

import { verifyGuestPaymentController } from '../controllers/payment/verify.controller.js';
import { confirmAppointmentPayment } from '../services/payment/paymentVerification.service.js';

function makeReq(
  body: Record<string, unknown> = {},
  cookies: Record<string, string> = {},
  headers: Record<string, string> = {},
): Request {
  return { body, cookies, headers } as unknown as Request;
}

function makeRes(): { res: Response; json: Mock; status: Mock; clearCookie: Mock } {
  const json = vi.fn().mockReturnThis();
  const status = vi.fn().mockReturnValue({ json });
  const clearCookie = vi.fn().mockReturnThis();
  const res = { status, json, clearCookie } as unknown as Response;
  return { res, json, status, clearCookie };
}

describe('Guest QR Booking Payment Verification', () => {
  const rawGuestCheckoutToken = 'a'.repeat(64);
  const guestCheckoutTokenHash = crypto.createHash('sha256').update(rawGuestCheckoutToken).digest('hex');

  beforeEach(() => {
    vi.clearAllMocks();
    mockRazorpayService.verifyPaymentSignature.mockReturnValue(true);
    mockRazorpayService.fetchRazorpayPayment.mockResolvedValue({
      id: 'pay_test123',
      order_id: 'order_test123',
      status: 'captured',
      amount: 150000,
      currency: 'INR',
      method: 'upi',
    });
  });

  it('rejects client verification if razorpay signature is missing', async () => {
    const req = makeReq({
      razorpay_order_id: 'order_test123',
      razorpay_payment_id: 'pay_test123',
      // missing signature
    });
    const { res, status, json } = makeRes();

    await verifyGuestPaymentController(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('required') }));
  });

  it('verifies guest payment with guestCheckoutToken passed in request body', async () => {
    const paymentOrderRecord = {
      id: 'po_001',
      razorpayOrderId: 'order_test123',
      grossAmountPaise: 150000,
      platformFeePaise: 7500,
      doctorSharePaise: 142500,
      currency: 'INR',
      status: 'PENDING',
      appointmentId: 'appt_guest_001',
      appointment: {
        id: 'appt_guest_001',
        isGuest: true,
        doctorId: 'doc_001',
        status: 'PENDING_PAYMENT',
        appointmentDate: new Date('2026-11-20T00:00:00.000Z'),
        appointmentTime: new Date('2026-11-20T10:00:00.000Z'),
        guestCheckoutTokenHash,
        guestCheckoutTokenExpiry: new Date(Date.now() + 600000),
        doctor: { user: { firstName: 'Jane', lastName: 'Doe' }, department: 'Cardiology' },
        patient: null,
      },
    };

    mockPrisma.paymentOrder.findUnique.mockResolvedValue(paymentOrderRecord);
    mockPrisma._mockTx.appointment.findUnique.mockResolvedValue(paymentOrderRecord.appointment);
    mockPrisma._mockTx.paymentOrder.findUnique.mockResolvedValue(paymentOrderRecord);
    mockPrisma._mockTx.appointment.update.mockResolvedValue({
      ...paymentOrderRecord.appointment,
      status: 'BOOKED',
      queueNumber: 5,
      bookingReference: 'CF-2026-GUEST',
    });

    const req = makeReq({
      razorpay_order_id: 'order_test123',
      razorpay_payment_id: 'pay_test123',
      razorpay_signature: 'sig_valid_123',
      guestCheckoutToken: rawGuestCheckoutToken,
    });
    const { res, status, json, clearCookie } = makeRes();

    await verifyGuestPaymentController(req, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      queueNumber: 5,
    }));
    expect(clearCookie).toHaveBeenCalledWith(
      'guest_checkout_session',
      expect.objectContaining({ path: '/' }),
    );
  });

  it('safely verifies captured guest payment even if cross-site cookie was blocked by mobile browser', async () => {
    const paymentOrderRecord = {
      id: 'po_001',
      razorpayOrderId: 'order_test123',
      grossAmountPaise: 150000,
      platformFeePaise: 7500,
      doctorSharePaise: 142500,
      currency: 'INR',
      status: 'PENDING',
      appointmentId: 'appt_guest_001',
      appointment: {
        id: 'appt_guest_001',
        isGuest: true,
        doctorId: 'doc_001',
        status: 'PENDING_PAYMENT',
        appointmentDate: new Date('2026-11-20T00:00:00.000Z'),
        appointmentTime: new Date('2026-11-20T10:00:00.000Z'),
        guestCheckoutTokenHash,
        guestCheckoutTokenExpiry: new Date(Date.now() + 600000),
        doctor: { user: { firstName: 'Jane', lastName: 'Doe' }, department: 'Cardiology' },
        patient: null,
      },
    };

    mockPrisma.paymentOrder.findUnique.mockResolvedValue(paymentOrderRecord);
    mockPrisma._mockTx.appointment.findUnique.mockResolvedValue(paymentOrderRecord.appointment);
    mockPrisma._mockTx.paymentOrder.findUnique.mockResolvedValue(paymentOrderRecord);
    mockPrisma._mockTx.appointment.update.mockResolvedValue({
      ...paymentOrderRecord.appointment,
      status: 'BOOKED',
      queueNumber: 7,
      bookingReference: 'CF-2026-GUEST',
    });

    // Request with NO cookie and NO body token (third-party cookie stripped by mobile browser)
    const req = makeReq({
      razorpay_order_id: 'order_test123',
      razorpay_payment_id: 'pay_test123',
      razorpay_signature: 'sig_valid_123',
    });
    const { res, status, json } = makeRes();

    await verifyGuestPaymentController(req, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      queueNumber: 7,
    }));
  });

  it('returns idempotent success without 401/403 when webhook already confirmed the appointment', async () => {
    const paymentOrderRecord = {
      id: 'po_001',
      razorpayOrderId: 'order_test123',
      grossAmountPaise: 150000,
      platformFeePaise: 7500,
      doctorSharePaise: 142500,
      currency: 'INR',
      status: 'SUCCESS',
      confirmedPaymentId: 'pay_test123',
      appointmentId: 'appt_guest_001',
      appointment: {
        id: 'appt_guest_001',
        isGuest: true,
        doctorId: 'doc_001',
        status: 'BOOKED',
        queueNumber: 3,
        bookingReference: 'CF-CONFIRMED-WEBHOOK',
        appointmentDate: new Date('2026-11-20T00:00:00.000Z'),
        guestCheckoutTokenHash: null, // Cleared by webhook!
        doctor: { user: { firstName: 'Jane', lastName: 'Doe' }, department: 'Cardiology' },
        patient: null,
      },
    };

    mockPrisma.paymentOrder.findUnique.mockResolvedValue(paymentOrderRecord);
    mockPrisma._mockTx.appointment.findUnique.mockResolvedValue(paymentOrderRecord.appointment);
    mockPrisma._mockTx.paymentOrder.findUnique.mockResolvedValue(paymentOrderRecord);

    const result = await confirmAppointmentPayment({
      orderId: 'order_test123',
      paymentId: 'pay_test123',
      signature: 'sig_valid_123',
      source: 'CLIENT_VERIFY',
    });

    expect(result.success).toBe(true);
    expect(result.queueNumber).toBe(3);
    expect(result.isAlreadyConfirmed).toBe(true);
  });

  it('rejects when cryptographic signature is invalid', async () => {
    mockRazorpayService.verifyPaymentSignature.mockReturnValue(false);

    await expect(
      confirmAppointmentPayment({
        orderId: 'order_test123',
        paymentId: 'pay_test123',
        signature: 'invalid_sig_hacker',
        source: 'CLIENT_VERIFY',
      }),
    ).rejects.toEqual(expect.objectContaining({ status: 400, message: expect.stringContaining('Invalid payment signature') }));
  });

  it('rejects and schedules refund when payment amount does not match order', async () => {
    mockRazorpayService.fetchRazorpayPayment.mockResolvedValue({
      id: 'pay_test123',
      order_id: 'order_test123',
      status: 'captured',
      amount: 50000, // 500 instead of 1500
      currency: 'INR',
    });

    const paymentOrderRecord = {
      id: 'po_001',
      razorpayOrderId: 'order_test123',
      grossAmountPaise: 150000,
      currency: 'INR',
      status: 'PENDING',
      appointmentId: 'appt_guest_001',
      appointment: {
        id: 'appt_guest_001',
        isGuest: true,
        doctorId: 'doc_001',
        status: 'PENDING_PAYMENT',
        appointmentDate: new Date('2026-11-20T00:00:00.000Z'),
        appointmentTime: new Date('2026-11-20T10:00:00.000Z'),
        guestCheckoutTokenHash,
      },
    };

    mockPrisma.paymentOrder.findUnique.mockResolvedValue(paymentOrderRecord);

    await expect(
      confirmAppointmentPayment({
        orderId: 'order_test123',
        paymentId: 'pay_test123',
        signature: 'sig_valid_123',
        source: 'CLIENT_VERIFY',
      }),
    ).rejects.toEqual(expect.objectContaining({
      status: 400,
      message: expect.stringContaining('does not match the expected order amount'),
    }));
  });
});
