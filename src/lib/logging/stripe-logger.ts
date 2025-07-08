/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/logging/stripe-logger.ts
import { NextRequest } from "next/server";
import { Logger, LogContext, LogLevel } from "./logger";
import { AnalyticsLogger } from "./logger";
import clientPromise from "@/lib/db/mongodb";
import { StripeLog } from "@/models/StripeLog"; // We will need to create this model interface

/**
 * Logs a Stripe-related event to the database and console.
 * @param {object} params - The parameters for logging.
 * @param {string} params.level - The severity level of the log.
 * @param {string} params.message - The log message.
 * @param {string} [params.userId] - The ID of the user associated with the event.
 * @param {NextRequest} [params.request] - The Next.js request object.
 * @param {Record<string, any>} [params.metadata] - Additional metadata for the log.
 * @returns {Promise<string | null>} The ID of the log entry or null if not logged.
 */
export async function logStripeEvent({
  level,
  message,
  userId,
  request,
  metadata = {},
}: {
  level: LogLevel;
  message: string;
  userId?: string;
  request?: NextRequest;
  metadata?: Record<string, any>;
}): Promise<string | null> {
  try {
    const requestId = await Logger.log({
      context: LogContext.SYSTEM, // Using SYSTEM context as Stripe is an external service
      level,
      message,
      userId,
      request,
      metadata,
    });

    // Persist to a dedicated Stripe log collection in the database
    const client = await clientPromise;
    const db = client.db();

    const logEntry: StripeLog = {
      level,
      message,
      userId,
      timestamp: new Date(),
      metadata,
      requestId,
    };

    await db.collection("stripe_logs").insertOne(logEntry);

    // If it's a successful payment, track it as an analytics event
    if (metadata.eventType === "checkout.session.completed" && level === LogLevel.INFO) {
      await AnalyticsLogger.trackEvent({
        userId,
        eventType: "user_subscription_created", // A new, specific analytics event
        properties: {
          stripeCustomerId: metadata.stripeCustomerId,
          plan: metadata.plan,
        },
        request,
      });
    }

    return requestId;
  } catch (error) {
    // Fallback to console if database logging fails
    console.error("Failed to log Stripe event:", error);
    return null;
  }
}
