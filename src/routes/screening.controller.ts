import { Request, Response } from 'express';
import Job from '../models/Job';
import { IApplicant } from '../models/Applicant'; // Import IApplicant interface
import Applicant from '../models/Applicant';
import { extractTextFromResume } from './resumeParser';
import { screenCandidate } from './gemini';
import notificationService from '../services/notification.service';
import communicationService from '../services/communication.service';

export const runScreening = async (req: Request, res: Response) => {

    try {
        const { jobId, applicantId } = req.body;
        const job = await Job.findById(jobId);
        const applicant = await Applicant.findById(applicantId);

        if (!job || !applicant) {
            return res.status(404).json({ error: 'Job or Applicant not found' });
        }

        // 1. Extract text if not already cached
        let resumeText = applicant.resumeText;
        if (!resumeText && applicant.resumeUrl) {
            resumeText = await extractTextFromResume(applicant.resumeUrl);
            applicant.resumeText = resumeText;
            await applicant.save();
        }

        // 2. Run AI Screening
        const aiResult = await screenCandidate(
            `Title: ${job.title}\nDescription: ${job.description}\nSkills: ${job.requiredSkills?.join(', ') || ''}`,
            resumeText || ''
        );

        // 3. Update Applicant Record
        applicant.matchScore = aiResult.matchScore;
        applicant.aiReasoning = aiResult.reasoning;
        applicant.strengths = aiResult.strengths;
        applicant.gaps = aiResult.gaps;
        applicant.status = aiResult.recommendation === 'Shortlist' ? 'shortlisted' : applicant.status;
        applicant.aiRecommendation = aiResult.recommendation; // Store AI's raw recommendation

        await applicant.save();

        // 4. Dispatch Personalized Notifications & Feedback
        const isSelected = applicant.status === 'shortlisted';

        // Construct a transparent feedback message using AI reasoning
        const feedbackMessage = isSelected
            ? `Great news! You have been shortlisted for the '${job.title}' position. \n\nAI Insight: ${aiResult.reasoning}`
            : `Thank you for applying for the '${job.title}' position. We've decided to move forward with other candidates. \n\nAI Feedback: ${aiResult.reasoning}\n\nStrengths found: ${aiResult.strengths?.join(', ') || 'N/A'}`;

        try {
            // Create an in-app notification targeted strictly to this applicant's ID
            // targeting applicant.userId if they are registered, or their applicant ID
            await notificationService.create({
                userId: applicant.userId || applicant._id,
                title: `Update: Application for ${job.title}`,
                message: feedbackMessage,
                status: isSelected ? 'SUCCESS' : 'REJECTION'
            });

            // Send external email via Communication Service
            await communicationService.sendEmail(applicant.email, `Application Status - ${job.title}`, feedbackMessage);
        } catch (notifError) {
            console.error('Feedback Dispatch Error:', notifError);
            // Non-blocking: We don't fail the whole request if just the email fails
        }

        res.status(200).json({
            success: true,
            data: applicant
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getScreeningResult = async (req: Request, res: Response) => {
    const { jobId } = req.params;
    try {
        // Return candidates sorted by matchScore for the Top 10/20 Shortlist
        const shortlist = await Applicant.find({ jobId })
            .sort({ matchScore: -1 })
            .limit(20);

        res.status(200).json(shortlist);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};