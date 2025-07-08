'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AuthStatusProps {
  isLoggedIn: boolean;
}

export default function AuthStatus({ isLoggedIn }: AuthStatusProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Refresh the page to reflect the new auth state
      router.refresh();
    }
  };

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-4">
        {/* --- NEW SETTINGS LINK --- */}
        <Link href="/settings" className="text-gray-300 hover:text-white transition-colors text-sm">
          Settings
        </Link>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors"
        >
          Log Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
        Log In
      </Link>
      <Link href="/register" className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors">
        Sign Up
      </Link>
    </div>
  );
}