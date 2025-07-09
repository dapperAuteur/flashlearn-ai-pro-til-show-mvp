/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/logging/logger.ts
import { NextRequest } from "next/server";
import dbConnect from "@/lib/db/dbConnect";
import { getClientIp } from "@/lib/utils";
import { SystemLog } from "@/models/Logs"; // <-- Use Mongoose model
import mongoose from "mongoose";

// Log severity levels
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARNING = "warning",
  ERROR = "error"
}

// Context types to organize logs
export enum LogContext {
  AUTH = "auth",
  FLASHCARD = "flashcard",
  AI = "ai",
  USER = "user",
  STUDY = "study",
  SYSTEM = "system"
}

// Base log entry interface
export interface BaseLogEntry {
  context: LogContext;
  level: LogLevel;
  message: string;
  timestamp: Date;
  userId?: string;
  requestId?: string; // Correlation ID
  metadata?: Record<string, any>;
}

// Centralized Logger
export class Logger {
  private static config = {
    logToConsole: process.env.NODE_ENV !== "production",
    logToDatabase: true,
    minLevel: process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG
  };

  private static generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  static async log({
    context,
    level,
    message,
    userId = undefined,
    requestId = undefined,
    request = undefined,
    metadata = {}
  }: {
    context: LogContext;
    level: LogLevel;
    message: string;
    userId?: string;
    requestId?: string;
    request?: NextRequest;
    metadata?: Record<string, any>;
  }): Promise<string | null> {
    if (!this.shouldLog(level)) {
      return null;
    }

    if (!requestId) {
      requestId = this.generateRequestId();
    }

    if (request) {
      metadata.ipAddress = getClientIp(request);
      metadata.userAgent = request.headers.get("user-agent") || "unknown";
    }

    const logEntry: BaseLogEntry = {
      context,
      level,
      message,
      timestamp: new Date(),
      userId,
      requestId,
      metadata
    };

    if (this.config.logToConsole) {
      this.logToConsole(logEntry);
    }

    if (this.config.logToDatabase) {
      return await this.logToDatabase(logEntry);
    }

    return requestId;
  }

  private static shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARNING, LogLevel.ERROR];
    const configLevelIndex = levels.indexOf(this.config.minLevel);
    const logLevelIndex = levels.indexOf(level);
    
    return logLevelIndex >= configLevelIndex;
  }

  private static logToConsole(logEntry: BaseLogEntry): void {
    const timestamp = logEntry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${logEntry.level.toUpperCase()}] [${logEntry.context}]`;
    
    switch (logEntry.level) {
      case LogLevel.ERROR:
        console.error(`${prefix} ${logEntry.message}`, logEntry.metadata);
        break;
      case LogLevel.WARNING:
        console.warn(`${prefix} ${logEntry.message}`, logEntry.metadata);
        break;
      case LogLevel.INFO:
        console.info(`${prefix} ${logEntry.message}`, logEntry.metadata);
        break;
      case LogLevel.DEBUG:
        console.debug(`${prefix} ${logEntry.message}`, logEntry.metadata);
        break;
    }
  }

  // --- UPDATED to use Mongoose ---
  private static async logToDatabase(logEntry: BaseLogEntry): Promise<string> {
    try {
      await dbConnect();
      const newLog = await SystemLog.create(logEntry);
      return newLog._id.toString();
    } catch (error) {
      console.error("Failed to log to database:", error);
      console.error("Original log entry:", logEntry);
      return "logging-failed";
    }
  }
  
  // Convenience methods remain the same
  static async debug(context: LogContext, message: string, metadata: any = {}, options: { userId?: string; requestId?: string; request?: NextRequest } = {}): Promise<string | null> { return this.log({ context, level: LogLevel.DEBUG, message, metadata, ...options }); }
  static async info(context: LogContext, message: string, metadata: any = {}, options: { userId?: string; requestId?: string; request?: NextRequest } = {}): Promise<string | null> { return this.log({ context, level: LogLevel.INFO, message, metadata, ...options }); }
  static async warning(context: LogContext, message: string, metadata: any = {}, options: { userId?: string; requestId?: string; request?: NextRequest } = {}): Promise<string | null> { return this.log({ context, level: LogLevel.WARNING, message, metadata, ...options }); }
  static async error(context: LogContext, message: string, metadata: any = {}, options: { userId?: string; requestId?: string; request?: NextRequest } = {}): Promise<string | null> { return this.log({ context, level: LogLevel.ERROR, message, metadata, ...options }); }
}

// --- Define a Mongoose model for Analytics Events ---
const AnalyticsEventSchema = new mongoose.Schema({
    userId: { type: String, index: true },
    eventType: { type: String, required: true, index: true },
    properties: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
    requestId: { type: String },
});
const AnalyticsEventModel = mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', AnalyticsEventSchema, 'analytics_events');


// Analytics-focused logger
export class AnalyticsLogger {
  static EventType = {
    AI_GENERATED: "ai_generated",
    AI_PROMPT_SUBMITTED: "ai_prompt_submitted",
    FLASHCARD_CREATED: "flashcard_created",
    FLASHCARD_SET_SAVED: "flashcard_set_saved",
    FLASHCARD_STUDIED: "flashcard_studied",
    LIST_EXPORTED: "list_exported",
    LIST_IMPORTED: "list_imported",
    SHARED_FLASHCARDS_USED: "shared_flashcards_used",
    SHARED_FLASHCARDS_VIEWED: "shared_flashcards_viewed",
    USER_LOGIN: "user_login",
    USER_SIGNUP: "user_signup"
  };

  // --- UPDATED to use Mongoose ---
  static async trackEvent({
    userId,
    eventType,
    properties = {},
    request = undefined
  }: {
    userId?: string;
    eventType: string;
    properties?: Record<string, any>;
    request?: NextRequest;
  }): Promise<string | null> {
    if (request) {
      properties.ipAddress = getClientIp(request);
      properties.userAgent = request.headers.get("user-agent") || "unknown";
    }
    if (!properties.timestamp) {
      properties.timestamp = new Date();
    }

    const logContext = this.getContextFromEventType(eventType);
    const requestId = await Logger.info(
      logContext,
      `Analytics event: ${eventType}`,
      { userId, metadata: properties }
    );

    try {
      await dbConnect();
      const analyticsEvent = { userId, eventType, properties, timestamp: new Date(), requestId };
      const result = await AnalyticsEventModel.create(analyticsEvent);
      return result._id.toString();
    } catch (error) {
      await Logger.error(LogContext.SYSTEM, `Failed to store analytics event: ${eventType}`, { metadata: { error, properties } });
      return null;
    }
  }

  private static getContextFromEventType(eventType: string): LogContext {
    if (eventType.startsWith("flashcard_")) return LogContext.FLASHCARD;
    if (eventType.startsWith("ai_")) return LogContext.AI;
    if (eventType.startsWith("user_")) return LogContext.USER;
    return LogContext.SYSTEM;
  }

  // Convenience methods remain the same
  // ...
}
