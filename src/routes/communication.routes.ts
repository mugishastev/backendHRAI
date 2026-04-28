import { Router } from 'express';
import { sendMessage } from '../controllers/communication.controller';
import { verifyToken, isRecruiter } from '../middleware/auth.middleware';

const router = Router();

router.post('/send', verifyToken, isRecruiter, sendMessage);

export default router;
