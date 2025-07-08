'use client';

import { useState, useEffect } from 'react';
import { getLeaderboardScores, LeaderboardScore } from '@/utils/db';

export default function Leaderboard() {
  const [scores, setScores] = useState<LeaderboardScore[]>([]);

  useEffect(() => {
    getLeaderboardScores().then(savedScores => {
      // Sort scores: highest score first, then fastest time for ties
      const sorted = savedScores.sort((a, b) => {
        if (a.score !== b.score) {
          return b.score - a.score; // Higher score is better
        }
        return a.time - b.time; // Lower time is better
      });
      setScores(sorted);
    });
  }, []);

  return (
    <div className="p-8 bg-gray-800/50 rounded-lg max-w-3xl mx-auto">
      <h3 className="text-2xl font-bold text-white text-center mb-6">Leaderboard</h3>
      <div className="space-y-2">
        {scores.length > 0 ? (
          scores.map((s, index) => (
            <div key={s.id} className="bg-gray-700 p-3 rounded-md flex justify-between items-center text-lg">
              <span className="font-bold text-white w-8">{index + 1}.</span>
              <span className="flex-grow text-cyan-400">{s.username}</span>
              <span className="text-gray-300 w-1/3">Topic: {s.topic}</span>
              <span className="font-semibold text-white w-1/4 text-right">Score: {s.score} ({s.time}s)</span>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center py-4">No scores recorded yet. Complete a study session!</p>
        )}
      </div>
    </div>
  );
}