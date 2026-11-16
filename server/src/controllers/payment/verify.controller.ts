import { type Request, type Response } from 'express';
import { prisma } from '../../db/db.js';
import { confirmAppointmentPayment } from '../../services/payment/paymentVerification.service.js';

export const verifyPatientPaymentController = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required',
      });
    }

    const userId = req.user?.id;
    let patientProfileId: string | undefined;
    if (userId) {
      const patientProfile = await prisma.patientProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      patientProfileId = patientProfile?.id;
    }

    const result = await confirmAppointmentPayment({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      source: 'CLIENT_VERIFY',
      patientId: patientProfileId,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Verify patient payment error:', error);
    return res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};

export const verifyGuestPaymentController = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, guestCheckoutToken: bodyGuestToken } = req.body as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      guestCheckoutToken?: string;
    };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required',
      });
    }

    // Resolve guest checkout token from body, header, or cookie
    const headerToken = req.headers['x-guest-checkout-token'];
    const guestCheckoutToken =
      (typeof bodyGuestToken === 'string' && bodyGuestToken.trim()) ||
      (typeof headerToken === 'string' && headerToken.trim()) ||
      req.cookies?.guest_checkout_session ||
      undefined;

    const result = await confirmAppointmentPayment({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      source: 'CLIENT_VERIFY',
      guestCheckoutToken,
    });

    // Clear guest checkout session cookie upon successful verification
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('guest_checkout_session', {
      path: '/',
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Verify guest payment error:', error);
    return res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};

