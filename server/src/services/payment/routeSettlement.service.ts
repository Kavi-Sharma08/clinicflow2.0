import { paymentConfig } from '../../config/payment.config.js';
import { getRazorpayClient } from './razorpay.service.js';

export interface RouteTransferInput {
  paymentId: string;
  doctorAccountId: string;
  amountPaise: number;
  currency?: string;
  notes?: Record<string, string>;
}

/**
 * Razorpay Route Settlement Capability Layer
 * Strictly guarded: Throws descriptive error if RAZORPAY_ROUTE_ENABLED is false.
 * When enabled in future with merchant Route approval, transfers allocated share to doctor's linked account.
 */
export const transferDoctorSettlementViaRoute = async (input: RouteTransferInput) => {
  if (!paymentConfig.razorpay.routeEnabled) {
    throw new Error(
      'Razorpay Route transfers are disabled (RAZORPAY_ROUTE_ENABLED=false). Doctor allocations are tracked in the internal settlement ledger.'
    );
  }

  const razorpay = getRazorpayClient();

  const transfer = await (razorpay.payments as any).transfer(input.paymentId, {
    transfers: [
      {
        account: input.doctorAccountId,
        amount: input.amountPaise,
        currency: input.currency || paymentConfig.currency,
        notes: input.notes || {},
      },
    ],
  });

  return transfer;
};
