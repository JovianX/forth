const APP_SYSTEM_PREFIX = `You are responding inside a personal journaling app. The user shared journal text below.
Rules: Be supportive and clear. Do not provide medical or clinical diagnoses. Do not claim to be human.
Keep a reasonable length (roughly under 400 words unless the user content clearly needs more).
`;

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaChatOptions {
  baseUrl: string;
  model: string;
  messages: OllamaChatMessage[];
  signal?: AbortSignal;
}

function normalizeBaseUrl(baseUrl: string): string {
  const t = baseUrl.trim();
  if (!t) return '';
  return t.endsWith('/') ? t.slice(0, -1) : t;
}

/**
 * In dev, browser fetches to 127.0.0.1:11434 are blocked by CORS. The Vite proxy serves `/ollama` → Ollama.
 * If the user saved a direct localhost URL, use the proxy path instead.
 */
export function resolveOllamaBaseUrlForBrowser(baseUrl: string): string {
  const t = normalizeBaseUrl(baseUrl);
  if (!t || t.startsWith('/')) return t;
  if (!import.meta.env.DEV) return t;
  try {
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `http://${t}`;
    const u = new URL(withScheme);
    const port = u.port || (u.protocol === 'https:' ? '443' : '80');
    if ((u.hostname === '127.0.0.1' || u.hostname === 'localhost') && port === '11434') {
      return '/ollama';
    }
  } catch {
    /* keep t */
  }
  return t;
}

export function ollamaChatUrl(baseUrl: string): string {
  return `${normalizeBaseUrl(baseUrl)}/api/chat`;
}

export function ollamaTagsUrl(baseUrl: string): string {
  return `${normalizeBaseUrl(baseUrl)}/api/tags`;
}

/**
 * Non-streaming chat completion. Parses Ollama JSON response message.content.
 */
export async function ollamaChat(options: OllamaChatOptions): Promise<string> {
  const { baseUrl, model, messages, signal } = options;
  const url = ollamaChatUrl(resolveOllamaBaseUrlForBrowser(baseUrl));
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(errText || `Ollama request failed (${res.status})`);
  }

  const data = (await res.json()) as {
    message?: { content?: string };
    error?: string;
  };

  if (data.error) {
    throw new Error(data.error);
  }

  const content = data.message?.content;
  if (typeof content !== 'string') {
    throw new Error('Unexpected response from Ollama');
  }

  return content;
}

export async function ollamaListTags(baseUrl: string, signal?: AbortSignal): Promise<boolean> {
  const url = ollamaTagsUrl(resolveOllamaBaseUrlForBrowser(baseUrl));
  const res = await fetch(url, { method: 'GET', signal });
  return res.ok;
}

export function buildPersonaSystemMessage(personaInstructions: string): string {
  return `${APP_SYSTEM_PREFIX.trim()}\n\n--- Persona instructions ---\n${personaInstructions.trim()}`;
}

export function buildPersonaUserMessage(serializedEntry: string): string {
  return `The user is journaling. Read their entry and respond in the persona defined above.

${serializedEntry}`;
}
