/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  const body = await request.text(); // We need the raw body for verification
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Error message: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
  case 'checkout.session.completed': { // Use brackets to scope constants
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('✅ Checkout session completed for user:', session.metadata?.userId);

    const userId = session.metadata?.userId;
    if (!userId) {
      console.error('Webhook Error: Missing userId in session metadata.');
      break;
    }
    
    await dbConnect();

    // Handle one-time payment for lifetime access
    if (session.mode === 'payment') {
      await User.findByIdAndUpdate(userId, {
        subscriptionStatus: 'lifetime', // Set a specific status for lifetime
      });
      console.log(`Updated user ${userId} to lifetime status.`);
    }

    // Handle a new subscription
    if (session.mode === 'subscription') {
      await User.findByIdAndUpdate(userId, {
        subscriptionStatus: 'active',
        stripeSubscriptionId: session.subscription?.toString(),
      });
      console.log(`Updated user ${userId} to active subscription.`);
    }
    break;
  }

  case 'customer.subscription.deleted': { // Handle cancellations
    const subscription = event.data.object as Stripe.Subscription;
    await dbConnect();
    
    // Find the user by their Stripe subscription ID and downgrade them
    await User.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      { subscriptionStatus: 'inactive' }
    );
    console.log(`Subscription deleted for user with sub ID: ${subscription.id}`);
    break;
  }

  default:
    console.warn(`Unhandled event type ${event.type}`);
}

  return NextResponse.json({ received: true });
}