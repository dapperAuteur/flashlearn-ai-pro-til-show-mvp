'use client';

import { signIn } from 'next-auth/react';

export default function GetStartedButton() {
  const handleGetStarted = () => {
    // Redirect the user to the Google sign-in page.
    // After sign-in, they will be returned to the homepage.
    signIn('google', { callbackUrl: '/' });
  };

  return (
    <button
      onClick={handleGetStarted}
      className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors shadow-lg"
    >
      Get Started
    </button>
  );
}
