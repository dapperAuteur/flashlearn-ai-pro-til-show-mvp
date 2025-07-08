/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // user state
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [zipCode, setZipCode] = useState('');
  // const [email, setEmail] = useState('');
  // const [password, setPassword] = useState('');
  // const [confirmPassword, setConfirmPassword] = useState('');
  // const [showPassword, setShowPassword] = useState(false);
  // const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
          const data = await response.json();
          console.log('data :>> ', data);
          setUser(data.user);
          setName(data.user.name);
          setZipCode(data.user.zipCode);
        }
      } catch (e) { console.error(e); }
    };
    fetchUser();
  }, []);

  const handleManageSubscription = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session.');
      }

      const { url } = await response.json();
      // Redirect the user to the Stripe Customer Portal
      router.push(url);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, zipCode }),
      });
      if (!response.ok) throw new Error('Failed to update profile.');
      setSuccessMessage('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
      <div className="bg-gray-800/50 p-8 rounded-lg">
      <div className="bg-gray-800/50 p-8 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Update Profile</h2>
        <form onSubmit={handleProfileUpdate}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-300 mb-2">Full Name</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-gray-700 text-white rounded-md px-4 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
          </div>
          <div className="mb-4">
            <label htmlFor="zipCode" className="block text-gray-300 mb-2">Zip Code</label>
            <input type="text" id="zipCode" value={zipCode} onChange={(e) => setZipCode(e.target.value)} required pattern="\d{5}" title="Enter a 5-digit zip code" className="w-full bg-gray-700 text-white rounded-md px-4 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-cyan-500 hover:bg-cyan-600 ...">
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          {successMessage && <p className="text-green-400 text-center mt-4">{successMessage}</p>}
        </form>
      </div>
      
        
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div>
          {
            user && (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'lifetime') && (
              <div className="bg-gray-800/50 p-8 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Manage Billing</h2>
          <p className="text-gray-300 mb-6">
            Update your payment method, view your invoice history, or cancel your subscription at any time.
          </p>
            <button
              onClick={handleManageSubscription}
              disabled={isLoading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-md transition-colors duration-300 disabled:bg-gray-500"
            >
              {isLoading ? 'Loading...' : 'Manage Billing & Subscription'}
            </button>
            </div>
            
          )}
        </div>
      </div>
    </div>
  );
}