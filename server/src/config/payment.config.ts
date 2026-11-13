import { env } from './env.js';

export const paymentConfig = {
  // Centralized, configurable platform commission in basis points (500 bps = 5.00%)
  commissionRateBps: 500,

  // Temporary slot reservation hold duration (10 minutes in ms & minutes)
  reservationExpiryMinutes: 10,
  reservationExpiryMs: 10 * 60 * 1000,

  // Currency
  currency: 'INR',

  // Razorpay Gateway Settings
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    // Strict isolation: Razorpay Route capability disabled by default
    routeEnabled: process.env.RAZORPAY_ROUTE_ENABLED === 'true',
  },
} as const;

/**
 * Calculates platform fee and doctor share in integer paise
 * Example: For ₹1,500.00 (150,000 paise):
 * - platformFeePaise = Math.round((150000 * 500) / 10000) = 7,500 paise (₹75.00)
 * - doctorSharePaise = 150000 - 7500 = 142,500 paise (₹1,425.00)
 */
export const calculateCommission = (grossAmountPaise: number, commissionRateBps: number = paymentConfig.commissionRateBps) => {
  if (!Number.isInteger(grossAmountPaise) || grossAmountPaise < 0) {
    throw new Error('Invalid gross amount: must be a non-negative integer in paise');
  }

  const platformFeePaise = Math.round((grossAmountPaise * commissionRateBps) / 10000);
  const doctorSharePaise = grossAmountPaise - platformFeePaise;

  return {
    grossAmountPaise,
    commissionRateBps,
    platformFeePaise,
    doctorSharePaise,
    currency: paymentConfig.currency,
  };
};
