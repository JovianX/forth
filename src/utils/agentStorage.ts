import { AiAgent } from '../types';

const AGENTS_STORAGE_KEY = 'forth-ai-agents';

export function loadAgents(): AiAgent[] {
  try {
    const raw = localStorage.getItem(AGENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidAgent);
  } catch {
    return [];
  }
}

export function saveAgents(agents: AiAgent[]): void {
  try {
    localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(agents));
  } catch (e) {
    console.error('Error saving AI agents:', e);
  }
}

export function createAgent(partial?: Pick<AiAgent, 'name' | 'systemPrompt'>): AiAgent {
  return {
    id: crypto.randomUUID(),
    name: partial?.name?.trim() || 'New agent',
    systemPrompt: partial?.systemPrompt ?? '',
  };
}

function isValidAgent(value: unknown): value is AiAgent {
  if (!value || typeof value !== 'object') return false;
  const agent = value as Partial<AiAgent>;
  return (
    typeof agent.id === 'string' &&
    typeof agent.name === 'string' &&
    typeof agent.systemPrompt === 'string'
  );
}
