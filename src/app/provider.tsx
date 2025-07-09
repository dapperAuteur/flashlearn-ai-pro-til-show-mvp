'use client';

import { SessionProvider } from 'next-auth/react';

// This is a client component that wraps the app in the SessionProvider
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
