'use client'; // This directive marks this as a client-side component

import { useState, useEffect } from 'react';
import { addFlashcardSet, getAllFlashcardSets, FlashcardSet } from '@/utils/db';


// Define the structure of a single flashcard
type Flashcard = {
  sideA: string;
  sideB: string;
};

// This is a temporary placeholder for our on-device AI model
const mockAIGeneration = async (topic: string): Promise<Flashcard['cards']> => {
  console.log(`Generating cards for topic: ${topic}`);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Return mock data
  return [
    { sideA: `What is the capital of ${topic}?`, sideB: 'Capital City' },
    { sideA: `What is the main currency of ${topic}?`, sideB: 'Currency' },
    { sideA: `What is a famous landmark in ${topic}?`, sideB: 'Famous Landmark' },
  ];
};


export default function CardGenerator() {
  const [topic, setTopic] = useState('');
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing sets from IndexedDB when the component mounts
  useEffect(() => {
    const loadSets = async () => {
      const savedSets = await getAllFlashcardSets();
      setSets(savedSets);
    };
    loadSets();
  }, []);

  const handleGenerateClick = async () => {
    if (!topic) {
      alert('Please enter a topic.');
      return;
    }
    setIsLoading(true);
    // setCards([]); // Clear previous cards
    const generatedCards = await mockAIGeneration(topic);
    // setCards(generatedCards);
    await addFlashcardSet(topic, generatedCards);

    const updatedSets = await getAllFlashcardSets();
    setSets(updatedSets);

    setIsLoading(false);
    setTopic('');
  };

  return (
    <>
      <div className="p-8 bg-gray-800/50 rounded-lg max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic (e.g., 'Japan')"
            className="flex-grow bg-gray-700 text-white placeholder-gray-400 rounded-md px-4 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            disabled={isLoading}
          />
          <button
            onClick={handleGenerateClick}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-md transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Cards'}
          </button>
        </div>
      </div>

      {/* Display List of Generated Sets */}
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
                <button className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
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