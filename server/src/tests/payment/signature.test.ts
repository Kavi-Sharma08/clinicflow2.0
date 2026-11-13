import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import { verifyPaymentSignature, verifyWebhookSignature } from '../../services/payment/razorpay.service.js';
import { paymentConfig } from '../../config/payment.config.js';

describe('Payment & Webhook Signature Verification', () => {
  const secretKey = 'test_secret_key_12345';
  const webhookSecret = 'test_webhook_secret_67890';

  beforeEach(() => {
    (paymentConfig.razorpay as any).keySecret = secretKey;
    (paymentConfig.razorpay as any).webhookSecret = webhookSecret;
  });

  describe('verifyPaymentSignature', () => {
    it('verifies valid HMAC SHA256 payment signature', () => {
      const orderId = 'order_ABC1234567890';
      const paymentId = 'pay_XYZ1234567890';
      const payload = `${orderId}|${paymentId}`;

      const validSignature = crypto
        .createHmac('sha256', secretKey)
        .update(payload)
        .digest('hex');

      const isValid = verifyPaymentSignature({
        orderId,
        paymentId,
        signature: validSignature,
      });

      expect(isValid).toBe(true);
    });

    it('rejects tampered signature', () => {
      const isValid = verifyPaymentSignature({
        orderId: 'order_ABC1234567890',
        paymentId: 'pay_XYZ1234567890',
        signature: 'invalid_signature_hex_digest_string_value',
      });

      expect(isValid).toBe(false);
    });

    it('rejects missing parameters safely', () => {
      expect(verifyPaymentSignature({ orderId: '', paymentId: '', signature: '' })).toBe(false);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('verifies valid webhook signature with raw payload buffer', () => {
      const rawBody = Buffer.from(JSON.stringify({ event: 'payment.captured', id: 'evt_123' }), 'utf-8');

      const validSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      const isValid = verifyWebhookSignature(rawBody, validSignature);
      expect(isValid).toBe(true);
    });

    it('rejects modified raw buffer payload', () => {
      const originalBody = Buffer.from(JSON.stringify({ event: 'payment.captured', id: 'evt_123' }), 'utf-8');
      const tamperedBody = Buffer.from(JSON.stringify({ event: 'payment.captured', id: 'evt_999' }), 'utf-8');

      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(originalBody)
        .digest('hex');

      const isValid = verifyWebhookSignature(tamperedBody, signature);
      expect(isValid).toBe(false);
    });
  });
});
