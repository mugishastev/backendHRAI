import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  title: string;
  department?: string;
  description: string;
  requirements: string[];
  experienceLevel: string;
  requiredSkills?: string[];
  expirationDate?: Date;
  company?: string;
  location?: string;
  employmentType?: string;
  salaryRange?: string;
  aiBlueprint?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema: Schema = new Schema({
  title: { type: String, required: true },
  department: { type: String },
  description: { type: String, required: true },
  requirements: { type: [String], default: [] },
  skills: { type: [String], default: [] },
  requiredSkills: { type: [String], default: [] },
  experienceLevel: { type: String },
  expirationDate: { type: Date },
  company: { type: String, default: 'Umurava AI' },
  location: { type: String, default: 'Remote' },
  employmentType: { type: String, default: 'Full-time' },
  salaryRange: { type: String },
  aiBlueprint: { type: String },
}, { timestamps: true });

export default mongoose.model<IJob>('Job', JobSchema);
