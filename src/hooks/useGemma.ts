'use client';

import { useEffect, useState, useRef } from 'react';
import { LlmInference } from '@mediapipe/tasks-text';

export const useGemma = () => {
  const [llmInference, setLlmInference] = useState<LlmInference | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the LlmInference model
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        // Path to the model files you placed in the /public folder
        const modelPath = '/models/gemma-2b-it/model.json'; 
        const llm = await LlmInference.createFromOptions({
          baseOptions: { modelAssetPath: modelPath }
        });
        setLlmInference(llm);
      } catch (e: any) {
        setError(`Failed to initialize AI model: ${e.message}`);
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  const generateResponse = async (prompt: string): Promise<string> => {
    if (!llmInference) {
      throw new Error("LLM Inference not initialized.");
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await llmInference.generateResponse(prompt);
      return result;
    } catch (e: any) {
      setError(`Failed to generate response: ${e.message}`);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  return { llmInference, isLoading, error, generateResponse };
};