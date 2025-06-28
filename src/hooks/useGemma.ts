/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useRef } from 'react';
import { LlmInference, FilesetResolver } from '@mediapipe/tasks-genai';

export const useGemma = () => {
  const [llmInference, setLlmInference] = useState<LlmInference | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the LlmInference model
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        // Path to the .gguf model file you placed in the /public folder
        const modelPath = '/models/gemma-2-2b-it/gemma2-2b-it-cpu-int8.task';

        // FIX 1: Create the WasmFileset using FilesetResolver
        const wasmFileset = await FilesetResolver.forGenAiTasks(
          // Path to the WASM files, typically from a CDN
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm'
        );

        // FIX 2: Pass the wasmFileset and modelPath as two separate arguments
        const llm = await LlmInference.createFromModelPath(wasmFileset, modelPath);
        
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