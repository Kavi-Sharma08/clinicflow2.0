import { Router } from 'express'
import { requireAuth } from '../middlewares/requireAuth.middleware.js'
import { requireRole } from '../middlewares/requireRole.middleware.js'
import {
  getApprovedDoctors,
  getSpecializations,
  getDoctorAvailabilityForPatient,
} from '../controllers/user/patient/doctors.controller.js'
import { getPatientDashboardSummary } from '../controllers/user/patient/dashboard.controller.js'
import { getMyPatientProfile, updateMyPatientProfile } from '../controllers/user/patient/profile.controller.js'
import {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  getAppointmentQueueStatusController,
} from '../controllers/user/patient/appointment.controller.js'

const router = Router()

router.get('/dashboard/summary', requireAuth, requireRole('PATIENT'), getPatientDashboardSummary)
router.get('/profile/me', requireAuth, requireRole('PATIENT'), getMyPatientProfile)
router.put('/profile/me', requireAuth, requireRole('PATIENT'), updateMyPatientProfile)

router.get('/doctors', requireAuth, requireRole('PATIENT'), getApprovedDoctors)
router.get('/doctors/specializations', requireAuth, requireRole('PATIENT'), getSpecializations)
router.get('/doctors/:doctorId/availability', requireAuth, requireRole('PATIENT'), getDoctorAvailabilityForPatient)

router.post('/appointments', requireAuth, requireRole('PATIENT'), bookAppointment)
router.get('/appointments/me', requireAuth, requireRole('PATIENT'), getMyAppointments)
router.get('/appointments/:id/queue-status', requireAuth, requireRole('PATIENT'), getAppointmentQueueStatusController)
router.patch('/appointments/:id/cancel', requireAuth, requireRole('PATIENT'), cancelAppointment)

export default router