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

import {
  listAdminAppointments,
  getAdminAppointmentStats,
  getAdminAppointmentDetail,
  updateAdminAppointmentStatus,
  listRescheduleRequests,
  getDoctorAvailableSlotsForReschedule,
  confirmReschedule,
  rejectReschedule,
} from '../controllers/user/admin/appointments/adminAppointment.controller.js'
import { getAdminFinancialOverviewController } from '../controllers/user/admin/financials/overview.controller.js'
import { getAdminFinancialTransactionsController } from '../controllers/user/admin/financials/transactions.controller.js'
import {
  getAdminRefundRequestsController,
  processAdminRefundReviewController,
} from '../controllers/user/admin/refunds/refundReview.controller.js'
import {
  getAdminSettlementLedgerController,
  releaseSettlementBatchController,
} from '../controllers/user/admin/settlements/settlementRelease.controller.js'

const router = Router()

router.get('/dashboard/summary', requireAuth, requireRole('ADMIN'), getAdminDashboardSummary)
router.get('/users', requireAuth, requireRole('ADMIN'), listUsers)
router.get('/doctors', requireAuth, requireRole('ADMIN'), listDoctors)
router.get('/doctors/summary', requireAuth, requireRole('ADMIN'), getDoctorSummary)
router.get('/doctors/:id', requireAuth, requireRole('ADMIN'), getVerificationDetail)
router.put('/doctors/:id/reject', requireAuth, requireRole('ADMIN'), rejectVerification)
router.put('/doctors/:id/approve', requireAuth, requireRole('ADMIN'), approveVerification)

// Admin Appointment Management
router.get('/appointments/stats', requireAuth, requireRole('ADMIN'), getAdminAppointmentStats)
router.get('/appointments', requireAuth, requireRole('ADMIN'), listAdminAppointments)
router.get('/appointments/:id', requireAuth, requireRole('ADMIN'), getAdminAppointmentDetail)
router.patch('/appointments/:id/status', requireAuth, requireRole('ADMIN'), updateAdminAppointmentStatus)

// Admin Reschedule Requests & Slot Generation
router.get('/reschedule-requests', requireAuth, requireRole('ADMIN'), listRescheduleRequests)
router.get('/doctors/:doctorId/available-slots', requireAuth, requireRole('ADMIN'), getDoctorAvailableSlotsForReschedule)
router.post('/reschedule-requests/:id/confirm', requireAuth, requireRole('ADMIN'), confirmReschedule)
router.post('/reschedule-requests/:id/reject', requireAuth, requireRole('ADMIN'), rejectReschedule)

// Admin Financial Oversight & Settlements
router.get('/financials/overview', requireAuth, requireRole('ADMIN'), getAdminFinancialOverviewController)
router.get('/financials/transactions', requireAuth, requireRole('ADMIN'), getAdminFinancialTransactionsController)
router.get('/refunds', requireAuth, requireRole('ADMIN'), getAdminRefundRequestsController)
router.post('/refunds/:refundId/review', requireAuth, requireRole('ADMIN'), processAdminRefundReviewController)
router.get('/settlements/ledger', requireAuth, requireRole('ADMIN'), getAdminSettlementLedgerController)
router.post('/settlements/release', requireAuth, requireRole('ADMIN'), releaseSettlementBatchController)

export default router