import { Router } from 'express'
import {
  cancelGuestAppointmentController,
  createGuestBookingController,
  getDoctorPublicAvailabilityController,
  getDoctorPublicProfileController,
  getGuestAppointmentController,
  joinWalkInQueueController,
  rescheduleGuestAppointmentController,
} from '../controllers/public/guestBooking.controller.js'
import { publicBookingLimiter, publicManagementLimiter } from '../middlewares/rateLimiter.middleware.js'
import { createGuestPaymentOrderController } from '../controllers/payment/order.controller.js'
import { verifyGuestPaymentController } from '../controllers/payment/verify.controller.js'

const router = Router()

// Public doctor profile & schedule
router.get('/doctors/:identifier', getDoctorPublicProfileController)
router.get('/doctors/:identifier/availability', getDoctorPublicAvailabilityController)

// Public booking & queue actions
router.post('/appointments/book', publicBookingLimiter, createGuestBookingController)
router.post('/payments/create-order', publicBookingLimiter, createGuestPaymentOrderController)
router.post('/payments/verify', publicBookingLimiter, verifyGuestPaymentController)
router.post('/queue/join-walkin', publicBookingLimiter, joinWalkInQueueController)

// Secure guest self-service management
router.get('/appointments/manage/:token', publicManagementLimiter, getGuestAppointmentController)
router.post('/appointments/manage/:token/cancel', publicManagementLimiter, cancelGuestAppointmentController)
router.post('/appointments/manage/:token/reschedule', publicManagementLimiter, rescheduleGuestAppointmentController)

export default router
