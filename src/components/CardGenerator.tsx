'use client'; // This directive marks this as a client-side component

import { useState } from 'react';

// Define the structure of a single flashcard
type Flashcard = {
  sideA: string;
  sideB: string;
};

// This is a temporary placeholder for our on-device AI model
const mockAIGeneration = async (topic: string): Promise<Flashcard[]> => {
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
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateClick = async () => {
    if (!topic) {
      alert('Please enter a topic.');
      return;
    }
    setIsLoading(true);
    setCards([]); // Clear previous cards
    const generatedCards = await mockAIGeneration(topic);
    setCards(generatedCards);
    setIsLoading(false);
  };

  return (
    <div className="mt-12 p-8 bg-gray-800/50 rounded-lg max-w-3xl mx-auto">
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

      {/* Display Generated Cards */}
      <div className="mt-8 space-y-4">
        {cards.map((card, index) => (
          <div key={index} className="bg-gray-700 p-4 rounded-md shadow-md">
            <p className="font-semibold text-white">Side A: {card.sideA}</p>
            <hr className="my-2 border-gray-600" />
            <p className="text-gray-300">Side B: {card.sideB}</p>
          </div>
        ))}
      </div>
    </div>
  );
}