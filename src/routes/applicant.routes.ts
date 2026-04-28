import { Router } from 'express';
import { addApplicant, getApplicantsByJobId, bulkUploadApplicants, getAllApplicants, updateApplicantStatus, getMyApplications, withdrawApplication, transcribeApplicantResume } from '../controllers/applicant.controller';
import { verifyToken, isRecruiter, isAdmin, optionalVerifyToken } from '../middleware/auth.middleware';

const router = Router();

// Public/Optional Auth: Apply for job
router.post('/', optionalVerifyToken, addApplicant);

// Private: My Applications (for applicants)
router.get('/my', verifyToken, getMyApplications);
router.delete('/:id', verifyToken, withdrawApplication);

// Management routes
router.use(verifyToken);
router.get('/', isRecruiter, getAllApplicants); 
router.patch('/:id/status', isRecruiter, updateApplicantStatus); 
router.post('/:id/transcribe', isRecruiter, transcribeApplicantResume); 

router.use(isRecruiter); 
router.post('/bulk', bulkUploadApplicants);
router.get('/job/:jobId', getApplicantsByJobId);

export default router;
