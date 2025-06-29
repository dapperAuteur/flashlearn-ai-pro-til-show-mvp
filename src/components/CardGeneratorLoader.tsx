'use client'; // This is the most important line! It marks this as a Client Component.

import dynamic from 'next/dynamic';

const CardGenerator = dynamic(
  () => import('@/components/CardGenerator'),
  { 
    ssr: false,
    // Optional: Add a loading component to improve user experience
    loading: () => <p className="text-center text-gray-400">Loading Generator...</p>
  }
);

export default function CardGeneratorLoader() {  
  return <CardGenerator />;
}