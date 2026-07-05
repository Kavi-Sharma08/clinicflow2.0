import { Router } from 'express'
import authRoutes from './auth.route.js'
import adminRoutes from './admin.routes.js';
import doctorRoutes from './doctor.routes.js';
import patientRoutes from './patient.route.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/doctor', doctorRoutes);
router.use('/admin', adminRoutes);
router.use('/patient', patientRoutes);
router.use('/notifications', notificationRoutes);

export default router