const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
    code?: number;
  };
}

function buildGenerateContentUrl(model: string): string {
  const trimmed = model.trim();
  const modelId = trimmed.startsWith('models/') ? trimmed.slice('models/'.length) : trimmed;
  return `${GEMINI_API_BASE}/models/${modelId}:generateContent`;
}

export async function geminiTestConnection(
  apiKey: string,
  model: string,
  signal?: AbortSignal
): Promise<{ ok: true } | { ok: false; message: string }> {
  const key = apiKey.trim();
  if (!key) {
    return { ok: false, message: 'API key is required.' };
  }

  const modelName = model.trim() || 'gemma-4-31b-it';

  try {
    const response = await fetch(buildGenerateContentUrl(modelName), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': key,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: 'Reply with the single word: ok' }],
          },
        ],
      }),
      signal,
    });

    const data = (await response.json()) as GeminiGenerateContentResponse;

    if (!response.ok) {
      return {
        ok: false,
        message: data.error?.message ?? `Request failed (${response.status}).`,
      };
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      return { ok: false, message: 'Empty response from model.' };
    }

    return { ok: true };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { ok: false, message: 'Request cancelled.' };
    }
    const message = err instanceof Error ? err.message : 'Network error.';
    return { ok: false, message };
  }
}

export async function geminiGenerateContent(options: {
  apiKey: string;
  model: string;
  prompt: string;
  systemInstruction?: string;
  signal?: AbortSignal;
}): Promise<string> {
  const key = options.apiKey.trim();
  if (!key) {
    throw new Error('Gemini API key is not configured.');
  }

  const body: {
    contents: Array<{ parts: Array<{ text: string }> }>;
    systemInstruction?: { parts: Array<{ text: string }> };
  } = {
    contents: [
      {
        parts: [{ text: options.prompt }],
      },
    ],
  };

  const systemInstruction = options.systemInstruction?.trim();
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const response = await fetch(buildGenerateContentUrl(options.model), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': key,
    },
    body: JSON.stringify(body),
    signal: options.signal,
  });

  const data = (await response.json()) as GeminiGenerateContentResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? `Gemini request failed (${response.status}).`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini.');
  }

  return text;
}
