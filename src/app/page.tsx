import CardGeneratorLoader from '@/components/CardGeneratorLoader';
import NotifyForm from '@/components/NotifyForm';

export default function Home() {
  return (
    <div className="text-center">
      <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
        AI-Powered Flashcards
      </h2>
      <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-300 sm:text-xl">
        Enter a topic below, and our on-device AI will generate a set of flashcards for you.
      </p>

      {/* Use our new client-side loader component */}
      <CardGeneratorLoader />
      <NotifyForm />
    </div>
  );
}