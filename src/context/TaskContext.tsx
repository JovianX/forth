import React, { createContext, useContext, useCallback, ReactNode, useEffect } from 'react';
import { Task, Container, Mode, NoteBlock } from '../types';
import { 
  generateId, 
  getTimestamp, 
  validateContainerParent, 
  getNextContainerColor,
  getNextPriority,
  priorityForOrderIndex
} from '../utils/taskUtils';
import { useFirebaseStorage } from '../hooks/useFirebaseStorage';

interface TaskContextType {
  mode: Mode;
  containers: Container[];
  tasks: Task[];
  expandedContainers: Set<string>; // Actually stores collapsed containers
  loading: boolean;
  setMode: (mode: Mode) => void;
  toggleContainerExpanded: (containerId: string) => void;
  isContainerExpanded: (containerId: string) => boolean;
  addContainer: (name: string, parentId: string | null, insertAfterId?: string | null) => string | undefined;
  updateContainer: (id: string, updates: Partial<Container>) => void;
  deleteContainer: (id: string) => void;
  reorderContainers: (activeId: string, overId: string | null) => void;
  addTask: (title: string, containerId: string, priority?: number, type?: 'task' | 'note' | 'text-block' | 'entry', content?: string, onCreated?: (newTaskId: string) => void) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  reorderTasks: (activeId: string, overId: string | null) => void;
  reorderTasksInContainer: (containerId: string, activeId: string, overId: string | null) => void;
  reorderTasksInEntry: (entryId: string, activeId: string, overId: string | null) => void;
  reorderTasksAmong: (taskIds: string[], activeId: string, overId: string) => void;
  moveTaskToContainer: (taskId: string, targetContainerId: string) => void;
  addNoteBlock: (noteId: string, type: 'text' | 'task') => void;
  updateNoteBlock: (noteId: string, blockId: string, updates: Partial<NoteBlock>) => void;
  deleteNoteBlock: (noteId: string, blockId: string) => void;
  reorderNoteBlocks: (noteId: string, activeId: string, overId: string | null) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState, loading] = useFirebaseStorage();
  const addTaskNewIdRef = React.useRef<string | null>(null);
  const addTaskOnCreatedRef = React.useRef<((newTaskId: string) => void) | null>(null);

  // Migrate containers without colors (only on initial load)
  useEffect(() => {
    const containersWithoutColors = state.containers.filter((c) => !c.color);
    if (containersWithoutColors.length > 0) {
      setState((prev) => ({
        ...prev,
        containers: prev.containers.map((c) =>
          c.color ? c : { ...c, color: getNextContainerColor(c.parentId, prev.containers) }
        ),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const setMode = useCallback((mode: Mode) => {
    setState((prev) => ({ ...prev, mode }));
  }, [setState]);

  const toggleContainerExpanded = useCallback((containerId: string) => {
    setState((prev) => {
      const collapsed = prev.expandedContainers as Set<string>; // Actually stores collapsed containers
      const newCollapsed = new Set(collapsed);
      if (newCollapsed.has(containerId)) {
        // Currently collapsed, so expand it (remove from collapsed set)
        newCollapsed.delete(containerId);
      } else {
        // Currently expanded, so collapse it (add to collapsed set)
        newCollapsed.add(containerId);
      }
      return { ...prev, expandedContainers: newCollapsed };
    });
  }, [setState]);

  const isContainerExpanded = useCallback((containerId: string): boolean => {
    const collapsed = state.expandedContainers as Set<string>; // Actually stores collapsed containers
    // If container is in the collapsed set, it's collapsed (return false)
    // If not in the set, it's expanded (default behavior)
    return !collapsed.has(containerId);
  }, [state.expandedContainers]);

  const addContainer = useCallback((name: string, parentId: string | null, insertAfterId?: string | null) => {
    if (!validateContainerParent('', parentId, state.containers)) {
      console.error('Invalid container parent: would create cycle');
      return undefined;
    }

    const newContainerId = generateId();
    setState((prev) => {
      // Get siblings (containers with the same parent)
      const siblings = prev.containers
        .filter((c) => c.parentId === parentId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      let newOrder: number;
      
      if (insertAfterId !== undefined && insertAfterId !== null) {
        // Insert after a specific container
        const insertAfterIndex = siblings.findIndex((c) => c.id === insertAfterId);
        if (insertAfterIndex !== -1 && insertAfterIndex < siblings.length - 1) {
          // Insert between two containers
          const beforeOrder = siblings[insertAfterIndex].order ?? 0;
          const afterOrder = siblings[insertAfterIndex + 1].order ?? 0;
          newOrder = (beforeOrder + afterOrder) / 2;
        } else if (insertAfterIndex !== -1) {
          // Insert at the end
          const lastOrder = siblings[insertAfterIndex].order ?? 0;
          newOrder = lastOrder + 1;
        } else {
          // Fallback: append to end
          const maxOrder = siblings.length > 0
            ? Math.max(...siblings.map((c) => c.order ?? 0))
            : -1;
          newOrder = maxOrder + 1;
        }
      } else {
        // Default: append to end
        const maxOrder = siblings.length > 0
          ? Math.max(...siblings.map((c) => c.order ?? 0))
          : -1;
        newOrder = maxOrder + 1;
      }

      const newContainer: Container = {
        id: newContainerId,
        name,
        parentId,
        color: getNextContainerColor(parentId, prev.containers),
        order: parentId === null ? newOrder : 0, // Only root containers need order
        createdAt: getTimestamp(),
      };

      return {
        ...prev,
        containers: [...prev.containers, newContainer],
      };
    });
    return newContainerId;
  }, [setState, state.containers]);

  const updateContainer = useCallback((id: string, updates: Partial<Container>) => {
    setState((prev) => ({
      ...prev,
      containers: prev.containers.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  }, [setState]);

  const deleteContainer = useCallback((id: string) => {
    setState((prev) => {
      // Delete all child containers recursively
      const containersToDelete = new Set<string>([id]);
      let found = true;
      while (found) {
        found = false;
        prev.containers.forEach((c) => {
          if (c.parentId && containersToDelete.has(c.parentId) && !containersToDelete.has(c.id)) {
            containersToDelete.add(c.id);
            found = true;
          }
        });
      }

      // Delete all tasks in deleted containers
      const tasksToDelete = new Set(
        prev.tasks
          .filter((t) => containersToDelete.has(t.containerId))
          .map((t) => t.id)
      );

      return {
        ...prev,
        containers: prev.containers.filter((c) => !containersToDelete.has(c.id)),
        tasks: prev.tasks.filter((t) => !tasksToDelete.has(t.id)),
      };
    });
  }, [setState]);

  const addTask = useCallback((title: string, containerId: string, priority?: number, type: 'task' | 'note' | 'text-block' | 'entry' = 'task', content?: string, onCreated?: (newTaskId: string) => void) => {
    addTaskOnCreatedRef.current = onCreated ?? null;
    setState((prev) => {
      const existingTasks = prev.tasks.filter((t) => t.containerId === containerId);
      const existingPriorities = existingTasks.map((t) => t.priority);
      const taskPriority = priority !== undefined && typeof priority === 'number'
        ? priority
        : getNextPriority(existingPriorities);

      const newTask: Task = {
        id: generateId(),
        title,
        completed: false,
        priority: taskPriority,
        containerId,
        createdAt: getTimestamp(),
        type: type || 'task',
        content: (type === 'note' || type === 'text-block') ? (content || '') : undefined,
        blocks: type === 'note' ? [] : undefined,
        isQuickTask: false,
      };

      if (onCreated) {
        addTaskNewIdRef.current = newTask.id;
      }

      return {
        ...prev,
        tasks: [...prev.tasks, newTask],
      };
    });
    // useState's setState does not support a completion callback; run onCreated after React commits
    if (onCreated) {
      setTimeout(() => {
        const id = addTaskNewIdRef.current;
        const cb = addTaskOnCreatedRef.current;
        addTaskNewIdRef.current = null;
        addTaskOnCreatedRef.current = null;
        if (id && cb) cb(id);
      }, 0);
    }
  }, [setState]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    const now = getTimestamp();
    setState((prev) => {
      let nextTasks = prev.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: now } : t
      );
      // When updating a task that belongs to an entry, bump the entry's updatedAt
      const updated = nextTasks.find((t) => t.id === id);
      const entryId = updated?.entryId ?? (prev.tasks.find((t) => t.id === id)?.entryId);
      if (entryId) {
        nextTasks = nextTasks.map((t) =>
          t.id === entryId ? { ...t, updatedAt: now } : t
        );
      }
      return { ...prev, tasks: nextTasks };
    });
  }, [setState]);

  const deleteTask = useCallback((id: string) => {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === id);
      const idsToDelete = new Set<string>([id]);
      // When deleting an entry (entity), also delete all its tasks and text blocks
      if (task?.type === 'entry') {
        prev.tasks
          .filter((t) => t.entryId === id)
          .forEach((t) => idsToDelete.add(t.id));
      }
      return {
        ...prev,
        tasks: prev.tasks.filter((t) => !idsToDelete.has(t.id)),
      };
    });
  }, [setState]);

  const toggleTaskCompletion = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    }));
  }, [setState]);

  const reorderTasks = useCallback((activeId: string, overId: string | null) => {
    if (!overId) return;

    setState((prev) => {
      const sortedTasks = [...prev.tasks].sort((a, b) => b.priority - a.priority);
      const activeIndex = sortedTasks.findIndex((t) => t.id === activeId);
      if (activeIndex === -1) return prev;

      let resolvedOverId = overId;
      if (resolvedOverId === activeId && activeIndex < sortedTasks.length - 1) {
        resolvedOverId = sortedTasks[activeIndex + 1].id;
      }
      if (resolvedOverId === activeId) return prev;

      const overIndex = sortedTasks.findIndex((t) => t.id === resolvedOverId);
      if (overIndex === -1) return prev;

      const [removed] = sortedTasks.splice(activeIndex, 1);
      const insertIndex = overIndex;
      sortedTasks.splice(insertIndex, 0, removed);

      const priorityById = new Map<string, number>();
      sortedTasks.forEach((t, i) => priorityById.set(t.id, priorityForOrderIndex(i, sortedTasks.length)));
      const updatedTasks = prev.tasks.map((t) => {
        const p = priorityById.get(t.id);
        return p !== undefined ? { ...t, priority: p } : t;
      });
      return { ...prev, tasks: updatedTasks };
    });
  }, [setState]);

  const reorderTasksInContainer = useCallback((containerId: string, activeId: string, overId: string | null) => {
    if (!overId) return;

    setState((prev) => {
      const containerTasks = prev.tasks
        .filter((t) => t.containerId === containerId)
        .sort((a, b) => b.priority - a.priority);
      const activeIndex = containerTasks.findIndex((t) => t.id === activeId);
      if (activeIndex === -1) return prev;

      let resolvedOverId = overId;
      if (resolvedOverId === activeId && activeIndex < containerTasks.length - 1) {
        resolvedOverId = containerTasks[activeIndex + 1].id;
      }
      if (resolvedOverId === activeId) return prev;

      const overIndex = containerTasks.findIndex((t) => t.id === resolvedOverId);
      if (overIndex === -1) return prev;

      const [removed] = containerTasks.splice(activeIndex, 1);
      const insertIndex = overIndex;
      containerTasks.splice(insertIndex, 0, removed);

      const priorityById = new Map<string, number>();
      containerTasks.forEach((t, i) => priorityById.set(t.id, priorityForOrderIndex(i, containerTasks.length)));
      const updatedTasks = prev.tasks.map((t) => {
        if (t.containerId !== containerId) return t;
        const p = priorityById.get(t.id);
        return p !== undefined ? { ...t, priority: p } : t;
      });
      return { ...prev, tasks: updatedTasks };
    });
  }, [setState]);

  const reorderTasksInEntry = useCallback((entryId: string, activeId: string, overId: string | null) => {
    if (!overId) return;

    setState((prev) => {
      const entryTasks = prev.tasks
        .filter((t) => t.entryId === entryId)
        .sort((a, b) => b.priority - a.priority);
      const activeIndex = entryTasks.findIndex((t) => t.id === activeId);
      if (activeIndex === -1) return prev;

      let resolvedOverId = overId;
      if (resolvedOverId === activeId && activeIndex < entryTasks.length - 1) {
        resolvedOverId = entryTasks[activeIndex + 1].id;
      }
      if (resolvedOverId === activeId) return prev;

      const overIndex = entryTasks.findIndex((t) => t.id === resolvedOverId);
      if (overIndex === -1) return prev;

      const [removed] = entryTasks.splice(activeIndex, 1);
      const insertIndex = overIndex;
      entryTasks.splice(insertIndex, 0, removed);

      const priorityById = new Map<string, number>();
      entryTasks.forEach((t, i) => priorityById.set(t.id, priorityForOrderIndex(i, entryTasks.length)));
      const updatedTasks = prev.tasks.map((t) => {
        if (t.entryId !== entryId) return t;
        const p = priorityById.get(t.id);
        return p !== undefined ? { ...t, priority: p } : t;
      });
      return { ...prev, tasks: updatedTasks };
    });
  }, [setState]);

  const reorderTasksAmong = useCallback((taskIds: string[], activeId: string, overId: string) => {
    if (!overId || taskIds.length === 0) return;

    const idSet = new Set(taskIds);
    if (!idSet.has(activeId)) return;

    setState((prev) => {
      const sortedTasks = prev.tasks
        .filter((t) => idSet.has(t.id))
        .sort((a, b) => b.priority - a.priority);
      const activeIndex = sortedTasks.findIndex((t) => t.id === activeId);
      if (activeIndex === -1) return prev;

      // When overId === activeId (e.g. closestCenter didn't update when dragging down), treat as move down one
      let resolvedOverId = overId;
      if (resolvedOverId === activeId && activeIndex < sortedTasks.length - 1) {
        resolvedOverId = sortedTasks[activeIndex + 1].id;
      }
      if (resolvedOverId === activeId) return prev;
      if (!idSet.has(resolvedOverId)) return prev;

      const overIndex = sortedTasks.findIndex((t) => t.id === resolvedOverId);
      if (overIndex === -1) return prev;

      const [removed] = sortedTasks.splice(activeIndex, 1);
      const insertIndex = overIndex;
      sortedTasks.splice(insertIndex, 0, removed);

      const priorityById = new Map<string, number>();
      sortedTasks.forEach((t, i) => priorityById.set(t.id, priorityForOrderIndex(i, sortedTasks.length)));
      const updatedTasks = prev.tasks.map((t) => {
        const p = priorityById.get(t.id);
        return p !== undefined ? { ...t, priority: p } : t;
      });
      return { ...prev, tasks: updatedTasks };
    });
  }, [setState]);

  const reorderContainers = useCallback((activeId: string, overId: string | null) => {
    if (!overId || activeId === overId) return;

    setState((prev) => {
      const activeContainer = prev.containers.find((c) => c.id === activeId);
      const overContainer = prev.containers.find((c) => c.id === overId);

      if (!activeContainer || !overContainer) return prev;

      // Validate that moving wouldn't create a cycle
      if (!validateContainerParent(activeId, overContainer.parentId, prev.containers)) {
        console.error('Cannot move container: would create cycle');
        return prev;
      }

      // Check if we're moving to a different parent
      const isMovingToDifferentParent = activeContainer.parentId !== overContainer.parentId;
      const targetParentId = isMovingToDifferentParent ? overContainer.parentId : activeContainer.parentId;

      // Get all siblings including the active container, sorted by order
      const allSiblings = prev.containers
        .filter((c) => c.parentId === targetParentId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const activeIndex = allSiblings.findIndex((c) => c.id === activeId);
      const overIndex = allSiblings.findIndex((c) => c.id === overId);

      if (activeIndex === -1 || overIndex === -1) return prev;

      // Remove active container from its current position
      const siblingsWithoutActive = allSiblings.filter((c) => c.id !== activeId);
      
      // Determine insertion position
      // If dragging down (activeIndex < overIndex), insert after overIndex
      // If dragging up (activeIndex > overIndex), insert at overIndex
      let insertIndex: number;
      if (activeIndex < overIndex) {
        // Dragging down: insert after the target
        insertIndex = overIndex; // After removing active, overIndex is still correct
      } else {
        // Dragging up: insert before the target
        insertIndex = overIndex;
      }

      // Insert active container at the correct position
      siblingsWithoutActive.splice(insertIndex, 0, activeContainer);

      // Update containers: change parent if needed and update orders
      const updatedContainers = prev.containers.map((c) => {
        if (c.id === activeId) {
          // Update active container's parent and order
          const newIndex = siblingsWithoutActive.findIndex((s) => s.id === c.id);
          return {
            ...c,
            parentId: targetParentId,
            order: newIndex >= 0 ? newIndex : siblingsWithoutActive.length - 1,
          };
        }

        // Update orders for siblings
        if (c.parentId === targetParentId && c.id !== activeId) {
          const newIndex = siblingsWithoutActive.findIndex((s) => s.id === c.id);
          if (newIndex >= 0) {
            return { ...c, order: newIndex };
          }
        }

        return c;
      });

      return { ...prev, containers: updatedContainers };
    });
  }, [setState]);

  const moveTaskToContainer = useCallback((taskId: string, targetContainerId: string) => {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task || task.containerId === targetContainerId) return prev;

      // Get priorities in target container
      const targetContainerTasks = prev.tasks.filter((t) => t.containerId === targetContainerId);
      const existingPriorities = targetContainerTasks.map((t) => t.priority);
      
      // Get next priority for the moved task (highest priority = appears first)
      const newPriority = getNextPriority(existingPriorities);

      // Update task's container and assign it the appropriate priority
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, containerId: targetContainerId, priority: newPriority };
        }
        return t;
      });

      return { ...prev, tasks: updatedTasks };
    });
  }, [setState]);

  const addNoteBlock = useCallback((noteId: string, type: 'text' | 'task') => {
    setState((prev) => {
      const note = prev.tasks.find((t) => t.id === noteId && t.type === 'note');
      if (!note) return prev;

      const blocks = note.blocks || [];
      const maxOrder = blocks.length > 0 ? Math.max(...blocks.map((b) => b.order)) : -1;

      const newBlock: NoteBlock = {
        id: generateId(),
        type,
        order: maxOrder + 1,
        content: type === 'text' ? '' : undefined,
        taskTitle: type === 'task' ? '' : undefined,
        completed: type === 'task' ? false : undefined,
      };

      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === noteId) {
          return { ...t, blocks: [...blocks, newBlock] };
        }
        return t;
      });

      return { ...prev, tasks: updatedTasks };
    });
  }, [setState]);

  const updateNoteBlock = useCallback((noteId: string, blockId: string, updates: Partial<NoteBlock>) => {
    setState((prev) => {
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === noteId && t.type === 'note' && t.blocks) {
          return {
            ...t,
            blocks: t.blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b)),
          };
        }
        return t;
      });

      return { ...prev, tasks: updatedTasks };
    });
  }, [setState]);

  const deleteNoteBlock = useCallback((noteId: string, blockId: string) => {
    setState((prev) => {
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === noteId && t.type === 'note' && t.blocks) {
          return {
            ...t,
            blocks: t.blocks.filter((b) => b.id !== blockId),
          };
        }
        return t;
      });

      return { ...prev, tasks: updatedTasks };
    });
  }, [setState]);

  const reorderNoteBlocks = useCallback((noteId: string, activeId: string, overId: string | null) => {
    setState((prev) => {
      const note = prev.tasks.find((t) => t.id === noteId && t.type === 'note');
      if (!note || !note.blocks) return prev;

      const blocks = [...note.blocks];
      const activeIndex = blocks.findIndex((b) => b.id === activeId);
      if (activeIndex === -1) return prev;

      if (overId === null) {
        // Move to end
        const [activeBlock] = blocks.splice(activeIndex, 1);
        blocks.push(activeBlock);
      } else {
        const overIndex = blocks.findIndex((b) => b.id === overId);
        if (overIndex === -1) return prev;

        const [activeBlock] = blocks.splice(activeIndex, 1);
        blocks.splice(overIndex, 0, activeBlock);
      }

      // Reassign order values
      const reorderedBlocks = blocks.map((b, index) => ({ ...b, order: index }));

      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === noteId) {
          return { ...t, blocks: reorderedBlocks };
        }
        return t;
      });

      return { ...prev, tasks: updatedTasks };
    });
  }, [setState]);

  const value: TaskContextType = {
    mode: state.mode,
    containers: state.containers,
    tasks: state.tasks,
    expandedContainers: state.expandedContainers as Set<string>,
    loading,
    setMode,
    toggleContainerExpanded,
    isContainerExpanded,
    addContainer,
    updateContainer,
    deleteContainer,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    reorderTasks,
    reorderTasksInContainer,
    reorderTasksInEntry,
    reorderTasksAmong,
    moveTaskToContainer,
    reorderContainers,
    addNoteBlock,
    updateNoteBlock,
    deleteNoteBlock,
    reorderNoteBlocks,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};
