import { Router } from 'express';
import { handleRazorpayWebhookController } from '../controllers/payment/webhook.controller.js';

const router = Router();

// Razorpay webhook endpoint (Raw body verification handled via Express verify middleware)
router.post('/razorpay', handleRazorpayWebhookController);

export default router;

