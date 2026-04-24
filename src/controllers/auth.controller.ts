import { Request, Response } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'umurava-hackathon-secret-key-2025';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    
    // For Hackathon prototype purposes, allow demo bypass
    if (email === 'admin@umurava.ai' && password === 'admin123') {
        const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token, user: { email, role: 'admin' } });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
       // Support plain text for seeded users if needed, but best to stay strict
       if (user.passwordHash !== password) {
         return res.status(401).json({ error: 'Invalid email or password' });
       }
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};
export const register = async (req: Request, res: Response) => {
  const { email, password, role = 'applicant' } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    const user = new User({ 
      email, 
      passwordHash, 
      role: ['admin', 'recruiter', 'applicant'].includes(role) ? role : 'applicant', 
      isVerified: false, 
      verificationOTP 
    });
    await user.save();

    console.log(`[AUTH] Verification OTP for ${email}: ${verificationOTP}`);
    
    res.status(201).json({ 
      message: 'Account created. Please verify your email.', 
      email,
      otp: verificationOTP // In production, send via email service
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email, verificationOTP: otp });
    if (!user) return res.status(400).json({ error: 'Invalid OTP' });

    user.isVerified = true;
    user.verificationOTP = undefined;
    await user.save();

    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { email: user.email, role: user.role }, message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  const { email, googleId, name } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, googleId, name, role: 'applicant', isVerified: true });
      await user.save();
    } else {
       user.googleId = googleId;
       user.isVerified = true;
       await user.save();
    }

    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Google login failed' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log(`[AUTH] Password recovery OTP for ${email}: ${otp}`);
    res.json({ message: 'Password reset OTP sent to email', email, otp });
  } catch (error) {
    res.status(500).json({ error: 'Recovery failed' });
  }
};

export const resendOTP = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isVerified) return res.status(400).json({ error: 'Account already verified' });

    const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationOTP = newOTP;
    await user.save();

    console.log(`[AUTH] Resent Verification OTP for ${email}: ${newOTP}`);
    res.json({ message: 'Verification code resent successfully', otp: newOTP });
  } catch (error) {
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
};
