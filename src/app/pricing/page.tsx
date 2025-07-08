/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import getStripe from '@/lib/stripe';

interface Plan {
  name: string;
  description: string;
  price: string;
  priceId: string;
}

const plans: Plan[] = [
  {
    name: 'Monthly',
    description: 'Full access, billed monthly.',
    price: '$10/mo',
    priceId: process.env.NEXT_PUBLIC_STRIPE_STUDENT_MONTHLY_MEMBERSHIP!,
  },
  {
    name: 'Annual',
    description: 'Full access, billed annually.',
    price: '$100/yr',
    priceId: process.env.NEXT_PUBLIC_STRIPE_STUDENT_ANNUAL_MEMBERSHIP!,
  },
  {
    name: 'Lifetime Learner',
    description: 'One-time payment for lifetime access.',
    price: '$100',
    priceId: process.env.NEXT_PUBLIC_STRIPE_LIFELONG_LEARNER_MEMBERSHIP!,
  }
];

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        throw new Error('Could not create checkout session.');
      }
      
      const { sessionId } = await response.json();
      const stripe = await getStripe();
      if (!stripe) throw new Error('Stripe.js failed to load.');

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        throw new Error(error.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto text-center">
      <h1 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h1>
      <p className="text-lg text-gray-300 mb-12">Unlock premium features like unlimited AI card generation.</p>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.priceId} className="bg-gray-800/50 p-8 rounded-lg border border-gray-700 flex flex-col">
            <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
            <p className="text-gray-400 mt-2 flex-grow">{plan.description}</p>
            <p className="text-4xl font-extrabold text-white my-6">{plan.price}</p>
            <button
              onClick={() => handleCheckout(plan.priceId)}
              disabled={isLoading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-md transition-colors disabled:bg-gray-500"
            >
              {isLoading ? 'Processing...' : 'Get Started'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}