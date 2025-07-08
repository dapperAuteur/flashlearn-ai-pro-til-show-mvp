// This defines the shape of our data on the frontend
export type Flashcard = {
  sideA: string;
  sideB: string;
  srsLevel?: number;
  nextReview?: Date;
  _id?: string; // Mongoose sub-docs have _id
};

export type FlashcardSet = {
  _id: string; // MongoDB uses _id
  topic: string;
  owner: string; // We'll just need the ID string on the frontend
  isPublic: boolean;
  cards: Flashcard[];
  createdAt: string; // Dates are serialized as strings
  updatedAt: string;
};