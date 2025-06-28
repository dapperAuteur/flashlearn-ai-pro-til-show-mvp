import { Flashcard } from './db';

// The intervals in days for each SRS level.
// e.g., Level 1 -> review in 1 day, Level 2 -> 3 days, etc.
const srsIntervals = [1, 3, 7, 14, 30, 60, 120, 365];

export const calculateNextReview = (card: Flashcard, wasCorrect: boolean): Flashcard => {
  const currentSrsLevel = card.srsLevel || 0;

  let nextSrsLevel: number;

  if (wasCorrect) {
    // If correct, advance to the next level
    nextSrsLevel = currentSrsLevel + 1;
  } else {
    // If incorrect, reset to level 0 or go back one level
    nextSrsLevel = Math.max(0, currentSrsLevel - 1);
  }

  // Cap the level at the highest defined interval
  const cappedLevel = Math.min(nextSrsLevel, srsIntervals.length - 1);
  const intervalDays = srsIntervals[cappedLevel];

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

  return {
    ...card,
    srsLevel: cappedLevel,
    nextReview: nextReviewDate,
  };
};