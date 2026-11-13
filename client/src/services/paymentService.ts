import api from '../lib/axios';

export interface CreatePaymentOrderResponse {
  success: boolean;
  message: string;
  data: {
    appointmentId: string;
    orderId: string;
    amountPaise: number;
    currency: string;
    keyId: string;
    expiresAt: string;
    guestCheckoutToken?: string | null;
    doctor: {
      id: string;
      fullName: string;
      department: string;
      consultationFee: number;
    };
  };
}

export interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  appointmentId: string;
  queueNumber: number;
  bookingReference?: string | null;
  managementToken?: string | null;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
      on: (event: string, callback: (response: any) => void) => void;
    };
  }
}

export const paymentService = {
  // ── Patient Booking Payment ──
  createPatientPaymentOrder: async (data: {
    availabilityId: string;
    appointmentDate: string;
    notes?: string;
    urgency?: 'ROUTINE' | 'URGENT';
  }): Promise<CreatePaymentOrderResponse> => {
    const res = await api.post('/patient/payments/create-order', data);
    return res.data;
  },

  verifyPatientPayment: async (payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> => {
    const res = await api.post('/patient/payments/verify', payload);
    return res.data;
  },

  // ── Public Guest Booking Payment ──
  createGuestPaymentOrder: async (data: {
    doctorId: string;
    availabilityId: string;
    appointmentDate: string;
    guestName: string;
    guestPhone: string;
    guestEmail?: string;
    notes?: string;
    urgency?: 'ROUTINE' | 'URGENT';
  }): Promise<CreatePaymentOrderResponse> => {
    const res = await api.post('/public/payments/create-order', data);
    return res.data;
  },

  verifyGuestPayment: async (payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> => {
    const res = await api.post('/public/payments/verify', payload);
    return res.data;
  },
};
