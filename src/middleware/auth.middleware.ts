import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'umurava-hackathon-secret-key-2025';

export const verifyToken = (req: any, res: Response, next: NextFunction) => {
  // Skip verification for preflight requests
  if (req.method === 'OPTIONS') return next();

  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  // Allow demo bypass token for testing convenience
  if (token === 'demo-jwt-token-7382') {
    req.user = { email: 'admin@umurava.ai', role: 'admin' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token. Please log in again.' });
  }
};

export const isAdmin = (req: any, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
};

export const isRecruiter = (req: any, res: Response, next: NextFunction) => {
    if (req.user && (req.user.role === 'recruiter' || req.user.role === 'admin')) {
      next();
    } else {
      res.status(403).json({ error: 'Access denied. Recruiter privileges required.' });
    }
};
export const optionalVerifyToken = (req: any, res: Response, next: NextFunction) => {
  if (req.method === 'OPTIONS') return next();

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
  } catch (error) {
    // Ignore invalid token for optional check
  }
  next();
};
