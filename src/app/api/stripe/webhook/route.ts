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

  console.log('--- STRIPE WEBHOOK RECEIVED ---');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed. Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log(`✅ Received Stripe Event: ${event.type}`);

  try {
    await dbConnect();
    // Handle the event
    switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      if (!userId) {
          console.error('Webhook Error: Missing userId in checkout.session.completed metadata.');
          break;
        }

      console.log('Processing checkout.session.completed for userId session:', userId, session);


      if (!userId) {
        console.error('Webhook Error: Missing userId in checkout session metadata.');
        break;
      }
      
      // Handle one-time lifetime payment immediately
        if (session.mode === 'payment') {
          console.log(`Processing lifetime payment for user: ${userId}`);
          await User.findByIdAndUpdate(userId, { subscriptionStatus: 'lifetime' });
          console.log(`✅ User ${userId} updated to 'lifetime' status.`);
        }
        
        // For new subscriptions, we save the IDs here. The 'invoice.paid' event will activate the status.
        if (session.mode === 'subscription' && session.subscription) {
           console.log(`Processing new subscription for user: ${userId}`);
           await User.findByIdAndUpdate(userId, { 
             stripeSubscriptionId: session.subscription.toString(),
             // We can optionally find the customer and update the user record here too if needed
             stripeCustomerId: session.customer?.toString(),
           });
           console.log(`✅ User ${userId} subscription and customer IDs saved.`);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription?.toString();
        
        if (!subscriptionId) break;

        console.log(`Processing invoice.paid for subscription: ${subscriptionId}`);
        // Find user by their subscription ID and activate their account
        const updatedUser = await User.findOneAndUpdate(
          { stripeSubscriptionId: subscriptionId },
          { subscriptionStatus: 'active' },
          { new: true }
        );
        if (updatedUser) {
          console.log(`✅ User ${updatedUser._id} subscription status updated to 'active'.`);
        } else {
          console.warn(`Webhook Warning: Could not find user for subscription ID ${subscriptionId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Processing subscription deletion for: ${subscription.id}`);

        
        const updatedUser = await User.findOneAndUpdate(
          { stripeSubscriptionId: subscription.id },
          { subscriptionStatus: 'inactive' },
          { new: true }
        );
        console.log(`❌ Subscription deleted. User ${updatedUser?._id} status set to inactive.`);
        if (updatedUser) {
          console.log(`❌ User ${updatedUser._id} subscription status set to 'inactive'.`);
        } else {
          console.warn(`Webhook Warning: Could not find user for deleted subscription ID ${subscription.id}`);
        }
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