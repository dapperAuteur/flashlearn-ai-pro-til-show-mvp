'use client';

import { useState, useEffect, useRef } from 'react';
import { addFlashcardSet, getAllFlashcardSets, FlashcardSet } from '@/utils/db';
import StudySession from './StudySession';

export default function CardGenerator() {
  const [topic, setTopic] = useState('');
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [studyingSet, setStudyingSet] = useState<FlashcardSet | null>(null);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize the worker
    workerRef.current = new Worker(new URL('./../../public/worker.js', import.meta.url));

    // Handle messages from the worker
    workerRef.current.onmessage = async (event) => {
      const { status, output } = event.data;
      if (status === 'complete') {
        await addFlashcardSet(topic, output); // Save the new set
        const updatedSets = await getAllFlashcardSets();
        setSets(updatedSets);
        setIsLoading(false);
        setTopic('');
        setLoadingStatus('');
      }
    };
    
    // Cleanup worker on component unmount
    return () => {
      workerRef.current?.terminate();
    };
  }, [topic]); // Re-create worker if topic changes to pass it into the message handler


  useEffect(() => {
    const loadSets = async () => {
      const savedSets = await getAllFlashcardSets();
      setSets(savedSets);
    };
    loadSets();
  }, []);

  const handleGenerateClick = () => {
    if (!topic) {
      alert('Please enter a topic.');
      return;
    }
    console.log('topic :>> ', topic);
    setIsLoading(true);
    setLoadingStatus('Initializing AI model...');
    workerRef.current?.postMessage({ topic });
  };

  if (studyingSet) {
    return <StudySession set={studyingSet} onEndSession={() => setStudyingSet(null)} />;
  }

  return (
    <>
      <div className="p-8 bg-gray-800/50 rounded-lg max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic (e.g., 'Photosynthesis')"
            className="flex-grow bg-gray-700 text-white placeholder-gray-400 rounded-md px-4 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            disabled={isLoading} />
          <button
            onClick={handleGenerateClick}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-md transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
            disabled={isLoading} >
            {isLoading ? 'Generating...' : 'Generate Cards'}
          </button>
        </div>
        {isLoading && <p className="text-center text-cyan-300 mt-4 animate-pulse">{loadingStatus}</p>}
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