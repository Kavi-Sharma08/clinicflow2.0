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

const router = Router()

// Public doctor profile & schedule
router.get('/doctors/:identifier', getDoctorPublicProfileController)
router.get('/doctors/:identifier/availability', getDoctorPublicAvailabilityController)

// Public booking & queue actions
router.post('/appointments/book', publicBookingLimiter, createGuestBookingController)
router.post('/queue/join-walkin', publicBookingLimiter, joinWalkInQueueController)

// Secure guest self-service management
router.get('/appointments/manage/:token', publicManagementLimiter, getGuestAppointmentController)
router.post('/appointments/manage/:token/cancel', publicManagementLimiter, cancelGuestAppointmentController)
router.post('/appointments/manage/:token/reschedule', publicManagementLimiter, rescheduleGuestAppointmentController)

export default router
