// src/models/Logs.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
import { LogLevel, LogContext } from '@/lib/logging/logger';
import { AuthEventType } from '@/models/AuthLog';

// --- System Log ---
interface ISystemLog extends Document {
  context: LogContext;
  level: LogLevel;
  message: string;
  timestamp: Date;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}
const SystemLogSchema: Schema<ISystemLog> = new Schema({
  context: { type: String, enum: Object.values(LogContext), required: true },
  level: { type: String, enum: Object.values(LogLevel), required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  userId: { type: String, index: true },
  requestId: { type: String },
  metadata: { type: Schema.Types.Mixed },
});
export const SystemLog: Model<ISystemLog> = mongoose.models.SystemLog || mongoose.model<ISystemLog>('SystemLog', SystemLogSchema, 'system_logs');


// --- Auth Log ---
export interface IAuthLog extends Document {
  event: AuthEventType;
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  reason?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}
const AuthLogSchema: Schema<IAuthLog> = new Schema({
    event: { type: String, enum: Object.values(AuthEventType), required: true },
    userId: { type: String, index: true },
    email: { type: String, index: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    status: { type: String, enum: ['success', 'failure'], required: true },
    reason: { type: String },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
});
export const AuthLogModel: Model<IAuthLog> = mongoose.models.AuthLog || mongoose.model<IAuthLog>('AuthLog', AuthLogSchema, 'auth_logs');


// --- Stripe Log ---
interface IStripeLog extends Document {
  level: LogLevel;
  message: string;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  requestId: string | null;
}
const StripeLogSchema: Schema<IStripeLog> = new Schema({
    level: { type: String, enum: Object.values(LogLevel), required: true },
    message: { type: String, required: true },
    userId: { type: String, index: true },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed },
    requestId: { type: String },
});
export const StripeLogModel: Model<IStripeLog> = mongoose.models.StripeLog || mongoose.model<IStripeLog>('StripeLog', StripeLogSchema, 'stripe_logs');
export const AuthLogModel: Model<IAuthLog> =
  mongoose.models.AuthLog || mongoose.model<IAuthLog>("AuthLog", AuthLogSchema);