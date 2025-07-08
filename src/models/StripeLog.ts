/* eslint-disable @typescript-eslint/no-explicit-any */
import { LogLevel } from "@/lib/logging/logger";

export interface StripeLog {
  level: LogLevel;
  message: string;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  requestId: string | null;
}
