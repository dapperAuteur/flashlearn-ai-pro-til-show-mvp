'use client';

import { useState, useEffect } from 'react';
import { addFlashcardSet, getAllFlashcardSets, FlashcardSet } from '@/utils/db';
import StudySession from './StudySession';
import { useGemma } from '@/hooks/useGemma'; // Import our new hook

export default function CardGenerator() {
  const [topic, setTopic] = useState('');
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [studyingSet, setStudyingSet] = useState<FlashcardSet | null>(null);
  
  // Use our custom hook to get access to Gemma
  const { generateResponse, isLoading, error } = useGemma();

  useEffect(() => {
    const loadSets = async () => {
      const savedSets = await getAllFlashcardSets();
      setSets(savedSets);
    };
    loadSets();
  }, []);

  const handleGenerateClick = async () => {
    if (!topic) return;
    
    const prompt = `Generate a numbered list of 5 unique flashcards for the topic "${topic}". Format each flashcard on a new line with the question and answer separated by a pipe symbol '|'.
    Example:
    1. What is the capital of France? | Paris
    2. Who painted the Mona Lisa? | Leonardo da Vinci`;

    try {
      const resultText = await generateResponse(prompt);

      // Parse the structured text from Gemma
      const flashcards = resultText
        .split('\n')
        .map((line: string) => {
          const cleanLine = line.replace(/^\d+\.\s*/, '');
          const parts = cleanLine.split('|');
          if (parts.length === 2) {
            return { sideA: parts[0].trim(), sideB: parts[1].trim() };
          }
          return null;
        })
        .filter((card): card is { sideA: string; sideB: string } => card !== null);

      if (flashcards.length > 0) {
        await addFlashcardSet(topic, flashcards);
        const updatedSets = await getAllFlashcardSets();
        setSets(updatedSets);
      }
    } catch (e) {
      console.error("Failed to generate flashcards", e);
    } finally {
      setTopic('');
    }
  };
  
  // The rest of your component's JSX remains the same...
  // ... (You can copy the JSX from the previous version)
  // Just make sure the button's disabled state uses `isLoading` from the hook
  // and you can display the `error` state to the user if it's not null.
  
  if (studyingSet) {
    return <StudySession set={studyingSet} onEndSession={() => setStudyingSet(null)} />;
  }

  // Replace your existing return block with this one:
  return (
    <>
      <div className="p-8 bg-gray-800/50 rounded-lg max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic (e.g., 'The Roman Empire')"
            className="flex-grow bg-gray-700 text-white placeholder-gray-400 rounded-md px-4 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            disabled={isLoading} />
          <button
            onClick={handleGenerateClick}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-md transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
            disabled={isLoading} >
            {/* FIX: Changed to use a static string instead of loadingStatus */}
            {isLoading ? 'AI is Thinking...' : 'Generate Cards'}
          </button>
        </div>
        {/* FIX: Changed to show a static message instead of loadingStatus */}
        {isLoading && <p className="text-center text-cyan-300 mt-4 animate-pulse">Generating cards, this may take a moment...</p>}
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </div>

      <div className="mt-12 max-w-3xl mx-auto">
        <h3 className="text-2xl font-bold text-white mb-4">Your Flashcard Sets</h3>
        <div className="space-y-4">
          {sets.length > 0 ? (
            sets.map((set) => (
              <div key={set.id} className="bg-gray-800 p-4 rounded-md shadow-md flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white text-lg">{set.topic}</p>
                  <p className="text-gray-400 text-sm">{set.cards.length} cards - Created on {new Date(set.createdAt).toLocaleDateString()}</p>
                </div>
                <button 
                  onClick={() => setStudyingSet(set)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                  Study
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center py-4">You haven&apos;t generated any sets yet.</p>
          )}
        </div>
      </div>
    </>
  );
}