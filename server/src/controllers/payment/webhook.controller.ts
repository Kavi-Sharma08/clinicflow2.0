import { type Request, type Response } from 'express';
import { prisma } from '../../db/db.js';
import { verifyWebhookSignature } from '../../services/payment/razorpay.service.js';
import { confirmAppointmentPayment } from '../../services/payment/paymentVerification.service.js';

export const handleRazorpayWebhookController = async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = (req as any).rawBody;

  // 1. Verify webhook signature against raw byte buffer
  if (!signature || !rawBody) {
    return res.status(400).json({ success: false, message: 'Missing signature or payload body' });
  }

  const isValid = verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    console.warn('[WebhookController] Invalid Razorpay webhook signature');
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }

  const payload = req.body;
  const eventId = (req.headers['x-razorpay-event-id'] as string) || payload.event_id;

  // Razorpay always provides event id in header or payload for legitimate webhooks
  if (!eventId) {
    return res.status(400).json({ success: false, message: 'Missing event ID' });
  }

  const eventType = payload.event;
  if (!eventType) {
    return res.status(400).json({ success: false, message: 'Missing event type' });
  }

  // 2. Durable Ingestion: Persist event in DB before acknowledging HTTP 200
  try {
    const existing = await prisma.webhookEvent.findUnique({ where: { eventId } });
    if (existing && (existing.status === 'PROCESSED' || existing.status === 'PROCESSING')) {
      return res.status(200).json({ status: existing.status.toLowerCase() });
    }

    const webhookEvent = await prisma.webhookEvent.upsert({
      where: { eventId },
      create: {
        eventId,
        eventType,
        payloadSummary: payload as any, // Store full payload for durable replay/recovery
        status: 'RECEIVED',
      },
      update: {
        attempts: { increment: 1 },
      },
    });

    // 3. Immediately return HTTP 200 to Razorpay (Event safely stored)
    res.status(200).json({ status: 'received' });

    // 4. Trigger processing asynchronously
    processWebhookEventAsync(webhookEvent.id).catch((err) => {
      console.error(`[WebhookWorker] Error processing event ${eventId}:`, err);
    });
  } catch (error) {
    console.error('[WebhookController] Failed to persist webhook event:', error);
    return res.status(500).json({ success: false, message: 'Webhook ingestion error' });
  }
};

/**
 * Atomically claims and processes a WebhookEvent by its database ID
 */
