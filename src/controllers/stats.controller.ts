import { Request, Response } from 'express';
import Job from '../models/Job';
import Applicant from '../models/Applicant';
import Screening from '../models/Screening';
import User from '../models/User';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [totalJobs, totalCandidates, totalUsers, completedScreenings, pendingScreenings, shortlistedCandidates, jobs, recentApplicants] = await Promise.all([
      Job.countDocuments(),
      Applicant.countDocuments(),
      User.countDocuments(),
      Screening.countDocuments({ status: 'COMPLETED' }),
      Screening.countDocuments({ status: 'PENDING' }),
      Applicant.countDocuments({ status: 'shortlisted' }),
      Job.find().select('_id title department createdAt').lean(),
      Applicant.find().select('jobId createdAt').lean(),
    ]);

    // Per-job applicant counts
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

    // Applications over last 7 days
    const last7Days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr: string = d.toISOString().split('T')[0] ?? '';
      const count = recentApplicants.filter((a: any) =>
        new Date(a.createdAt).toISOString().split('T')[0] === dayStr
      ).length;
      last7Days.push({ date: dayStr, count });
    }

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
    res.status(500).json({ error: 'Failed to fetch global stats' });
  }
};
