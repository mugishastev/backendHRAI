import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  title: string;
  desc: string;
  type: 'info' | 'success' | 'warning' | 'error';
  targetRole?: 'admin' | 'recruiter' | 'applicant' | 'all';
  targetUserId?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  title: { type: String, required: true },
  desc: { type: String, required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  targetRole: { type: String, enum: ['admin', 'recruiter', 'applicant', 'all'], default: 'all' },
  targetUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<INotification>('Notification', NotificationSchema);
