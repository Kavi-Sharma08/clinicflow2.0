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
  const eventId = req.headers['x-razorpay-event-id'] as string || payload.event_id || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const eventType = payload.event;

  // 2. Durable Ingestion: Persist event in DB before acknowledging HTTP 200
  try {
    const existing = await prisma.webhookEvent.findUnique({ where: { eventId } });
    if (existing && existing.status === 'PROCESSED') {
      return res.status(200).json({ status: 'already_processed' });
    }

    const webhookEvent = await prisma.webhookEvent.upsert({
      where: { eventId },
      create: {
        eventId,
        eventType,
        payloadSummary: {
          event: eventType,
          contains: Object.keys(payload.payload || {}),
        },
        status: 'RECEIVED',
      },
      update: {
        attempts: { increment: 1 },
      },
    });

    // 3. Immediately return HTTP 200 to Razorpay (Event safely stored)
    res.status(200).json({ status: 'received' });

    // 4. Inline Execution / Recovery
    processWebhookEventAsync(webhookEvent.id, eventType, payload).catch((err) => {
      console.error(`[WebhookWorker] Error processing event ${eventId}:`, err);
    });
  } catch (error) {
    console.error('[WebhookController] Failed to persist webhook event:', error);
    return res.status(500).json({ success: false, message: 'Webhook ingestion error' });
  }
};

const processWebhookEventAsync = async (dbEventId: string, eventType: string, payload: any) => {
  try {
    // Acquire lease
    await prisma.webhookEvent.update({
      where: { id: dbEventId },
      data: { status: 'PROCESSING', lockedAt: new Date() },
    });

    switch (eventType) {
      case 'order.paid': {
        const orderEntity = payload.payload?.order?.entity;
        const paymentEntity = payload.payload?.payment?.entity;

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
        const paymentEntity = payload.payload?.payment?.entity;
        if (paymentEntity?.order_id && paymentEntity?.id) {
          await confirmAppointmentPayment({
            orderId: paymentEntity.order_id,
            paymentId: paymentEntity.id,
            source: 'WEBHOOK',
          });
        }
        break;
      }

      case 'payment.failed': {
        const paymentEntity = payload.payload?.payment?.entity;
        if (paymentEntity?.order_id) {
          // Record failed payment attempt
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
          }
        }
        break;
      }

      case 'refund.processed': {
        const refundEntity = payload.payload?.refund?.entity;
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
          data: { status: 'IGNORED', processedAt: new Date() },
        });
        return;
      }
    }

    // Mark PROCESSED
    await prisma.webhookEvent.update({
      where: { id: dbEventId },
      data: { status: 'PROCESSED', processedAt: new Date(), errorMessage: null },
    });
  } catch (err: any) {
    console.error(`[WebhookWorker] Processing failed for event ${dbEventId}:`, err);
    await prisma.webhookEvent.update({
      where: { id: dbEventId },
      data: {
        status: 'FAILED',
        errorMessage: err instanceof Error ? err.message : String(err),
        nextRetryAt: new Date(Date.now() + 60 * 1000), // Retry in 1 minute
      },
    }).catch(() => {});
  }
};

