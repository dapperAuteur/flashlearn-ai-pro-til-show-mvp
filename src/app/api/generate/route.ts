/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize the Google AI client with the API key from your .env.local file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function POST(request: Request) {
  // TODO: In Phase 2, add logic here to check if the user is authenticated.
  // For now, we assume any request is from a "paid" user for the MVP.

  // TODO: In Phase 2, check the user's monthly usage against their limit (2 sets/month).

  try {
    const { topic } = await request.json();
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Use the same reliable prompt strategy
    const prompt = `Generate a list of flashcards for the topic of "${topic}". Each flashcard should have a term and a concise definition. Format the output as a list of "Front: Back" pairs, with each pair on a new line. Ensure terms are set to front and definitions are set to back. Front (Terms) and Back (Definitions) are distinct and clearly separated by a single colon. Here's an example output:
      Hello: Hola
      Goodbye: Adiós`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const generatedText = response.text();

    // Parse the structured text into a flashcard array
    const flashcards = generatedText
      .split('\n')
      .map((line: string) => {
        const cleanLine = line.replace(/^\d+\.\s*/, '');
        const parts = cleanLine.split('|');
        if (parts.length === 2) {
          return { sideA: parts[0].trim(), sideB: parts[1].trim() };
        }
        return null;
      })
      .filter((card: any): card is { sideA: string, sideB: string } => card !== null);

    if (flashcards.length === 0) {
      throw new Error("Gemini AI failed to generate cards in the correct format.");
    }

    return NextResponse.json({ cards: flashcards });
    
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: "Failed to generate cards from AI." }, { status: 500 });
  }
}