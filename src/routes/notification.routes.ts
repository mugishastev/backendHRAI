import { Router } from 'express';
import { getNotifications, markRead, markAllRead } from '../controllers/notification.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.use(verifyToken);

router.get('/', getNotifications);
router.put('/mark-all-read', markAllRead);
router.put('/:id/read', markRead);

export default router;
