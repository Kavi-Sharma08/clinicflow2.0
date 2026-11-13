import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import { paymentConfig } from '../../config/payment.config.js';

let razorpayClient: Razorpay | null = null;

export const getRazorpayClient = (): Razorpay => {
  if (!paymentConfig.razorpay.keyId || !paymentConfig.razorpay.keySecret) {
    throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: paymentConfig.razorpay.keyId,
      key_secret: paymentConfig.razorpay.keySecret,
    });
  }

  return razorpayClient;
};

export interface CreateOrderParams {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export const createRazorpayOrder = async (params: CreateOrderParams) => {
  const razorpay = getRazorpayClient();

  const options = {
    amount: params.amountPaise,
    currency: params.currency || paymentConfig.currency,
    receipt: params.receipt.slice(0, 40), // Razorpay limits receipts to max 40 chars
    notes: params.notes || {},
  };

  const order = await razorpay.orders.create(options);
  return order;
};

export const fetchRazorpayOrderById = async (orderId: string) => {
  const razorpay = getRazorpayClient();
  return razorpay.orders.fetch(orderId);
};

export const fetchRazorpayOrderByReceipt = async (receipt: string) => {
  const razorpay = getRazorpayClient();
  const collection = await (razorpay.orders as any).all({
    receipt: receipt.slice(0, 40),
    count: 5,
  });
  return collection.items?.[0] || null;
};

export const fetchRazorpayPayment = async (paymentId: string) => {
  const razorpay = getRazorpayClient();
  return razorpay.payments.fetch(paymentId);
};

export const verifyPaymentSignature = (params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean => {
  if (!params.orderId || !params.paymentId || !params.signature) return false;

  const body = `${params.orderId}|${params.paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', paymentConfig.razorpay.keySecret)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf-8'),
    Buffer.from(params.signature, 'utf-8')
  );
};

export const verifyWebhookSignature = (rawBody: Buffer | string, signature: string): boolean => {
  if (!signature || !paymentConfig.razorpay.webhookSecret) return false;

  const expectedSignature = crypto
    .createHmac('sha256', paymentConfig.razorpay.webhookSecret)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );
  } catch {
    return false;
  }
};

