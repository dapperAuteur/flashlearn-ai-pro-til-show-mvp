/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { HydratedDocument } from "mongoose"; // Import HydratedDocument for correct typing
import dbConnect from "@/lib/db/dbConnect";
import { Logger, LogContext, LogLevel, AnalyticsLogger } from "./logger";
import { AuthLogModel, IAuthLog } from "@/models/Logs";
import { AuthEventType } from "@/models/AuthLog";
import { getClientIp } from "@/lib/utils";

/**
 * Log an authentication event to the database using Mongoose.
 */
export async function logAuthEvent({
  request,
  event,
  userId = undefined,
  email = undefined,
  status,
  reason = undefined,
  metadata = {},
}: {
  request: NextRequest;
  event: AuthEventType;
  userId?: string;
  email?: string;
  status: "success" | "failure";
  reason?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  try {
    const message = `Auth event: ${event}, status: ${status}${reason ? `, reason: ${reason}` : ''}`;
    const level = status === "success" ? LogLevel.INFO : LogLevel.WARNING;

    await Logger.log({
      context: LogContext.AUTH,
      level,
      message,
      userId,
      request,
      metadata: { ...metadata, email, reason }
    });

    if (status === "success") {
      let eventType = "";
      switch (event) {
        case AuthEventType.LOGIN:
          eventType = AnalyticsLogger.EventType.USER_LOGIN;
          break;
        case AuthEventType.REGISTER:
          eventType = AnalyticsLogger.EventType.USER_SIGNUP;
          break;
      }
      if (eventType) {
        await AnalyticsLogger.trackEvent({ userId, eventType, properties: { email }, request });
      }
    }

    await dbConnect(); // Ensure DB connection is established

    const logEntry: Partial<IAuthLog> = {
      event,
      userId,
      email,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
      status,
      reason,
      metadata,
      timestamp: new Date(),
    };

    // Use the Mongoose model to create the new log document
    const result: HydratedDocument<IAuthLog> = await AuthLogModel.create(logEntry);
    
    // The type is now correctly inferred, so ._id is available and correctly typed.
    return result._id.toString();
  } catch (error) {
    Logger.error(LogContext.SYSTEM, "Failed to log auth event", { error });
    return "logging-failed";
  }
}

/**
 * Check for suspicious activity patterns using Mongoose.
 */
export async function checkSuspiciousActivity(
  email: string,
  ipAddress: string
): Promise<{ suspicious: boolean; reason?: string }> {
  try {
    await dbConnect(); // Ensure DB connection

    const lookbackTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const failedLogins = await AuthLogModel.countDocuments({
      event: AuthEventType.LOGIN_FAILURE,
      email,
      timestamp: { $gte: lookbackTime },
    });
    
    if (failedLogins >= 5) {
      return { suspicious: true, reason: `Multiple failed login attempts (${failedLogins}) in the last 24 hours` };
    }
    
    const distinctIps = await AuthLogModel.distinct("ipAddress", {
        event: AuthEventType.LOGIN,
        email,
        status: "success",
        timestamp: { $gte: lookbackTime },
    });
    
    if (distinctIps.length > 0 && !distinctIps.includes(ipAddress)) {
      return { suspicious: true, reason: "Login attempt from a new location" };
    }
    
    if (ipAddress) {
      const accountsFromIp = await AuthLogModel.distinct("email", {
        ipAddress,
        event: AuthEventType.REGISTER,
        timestamp: { $gte: lookbackTime },
      });
      
      if (accountsFromIp.length >= 3) {
        return { suspicious: true, reason: `Multiple accounts (${accountsFromIp.length}) created from the same IP address` };
      }
    }
    
    return { suspicious: false };
  } catch (error) {
    Logger.error(LogContext.SYSTEM, "Failed to check for suspicious activity", { error });
    return { suspicious: false };
  }
}

/**
 * Get authentication logs for a specific user using Mongoose.
 */
export async function getUserAuthLogs(userId: string, limit: number = 20): Promise<any[]> {
  try {
    await dbConnect();
    // Use .lean() for faster, plain JavaScript object results
    const logs = await AuthLogModel.find({ userId }).sort({ timestamp: -1 }).limit(limit).lean();
    return logs as IAuthLog[];
  } catch (error) {
    Logger.error(LogContext.SYSTEM, "Failed to get user auth logs", { error, userId });
    return [];
  }
}
