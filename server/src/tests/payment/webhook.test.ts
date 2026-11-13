/**
 * Webhook processing unit tests
 *
 * Strategy:
 *  - Pure-logic tests for signature verification are already in signature.test.ts.
 *  - Here we test the stateful webhook pipeline by mocking Prisma and
 *    the confirmAppointmentPayment service.
 *  - We import the functions under test AFTER vi.mock() calls so that the
 *    mocked modules are in place (vitest hoists vi.mock to the top).
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import crypto from 'node:crypto';

// ── Prisma mock ────────────────────────────────────────────────────────────────
vi.mock('../../db/db.js', () => ({
  prisma: {
    webhookEvent: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
    paymentOrder: { findUnique: vi.fn() },
    paymentAttempt: { upsert: vi.fn() },
    financialAuditLog: { create: vi.fn() },
    refundRecord: { updateMany: vi.fn() },
  },
}));

// ── Razorpay service mock (for verifyWebhookSignature) ─────────────────────────
vi.mock('../../services/payment/razorpay.service.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/payment/razorpay.service.js')>();
  return { ...actual }; // use real verifyWebhookSignature — it is pure
});

// ── Payment verification service mock ─────────────────────────────────────────
vi.mock('../../services/payment/paymentVerification.service.js', () => ({
  confirmAppointmentPayment: vi.fn(),
}));

// ── Payment config mock ────────────────────────────────────────────────────────
vi.mock('../../config/payment.config.js', () => ({
  paymentConfig: {
    razorpay: {
      keyId: 'rzp_test_key',
      keySecret: 'test_key_secret_12345678',
      webhookSecret: 'test_webhook_secret_6789',
    },
    currency: 'INR',
    commissionBps: 500,
    holdMinutes: 10,
  },
  calculateCommission: (gross: number, bps = 500) => {
    const fee = Math.round((gross * bps) / 10000);
    return { grossAmountPaise: gross, platformFeePaise: fee, doctorSharePaise: gross - fee, commissionRateBps: bps };
  },
}));

import { prisma } from '../../db/db.js';
import { processWebhookEventAsync, recoverPendingWebhookEvents } from '../../controllers/payment/webhook.controller.js';
import { confirmAppointmentPayment } from '../../services/payment/paymentVerification.service.js';
import { verifyWebhookSignature } from '../../services/payment/razorpay.service.js';
import { paymentConfig } from '../../config/payment.config.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeSignature(rawBody: Buffer | string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

function makeWebhookEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'db-event-uuid-001',
    eventId: 'evt_razorpay_001',
    eventType: 'order.paid',
    attempts: 0,
    maxAttempts: 5,
    status: 'PROCESSING',
    payloadSummary: {
      event: 'order.paid',
      payload: {
        order: { entity: { id: 'order_ABC123' } },
        payment: { entity: { id: 'pay_XYZ456', order_id: 'order_ABC123', amount: 150000, currency: 'INR' } },
      },
    },
    lockedAt: new Date(),
    lockedBy: 'worker_test',
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Webhook Signature Verification (pure function)', () => {
  const webhookSecret = 'test_webhook_secret_6789';

  beforeEach(() => {
    (paymentConfig.razorpay as any).webhookSecret = webhookSecret;
  });

  it('accepts a valid HMAC-SHA256 webhook signature (Buffer payload)', () => {
    const body = Buffer.from(JSON.stringify({ event: 'order.paid', event_id: 'evt_001' }), 'utf-8');
    const sig = makeSignature(body, webhookSecret);
    expect(verifyWebhookSignature(body, sig)).toBe(true);
  });

  it('rejects a tampered payload', () => {
    const original = Buffer.from(JSON.stringify({ event: 'order.paid', event_id: 'evt_001' }));
    const tampered = Buffer.from(JSON.stringify({ event: 'order.paid', event_id: 'evt_999' }));
    const sig = makeSignature(original, webhookSecret);
    expect(verifyWebhookSignature(tampered, sig)).toBe(false);
  });

  it('rejects an empty signature gracefully (no crash)', () => {
    const body = Buffer.from('{}');
    expect(verifyWebhookSignature(body, '')).toBe(false);
  });

  it('rejects a signature of different length without crashing (timingSafeEqual guard)', () => {
    // Previously crashed if lengths differed before the length-check fix
    const body = Buffer.from('{"event":"order.paid"}');
    expect(verifyWebhookSignature(body, 'short')).toBe(false);
  });

  it('rejects signature when webhook secret is empty', () => {
    (paymentConfig.razorpay as any).webhookSecret = '';
    const body = Buffer.from('{}');
    expect(verifyWebhookSignature(body, 'any_signature')).toBe(false);
    (paymentConfig.razorpay as any).webhookSecret = webhookSecret; // restore
  });
});

describe('processWebhookEventAsync — event dispatch', () => {
  const mockPrisma = prisma as any;
  const mockConfirm = confirmAppointmentPayment as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls confirmAppointmentPayment for order.paid events with valid entities', async () => {
    const event = makeWebhookEvent({ eventType: 'order.paid' });

    // Atomic lease claim succeeds (count: 1)
    mockPrisma.webhookEvent.updateMany.mockResolvedValueOnce({ count: 1 });
    mockPrisma.webhookEvent.findUnique.mockResolvedValueOnce(event);
    mockConfirm.mockResolvedValueOnce(undefined);
    mockPrisma.webhookEvent.update.mockResolvedValueOnce(event);

    await processWebhookEventAsync(event.id);

    expect(mockConfirm).toHaveBeenCalledWith({
      orderId: 'order_ABC123',
      paymentId: 'pay_XYZ456',
      source: 'WEBHOOK',
    });
    expect(mockPrisma.webhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PROCESSED' }) }),
    );
  });

  it('calls confirmAppointmentPayment for payment.captured events', async () => {
    const event = makeWebhookEvent({
      eventType: 'payment.captured',
      payloadSummary: {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: { id: 'pay_CAP789', order_id: 'order_DEF456', amount: 200000, currency: 'INR' },
          },
        },
      },
    });

    mockPrisma.webhookEvent.updateMany.mockResolvedValueOnce({ count: 1 });
    mockPrisma.webhookEvent.findUnique.mockResolvedValueOnce(event);
    mockConfirm.mockResolvedValueOnce(undefined);
    mockPrisma.webhookEvent.update.mockResolvedValueOnce(event);

    await processWebhookEventAsync(event.id);

    expect(mockConfirm).toHaveBeenCalledWith({
      orderId: 'order_DEF456',
      paymentId: 'pay_CAP789',
      source: 'WEBHOOK',
    });
  });

  it('records PaymentAttempt and FinancialAuditLog for payment.authorized events', async () => {
    const paymentOrder = { id: 'po-uuid-001', razorpayOrderId: 'order_GHI789' };
    const event = makeWebhookEvent({
      eventType: 'payment.authorized',
      payloadSummary: {
        event: 'payment.authorized',
        payload: {
          payment: {
            entity: {
              id: 'pay_AUTH001',
              order_id: 'order_GHI789',
              amount: 100000,
              currency: 'INR',
              method: 'card',
              bank: null,
              wallet: null,
              vpa: null,
            },
          },
        },
      },
    });

    mockPrisma.webhookEvent.updateMany.mockResolvedValueOnce({ count: 1 });
    mockPrisma.webhookEvent.findUnique.mockResolvedValueOnce(event);
    mockPrisma.paymentOrder.findUnique.mockResolvedValueOnce(paymentOrder);
    mockPrisma.paymentAttempt.upsert.mockResolvedValueOnce({ id: 'pa-uuid-001', status: 'AUTHORIZED' });
    mockPrisma.financialAuditLog.create.mockResolvedValueOnce({});
    mockPrisma.webhookEvent.update.mockResolvedValueOnce(event);

    await processWebhookEventAsync(event.id);

    expect(mockPrisma.paymentAttempt.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { razorpayPaymentId: 'pay_AUTH001' },
        create: expect.objectContaining({ status: 'AUTHORIZED', amountPaise: 100000 }),
      }),
    );
    expect(mockPrisma.financialAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'PAYMENT_AUTHORIZED' }),
      }),
    );
    expect(mockPrisma.webhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PROCESSED' }) }),
    );
  });

  it('records PaymentAttempt and FinancialAuditLog for payment.failed events', async () => {
    const paymentOrder = { id: 'po-uuid-002', razorpayOrderId: 'order_FAIL01' };
    const event = makeWebhookEvent({
      eventType: 'payment.failed',
      payloadSummary: {
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: 'pay_FAIL001',
              order_id: 'order_FAIL01',
              amount: 150000,
              currency: 'INR',
              error_code: 'BAD_REQUEST_ERROR',
              error_description: 'Card declined',
              error_reason: 'card_declined',
            },
          },
        },
      },
    });

    mockPrisma.webhookEvent.updateMany.mockResolvedValueOnce({ count: 1 });
    mockPrisma.webhookEvent.findUnique.mockResolvedValueOnce(event);
    mockPrisma.paymentOrder.findUnique.mockResolvedValueOnce(paymentOrder);
    mockPrisma.paymentAttempt.upsert.mockResolvedValueOnce({ id: 'pa-fail-001', status: 'FAILED' });
    mockPrisma.financialAuditLog.create.mockResolvedValueOnce({});
    mockPrisma.webhookEvent.update.mockResolvedValueOnce(event);

    await processWebhookEventAsync(event.id);

    expect(mockPrisma.paymentAttempt.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { razorpayPaymentId: 'pay_FAIL001' },
        create: expect.objectContaining({
          status: 'FAILED',
          errorCode: 'BAD_REQUEST_ERROR',
          errorDescription: 'Card declined',
        }),
      }),
    );
    expect(mockPrisma.financialAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'PAYMENT_FAILED' }),
      }),
    );
  });

  it('marks event IGNORED for unrecognised event types', async () => {
    const event = makeWebhookEvent({
      eventType: 'subscription.charged', // not handled
      payloadSummary: { event: 'subscription.charged' },
    });

    mockPrisma.webhookEvent.updateMany.mockResolvedValueOnce({ count: 1 });
    mockPrisma.webhookEvent.findUnique.mockResolvedValueOnce(event);
    mockPrisma.webhookEvent.update.mockResolvedValueOnce(event);

    await processWebhookEventAsync(event.id);

    expect(mockConfirm).not.toHaveBeenCalled();
    expect(mockPrisma.webhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'IGNORED' }) }),
    );
  });

  it('skips processing when no lease is acquired (duplicate delivery)', async () => {
    // Another worker already claimed it → updateMany returns count: 0
    mockPrisma.webhookEvent.updateMany.mockResolvedValueOnce({ count: 0 });

    await processWebhookEventAsync('db-event-uuid-dupe');

    expect(mockPrisma.webhookEvent.findUnique).not.toHaveBeenCalled();
    expect(mockConfirm).not.toHaveBeenCalled();
  });

  it('marks event FAILED with exponential backoff on processing error', async () => {
    const event = makeWebhookEvent({ eventType: 'order.paid', attempts: 1 });

    mockPrisma.webhookEvent.updateMany.mockResolvedValueOnce({ count: 1 });
    mockPrisma.webhookEvent.findUnique.mockResolvedValueOnce(event);
    mockConfirm.mockRejectedValueOnce(new Error('DB timeout'));
    mockPrisma.webhookEvent.update.mockResolvedValueOnce(event);

    await processWebhookEventAsync(event.id);

    // Should record FAILED status (not throw)
    expect(mockPrisma.webhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'FAILED',
          errorMessage: 'DB timeout',
        }),
      }),
    );
  });

  it('marks event permanently exhausted when maxAttempts is reached', async () => {
    const event = makeWebhookEvent({
      eventType: 'order.paid',
      attempts: 4, // maxAttempts is 5, so nextAttempts === 5 >= 5
      maxAttempts: 5,
    });

    mockPrisma.webhookEvent.updateMany.mockResolvedValueOnce({ count: 1 });
    mockPrisma.webhookEvent.findUnique.mockResolvedValueOnce(event);
    mockConfirm.mockRejectedValueOnce(new Error('Persistent failure'));
    mockPrisma.webhookEvent.update.mockResolvedValueOnce(event);

    await processWebhookEventAsync(event.id);

    expect(mockPrisma.webhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'FAILED',
          nextRetryAt: null, // exhausted — no more retries
        }),
      }),
    );
  });
});

describe('recoverPendingWebhookEvents', () => {
  const mockPrisma = prisma as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dispatches processWebhookEventAsync for each pending/failed/stale event', async () => {
    const pendingIds = [{ id: 'ev-001' }, { id: 'ev-002' }];
    mockPrisma.webhookEvent.findMany.mockResolvedValueOnce(pendingIds);
    // Each processWebhookEventAsync call will find count: 0 (no-op) — we just verify dispatch
    mockPrisma.webhookEvent.updateMany.mockResolvedValue({ count: 0 });

    await recoverPendingWebhookEvents();

    expect(mockPrisma.webhookEvent.findMany).toHaveBeenCalledTimes(1);
    // updateMany called once per event (lease attempt)
    expect(mockPrisma.webhookEvent.updateMany).toHaveBeenCalledTimes(pendingIds.length);
  });

  it('does nothing when there are no pending events', async () => {
    mockPrisma.webhookEvent.findMany.mockResolvedValueOnce([]);

    await recoverPendingWebhookEvents();

    expect(mockPrisma.webhookEvent.updateMany).not.toHaveBeenCalled();
  });
});

