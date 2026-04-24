import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: 'admin' | 'recruiter' | 'applicant';
  permissions: string[];
  isVerified: boolean;
  verificationOTP?: string;
  googleId?: string;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String }, // Optional for Google users
  role: { type: String, enum: ['admin', 'recruiter', 'applicant'], default: 'applicant' },
  permissions: { type: [String], default: [] },
  isVerified: { type: Boolean, default: false },
  verificationOTP: { type: String },
  googleId: { type: String },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
