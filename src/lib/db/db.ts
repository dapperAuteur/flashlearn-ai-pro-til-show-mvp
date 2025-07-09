// src/lib/db.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Flashcard } from '@/types';

interface MyDB extends DBSchema {
  'flashcard-sets': {
    key: string;
    value: {
      topic: string;
      cards: Flashcard[];
    };
  };
}

let dbPromise: Promise<IDBPDatabase<MyDB>> | null = null;

const getDb = () => {
  // This check ensures that indexedDB is only accessed on the client-side (in the browser)
  if (typeof window === 'undefined') {
    return null;
  }

  // Use a single promise to prevent opening multiple connections
  if (!dbPromise) {
    dbPromise = openDB<MyDB>('flashcard-ai-pro-db', 1, {
      upgrade(db) {
        // Create the object store if it doesn't exist
        if (!db.objectStoreNames.contains('flashcard-sets')) {
            db.createObjectStore('flashcard-sets', { keyPath: 'topic' });
        }
      },
    });
  }
  return dbPromise;
};


export const saveSetToDB = async (topic: string, cards: Flashcard[]) => {
  const db = await getDb();
  // If db is null (because we're on the server), do nothing.
  if (!db) return;
  return db.put('flashcard-sets', { topic, cards });
};

export const getSetFromDB = async (topic: string) => {
  const db = await getDb();
  // If db is null, return undefined.
  if (!db) return undefined;
  return db.get('flashcard-sets', topic);
};
