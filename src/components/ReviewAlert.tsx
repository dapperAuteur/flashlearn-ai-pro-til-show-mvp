'use client';

import { useState, useEffect } from 'react';
import { getAllFlashcardSets, Flashcard, FlashcardSet } from '@/utils/db';

interface ReviewAlertProps {
  onStartReview: (reviewSet: FlashcardSet) => void;
}

export default function ReviewAlert({ onStartReview }: ReviewAlertProps) {
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);

  useEffect(() => {
    const checkForDueCards = async () => {
      const allSets = await getAllFlashcardSets();
      const now = new Date();
      const cardsToReview: Flashcard[] = [];

      allSets.forEach(set => {
        set.cards.forEach(card => {
          // Check if the card has a review date and if it's in the past or today
          if (card.nextReview && new Date(card.nextReview) <= now) {
            cardsToReview.push(card);
          }
        });
      });

      setDueCards(cardsToReview);
    };

    checkForDueCards();
  }, []); // Runs once on component mount

  if (dueCards.length === 0) {
    return null; // Don't show anything if no cards are due
  }

  const handleStartReviewClick = () => {
    // Create a temporary "super set" containing all cards due for review
    const reviewSet: FlashcardSet = {
      id: Date.now(), // Use a temporary unique ID
      topic: 'Review Session',
      createdAt: new Date(),
      cards: dueCards,
    };
    onStartReview(reviewSet);
  };

  return (
    <div className="p-4 mb-8 bg-cyan-800/50 border-2 border-cyan-500 rounded-lg max-w-3xl mx-auto text-center">
      <h3 className="text-xl font-bold text-white">Review Due!</h3>
      <p className="text-gray-200 mt-1">
        You have <span className="font-bold text-cyan-300">{dueCards.length}</span> card{dueCards.length > 1 ? 's' : ''} ready for review.
      </p>
      <button
        onClick={handleStartReviewClick}
        className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-md transition-colors"
      >
        Start Review Session
      </button>
    </div>
  );
}