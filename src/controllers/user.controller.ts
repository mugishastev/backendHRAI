import { Request, Response } from 'express';
import User from '../models/User';
import Job from '../models/Job';
import Applicant from '../models/Applicant';
import Screening from '../models/Screening';
import bcrypt from 'bcryptjs';
import notificationService from '../services/notification.service';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getRecruiters = async (req: Request, res: Response) => {
  try {
    const recruiters = await User.find({ role: 'recruiter' }).select('-passwordHash');
    res.json(recruiters);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const createRecruiter = async (req: Request, res: Response) => {
  try {
    const { email, password, role = 'recruiter', permissions } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ email, passwordHash, role, permissions: permissions || ['manage_jobs', 'view_applicants'] });
    await user.save();

    // Notify of new account
    notificationService.notifyUserCreated(email, role);

    res.status(201).json({ _id: user._id, email: user.email, role: user.role, permissions: user.permissions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const deleteRecruiter = async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

export const getBatchStatus = async (req: Request, res: Response) => {
  try {
    const jobs = await Job.find().lean();
    const result = await Promise.all(jobs.map(async (job: any) => {
      const applicantCount = await Applicant.countDocuments({ jobId: job._id });
      const screening = await Screening.findOne({ jobId: job._id }).lean() as any;
      return {
        jobId: job._id,
        title: job.title,
        department: job.department || 'N/A',
        applicantCount,
        screeningStatus: screening?.status || 'NOT_RUN',
        lastRun: screening?.updatedAt || null,
        resultCount: screening?.results?.length || 0,
      };
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch batch status' });
  }
};
