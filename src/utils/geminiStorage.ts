const GEMINI_API_KEY_KEY = 'forth-gemini-api-key';
const GEMINI_MODEL_KEY = 'forth-gemini-model';

export const DEFAULT_GEMINI_MODEL = 'gemma-4-31b-it';

export function loadGeminiApiKey(): string {
  try {
    return localStorage.getItem(GEMINI_API_KEY_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveGeminiApiKey(key: string): void {
  try {
    localStorage.setItem(GEMINI_API_KEY_KEY, key.trim());
  } catch (e) {
    console.error('Error saving Gemini API key:', e);
  }
}

export function loadGeminiModel(): string {
  try {
    const saved = localStorage.getItem(GEMINI_MODEL_KEY);
    return saved?.trim() || DEFAULT_GEMINI_MODEL;
  } catch {
    return DEFAULT_GEMINI_MODEL;
  }
}

export function saveGeminiModel(model: string): void {
  try {
    localStorage.setItem(GEMINI_MODEL_KEY, model.trim() || DEFAULT_GEMINI_MODEL);
  } catch (e) {
    console.error('Error saving Gemini model:', e);
  }
}
