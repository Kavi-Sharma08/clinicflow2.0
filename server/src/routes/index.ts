import { Router } from 'express'
import authRoutes from './auth.route.js'
import adminRoutes from './admin.routes.js';
import doctorRoutes from './doctor.routes.js';
import patientRoutes from './patient.route.js';
import notificationRoutes from './notification.routes.js';
import publicRoutes from './public.routes.js';
import webhookRoutes from './webhook.routes.js';
import { requireAuth } from '../middlewares/requireAuth.middleware.js';
import { requireRole } from '../middlewares/requireRole.middleware.js';
import { analyzePatientSymptomsController } from '../controllers/user/patient/aiSymptom.controller.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/doctor', doctorRoutes);
router.use('/admin', adminRoutes);
router.use('/patient', patientRoutes);
router.use('/notifications', notificationRoutes);
router.use('/public', publicRoutes);
router.use('/webhooks', webhookRoutes);
router.post('/ai/symptom-analysis', requireAuth, requireRole('PATIENT'), analyzePatientSymptomsController);

router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', api: 'ClinicFlow API' });
});

export default router