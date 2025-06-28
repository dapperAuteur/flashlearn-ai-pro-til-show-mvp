import { useState, useEffect } from 'react';
import { addFlashcardSet, getAllFlashcardSets, FlashcardSet } from '@/utils/db';
import StudySession from './StudySession';
import { useGemma } from '@/hooks/useGemma';
import Leaderboard from './Leaderboard'; // Import Leaderboard
import UsernameSetter from './UsernameSetter'; // Import UsernameSetter

type View = 'generator' | 'leaderboard';

export default function CardGenerator() {
  const [topic, setTopic] = useState('');
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [studyingSet, setStudyingSet] = useState<FlashcardSet | null>(null);
  const [view, setView] = useState<View>('generator'); // State to control the view
  
  const { generateResponse, isLoading, error } = useGemma();

  useEffect(() => {
    getAllFlashcardSets().then(setSets);
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
      <UsernameSetter /> {/* This will only show if username is not set */}

      <div className="text-center mb-8">
        <div className="inline-flex bg-gray-800 p-1 rounded-lg">
          <button onClick={() => setView('generator')} className={`px-6 py-2 rounded-md ${view === 'generator' ? 'bg-cyan-500 text-white' : 'text-gray-300'}`}>Generator</button>
          <button onClick={() => setView('leaderboard')} className={`px-6 py-2 rounded-md ${view === 'leaderboard' ? 'bg-cyan-500 text-white' : 'text-gray-300'}`}>Leaderboard</button>
        </div>
      </div>
      
      {view === 'generator' && (
        <>
          <div className="p-8 bg-gray-800/50 rounded-lg max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Enter a topic..." className="flex-grow bg-gray-700 text-white rounded-md px-4 py-2 border border-gray-600" disabled={isLoading} />
              <button onClick={handleGenerateClick} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-md" disabled={isLoading}>
                {isLoading ? 'AI is Thinking...' : 'Generate Cards'}
              </button>
            </div>
            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
          </div>

          <div className="mt-12 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">Your Flashcard Sets</h3>
            <div className="space-y-4">
              {sets.map((set) => (
                <div key={set.id} className="bg-gray-800 p-4 rounded-md shadow-md flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-white text-lg">{set.topic}</p>
                    <p className="text-gray-400 text-sm">{set.cards.length} cards</p>
                  </div>
                  <button onClick={() => setStudyingSet(set)} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md">
                    Study
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {view === 'leaderboard' && <Leaderboard />}
    </>
  );
}