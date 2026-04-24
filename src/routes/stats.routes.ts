import { Router } from 'express';
import { getDashboardStats } from '../controllers/stats.controller';
import { verifyToken, isRecruiter } from '../middleware/auth.middleware';

const router = Router();

router.get('/', verifyToken, isRecruiter, getDashboardStats);

export default router;
