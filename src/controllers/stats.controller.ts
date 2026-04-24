import { Request, Response } from 'express';
import Job from '../models/Job';
import Applicant from '../models/Applicant';
import Screening from '../models/Screening';
import User from '../models/User';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [totalJobs, totalCandidates, totalUsers, completedScreenings, pendingScreenings, shortlistedCandidates, jobs] = await Promise.all([
      Job.countDocuments(),
      Applicant.countDocuments(),
      User.countDocuments(),
      Screening.countDocuments({ status: 'COMPLETED' }),
      Screening.countDocuments({ status: 'PENDING' }),
      Applicant.countDocuments({ status: 'shortlisted' }),
      Job.find().select('_id title department createdAt').lean(),
    ]);

    // Trend calculation for last 7 days
    const last7Days = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));
      
      const [appCount, shortlistCount] = await Promise.all([
        Applicant.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
        Applicant.countDocuments({ status: 'shortlisted', updatedAt: { $gte: startOfDay, $lte: endOfDay } })
      ]);

      last7Days.push({
        date: days[d.getDay()],
        fullDate: d.toISOString().split('T')[0],
        count: appCount,
        shortlisted: shortlistCount
      });
    }

    // Per-job breakdown
    const applicantCountsPerJob = await Applicant.aggregate([
      { $group: { _id: '$jobId', count: { $sum: 1 } } }
    ]);
    const countMap: Record<string, number> = {};
    applicantCountsPerJob.forEach((item: any) => { countMap[String(item._id)] = item.count; });

    const jobBreakdown = (jobs as any[]).map((job) => ({
      jobId: job._id,
      title: String(job.title),
      department: String(job.department || 'N/A'),
      applicants: countMap[String(job._id)] || 0,
      createdAt: job.createdAt,
    })).sort((a: any, b: any) => b.applicants - a.applicants);

    res.json({
      totalJobs,
      totalCandidates,
      totalUsers,
      completedScreenings,
      pendingScreenings,
      shortlistedCandidates,
      jobBreakdown,
      applicationsOverTime: last7Days,
    });
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch global stats' });
  }
};
