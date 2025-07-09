/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User'; // Import the User model
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  await dbConnect();
  try {
    const { userId } = verifyAuth(request);
    const { priceId } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    let stripeCustomerId = user.stripeCustomerId;

    if (stripeCustomerId) {
      // If user has an ID, retrieve the customer from Stripe
      // This is to ensure the customer hasn't been deleted in Stripe
      try {
        await stripe.customers.retrieve(stripeCustomerId);
      } catch (error) {
        console.log('Retrieving customer from Stripe with stripeCustomerId failed with error :>> ', error);
        // Customer was deleted in Stripe, so we'll create a new one
        stripeCustomerId = undefined;
      }
    }

    // 2. If the user doesn't have a Stripe Customer ID, create one
    if (!stripeCustomerId) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });
      if (customers.data.length > 0) {
        // Customer with this email already exists in Stripe
        stripeCustomerId = customers.data[0].id;
      } else {
        // No customer found, so create a new one
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name
        });
        stripeCustomerId = customer.id;
      }

      // 3. Save the new ID to our User model in our database
      await User.findByIdAndUpdate(userId, { stripeCustomerId: stripeCustomerId });
    }

    const mode: Stripe.Checkout.Session.Mode = 
        priceId === process.env.NEXT_PUBLIC_STRIPE_LIFELONG_LEARNER_MEMBERSHIP 
        ? 'payment' 
        : 'subscription';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: mode,
      success_url: `${request.headers.get('origin')}/?payment_success=true`,
      cancel_url: `${request.headers.get('origin')}/pricing`,
      // success_url: `${request.headers.get('origin')}/?session_id={CHECKOUT_SESSION_ID}`,
      // cancel_url: `${request.headers.get('origin')}/`,
      // We pass the userId in metadata to identify the user in the webhook
      customer: stripeCustomerId, 
      // We still pass metadata for our webhook to easily find our internal userId
      metadata: {
        userId: userId,
      }
    });

    return NextResponse.json({ sessionId: session.id });

  } catch (error: any) {
    if (error.message.includes('token')) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    console.error("Stripe Error:", error);
    return NextResponse.json({ error: 'Could not create checkout session' }, { status: 500 });
  }
}