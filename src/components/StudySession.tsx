'use client';

import { useState } from 'react';
import { FlashcardSet } from '@/utils/db';

interface StudySessionProps {
  set: FlashcardSet;
  onEndSession: () => void; // Function to go back to the list
}

export default function StudySession({ set, onEndSession }: StudySessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const currentCard = set.cards[currentIndex];

  const handleNext = () => {
    setIsRevealed(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % set.cards.length);
  };

  const handlePrevious = () => {
    setIsRevealed(false);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + set.cards.length) % set.cards.length);
  };

  return (
    <div className="p-8 bg-gray-800/50 rounded-lg max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">{set.topic}</h3>
        <button
          onClick={onEndSession}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md text-sm transition-colors"
        >
          End Session
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="text-center text-gray-300 mb-6">
        Card {currentIndex + 1} of {set.cards.length}
        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
            <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${((currentIndex + 1) / set.cards.length) * 100}%` }}></div>
        </div>
      </div>

      {/* Flashcard */}
      <div 
        className="bg-gray-700 aspect-[3/2] rounded-lg p-6 flex items-center justify-center text-center cursor-pointer select-none"
        onClick={() => setIsRevealed(!isRevealed)}
      >
        <p className="text-2xl text-white">
          {isRevealed ? currentCard.sideB : currentCard.sideA}
        </p>
      </div>
      <p className="text-center text-gray-400 mt-2 text-sm">Click card to reveal</p>

      {/* Navigation and Actions */}
      <div className="mt-6 flex justify-between items-center">
        <button 
          onClick={handlePrevious} 
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md transition-colors"
        >
          Previous
        </button>
        <div className="flex gap-4">
            {/* "Easy Mode" Buttons */}
            <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-md transition-colors" onClick={handleNext}>Wrong</button>
            <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-md transition-colors" onClick={handleNext}>Right</button>
        </div>
        <button 
          onClick={handleNext} 
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}