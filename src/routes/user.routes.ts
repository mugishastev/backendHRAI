import { Router } from 'express';
import { getAllUsers, getRecruiters, createRecruiter, deleteRecruiter, getBatchStatus } from '../controllers/user.controller';
import { verifyToken, isAdmin, isRecruiter } from '../middleware/auth.middleware';

const router = Router();

router.use(verifyToken);

// Accessible by both recruiters and admins
router.get('/batch-status', isRecruiter, getBatchStatus);

// Restricted to admins only
router.use(isAdmin);

router.get('/', getAllUsers);
router.get('/recruiters', getRecruiters);
router.post('/', createRecruiter);
router.delete('/:id', deleteRecruiter);

export default router;
