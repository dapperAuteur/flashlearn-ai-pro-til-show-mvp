'use client';

import { useState, useEffect } from 'react';

export const getUsername = () => localStorage.getItem('til_show_username');
const setUsernameInStorage = (name: string) => localStorage.setItem('til_show_username', name);

export default function UsernameSetter() {
  const [username, setUsername] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setUsername(getUsername());
  }, []);

  const handleSave = () => {
    if (inputValue.trim()) {
      setUsernameInStorage(inputValue.trim());
      setUsername(inputValue.trim());
    }
  };

  if (username) {
    // If username is already set, don't render anything
    return null; 
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-lg text-center">
        <h3 className="text-2xl font-bold text-white mb-4">Enter a Username</h3>
        <p className="text-gray-300 mb-6">This will be used for the local leaderboard.</p>
        <div className="flex gap-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Your cool name"
            className="flex-grow bg-gray-700 text-white rounded-md px-4 py-2 border border-gray-600"
          />
          <button onClick={handleSave} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-md">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}