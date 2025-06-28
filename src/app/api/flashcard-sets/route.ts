/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
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