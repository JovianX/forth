import React, { createContext, useContext, useCallback, ReactNode, useEffect } from 'react';
import { Task, Container, Mode, NoteBlock } from '../types';
import { 
  generateId, 
  getTimestamp, 
  validateContainerParent, 
  getNextContainerColor,
  getNextPriority
} from '../utils/taskUtils';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface TaskContextType {
  mode: Mode;
  containers: Container[];
  tasks: Task[];
  expandedContainers: Set<string>; // Actually stores collapsed containers
  setMode: (mode: Mode) => void;
  toggleContainerExpanded: (containerId: string) => void;
  isContainerExpanded: (containerId: string) => boolean;
  addContainer: (name: string, parentId: string | null, insertAfterId?: string | null) => void;
  updateContainer: (id: string, updates: Partial<Container>) => void;
  deleteContainer: (id: string) => void;
  reorderContainers: (activeId: string, overId: string | null) => void;
  addTask: (title: string, containerId: string, priority?: number, type?: 'task' | 'note' | 'text-block', content?: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  reorderTaskPriority: (taskId: string, newPriority: number) => void;
  moveTaskPriority: (taskId: string, direction: 'up' | 'down') => void;
  reorderTasks: (activeId: string, overId: string | null) => void;
  reorderTasksInContainer: (containerId: string, activeId: string, overId: string | null) => void;
  moveTaskToContainer: (taskId: string, targetContainerId: string) => void;
  addNoteBlock: (noteId: string, type: 'text' | 'task') => void;
  updateNoteBlock: (noteId: string, blockId: string, updates: Partial<NoteBlock>) => void;
  deleteNoteBlock: (noteId: string, blockId: string) => void;
  reorderNoteBlocks: (noteId: string, activeId: string, overId: string | null) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useLocalStorage();

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
      return;
    }

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
        id: generateId(),
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
  }, [setState]);

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

  const addTask = useCallback((title: string, containerId: string, priority?: number, type: 'task' | 'note' | 'text-block' = 'task', content?: string) => {
    setState((prev) => {
      const existingTasks = prev.tasks.filter((t) => t.containerId === containerId);
      const existingPriorities = existingTasks.map((t) => t.priority);
      
      let taskPriority: number;
      if (priority !== undefined && priority !== null && !isNaN(priority)) {
        // Use the provided priority directly
        taskPriority = priority;
      } else {
        // No priority provided - use getNextPriority which handles empty containers
        taskPriority = getNextPriority(existingPriorities);
      }

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

      // If a specific priority was provided, insert at the correct position
      if (priority !== undefined && priority !== null && !isNaN(priority) && existingTasks.length > 0) {
        // Get all tasks in the container, sorted by priority (descending - highest first)
        const containerTasks = [...existingTasks].sort((a, b) => b.priority - a.priority);
        
        // Find the insertion index: insert before the first task with priority <= taskPriority
        let insertIndex = containerTasks.length;
        for (let i = 0; i < containerTasks.length; i++) {
          if (taskPriority >= containerTasks[i].priority) {
            insertIndex = i;
            break;
          }
        }
        
        // Insert the new task at the calculated position
        containerTasks.splice(insertIndex, 0, newTask);
        
        // Combine with tasks from other containers (keep them unchanged)
        const otherTasks = prev.tasks.filter((t) => t.containerId !== containerId);
        
        return {
          ...prev,
          tasks: [...otherTasks, ...containerTasks],
        };
      }

      // No specific priority - just add to the end
      return {
        ...prev,
        tasks: [...prev.tasks, newTask],
      };
    });
  }, [setState]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => 
        t.id === id 
          ? { ...t, ...updates, updatedAt: getTimestamp() } 
          : t
      ),
    }));
  }, [setState]);

  const deleteTask = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  }, [setState]);

  const toggleTaskCompletion = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    }));
  }, [setState]);

  const reorderTaskPriority = useCallback((taskId: string, newPriority: number) => {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      // Update the task with the new priority
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, priority: newPriority };
        }
        return t;
      });

      return { ...prev, tasks: updatedTasks };
    });
  }, [setState]);

  const moveTaskPriority = useCallback((taskId: string, direction: 'up' | 'down') => {
    setState((prev) => {
      const sortedTasks = [...prev.tasks].sort((a, b) => b.priority - a.priority);
      const taskIndex = sortedTasks.findIndex((t) => t.id === taskId);
      
      if (taskIndex === -1) return prev;
      if (direction === 'up' && taskIndex === 0) return prev;
      if (direction === 'down' && taskIndex === sortedTasks.length - 1) return prev;

      const targetIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1;
      const targetTask = sortedTasks[targetIndex];
      const currentTask = sortedTasks[taskIndex];
      
      // Swap priorities
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, priority: targetTask.priority };
        }
        if (t.id === targetTask.id) {
          return { ...t, priority: currentTask.priority };
        }
        return t;
      });

      return { ...prev, tasks: updatedTasks };
    });
  }, [setState]);

  const reorderTasks = useCallback((activeId: string, overId: string | null) => {
    if (!overId || activeId === overId) return;

    setState((prev) => {
      // Get sorted tasks by priority (highest first)
      const sortedTasks = [...prev.tasks].sort((a, b) => b.priority - a.priority);
      
      const activeIndex = sortedTasks.findIndex((t) => t.id === activeId);
      const overIndex = sortedTasks.findIndex((t) => t.id === overId);
      
      if (activeIndex === -1 || overIndex === -1) return prev;

      const overTask = sortedTasks[overIndex];

      // Calculate new priority for the active task
      let newPriority: number;
      if (overIndex === 0) {
        // Moving to top - use priority higher than the top task
        newPriority = overTask.priority + 1;
      } else if (overIndex === sortedTasks.length - 1) {
        // Moving to bottom - use priority lower than the bottom task
        newPriority = overTask.priority - 1;
      } else {
        // Moving to middle - use average of adjacent tasks
        const nextTask = sortedTasks[overIndex + (activeIndex < overIndex ? 0 : 1)];
        const prevTask = sortedTasks[overIndex - (activeIndex > overIndex ? 0 : 1)];
        newPriority = (nextTask.priority + prevTask.priority) / 2;
      }

      // Update the active task's priority
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === activeId) {
          return { ...t, priority: newPriority };
        }
        return t;
      });

      return { ...prev, tasks: updatedTasks };
    });
  }, [setState]);

  const reorderTasksInContainer = useCallback((containerId: string, activeId: string, overId: string | null) => {
    if (!overId || activeId === overId) return;

    setState((prev) => {
      // Get tasks in this container, sorted by priority (highest first)
      const containerTasks = prev.tasks
        .filter((t) => t.containerId === containerId)
        .sort((a, b) => b.priority - a.priority);
      
      const activeIndex = containerTasks.findIndex((t) => t.id === activeId);
      const overIndex = containerTasks.findIndex((t) => t.id === overId);
      
      if (activeIndex === -1 || overIndex === -1) return prev;

      const overTask = containerTasks[overIndex];

      // Calculate new priority for the active task
      let newPriority: number;
      if (overIndex === 0) {
        // Moving to top - use priority higher than the top task
        newPriority = overTask.priority + 1;
      } else if (overIndex === containerTasks.length - 1) {
        // Moving to bottom - use priority lower than the bottom task
        newPriority = overTask.priority - 1;
      } else {
        // Moving to middle - use average of adjacent tasks
        const nextTask = containerTasks[overIndex + (activeIndex < overIndex ? 0 : 1)];
        const prevTask = containerTasks[overIndex - (activeIndex > overIndex ? 0 : 1)];
        newPriority = (nextTask.priority + prevTask.priority) / 2;
      }

      // Update the active task's priority
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === activeId) {
          return { ...t, priority: newPriority };
        }
        return t;
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

      // Get siblings (containers with the same parent)
      const siblings = prev.containers
        .filter((c) => c.parentId === targetParentId && c.id !== activeId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const overIndex = siblings.findIndex((c) => c.id === overId);
      
      // Insert active container at the correct position
      if (overIndex === -1) {
        // Over container not found in siblings, append to end
        siblings.push(activeContainer);
      } else {
        siblings.splice(overIndex, 0, activeContainer);
      }

      // Update containers: change parent if needed and update orders
      const updatedContainers = prev.containers.map((c) => {
        if (c.id === activeId) {
          // Update active container's parent and order
          const newIndex = siblings.findIndex((s) => s.id === c.id);
          return {
            ...c,
            parentId: targetParentId,
            order: newIndex >= 0 ? newIndex : (targetParentId === null ? siblings.length - 1 : 0),
          };
        }

        // Update orders for siblings
        if (c.parentId === targetParentId && c.id !== activeId) {
          const newIndex = siblings.findIndex((s) => s.id === c.id);
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
    reorderTaskPriority,
    moveTaskPriority,
    reorderTasks,
    reorderTasksInContainer,
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
