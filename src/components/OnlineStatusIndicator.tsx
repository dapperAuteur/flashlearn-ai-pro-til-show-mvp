'use client';

import { useState, useEffect } from 'react';

export default function OnlineStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);

  useEffect(() => {
    // Set initial status
    if (typeof window !== 'undefined' && typeof window.navigator !== 'undefined') {
      setIsOnline(window.navigator.onLine);
    }
    
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineMessage(true);
      setTimeout(() => setShowOnlineMessage(false), 3000); // Message disappears after 3 seconds
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {/* Persistent OFFLINE message */}
      {!isOnline && (
        <div className="fixed inset-x-0 top-0 z-50 p-2 bg-red-800 text-white text-center text-sm border-b-2 border-red-600">
          You are currently offline. Some features may be unavailable.
        </div>
      )}

      {/* Flashing ONLINE message */}
      {showOnlineMessage && (
        <div className="fixed inset-x-0 top-0 z-50 p-2 bg-green-700 text-white text-center text-sm animate-pulse">
          You are back online.
        </div>
      )}
    </>
  );
}