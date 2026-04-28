import { Request, Response } from 'express';
import Applicant from '../models/Applicant';
import Job from '../models/Job';
import communicationService from '../services/communication.service';
import notificationService from '../services/notification.service';
import { extractTextFromResume } from '../routes/resumeParser';
import { AIService } from '../services/ai.service';

export const addApplicant = async (req: any, res: Response) => {
  try {
    const { jobId } = req.body;
    const job = await Job.findById(jobId);
    if (!job) {
       return res.status(404).json({ error: 'Job not found' });
    }

    const applicantData = { ...req.body };
    if (req.user) {
        applicantData.userId = req.user.userId;
    }

    // NEW: Automatic Resume Parsing if URL exists
    if (applicantData.resumeUrl && !applicantData.resumeText) {
        try {
            const url = applicantData.resumeUrl.trim();
            console.log(`[ResumeProcessor] Starting extraction for ${applicantData.name} from: ${url}`);
            
            if (url.startsWith('http')) {
                const extractedText = await extractTextFromResume(url);
                applicantData.resumeText = extractedText;
                
                if (extractedText && extractedText.trim().length > 10) {
                    console.log(`[ResumeProcessor] Deep analyzing structure for ${applicantData.name}...`);
                    const analysis = await AIService.analyzeResumeStructure(extractedText);
                    if (analysis) {
                        applicantData.structuredProfile = analysis;
                        console.log(`[ResumeProcessor] Completeness Score: ${analysis.completenessScore}%`);
                    }
                } else {
                    console.warn(`[ResumeProcessor] Warning: ${applicantData.name}'s resume returned minimal text. It might be a scanned image/PDF.`);
                    applicantData.resumeText = "[SCANNED IMAGE DETECTED] This resume appears to be a scanned image and could not be transcribed to text. Please ask the candidate for a text-based PDF or use an OCR tool.";
                }
            }
        } catch (parseError: any) {
            console.warn(`[ResumeProcessor] Failed to extract text for ${applicantData.name}:`, parseError.message);
        }
    }
    
    const applicant = new Applicant(applicantData);
    await applicant.save();

    // Create system notification
    notificationService.notifyApplicantReceived(applicant.name, job.title);

    // Send appreciation email
    const emailSubject = `Application Received: ${job.title} at HRAI`;
    const emailBody = `Dear ${applicant.name},

Thank you so much for taking the time to apply for the "${job.title}" position at HRAI. We sincerely appreciate your interest in joining our team!

Your application and details have been successfully received and placed into our system. Our team, aided by our AI recruitment assistants, will be reviewing your profile carefully against the requirements and blueprint for this role.

We know how much effort goes into job applications, so we want to express our deepest gratitude for choosing HRAI. If your profile proves to be a strong match, we will be reaching out to you shortly with the next steps.

In the meantime, we wish you the very best.

Warm regards,
The HRAI Talent Team
https://hrai-platform.vercel.app`;

    // Fire and forget the email so we don't block the API response
    communicationService.sendEmail(applicant.email, emailSubject, emailBody).catch(err => {
      console.warn('Failed to send appreciation email:', err);
    });

    res.status(201).json(applicant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add applicant' });
  }
};

export const getApplicantsByJobId = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const applicants = await Applicant.find({ jobId }).sort({ createdAt: -1 });
    res.json(applicants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applicants' });
  }
};

export const bulkUploadApplicants = async (req: Request, res: Response) => {
    try {
        const { jobId, applicants } = req.body;
        
        // ensure Job exists
        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ error: 'Job not found' });

        // NEW: Batch Resume Parsing for Bulk Uploads
        const formattedApplicants = [];
        for (const app of applicants) {
            const appData = { 
                ...app, 
                jobId,
                phone: app.phone || 'N/A' // Ensure required field exists
            };
            if (appData.resumeUrl && !appData.resumeText) {
                try {
                    appData.resumeText = await extractTextFromResume(appData.resumeUrl);
                } catch (e) {
                    console.warn(`[BulkParser] Failed for ${appData.name}`);
                }
            }
            formattedApplicants.push(appData);
        }
        
        const inserted = await Applicant.insertMany(formattedApplicants);
        res.status(201).json(inserted);
    } catch (error) {
        res.status(500).json({ error: 'Failed to bulk upload applicants' });
    }
};
export const getAllApplicants = async (req: Request, res: Response) => {
  try {
    const applicants = await Applicant.find().populate('jobId', 'title department').sort({ createdAt: -1 });
    res.json(applicants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch global applicants' });
  }
};

export const updateApplicantStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const applicant = await Applicant.findByIdAndUpdate(id, { status }, { new: true }).populate('jobId', 'title');
    if (!applicant) return res.status(404).json({ error: 'Applicant not found' });

    // Send email notification to candidate
    const subject = `Application Update: ${status.toUpperCase()} - ${(applicant.jobId as any).title}`;
    const body = `Hi ${applicant.name},\n\nWe wanted to let you know that the status of your application for "${(applicant.jobId as any).title}" has been updated to: **${status.toUpperCase()}**.\n\nLog in to your dashboard to see more details.\n\nBest regards,\nThe HRAI Talent Team`;
    
    communicationService.sendEmail(applicant.email, subject, body).catch(err => {
        console.warn('Failed to send status update email:', err);
    });

    if (applicant.userId) {
        notificationService.notifyStatusUpdate(String(applicant.userId), (applicant.jobId as any).title, status).catch(err => {
            console.warn('Failed to send in-app notification:', err);
        });
    }

    res.json(applicant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
};

export const getMyApplications = async (req: any, res: Response) => {
  try {
    const applicants = await Applicant.find({ userId: req.user.userId }).populate('jobId', 'title department').sort({ createdAt: -1 });
    res.json(applicants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch personal applications' });
  }
};

export const withdrawApplication = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const applicant = await Applicant.findOneAndDelete({ _id: id, userId: req.user.userId }).populate('jobId');
    
    if (!applicant) {
        return res.status(404).json({ error: 'Application not found or unauthorized' });
    }

    // Notify recruiter
    notificationService.notifyApplicationWithdrawn(applicant.name, (applicant.jobId as any).title);

    res.json({ message: 'Application withdrawn successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to withdraw application' });
  }
};

export const transcribeApplicantResume = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const applicant = await Applicant.findById(id);
        
        if (!applicant) return res.status(404).json({ error: 'Applicant not found' });
        if (!applicant.resumeUrl) return res.status(400).json({ error: 'No resume URL found for this applicant' });

        console.log(`[ManualTranscriber] Starting for ${applicant.name}...`);
        const text = await extractTextFromResume(applicant.resumeUrl);
        
        if (text) {
            applicant.resumeText = text;
            
            // Also update structural analysis while we're at it
            const analysis = await AIService.analyzeResumeStructure(text);
            if (analysis) {
                applicant.structuredProfile = analysis;
            }
            
            await applicant.save();
            return res.json({ message: 'Transcription successful', data: applicant });
        } else {
            return res.status(422).json({ error: 'Extracted text was empty or invalid' });
        }
    } catch (error: any) {
        res.status(500).json({ error: 'Transcription failed', details: error.message });
    }
};
