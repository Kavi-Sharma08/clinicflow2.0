import { Router } from 'express'
import { requireAuth } from '../middlewares/requireAuth.middleware.js'
import { requireRole } from '../middlewares/requireRole.middleware.js'
import { getVerificationDetail } from '../controllers/user/admin/getVerificationDetail.js'
import { listUsers } from '../controllers/user/admin/listUsers.js'
import { rejectVerification } from '../controllers/user/admin/rejection.controller.js'
import { approveVerification } from '../controllers/user/admin/approveVerification.js'
import { getAdminDashboardSummary } from '../controllers/user/admin/dashboard/getAdminDashboardSummary.js'
import { listDoctors } from '../controllers/user/admin/doctors/listDoctors.js'
import { getDoctorSummary } from '../controllers/user/admin/doctors/getDoctorSummary.js'

const router = Router()

router.get('/dashboard/summary', requireAuth, requireRole('ADMIN'), getAdminDashboardSummary)
router.get('/users', requireAuth, requireRole('ADMIN'), listUsers)
router.get('/doctors', requireAuth, requireRole('ADMIN'), listDoctors)
router.get('/doctors/summary', requireAuth, requireRole('ADMIN'), getDoctorSummary)
router.get('/doctors/:id', requireAuth, requireRole('ADMIN'), getVerificationDetail)
router.put('/doctors/:id/reject', requireAuth, requireRole('ADMIN'), rejectVerification)
router.put('/doctors/:id/approve', requireAuth, requireRole('ADMIN'), approveVerification)

export default router