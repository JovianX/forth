import type { Persona } from '../types';

const PERSONAS_KEY = 'forth-personas';
const DEFAULT_PERSONA_ID_KEY = 'forth-persona-default-id';
const OLLAMA_BASE_URL_KEY = 'forth-ollama-base-url';
const OLLAMA_MODEL_KEY = 'forth-ollama-model';
const PERSONA_AI_BACKEND_KEY = 'forth-persona-ai-backend';
const WEBLLM_MODEL_KEY = 'forth-webllm-model';

export type PersonaAiBackend = 'ollama' | 'webllm';

/** Default model label; user should match an installed Ollama model. */
export const DEFAULT_OLLAMA_MODEL = 'llama3.2';

/** Default WebLLM prebuilt model id (see @mlc-ai/web-llm prebuiltAppConfig). */
export const DEFAULT_WEBLLM_MODEL = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';

export function defaultOllamaBaseUrl(): string {
  return import.meta.env.DEV ? '/ollama' : 'http://127.0.0.1:11434';
}

export function loadPersonas(): Persona[] {
  try {
    const raw = localStorage.getItem(PERSONAS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is Persona =>
        typeof p === 'object' &&
        p !== null &&
        typeof (p as Persona).id === 'string' &&
        typeof (p as Persona).name === 'string' &&
        typeof (p as Persona).instructions === 'string' &&
        typeof (p as Persona).createdAt === 'number'
    );
  } catch {
    return [];
  }
}

export function savePersonas(personas: Persona[]): void {
  try {
    localStorage.setItem(PERSONAS_KEY, JSON.stringify(personas));
  } catch (e) {
    console.error('Error saving personas:', e);
  }
}

export function loadDefaultPersonaId(): string | null {
  try {
    const id = localStorage.getItem(DEFAULT_PERSONA_ID_KEY);
    return id && id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

export function saveDefaultPersonaId(id: string | null): void {
  try {
    if (id == null) localStorage.removeItem(DEFAULT_PERSONA_ID_KEY);
    else localStorage.setItem(DEFAULT_PERSONA_ID_KEY, id);
  } catch (e) {
    console.error('Error saving default persona:', e);
  }
}

export function loadOllamaBaseUrl(): string {
  try {
    const v = localStorage.getItem(OLLAMA_BASE_URL_KEY);
    if (v != null && v.trim() !== '') return v.trim();
  } catch {
    /* ignore */
  }
  return defaultOllamaBaseUrl();
}

export function saveOllamaBaseUrl(url: string): void {
  try {
    localStorage.setItem(OLLAMA_BASE_URL_KEY, url.trim());
  } catch (e) {
    console.error('Error saving Ollama base URL:', e);
  }
}

export function loadOllamaModel(): string {
  try {
    const v = localStorage.getItem(OLLAMA_MODEL_KEY);
    if (v != null && v.trim() !== '') return v.trim();
  } catch {
    /* ignore */
  }
  return DEFAULT_OLLAMA_MODEL;
}

export function saveOllamaModel(model: string): void {
  try {
    localStorage.setItem(OLLAMA_MODEL_KEY, model.trim());
  } catch (e) {
    console.error('Error saving Ollama model:', e);
  }
}

export function loadPersonaAiBackend(): PersonaAiBackend {
  try {
    const v = localStorage.getItem(PERSONA_AI_BACKEND_KEY);
    if (v === 'webllm' || v === 'ollama') return v;
  } catch {
    /* ignore */
  }
  return 'ollama';
}

export function savePersonaAiBackend(backend: PersonaAiBackend): void {
  try {
    localStorage.setItem(PERSONA_AI_BACKEND_KEY, backend);
  } catch (e) {
    console.error('Error saving persona AI backend:', e);
  }
}

export function loadWebLlmModel(): string {
  try {
    const v = localStorage.getItem(WEBLLM_MODEL_KEY);
    if (v != null && v.trim() !== '') return v.trim();
  } catch {
    /* ignore */
  }
  return DEFAULT_WEBLLM_MODEL;
}

export function saveWebLlmModel(modelId: string): void {
  try {
    localStorage.setItem(WEBLLM_MODEL_KEY, modelId.trim());
  } catch (e) {
    console.error('Error saving WebLLM model:', e);
  }
}
