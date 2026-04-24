import { Router } from 'express';
import { login, register, forgotPassword, verifyEmail, googleLogin, resendOTP } from '../controllers/auth.controller';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/verify-email', verifyEmail);
router.post('/google-login', googleLogin);
router.post('/resend-otp', resendOTP);

export default router;
