/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import dbConnect from '@/lib/db/dbConnect';
import User from '@/models/User';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function PUT(request: NextRequest) {
  await dbConnect();
  try {
    const { userId } = verifyAuth(request);
    const { name, zipCode } = await request.json();

    const user = await User.findByIdAndUpdate(userId, { name, zipCode }, { new: true });

    if (!user) throw new Error('User not found');

    // If the user is a stripe customer, update their info in Stripe too
    if (user.stripeCustomerId) {
      await stripe.customers.update(user.stripeCustomerId, {
        name: user.name,
        address: {
          postal_code: user.zipCode,
        },
      });
    }

    return NextResponse.json({ message: 'Profile updated successfully.' });
  } catch (error: any) {
    console.log('Update User error :>> ', error);
    // ... error handling
  }
}