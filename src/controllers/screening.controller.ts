import { Request, Response } from 'express';
import Screening from '../models/Screening';
import Applicant from '../models/Applicant';
import Job from '../models/Job';
import { AIService } from '../services/ai.service';
import communicationService from '../services/communication.service';
import notificationService from '../services/notification.service';
import { extractTextFromResume } from '../routes/resumeParser';

export const runScreening = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.body;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const applicants = await Applicant.find({ jobId });
    if (applicants.length === 0) return res.status(400).json({ error: 'No applicants found for this job' });

    // Ensure we don't already have an ongoing screening
    let screening = await Screening.findOne({ jobId });
    if (!screening) {
        screening = new Screening({ jobId, status: 'PENDING', results: [] });
        await screening.save();
    } else {
        screening.status = 'PENDING';
        await screening.save();
    }

    // NEW: Self-Healing Logic - Try to transcribe missing resumes before AI run
    console.log(`[ScreeningHealer] Checking ${applicants.length} applicants for missing transcripts...`);
    for (const applicant of applicants) {
        if ((!applicant.resumeText || applicant.resumeText.trim().length < 50) && applicant.resumeUrl) {
            try {
                console.log(`[ScreeningHealer] Healing transcript for ${applicant.name}...`);
                const text = await extractTextFromResume(applicant.resumeUrl);
                if (text) {
                    applicant.resumeText = text;
                    await applicant.save();
                    console.log(`[ScreeningHealer] Successfully healed ${applicant.name}.`);
                }
            } catch (healError) {
                console.warn(`[ScreeningHealer] Failed to heal ${applicant.name}:`, healError);
            }
        }
    }

    try {
        // Run AI evaluation
        const { rankings, biasAudit } = await AIService.screenCandidates(job, applicants);

        if (!Array.isArray(rankings) || rankings.length === 0) {
            throw new Error('AI returned no valid ranking results. Please check candidate data and try again.');
        }

        // Save results
        screening.results = rankings;
        screening.biasAudit = biasAudit;
        screening.status = 'COMPLETED';
        await screening.save();

        // Persist AI Insights to Applicant records and auto-shortlist top performers
        for (const result of rankings) {
            // Must use 'applied' instead of 'screening' to match Mongoose enum
            const status = result.rank <= 10 ? 'shortlisted' : 'applied';
            await Applicant.findByIdAndUpdate(result.applicantId, {
                matchScore: result.matchScore,
                aiReasoning: result.summary,
                aiRecommendation: result.finalRecommendation,
                skillsVerification: result.skillsVerification,
                extractedSkills: [...(result.skillsVerification?.verified || []), ...(result.skillsVerification?.hiddenGems || [])],
                status: status
            });
        }

        // Create system notification
        notificationService.notifyScreeningComplete(job.title, applicants.length);

        // Notify Candidates Automatically
        for (const applicant of applicants) {
             const result = rankings.find((r: any) => String(r.applicantId) === String(applicant._id));
             if (result) {
                  const isSelected = result.rank <= 10;
                  const subject = `HRAI Application Result: ${job.title}`;
                  const messageBody = isSelected 
                        ? `Congratulations ${applicant.name}!\n\nOur AI analysis has ranked you in the top tier (Rank: #${result.rank}) for the "${job.title}" position at HRAI. We were impressed by your profile and have moved you to the next stage.\n\nA member of our recruitment team will be in touch shortly.\n\nBest regards,\nThe HRAI Talent Team`
                        : `Hi ${applicant.name},\n\nThank you for your interest in the "${job.title}" role at HRAI. Our AI screening process has concluded. While your profile was strong, we have decided to move forward with other candidates at this time.\n\nFeedback from our AI Analyst: ${result.finalRecommendation}\n\nWe wish you the best in your search.\n\nBest regards,\nThe HRAI Talent Team`;
                  
                  // Send Email
                  communicationService.sendEmail(applicant.email, subject, messageBody).catch(err => {
                      console.warn(`Failed to email ${applicant.email}:`, err);
                  });
             }
        }

        res.status(200).json(screening);
    } catch (aiError) {
        screening.status = 'FAILED';
        await screening.save();
        
        // Notify of failure
        notificationService.notifyScreeningFailed(job.title);
        
        throw aiError;
    }

  } catch (error: any) {
    console.error('CRITICAL Screening Error:', error);
    res.status(500).json({ 
        error: 'Failed to execute screening process',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getScreeningResult = async (req: Request, res: Response) => {
    try {
        const { jobId } = req.params;
        const screening = await Screening.findOne({ jobId }).populate('results.applicantId', 'name email phone resumeUrl');
        
        if (!screening) return res.status(404).json({ error: 'No screening result found for this job' });

        res.json(screening);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch screening results' });
    }
};
