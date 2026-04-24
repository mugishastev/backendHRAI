import mongoose, { Schema, Document } from 'mongoose';

export interface IScreeningResult {
  applicantId: mongoose.Types.ObjectId;
  rank: number;
  matchScore: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  finalRecommendation: string;
}

export interface IScreening extends Document {
  jobId: mongoose.Types.ObjectId;
  results: IScreeningResult[];
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
}

const ScreeningResultSchema = new Schema({
  applicantId: { type: Schema.Types.ObjectId, ref: 'Applicant', required: true },
  rank: { type: Number, required: true },
  matchScore: { type: Number, required: true },
  summary: { type: String },
  strengths: { type: [String], default: [] },
  gaps: { type: [String], default: [] },
  finalRecommendation: { type: String, required: true }
});

const ScreeningSchema: Schema = new Schema({
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  status: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
  results: { type: [ScreeningResultSchema], default: [] }
}, { timestamps: true });

export default mongoose.model<IScreening>('Screening', ScreeningSchema);
