'use client';

import { useState } from 'react';

export default function NotifyForm() {
  const [email, setEmail] = useState('');

  // TODO: Replace this with the 'action' URL from your email service's form code.
  const formActionURL = 'YOUR_FORM_ACTION_URL_HERE';

  return (
    <div className="mt-16 p-8 bg-gray-800 rounded-lg max-w-2xl mx-auto text-center">
      <h3 className="text-2xl font-bold text-white">Get Notified!</h3>
      <p className="text-gray-300 mt-2">
        Sign up to get notified when user accounts, progress tracking, and more are released.
      </p>
      <form 
        action={formActionURL} 
        method="post" 
        target="_blank" // Opens the confirmation page in a new tab
        className="mt-6 flex flex-col sm:flex-row gap-4"
      >
        <label htmlFor="email-input" className="sr-only">Email address</label>
        <input
          type="email"
          id="email-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          // TODO: Replace 'EMAIL' with the 'name' attribute from your email service's form.
          name="EMAIL" 
          placeholder="Enter your email"
          required
          className="flex-grow bg-gray-700 text-white placeholder-gray-400 rounded-md px-4 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md transition-colors duration-300"
        >
          Notify Me
        </button>
      </form>
    </div>
  );
}