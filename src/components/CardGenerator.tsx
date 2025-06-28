/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

'use client';

import { useState, useEffect } from 'react';
import { addFlashcardSet, getAllFlashcardSets, FlashcardSet } from '@/utils/db';
import StudySession from './StudySession';
import Leaderboard from './Leaderboard';
import UsernameSetter from './UsernameSetter';
import ReviewAlert from './ReviewAlert';

type View = 'generator' | 'leaderboard';

export default function CardGenerator() {
  // --- STATE MANAGEMENT ---
  const [topic, setTopic] = useState('');
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [studyingSet, setStudyingSet] = useState<FlashcardSet | null>(null);
  const [view, setView] = useState<View>('generator');

  // We need a function to refresh the sets list after a study session
  const refreshSets = () => {
    getAllFlashcardSets().then(setSets);
  };
  
  // State for API calls
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- MOCK FOR MVP ---
  // In a real app, this would come from your user authentication system.
  const [isPaidUser, setIsPaidUser] = useState(true); 

   useEffect(() => {
    refreshSets();
  }, []);

  useEffect(() => {
    getAllFlashcardSets().then(setSets);
  }, []);

  const handleGenerateClick = async () => {
    if (!topic || !isPaidUser) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      const generatedCards = data.cards;

      if (generatedCards && generatedCards.length > 0) {
        await addFlashcardSet(topic, generatedCards);
        const updatedSets = await getAllFlashcardSets();
        setSets(updatedSets);
      }
    } catch (e: any) {
      console.error("Failed to generate flashcards", e);
      setError(e.message);
    } finally {
      setIsLoading(false);
      setTopic('');
    }
  };
  
  if (studyingSet) {
   // When a session ends, refresh the main sets list
    return <StudySession set={studyingSet} onEndSession={() => {
      setStudyingSet(null);
      refreshSets();
    }} />;
  }

  return (
    <>
      <UsernameSetter />
      <div className="text-center mb-8">
        <div className="inline-flex bg-gray-800 p-1 rounded-lg">
          <button onClick={() => setView('generator')} className={`px-6 py-2 rounded-md ${view === 'generator' ? 'bg-cyan-500 text-white' : 'text-gray-300'}`}>Generator</button>
          <button onClick={() => setView('leaderboard')} className={`px-6 py-2 rounded-md ${view === 'leaderboard' ? 'bg-cyan-500 text-white' : 'text-gray-300'}`}>Leaderboard</button>
        </div>
      </div>
      
      {view === 'generator' && (
        <>
          <div className="p-8 bg-gray-800/50 rounded-lg max-w-3xl mx-auto">
            {!isPaidUser && (
              <div className="text-center bg-yellow-900/50 border border-yellow-700 text-yellow-300 p-4 rounded-lg mb-4">
                AI Card Generation is a premium feature. Upgrade to create custom sets.
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
              <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Enter a topic..." className="flex-grow bg-gray-700 text-white rounded-md px-4 py-2 border border-gray-600" disabled={isLoading || !isPaidUser} />
              <button onClick={handleGenerateClick} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed" disabled={isLoading || !isPaidUser}>
                {isLoading ? 'Gemini is Thinking...' : 'Generate Cards'}
              </button>
            </div>
            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
          </div>
          <ReviewAlert onStartReview={setStudyingSet} />
          <div className="mt-12 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">Your Flashcard Sets</h3>
            <div className="space-y-4">
              {sets.map((set) => (
                <div key={set.id} className="bg-gray-800 p-4 rounded-md shadow-md flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-white text-lg">{set.topic}</p>
                    <p className="text-gray-400 text-sm">{set.cards.length} cards</p>
                  </div>
                  <button onClick={() => setStudyingSet(set)} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md">
                    Study
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {view === 'leaderboard' && <Leaderboard />}
    </>
  );
}