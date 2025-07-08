/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/stripe/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User"; // Using the User model from your schema
import { logStripeEvent } from "@/lib/logging/stripe-logger";
import { LogLevel } from "@/lib/logging/logger";

// This is a secret token you create and also add to Pabbly
const PABBLY_WEBHOOK_SECRET = process.env.PABBLY_WEBHOOK_SECRET;
// ** CRITICAL FIX: Force the runtime to be Node.js for database compatibility **
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  console.log('req :>> ', req);

  // Send a success response back to Pabbly
  return new NextResponse(JSON.stringify({ received: true, status: "success" }), { status: 200 });

}

export async function POST(req: NextRequest) {
  console.log('req :>> ', req);
  // 1. Authenticate the request from Pabbly using the shared secret

  console.log("[WEBHOOK_START] - Pabbly webhook handler invoked.");

  if (!PABBLY_WEBHOOK_SECRET) {
      console.error("[WEBHOOK_ERROR] - CRITICAL: PABBLY_WEBHOOK_SECRET environment variable is not set.");
  } else {
      console.log("[WEBHOOK_INFO] - PABBLY_WEBHOOK_SECRET is loaded.");
  }
  const authorizationHeader = req.headers.get("Authorization");
  if (authorizationHeader !== `Bearer ${PABBLY_WEBHOOK_SECRET}`) {
    await logStripeEvent({
      level: LogLevel.WARNING,
      message: "Unauthorized webhook attempt: Invalid or missing secret.",
      request: req,
    });
    console.warn(`[WEBHOOK_WARN] - Unauthorized access attempt. Provided token does not match expected secret.`);
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let body;
  try {
    body = await req.json();
    await logStripeEvent({
        level: LogLevel.INFO,
        message: "Received and parsed webhook from Pabbly.",
        metadata: { payload: body }
    });
  } catch (error: any) {
    await logStripeEvent({
        level: LogLevel.ERROR,
        message: "Failed to parse Pabbly webhook JSON body.",
        metadata: { error: error.message }
    });
    return new NextResponse("Invalid JSON body", { status: 400 });
  }

  // 2. Extract the customer's email from the Pabbly payload
  // NOTE: You MUST confirm this field name in your Pabbly workflow.
  // Common examples are 'customer_email', 'email', or 'data.customer_details.email'
  const userEmail = body?.customerEmail;
  const {checkoutStatus, subscription, dataObjectId, userId, postalCode, userName, } = body;

  console.log('userEmail, checkoutStatus, subscription, dataObjectId, userId, postalCode, userName :>> ', userEmail, checkoutStatus, subscription, dataObjectId, userId, postalCode, userName);

  if (!userEmail) {
    await logStripeEvent({
      level: LogLevel.ERROR,
      message: "Pabbly webhook payload is missing the required 'customer_email' field.",
      metadata: { payload: body },
    });
    return new NextResponse("Webhook Error: Missing customer_email in payload", { status: 400 });
  }

  // 3. Update the user in your database
  try {
    await logStripeEvent({
        level: LogLevel.INFO,
        message: `Attempting to connect to database for user: ${userEmail}`
    });
    await dbConnect();
    await logStripeEvent({
        level: LogLevel.INFO,
        message: `Database connected. Searching for user: ${userEmail}`
    });


    // Find the user by their email address
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      await logStripeEvent({
        level: LogLevel.ERROR,
        message: `User with email '${userEmail}' not found in database.`,
        metadata: { payload: body },
      });
      return new NextResponse(`User with email ${userEmail} not found`, { status: 404 });
    }

    await logStripeEvent({
        level: LogLevel.INFO,
        message: `Found user ${user.id}. Attempting to update subscriptionTier.`
    });

    // Update the user's subscription tier
    user.subscriptionTier = "Lifetime Learner";
    if (body?.customer_id) {
        user.stripeCustomerId = body.customer_id;
    }
    await user.save();

    await logStripeEvent({
      level: LogLevel.INFO,
      message: `Successfully updated user ${user.id} to Lifetime Learner tier.`,
      userId: user.id.toString(),
      metadata: {
        eventType: "pabbly.purchase.completed",
        userEmail: userEmail,
      },
    });

  } catch (dbError: any) {
    // Enhanced logging to capture the exact error
    await logStripeEvent({
      level: LogLevel.ERROR,
      message: "A critical error occurred during database operation.",
      metadata: {
          errorMessage: dbError.message,
          errorStack: dbError.stack, // Include stack trace for more detail
          userEmail: userEmail,
          payload: body
      },
    });
    // The generic 500 error is sent to the client
    return new NextResponse("Internal Server Error: Database operation failed.", { status: 500 });
  }

  // Send a success response back to Pabbly
  console.log("[WEBHOOK_SUCCESS] - Process complete. Sending 200 OK.");
  return new NextResponse(JSON.stringify({ received: true, status: "success" }), { status: 200 });
}
