/* eslint-disable @typescript-eslint/no-explicit-any */
import { openDB, DBSchema } from 'idb';

const DB_NAME = 'TILShowDB';
const DB_VERSION = 1;
const SETS_STORE_NAME = 'flashcardSets';

interface Flashcard {
  sideA: string;
  sideB: string;
}

export interface FlashcardSet {
  id: number;
  topic: string;
  createdAt: Date;
  cards: Flashcard[];
}

interface TILShowDB extends DBSchema {
  [SETS_STORE_NAME]: {
    key: number;
    value: FlashcardSet;
    indexes: { 'createdAt': Date };
  };
}

const dbPromise = openDB<TILShowDB>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    const store = db.createObjectStore(SETS_STORE_NAME, {
      keyPath: 'id',
      autoIncrement: true,
    });
    store.createIndex('createdAt', 'createdAt');
  },
});

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