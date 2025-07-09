/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
});

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    // 1. Authenticate the user and get their ID
    const { userId } = verifyAuth(request);

    // 2. Find the user in our database to get their Stripe Customer ID
    const user = await User.findById(userId);
    if (!user || !user.stripeCustomerId) {
      throw new Error('User not found or has no Stripe customer ID.');
    }

    let stripeCustomerId = user.stripeCustomerId;

    // If the user has an active sub but no ID, create one for them now
    if (!stripeCustomerId && (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'lifetime')) {
        const customer = await stripe.customers.create({ email: user.email, name: user.name });
        stripeCustomerId = customer.id;
        user.stripeCustomerId = stripeCustomerId;
        await user.save();
    }

    if (!stripeCustomerId) {
      throw new Error('User is not a Stripe customer.');
    }

    // 3. Create a Billing Portal session in Stripe
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${request.headers.get('origin')}/settings`, // URL to return to after leaving the portal
    });

    // 4. Return the unique URL for the portal session
    return NextResponse.json({ url: portalSession.url });

  } catch (error: any) {
    if (error.message.includes('token')) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    console.error("Stripe Portal Error:", error);
    return NextResponse.json({ error: 'Could not create portal session' }, { status: 500 });
  }
}