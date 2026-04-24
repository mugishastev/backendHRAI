import { Request, Response, NextFunction } from 'express';
import ActivityLog from '../models/ActivityLog';

export const logActivity = (req: any, res: Response, next: NextFunction) => {
  const originalSend = res.send;

  // We only log "write" operations by default to keep it clean, 
  // plus specific audit-worthy endpoints.
  const auditMethods = ['POST', 'PUT', 'DELETE'];
  
  res.send = function (body) {
    res.send = originalSend;
    const result = res.send(body);

    if (auditMethods.includes(req.method) || req.url.includes('/screening') || req.url.includes('/stats')) {
        const log = new ActivityLog({
            userEmail: req.user?.email || 'Anonymous',
            role: req.user?.role || 'Guest',
            action: getActionName(req),
            method: req.method,
            endpoint: req.originalUrl,
            status: res.statusCode,
            ip: req.ip
        });
        log.save().catch(err => console.error('Logging Error:', err));
    }

    return result;
  };

  next();
};

function getActionName(req: Request) {
    const url = req.originalUrl;
    if (url.includes('/screening/run')) return 'AI Screening Triggered';
    if (url.includes('/jobs')) {
        if (req.method === 'POST') return 'Job Created';
        if (req.method === 'PUT') return 'Job Updated';
        if (req.method === 'DELETE') return 'Job Deleted';
    }
    if (url.includes('/applicants')) return 'Applicant Data Modified';
    if (url.includes('/users')) return 'User Management Action';
    return `${req.method} Request`;
}
