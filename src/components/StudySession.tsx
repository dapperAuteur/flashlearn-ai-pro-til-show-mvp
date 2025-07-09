/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { Flashcard, FlashcardSet } from '@/types';
import { addLeaderboardScore } from '@/utils/db';
import { calculateNextReview } from '@/utils/srs';
import { getUsername } from './UsernameSetter';

interface StudySessionProps {
  set: FlashcardSet;
  onEndSession: () => void;
}

export default function StudySession({ set: initialSet, onEndSession }: StudySessionProps) {
  const [set, setSet] = useState(initialSet);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());

  const currentCard = set.cards[currentIndex];

  const handleAnswer = async (wasCorrect: boolean) => {
    if (wasCorrect) {
      setScore(prev => prev + 1);
    }
    
    // Calculate and update the card's next review date
    const updatedCard = calculateNextReview(currentCard, wasCorrect);
    
    // Create a new set with the updated card
    const updatedCards = [...set.cards];
    updatedCards[currentIndex] = updatedCard;
    const updatedSetData = { ...set, cards: updatedCards };
    
    try {
      await fetch('/api/flashcard-sets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          setId: updatedSetData._id, 
          topic: updatedSetData.topic,
          cards: updatedSetData.cards,
        }),
      });
      setSet(updatedSetData); // Update local state
    } catch (error) {
      console.error("Failed to update set:", error);
    }

    // Move to the next card or finish the session
    if (currentIndex === set.cards.length - 1) {
      setIsComplete(true);
    } else {
      setIsRevealed(false);
      setCurrentIndex(prev => prev + 1);
    }
  };
  
  const completionTime = Math.round((Date.now() - startTime) / 1000);
  const shareableLink = `${window.location.origin}/challenge?data=${btoa(JSON.stringify(set.cards))}&score=${score}&time=${completionTime}&topic=${encodeURIComponent(set.topic)}`;

  useEffect(() => {
    if (isComplete) {
      const username = getUsername();
      if (username) {
        addLeaderboardScore({ username, topic: set.topic, score, time: completionTime });
      }
    }
  }, [isComplete, set.topic, score, completionTime]);

  if (isComplete) {
    return (
      <div className="p-8 bg-gray-800/50 rounded-lg max-w-3xl mx-auto text-center">
        <h3 className="text-2xl font-bold text-white">Session Complete!</h3>
        <p className="text-cyan-400 text-4xl font-bold my-4">{score} / {set.cards.length}</p>
        <p className="text-gray-300">Completion Time: {completionTime} seconds</p>
        <div className="mt-6">
          <p className="text-white mb-2">Challenge a friend!</p>
          <input type="text" readOnly value={shareableLink} className="w-full bg-gray-700 text-gray-200 rounded-md p-2 border border-gray-600" onFocus={(e) => e.target.select()} />
          <button onClick={() => navigator.clipboard.writeText(shareableLink)} className="mt-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md w-full transition-colors">Copy Link</button>
        </div>
        <button onClick={onEndSession} className="mt-8 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md transition-colors">Back to Sets</button>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-800/50 rounded-lg max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">{set.topic}</h3>
        <button onClick={onEndSession} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md text-sm transition-colors">End Session</button>
      </div>
      <div className="text-center text-gray-300 mb-6">
        Card {currentIndex + 1} of {set.cards.length} | Score: {score}
        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2"><div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${((currentIndex + 1) / set.cards.length) * 100}%` }}></div></div>
      </div>
      <div className="bg-gray-700 aspect-[3/2] rounded-lg p-6 flex items-center justify-center text-center cursor-pointer select-none" onClick={() => setIsRevealed(!isRevealed)}>
        <p className="text-2xl text-white">{isRevealed ? set.cards[currentIndex].sideB : set.cards[currentIndex].sideA}</p>
      </div>
      <p className="text-center text-gray-400 mt-2 text-sm">Click card to reveal</p>
      <div className="mt-6 flex justify-around items-center">
        <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-md transition-colors" onClick={() => handleAnswer(false)}>Wrong</button>
        <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-md transition-colors" onClick={() => handleAnswer(true)}>Right</button>
      </div>
    </div>
  );
}