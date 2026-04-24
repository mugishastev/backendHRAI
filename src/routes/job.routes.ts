import { Router } from 'express';
import { createJob, getJobs, getJobById, updateJob, deleteJob } from '../controllers/job.controller';
import { verifyToken, isRecruiter } from '../middleware/auth.middleware';

const router = Router();

// Public routes for Career Portal
router.get('/', getJobs);
router.get('/:id', getJobById);

// Protected Management routes
router.post('/', verifyToken, isRecruiter, createJob);
router.put('/:id', verifyToken, isRecruiter, updateJob);
router.delete('/:id', verifyToken, isRecruiter, deleteJob);

export default router;
