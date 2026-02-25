import { AppState, Container, Task, NoteBlock } from '../types';
import { getNextContainerColor } from './taskUtils';

const STORAGE_KEY = 'forth-state';

/** Applies migrations to raw state - use for both localStorage and Firestore */
export function migrateState(state: AppState): AppState {
  // Migrate containers without colors
  let containers = state.containers || [];
  const containersWithoutColors = containers.filter((c: Container) => !c.color);
  if (containersWithoutColors.length > 0) {
    containers = containers.map((c: Container) =>
      c.color ? c : { ...c, color: getNextContainerColor(null, containers) }
    );
  }

  // Migrate containers without order property
  const containersWithoutOrder = containers.filter((c: Container) => c.order === undefined);
  if (containersWithoutOrder.length > 0) {
    const rootContainers = containers.filter((c: Container) => c.parentId === null);
    containers = containers.map((c: Container) => {
      if (c.order !== undefined) return c;
      if (c.parentId === null) {
        const index = rootContainers.findIndex((rc) => rc.id === c.id);
        return { ...c, order: index >= 0 ? index : 0 };
      }
      return { ...c, order: 0 };
    });
  }

  // Migrate tasks without type property
  let tasks = state.tasks || [];
  const tasksWithoutType = tasks.filter((t: Task) => t.type === undefined);
  if (tasksWithoutType.length > 0) {
    tasks = tasks.map((t: Task) =>
      t.type === undefined ? { ...t, type: 'task' as const } : t
    );
  }

  // Ensure isQuickTask exists for all tasks
  tasks = tasks.map((t: Task) =>
    t.isQuickTask === undefined ? { ...t, isQuickTask: false } : t
  );

  // Migrate notes with content but no blocks
  tasks = tasks.map((t: Task) => {
    if (t.type === 'note' && t.content && (!t.blocks || t.blocks.length === 0)) {
      const textBlock: NoteBlock = {
        id: `block-${Date.now()}-${Math.random()}`,
        type: 'text',
        content: t.content,
        order: 0,
      };
      return { ...t, blocks: [textBlock] };
    }
    if (t.type === 'note' && !t.blocks) {
      return { ...t, blocks: [] };
    }
    return t;
  });

  const expandedContainers = state.expandedContainers || [];

  // Migrate legacy mode names to Capture / Prioritize (persisted state may have 'plan' | 'execution')
  const rawMode = (state as { mode?: string }).mode ?? 'create';
  const mode: AppState['mode'] =
    rawMode === 'plan' ? 'capture'
    : rawMode === 'execution' ? 'prioritize'
    : rawMode === 'capture' || rawMode === 'prioritize' ? rawMode
    : 'create';

  return { mode, containers, tasks, expandedContainers };
}

export const loadState = (): AppState | null => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) return null;
    const state = JSON.parse(serializedState) as AppState;
    return migrateState(state);
  } catch (err) {
    console.error('Error loading state from localStorage:', err);
    return null;
  }
};

export const clearLocalState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing local state:', err);
  }
};

export const saveState = (state: AppState): void => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (err) {
    console.error('Error saving state to localStorage:', err);
  }
};

export const getDefaultState = (): AppState => ({
  mode: 'create',
  containers: [],
  tasks: [],
  expandedContainers: [],
});
