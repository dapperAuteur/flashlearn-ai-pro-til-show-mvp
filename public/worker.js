import { pipeline, env } from '@xenova/transformers';

// Skip local model checks to use the remote models.
env.allowLocalModels = false;

// Define the generation pipeline
const generator = await pipeline(
  'text2text-generation', 
  'Xenova/flan-t5-small' // A small, efficient model
);
console.log("generator", generator);

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  const topic = event.data.topic;
  console.log('topic :>> ', topic);

  // 1. Generate a comma-separated list of key terms from the topic
  const termGenerationPrompt = `Generate a comma-separated list of 5 key concepts or terms related to the topic: ${topic}.`;
  const termResult = await generator(termGenerationPrompt, {
    max_new_tokens: 50,
    num_beams: 2,
  });
  console.log('termGenerationPrompt :>> ', termGenerationPrompt);
  const terms = termResult[0].generated_text.split(',').map(t => t.trim());
  console.log('terms :>> ', terms);

  // 2. For each term, generate a "What is..." question and a brief answer
  const flashcards = [];
  for (const term of terms) {
    if (!term) continue;
    
    // Generate the answer first for better context
    const answerPrompt = `Provide a concise, one-sentence definition for: ${term}.`;
    const answerResult = await generator(answerPrompt, {
        max_new_tokens: 50,
    });
    const answer = answerResult[0].generated_text;

    flashcards.push({
      sideA: `What is ${term}?`,
      sideB: answer,
    });
  }

  // Send the generated flashcards back to the main thread
  self.postMessage({
    status: 'complete',
    output: flashcards,
  });
});