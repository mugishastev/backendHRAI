import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  userEmail: string;
  role: string;
  action: string;
  method: string;
  endpoint: string;
  status: number;
  ip?: string;
  createdAt: Date;
}

const ActivityLogSchema: Schema = new Schema({
  userEmail: { type: String, required: true },
  role: { type: String, required: true },
  action: { type: String, required: true },
  method: { type: String, required: true },
  endpoint: { type: String, required: true },
  status: { type: Number, required: true },
  ip: { type: String },
}, { timestamps: true });

export default mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
