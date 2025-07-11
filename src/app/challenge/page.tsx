'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useMemo } from 'react';
import StudySession from '@/components/StudySession';
import Link from 'next/link';
import { FlashcardSet, Flashcard } from '@/types/index';

// Helper function to decode data from the URL
const decodeDataFromURL = (encodedData: string | null): Flashcard[] | null => {
  if (!encodedData) return null;
  try {
    const jsonString = atob(encodedData); // atob is a browser function for Base64 decoding
    const data = JSON.parse(jsonString);
    // Basic validation to ensure the data is in the expected format
    if (Array.isArray(data) && data.every(item => typeof item.question === 'string' && typeof item.answer === 'string')) {
      return data;
    }
    console.error("Decoded data is not in the expected card array format.");
    return null;
  } catch (error) {
    console.error("Failed to decode or parse data:", error);
    return null;
  }
};

export default function ChallengePage() {
  const searchParams = useSearchParams();
  const [startChallenge, setStartChallenge] = useState(false);

  const score = searchParams.get('score');
  const time = searchParams.get('time');
  const topic = searchParams.get('topic');
  
  // useMemo will only decode the data once
  const cardData = useMemo(() => decodeDataFromURL(searchParams.get('data')), [searchParams]);

  // If the user starts the challenge, and we have card data, render the study session
  if (startChallenge && cardData) {
    // We need to create a temporary FlashcardSet object to pass to the StudySession component
    const challengeSet: FlashcardSet = {
      _id: '0', // A dummy ID
      owner: '', // A dummy owner
      isPublic: false, // A dummy flag
      topic: topic || 'Challenge Set',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cards: cardData,
    };
    return <StudySession set={challengeSet} onEndSession={() => setStartChallenge(false)} />;
  }

  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold">{score ? "You've been challenged!" : "A flashcard set was shared with you!"}</h2>
      <p className="text-lg mt-2 text-gray-300">Topic: <span className="font-bold text-white">{topic || 'Unknown'}</span></p>
      
      {/* Only show the "Score to Beat" section if score exists in the URL */}
      {score && (
        <div className="my-8 p-6 bg-gray-800/50 rounded-lg max-w-sm mx-auto">
          <p className="text-gray-400">Score to Beat:</p>
          <p className="text-cyan-400 text-5xl font-bold">{score}</p>
          <p className="text-gray-400 mt-4">Time to Beat:</p>
          <p className="text-cyan-400 text-3xl font-bold">{time || 'N/A'} seconds</p>
        </div>
      )}

      {cardData ? (
        <button 
          onClick={() => setStartChallenge(true)}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors mt-8"
        >
          {score ? 'Accept Challenge!' : 'Study This Set'}
        </button>
      ) : (
        <p className="text-red-500 mt-8">Challenge data is invalid or missing from the URL.</p>
      )}
       <Link href="/" className="block mt-8 text-cyan-400 hover:underline">
        Or, create your own sets
      </Link>
    </div>
  );
}