/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/dbConnect';
import FlashcardSet from '@/models/FlashcardSet';
import { verifyAuth } from '@/lib/auth';

// GET: Fetch all flashcard sets for the logged-in user
export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    const { userId } = verifyAuth(request);

    const sets = await FlashcardSet.find({ owner: userId }).sort({ createdAt: -1 });

    return NextResponse.json({ sets }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 401 });
  }
}

// POST: Create a new flashcard set for the logged-in user
export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const { userId } = verifyAuth(request);
    const { topic, cards } = await request.json();

    if (!topic || !cards || !Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json({ message: 'Topic and cards are required.' }, { status: 400 });
    }

    const newSet = new FlashcardSet({
      topic,
      cards,
      owner: userId, // Associate the set with the logged-in user
    });

    await newSet.save();

    return NextResponse.json({ message: 'Set created successfully', set: newSet }, { status: 201 });

  } catch (error: any) {
    if (error.message.includes('token')) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    return NextResponse.json({ message: 'Error creating set', error: error.message }, { status: 500 });
  }
}

// PUT: Update an existing flashcard set
export async function PUT(request: NextRequest) {
  await dbConnect();
  try {
    const { userId } = verifyAuth(request);
    const { setId, topic, cards } = await request.json();

    if (!setId || !topic || !cards) {
      return NextResponse.json({ message: 'Set ID, topic, and cards are required.' }, { status: 400 });
    }

    const set = await FlashcardSet.findById(setId);

    if (!set) {
      return NextResponse.json({ message: 'Set not found.' }, { status: 404 });
    }

    // Security Check: Ensure the logged-in user is the owner of the set
    if (set.owner.toString() !== userId) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 403 });
    }

    set.topic = topic;
    set.cards = cards;
    await set.save();

    return NextResponse.json({ message: 'Set updated successfully', set }, { status: 200 });
  } catch (error: any) {
    console.log('UPDATE Flashcard error :>> ', error);
    // ... error handling
  }
}

// --- NEW ---
// DELETE: Delete a flashcard set
export async function DELETE(request: NextRequest) {
  await dbConnect();
  try {
    const { userId } = verifyAuth(request);
    const { setId } = await request.json();

    if (!setId) {
      return NextResponse.json({ message: 'Set ID is required.' }, { status: 400 });
    }

    const set = await FlashcardSet.findById(setId);

    if (!set) {
      return NextResponse.json({ message: 'Set not found.' }, { status: 404 });
    }

    // Security Check: Ensure the logged-in user is the owner of the set
    if (set.owner.toString() !== userId) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 403 });
    }

    await FlashcardSet.findByIdAndDelete(setId);

    return NextResponse.json({ message: 'Set deleted successfully.' }, { status: 200 });
  } catch (error: any) {
    console.log('DELETE Flashcard error :>> ', error);
    // ... error handling
  }
}