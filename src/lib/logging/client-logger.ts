/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

// Simple client-side logger for the study functionality
export enum LogContext {
  AUTH = "auth",
  FLASHCARD = "flashcard",
  STUDY = "study",
  SYSTEM = "system",
  // New contexts for more granular logging
  REVIEW = "review",
  STORE = "store",
  DASHBOARD = "dashboard",
  API = "api",
}

export const Logger = {
  log(context: LogContext, message: string, metadata: any = {}) {
    console.log(`[${new Date().toISOString()}] [${context.toUpperCase()}] INFO: ${message}`, metadata);
    
    // Could later add sending logs to server
  },
  
  error(context: LogContext, message: string, metadata: any = {}) {
    console.error(`[${new Date().toISOString()}] [${context.toUpperCase()}] ERROR: ${message}`, metadata);
    
    // Could later add sending error logs to server
  },

  // New warn method for consistency
  warn(context: LogContext, message: string, metadata: any = {}) {
    console.warn(`[${new Date().toISOString()}] [${context.toUpperCase()}] WARN: ${message}`, metadata);
  }
};
