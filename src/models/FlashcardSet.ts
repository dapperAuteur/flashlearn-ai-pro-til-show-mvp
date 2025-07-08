import mongoose, { Schema, models, Document } from 'mongoose';

// Interface for a single flashcard sub-document
export interface IFlashcard extends Document {
  sideA: string;
  sideB: string;
}

// Interface for the FlashcardSet document
export interface IFlashcardSet extends Document {
  topic: string;
  owner: mongoose.Types.ObjectId;
  isPublic: boolean;
  cards: IFlashcard[];
}

// Schema for the embedded flashcard documents
const FlashcardSchema: Schema = new Schema({
  sideA: { type: String, required: true },
  sideB: { type: String, required: true },
});

// Schema for the main FlashcardSet documents
const FlashcardSetSchema: Schema = new Schema({
  topic: {
    type: String,
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User', // This creates the reference to the User model
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  cards: [FlashcardSchema], // An array of flashcard sub-documents
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

const FlashcardSet = models.FlashcardSet || mongoose.model<IFlashcardSet>('FlashcardSet', FlashcardSetSchema);

export default FlashcardSet;