/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react'; // <-- Import useSession and signIn
import StudySession from './StudySession';
import Leaderboard from './Leaderboard';
import UsernameSetter, { getUsername } from './UsernameSetter';
import ReviewAlert from './ReviewAlert';
import { FlashcardSet } from '@/types';

type View = 'generator' | 'leaderboard';

// Helper function to create a shareable link for a set
const createShareLink = (set: FlashcardSet): string => {
  const data = btoa(JSON.stringify(set.cards));
  const topic = encodeURIComponent(set.topic);
  return `${window.location.origin}/challenge?data=${data}&topic=${topic}`;
};

export default function CardGenerator() {
  // --- STATE MANAGEMENT ---
  const { data: session, status } = useSession(); // <-- Get session data
  const isAuthenticated = status === 'authenticated';

  const [topic, setTopic] = useState('');
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [studyingSet, setStudyingSet] = useState<FlashcardSet | null>(null);
  const [view, setView] = useState<View>('generator');
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  const refreshSets = useCallback(async () => {
    // No need to fetch if the user isn't logged in.
    if (!isAuthenticated) {
        setSets([]);
        return;
    }
    try {
      const response = await fetch('/api/flashcard-sets');
      if (response.ok) {
        const data = await response.json();
        setSets(data.sets);
      } else {
        setSets([]);
      }
    } catch (e) {
      console.error("Failed to fetch sets", e);
      setSets([]);
    }
  }, [isAuthenticated]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

   useEffect(() => {
    // Only show the username modal if the auth status is determined.
    if (status !== 'loading' && !getUsername()) {
      setShowUsernameModal(true);
    }
    // Only refresh sets if the user is authenticated.
    if (isAuthenticated) {
        refreshSets();
    }
  }, [status, isAuthenticated, refreshSets]);

  const handleShare = async (set: FlashcardSet) => {
    const shareUrl = createShareLink(set);
    const shareData = {
      title: `TIL.Show Flashcards: ${set.topic}`,
      text: `Check out this flashcard set I made on "${set.topic}"!`,
      url: shareUrl,
    };

    if (navigator.share) {
      await navigator.share(shareData).catch(err => console.error('Share failed:', err));
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    }
  };

  const handleGenerateClick = async () => {
    // --- NEW: Check for authentication first ---
    if (!isAuthenticated) {
      // Redirect to login. NextAuth will handle the rest.
      signIn(); 
      return;
    }

    if (!topic) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const genResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      
      // Handle potential rate-limiting or other errors from the API
      if (!genResponse.ok) {
        const errorData = await genResponse.json();
        throw new Error(errorData.error || 'Failed to generate cards from AI.');
      }
      const genData = await genResponse.json();

      const saveResponse = await fetch('/api/flashcard-sets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, cards: genData.cards }),
      });
      if (!saveResponse.ok) throw new Error('Failed to save the new set.');

      await refreshSets();

    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
      setTopic('');
    }
  };
  
  if (studyingSet) {
    return <StudySession set={studyingSet} onEndSession={() => {
      setStudyingSet(null);
      refreshSets();
    }} />;
  }

  return (
    <>
      {showUsernameModal && <UsernameSetter onClose={() => setShowUsernameModal(false)} />}
      
      <div className="text-center mb-8">
        <div className="inline-flex bg-gray-800 p-1 rounded-lg">
          <button onClick={() => setView('generator')} className={`px-6 py-2 rounded-md ${view === 'generator' ? 'bg-cyan-500 text-white' : 'text-gray-300'}`}>Generator</button>
          <button onClick={() => setView('leaderboard')} className={`px-6 py-2 rounded-md ${view === 'leaderboard' ? 'bg-cyan-500 text-white' : 'text-gray-300'}`}>Leaderboard</button>
        </div>
      </div>
      
      {view === 'generator' && (
        <>
          <div className="p-8 bg-gray-800/50 rounded-lg max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Enter a topic..." className="flex-grow bg-gray-700 text-white rounded-md px-4 py-2 border border-gray-600" disabled={isLoading} />
              <button onClick={handleGenerateClick} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed" disabled={isLoading}>
                {isLoading ? 'Gemini is Thinking...' : 'Generate Cards'}
              </button>
            </div>
            <div className="text-center mt-4">
              <a 
                href="/flashcard_template.csv" 
                download="flashcard_template.csv"
                className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline"
              >
                Download CSV Template for Bulk Import
              </a>
            </div>
            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
          </div>
          <ReviewAlert onStartReview={(reviewSet) => setStudyingSet(reviewSet)} />
          <div className="mt-12 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">Your Flashcard Sets</h3>
            <div className="space-y-4">
              {isAuthenticated && sets.length > 0 ? (
                 sets.map((set: FlashcardSet) => (
                  <div key={String(set._id)} className="bg-gray-800 p-4 rounded-md shadow-md flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-white text-lg">{set.topic}</p>
                      <p className="text-gray-400 text-sm">{set.cards.length} cards</p>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => handleShare(set)} title="Share this set" className="bg-gray-600 hover:bg-gray-700 text-white font-bold p-2 rounded-md">
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                       </button>
                      <button onClick={() => setStudyingSet(set)} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md">
                        Study
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">Log in to generate and see your saved flashcard sets.</p>
              )}
            </div>
          </div>
        </>
      )}

      {view === 'leaderboard' && <Leaderboard />}
    </>
  );
}
