/* eslint-disable @typescript-eslint/no-explicit-any */
import { pipeline, env } from '@xenova/transformers';
import { NextResponse } from 'next/server';

// Initialize the model once and reuse it
class PipelineSingleton {
    static task = 'text2text-generation';
    static model = 'Xenova/flan-t5-small';
    static instance: any = null;

    static async getInstance() {
        if (this.instance === null) {
            env.allowLocalModels = false;
            this.instance = await pipeline(this.task, this.model);
        }
        return this.instance;
    }
}

export async function POST(request: Request) {
  try {
    const { topic } = await request.json();
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const generator = await PipelineSingleton.getInstance();
    const flashcards = [];
    const numberOfCards = 5; // Generate 5 cards

    for (let i = 0; i < numberOfCards; i++) {
        // Generate a question about the topic
        const questionPrompt = `Generate a single, unique, short-answer question about a key aspect of "${topic}".`;
        const questionResult = await generator(questionPrompt, { max_new_tokens: 50, num_beams: 2 });
        const question = questionResult[0].generated_text;

        // Generate an answer for that specific question
        const answerPrompt = `Provide a concise, factual answer to the following question: ${question}`;
        const answerResult = await generator(answerPrompt, { max_new_tokens: 50, num_beams: 2 });
        const answer = answerResult[0].generated_text;
        
        flashcards.push({ sideA: question, sideB: answer });
    }

    return NextResponse.json({ cards: flashcards });
    
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}