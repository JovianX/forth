import { AiAgent } from '../types';
import { geminiGenerateContent } from './geminiClient';
import { loadGeminiApiKey, loadGeminiModel } from './geminiStorage';

export async function runAgent(options: {
  agent: AiAgent;
  input: string;
  signal?: AbortSignal;
}): Promise<string> {
  const apiKey = loadGeminiApiKey();
  const model = loadGeminiModel();

  if (!apiKey.trim()) {
    throw new Error('Add your Gemini API key in Settings → AI.');
  }

  const input = options.input.trim();
  if (!input) {
    throw new Error('Nothing to send — add content first.');
  }

  if (!options.agent.systemPrompt.trim()) {
    throw new Error(`Agent "${options.agent.name}" has an empty system prompt.`);
  }

  return geminiGenerateContent({
    apiKey,
    model,
    systemInstruction: options.agent.systemPrompt,
    prompt: input,
    signal: options.signal,
  });
}