export const processWebhookEventAsync = async (dbEventId: string) => {
  const workerId = `worker_${process.pid}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date();
  const staleLeaseCutoff = new Date(now.getTime() - 5 * 60 * 1000); // 5 min timeout for crashed workers

  // Atomic lease claim: Only claim if status is RECEIVED, FAILED (and ready for retry), or crashed PROCESSING
  const claimResult = await prisma.webhookEvent.updateMany({
    where: {
      id: dbEventId,
      OR: [
        { status: 'RECEIVED' },
        { status: 'FAILED', nextRetryAt: { lte: now } },
        { status: 'PROCESSING', lockedAt: { lte: staleLeaseCutoff } },
      ],
    },
    data: {
      status: 'PROCESSING',
      lockedAt: now,
      lockedBy: workerId,
    },
  });

  if (claimResult.count === 0) {
    // Event is currently being processed by another worker or already completed
    return;
  }

  const webhookEvent = await prisma.webhookEvent.findUnique({
    where: { id: dbEventId },
  });

  if (!webhookEvent) return;

  const payload = webhookEvent.payloadSummary as any;
  const eventType = webhookEvent.eventType;

  try {
    switch (eventType) {
      case 'order.paid': {
        const orderEntity = payload?.payload?.order?.entity;
        const paymentEntity = payload?.payload?.payment?.entity;

        if (orderEntity?.id && paymentEntity?.id) {
          await confirmAppointmentPayment({
            orderId: orderEntity.id,
            paymentId: paymentEntity.id,
            source: 'WEBHOOK',
          });
        }
        break;
      }

      case 'payment.captured': {
        const paymentEntity = payload?.payload?.payment?.entity;
        if (paymentEntity?.order_id && paymentEntity?.id) {
          await confirmAppointmentPayment({
            orderId: paymentEntity.order_id,
            paymentId: paymentEntity.id,
            source: 'WEBHOOK',
          });
        }
        break;
      }

      case 'payment.authorized': {
        const paymentEntity = payload?.payload?.payment?.entity;
        if (paymentEntity?.order_id && paymentEntity?.id) {
          const paymentOrder = await prisma.paymentOrder.findUnique({
            where: { razorpayOrderId: paymentEntity.order_id },
          });

          if (paymentOrder) {
            await prisma.paymentAttempt.upsert({
              where: { razorpayPaymentId: paymentEntity.id },
              create: {
                paymentOrderId: paymentOrder.id,
                razorpayPaymentId: paymentEntity.id,
                status: 'AUTHORIZED',
                amountPaise: Number(paymentEntity.amount || 0),
                currency: paymentEntity.currency || 'INR',
                method: paymentEntity.method,
                bank: paymentEntity.bank,
                wallet: paymentEntity.wallet,
                vpa: paymentEntity.vpa,
              },
              update: {
                status: 'AUTHORIZED',
                amountPaise: Number(paymentEntity.amount || 0),
              },
            });

            await prisma.financialAuditLog.create({
              data: {
                targetEntity: 'PAYMENT_ATTEMPT',
                targetId: paymentEntity.id,
                action: 'PAYMENT_AUTHORIZED',
                metadata: {
                  orderId: paymentEntity.order_id,
                  amountPaise: paymentEntity.amount,
                  method: paymentEntity.method,
                },
              },
            }).catch(() => {});
          }
        }
        break;
      }

      case 'payment.failed': {
        const paymentEntity = payload?.payload?.payment?.entity;
        if (paymentEntity?.order_id) {
          const paymentOrder = await prisma.paymentOrder.findUnique({
            where: { razorpayOrderId: paymentEntity.order_id },
          });

          if (paymentOrder && paymentEntity.id) {
            await prisma.paymentAttempt.upsert({
              where: { razorpayPaymentId: paymentEntity.id },
              create: {
                paymentOrderId: paymentOrder.id,
                razorpayPaymentId: paymentEntity.id,
                status: 'FAILED',
                amountPaise: Number(paymentEntity.amount || 0),
                currency: paymentEntity.currency || 'INR',
                errorCode: paymentEntity.error_code,
                errorDescription: paymentEntity.error_description,
                errorReason: paymentEntity.error_reason,
              },
              update: {
                status: 'FAILED',
                errorCode: paymentEntity.error_code,
                errorDescription: paymentEntity.error_description,
              },
            });

            await prisma.financialAuditLog.create({
              data: {
                targetEntity: 'PAYMENT_ATTEMPT',
                targetId: paymentEntity.id,
                action: 'PAYMENT_FAILED',
                reason: paymentEntity.error_description || paymentEntity.error_code || 'Payment failed at gateway',
                metadata: {
                  orderId: paymentEntity.order_id,
                  errorCode: paymentEntity.error_code,
                  errorReason: paymentEntity.error_reason,
                },
              },
            }).catch(() => {});
          }
        }
        break;
      }

      case 'refund.processed': {
        const refundEntity = payload?.payload?.refund?.entity;
        if (refundEntity?.id) {
          await prisma.refundRecord.updateMany({
            where: { razorpayRefundId: refundEntity.id },
            data: { status: 'SUCCESS' },
          });
        }
        break;
      }

      default: {
        // Unrecognized or informational event
        await prisma.webhookEvent.update({
          where: { id: dbEventId },
          data: {
            status: 'IGNORED',
            processedAt: new Date(),
            lockedAt: null,
            lockedBy: null,
          },
        });
        return;
      }
    }

    // Mark PROCESSED
    await prisma.webhookEvent.update({
      where: { id: dbEventId },
      data: {
        status: 'PROCESSED',
        processedAt: new Date(),
        errorMessage: null,
        lockedAt: null,
        lockedBy: null,
      },
    });
  } catch (err: any) {
    console.error(`[WebhookWorker] Processing failed for event ${dbEventId}:`, err);
    const nextAttempts = webhookEvent.attempts + 1;
    const isExhausted = nextAttempts >= webhookEvent.maxAttempts;

    // Exponential backoff: 30s, 60s, 120s, 240s...
    const backoffSeconds = Math.min(30 * Math.pow(2, webhookEvent.attempts), 3600);

    await prisma.webhookEvent.update({
      where: { id: dbEventId },
      data: {
        status: 'FAILED',
        attempts: nextAttempts,
        errorMessage: err instanceof Error ? err.message : String(err),
        nextRetryAt: isExhausted ? null : new Date(Date.now() + backoffSeconds * 1000),
        lockedAt: null,
        lockedBy: null,
      },
    }).catch(() => {});
  }
};

/**
 * Recovers pending or failed webhook events
 */
export const recoverPendingWebhookEvents = async () => {
  const now = new Date();
  const staleLeaseCutoff = new Date(now.getTime() - 5 * 60 * 1000);

  const pendingEvents = await prisma.webhookEvent.findMany({
    where: {
      OR: [
        { status: 'RECEIVED' },
        { status: 'FAILED', nextRetryAt: { lte: now } },
        { status: 'PROCESSING', lockedAt: { lte: staleLeaseCutoff } },
      ],
    },
    select: { id: true },
    take: 20,
    orderBy: { receivedAt: 'asc' },
  });

  for (const event of pendingEvents) {
    await processWebhookEventAsync(event.id).catch((err) => {
      console.error(`[WebhookRecovery] Error processing event ${event.id}:`, err);
    });
  }
};
