import { Router } from 'express'
import { requireAuth } from '../middlewares/requireAuth.middleware.js'
import { requireRole } from '../middlewares/requireRole.middleware.js'
import { submitVerification } from '../controllers/user/doctor/submitVerification.controller.js'
import { getVerificationStatus } from '../controllers/user/doctor/getVerificationStatus.js'
import { getUploadSignature } from '../controllers/user/doctor/getUploadSignature.js'
import { getDoctorDashboardSummary } from '../controllers/user/doctor/dashboard.controller.js'
import { getMyDoctorProfile, updateMyDoctorProfile } from '../controllers/user/doctor/profile.controller.js'
import {
  getAvailabilityForDate,
  createAvailability,
  updateAvailability,
  getAvailabilityForMonth,
  getAvailabilityList,
  deleteAvailability,
} from '../controllers/user/doctor/availaibility.controller.js'
import {
  getBookingsForDate,
  getBookingsList,
  getDoctorAppointments,
  updateDoctorAppointmentStatus,
  getAppointmentFilterOptions,
} from '../controllers/user/doctor/booking.controller.js'
import {
  getLiveQueue,
  startConsultation,
  completeConsultation,
  markNoShow,
} from '../controllers/user/doctor/queue.controller.js'

const router = Router()

router.post('/verification', requireAuth, requireRole('DOCTOR'), submitVerification)
router.get('/verification/status', requireAuth, requireRole('DOCTOR'), getVerificationStatus)
router.get('/verification/upload-signature', requireAuth, requireRole('DOCTOR'), getUploadSignature)

router.get('/dashboard/summary', requireAuth, requireRole('DOCTOR'), getDoctorDashboardSummary)
router.get('/profile/me', requireAuth, requireRole('DOCTOR'), getMyDoctorProfile)
router.put('/profile/me', requireAuth, requireRole('DOCTOR'), updateMyDoctorProfile)

router.get('/availability', requireAuth, requireRole('DOCTOR'), getAvailabilityForDate)
router.post('/availability', requireAuth, requireRole('DOCTOR'), createAvailability)
router.put('/availability/:id', requireAuth, requireRole('DOCTOR'), updateAvailability)
router.get('/availability/month', requireAuth, requireRole('DOCTOR'), getAvailabilityForMonth)
router.get('/availability/list', requireAuth, requireRole('DOCTOR'), getAvailabilityList)
router.delete('/availability/:id', requireAuth, requireRole('DOCTOR'), deleteAvailability)

router.get('/queue', requireAuth, requireRole('DOCTOR'), getLiveQueue)
router.get('/bookings/list', requireAuth, requireRole('DOCTOR'), getBookingsList)
router.get('/bookings/date', requireAuth, requireRole('DOCTOR'), getBookingsForDate)
router.get('/appointments/filter-options', requireAuth, requireRole('DOCTOR'), getAppointmentFilterOptions)
router.get('/appointments', requireAuth, requireRole('DOCTOR'), getDoctorAppointments)
router.patch('/appointments/:id/status', requireAuth, requireRole('DOCTOR'), updateDoctorAppointmentStatus)
router.post('/appointments/:id/start', requireAuth, requireRole('DOCTOR'), startConsultation)
router.post('/appointments/:id/complete', requireAuth, requireRole('DOCTOR'), completeConsultation)
router.post('/appointments/:id/no-show', requireAuth, requireRole('DOCTOR'), markNoShow)

export default router
