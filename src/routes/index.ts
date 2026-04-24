import { Router } from 'express';
import jobRoutes from './job.routes';
import applicantRoutes from './applicant.routes';
import screeningRoutes from './screening.routes';
import statsRoutes from './stats.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import notificationRoutes from './notification.routes';
import logRoutes from './logs.routes';
import uploadRoutes from './upload.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/applicants', applicantRoutes);
router.use('/screening', screeningRoutes);
router.use('/stats', statsRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit-logs', logRoutes);
router.use('/upload', uploadRoutes);

export default router;
