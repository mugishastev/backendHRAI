import { Router } from 'express';
import { runScreening, getScreeningResult } from '../controllers/screening.controller';
import { verifyToken, isRecruiter } from '../middleware/auth.middleware';

const router = Router();

router.use(verifyToken);
router.use(isRecruiter);

router.post('/run', runScreening);
router.get('/job/:jobId', getScreeningResult);

export default router;
