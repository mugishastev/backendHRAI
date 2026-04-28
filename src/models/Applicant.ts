import mongoose, { Schema, Document } from 'mongoose';

export interface IApplicant extends Document {
  jobId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  resumeUrl?: string;
  coverLetter?: string;
  currentJobTitle?: string;
  experience?: string;
  skills?: string[];
  extractedSkills?: string[];
  skillsVerification?: {
    verified: string[];
    claimedButMissing: string[];
    hiddenGems: string[]; // Skills found in resume but not claimed
  };
  linkedinUrl?: string;
  portfolioUrl?: string;
  availability?: string;
  status: 'applied' | 'shortlisted' | 'interviewing' | 'rejected' | 'hired';
  structuredProfile?: Record<string, any>;
  resumeText?: string;
  matchScore?: number;
  aiReasoning?: string;
  strengths?: string[];
  gaps?: string[];
  aiRecommendation?: string;
  createdAt: Date;
}

const ApplicantSchema: Schema = new Schema({
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  resumeUrl: { type: String },
  coverLetter: { type: String },
  currentJobTitle: { type: String },
  skills: { type: [String], default: [] },
  extractedSkills: { type: [String], default: [] },
  skillsVerification: {
    verified: { type: [String], default: [] },
    claimedButMissing: { type: [String], default: [] },
    hiddenGems: { type: [String], default: [] }
  },
  experience: { type: String },
  status: {
    type: String,
    enum: ['applied', 'shortlisted', 'interviewing', 'rejected', 'hired'],
    default: 'applied'
  },
  resumeText: { type: String },
  matchScore: { type: Number, min: 0, max: 100 },
  aiReasoning: { type: String },
  strengths: { type: [String], default: [] },
  gaps: { type: [String], default: [] },
  aiRecommendation: { type: String },
  linkedinUrl: { type: String },
  portfolioUrl: { type: String },
  availability: { type: String },
  structuredProfile: { type: Schema.Types.Mixed }, // Arbitrary JSON for structured talent schemas
}, { timestamps: true });

export default mongoose.model<IApplicant>('Applicant', ApplicantSchema);
