/* eslint-disable @typescript-eslint/no-explicit-any */
import { openDB, DBSchema } from 'idb';

const DB_NAME = 'TILShowDB';
const DB_VERSION = 2;
const SETS_STORE_NAME = 'flashcardSets';

const LEADERBOARD_STORE_NAME = 'leaderboardScores';

export interface LeaderboardScore {
  id?: number;
  username: string;
  topic: string;
  score: number;
  time: number; // in seconds
  createdAt: Date;
}

// Add the new store to the DB schema interface
interface TILShowDB extends DBSchema {
  [SETS_STORE_NAME]: {
    key: number;
    value: FlashcardSet;
    indexes: { 'createdAt': Date };
  };
  [LEADERBOARD_STORE_NAME]: {
    key: number;
    value: LeaderboardScore;
    indexes: { 'topic': string };
  };
}

export interface Flashcard {
  sideA: string;
  sideB: string;
  srsLevel?: number; // How many times reviewed correctly in a row
  nextReview?: Date; // When to review this card next
}

export interface FlashcardSet {
  id: number;
  topic: string;
  createdAt: Date;
  cards: Flashcard[];
}

const dbPromise = openDB<TILShowDB>(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      const setsStore = db.createObjectStore(SETS_STORE_NAME, {
        keyPath: 'id',
        autoIncrement: true,
      });
      setsStore.createIndex('createdAt', 'createdAt');
    }
    if (oldVersion < 2) { // Logic to create the new store
      const leaderboardStore = db.createObjectStore(LEADERBOARD_STORE_NAME, {
        keyPath: 'id',
        autoIncrement: true,
      });
      leaderboardStore.createIndex('topic', 'topic');
    }
  },
});

export const updateFlashcardSet = async (set: FlashcardSet): Promise<void> => {
  const db = await dbPromise;
  await db.put(SETS_STORE_NAME, set);
};

export const addFlashcardSet = async (topic: string, cards: Flashcard[]): Promise<void> => {
  const db = await dbPromise;
  await db.add(SETS_STORE_NAME, {
    // id is auto-generated
    topic,
    cards,
    createdAt: new Date(),
  } as any); // 'as any' is used because id is auto-incremented
};

export const getAllFlashcardSets = async (): Promise<FlashcardSet[]> => {
  const db = await dbPromise;
  // Get all sets and sort by most recently created
  return db.getAllFromIndex(SETS_STORE_NAME, 'createdAt').then(sets => sets.reverse());
};

export const getFlashcardSetById = async (id: number): Promise<FlashcardSet | undefined> => {
  const db = await dbPromise;
  return db.get(SETS_STORE_NAME, id);
};

export const addLeaderboardScore = async (scoreData: Omit<LeaderboardScore, 'id' | 'createdAt'>): Promise<void> => {
  const db = await dbPromise;
  await db.add(LEADERBOARD_STORE_NAME, {
    ...scoreData,
    createdAt: new Date(),
  });
};

export const getLeaderboardScores = async (): Promise<LeaderboardScore[]> => {
  const db = await dbPromise;
  return db.getAll(LEADERBOARD_STORE_NAME);
};

export const clearLocalSets = async (): Promise<void> => {
  const db = await dbPromise;
  await db.clear(SETS_STORE_NAME);
  console.log('Local flashcard sets cleared.');
};