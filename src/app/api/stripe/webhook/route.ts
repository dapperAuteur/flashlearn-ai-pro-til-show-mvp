/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
});

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  const body = await request.text(); // We need the raw body for verification
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  console.log('--- STRIPE WEBHOOK RECEIVED ---');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed. Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    // Handle the event
    switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      console.log('Processing checkout.session.completed for userId session:', userId, session);


      if (!userId) {
        console.error('Webhook Error: Missing userId in checkout session metadata.');
        break;
      }

      await dbConnect();
      
      let updateData = {};

      if (session.mode === 'subscription') {
        updateData = {
          subscriptionStatus: 'active',
          stripeSubscriptionId: session.subscription?.toString(),
        };
        console.log(`✅ User ${userId} started a subscription. updateData: ${updateData}`);
      } else if (session.mode === 'payment') {
        updateData = {
          subscriptionStatus: 'lifetime',
          // No subscription ID for one-time payments
        };
        console.log(`✅ User ${userId} made a lifetime purchase. , updateData: ${updateData}`);
      }

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
        console.log(`Database update result for user ${userId}:`, updatedUser);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await dbConnect();
        
        const updatedUser = await User.findOneAndUpdate(
          { stripeSubscriptionId: subscription.id },
          { subscriptionStatus: 'inactive' },
          { new: true }
        );
        console.log(`❌ Subscription deleted. User ${updatedUser?._id} status set to inactive.`);
        break;
      }

      default:
      console.warn(`🤷‍♀️ Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook event:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}