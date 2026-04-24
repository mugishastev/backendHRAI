import { Router } from 'express';
import ActivityLog from '../models/ActivityLog';
import { verifyToken, isAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

export default router;
