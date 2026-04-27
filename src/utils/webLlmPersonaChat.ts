import type { InitProgressCallback, MLCEngine } from '@mlc-ai/web-llm';
import type { OllamaChatMessage } from './ollamaClient';

type CachedEngine = { modelId: string; engine: MLCEngine };

let cached: CachedEngine | null = null;
/** Serializes unload/create so concurrent sparkles requests do not corrupt the singleton engine. */
let chain: Promise<unknown> = Promise.resolve();

function queueEngineOp<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(() => fn());
  chain = run.then(() => {}).catch(() => {});
  return run;
}

/** Warm the WebLLM engine cache (e.g. on app load). Safe to call multiple times for the same modelId. */
export function preloadWebLlmEngine(modelId: string): Promise<MLCEngine> {
  return getWebLlmEngine(modelId);
}

export async function getWebLlmEngine(
  modelId: string,
  onProgress?: InitProgressCallback
): Promise<MLCEngine> {
  return queueEngineOp(async () => {
    if (cached?.modelId === modelId) return cached.engine;
    if (cached) {
      await cached.engine.unload().catch(() => {});
      cached = null;
    }
    const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
    const engine = await CreateMLCEngine(modelId, {
      initProgressCallback: onProgress,
    });
    cached = { modelId, engine };
    return engine;
  });
}

export async function webLlmPersonaChat(options: {
  modelId: string;
  messages: OllamaChatMessage[];
  onProgress?: InitProgressCallback;
}): Promise<string> {
  const engine = await getWebLlmEngine(options.modelId, options.onProgress);
  const completion = await engine.chat.completions.create({
    messages: options.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    stream: false,
    max_tokens: 1024,
  });
  const content = completion.choices[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('WebLLM returned an empty response');
  }
  return content;
}
