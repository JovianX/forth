import { AppState, Container, Task, NoteBlock } from '../types';
import { getNextContainerColor } from './taskUtils';

const STORAGE_KEY = 'forth-state';

export const loadState = (): AppState | null => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return null;
    }
    const state = JSON.parse(serializedState) as AppState;
    
    // Migrate containers without colors
    const containersWithoutColors = state.containers?.filter((c: Container) => !c.color) || [];
    if (containersWithoutColors.length > 0) {
      state.containers = state.containers.map((c: Container) =>
        c.color ? c : { ...c, color: getNextContainerColor(null, state.containers) }
      );
    }
    
    // Migrate containers without order property
    const containersWithoutOrder = state.containers?.filter((c: Container) => c.order === undefined) || [];
    if (containersWithoutOrder.length > 0) {
      const rootContainers = state.containers?.filter((c: Container) => c.parentId === null) || [];
      // Assign order based on current array index for root containers
      state.containers = state.containers.map((c: Container) => {
        if (c.order !== undefined) {
          return c; // Already has order
        }
        if (c.parentId === null) {
          // Root container - assign order based on index
          const index = rootContainers.findIndex((rc) => rc.id === c.id);
          return { ...c, order: index >= 0 ? index : 0 };
        }
        // Child container - order doesn't matter
        return { ...c, order: 0 };
      });
    }
    
    // Migrate tasks without type property
    const tasksWithoutType = state.tasks?.filter((t: Task) => t.type === undefined) || [];
    if (tasksWithoutType.length > 0) {
      state.tasks = state.tasks.map((t: Task) => {
        if (t.type === undefined) {
          return { ...t, type: 'task' as const };
        }
        return t;
      });
    }
    
    // Ensure isQuickTask exists for all tasks
    state.tasks = state.tasks.map((t: Task) => {
      if (t.isQuickTask === undefined) {
        return { ...t, isQuickTask: false };
      }
      return t;
    });
    
    // Migrate notes with content but no blocks
    state.tasks = state.tasks.map((t: Task) => {
      if (t.type === 'note' && t.content && (!t.blocks || t.blocks.length === 0)) {
        // Convert old content to a text block
        const textBlock: NoteBlock = {
          id: `block-${Date.now()}-${Math.random()}`,
          type: 'text',
          content: t.content,
          order: 0,
        };
        return { ...t, blocks: [textBlock] };
      }
      // Ensure notes have blocks array
      if (t.type === 'note' && !t.blocks) {
        return { ...t, blocks: [] };
      }
      return t;
    });
    
    // Ensure expandedContainers exists and is an array
    if (!state.expandedContainers) {
      state.expandedContainers = [];
    }
    
    return state;
  } catch (err) {
    console.error('Error loading state from localStorage:', err);
    return null;
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
