import React, { useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TaskItem } from './TaskItem';
import { ContainerFilter } from './ContainerFilter';
import { useTaskContext } from '../../context/TaskContext';

export const TaskList: React.FC = () => {
  const { tasks, containers, toggleTaskCompletion, reorderTasks, reorderContainers } = useTaskContext();
  const [showCompleted, setShowCompleted] = useState(true);
  const [selectedContainers, setSelectedContainers] = useState<Set<string> | null>(null); // null = all selected
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Use first container color or default neutral color for checkbox accent
  const rootContainers = containers.filter((c) => c.parentId === null);
  const defaultAccentColor = rootContainers.length > 0 ? rootContainers[0].color : '#6B7280';

  const handleToggleContainer = (containerId: string, event?: React.MouseEvent) => {
    const isMultiSelect = event?.ctrlKey || event?.metaKey;
    
    setSelectedContainers((prev) => {
      if (isMultiSelect) {
        // Multi-select mode: toggle this container
        if (prev === null) {
          return new Set([containerId]);
        }
        const newSet = new Set(prev);
        if (newSet.has(containerId)) {
          newSet.delete(containerId);
          return newSet.size === 0 ? null : newSet;
        } else {
          newSet.add(containerId);
          return newSet;
        }
      } else {
        // Single-select mode: select only this container
        if (prev !== null && prev.size === 1 && prev.has(containerId)) {
          return null; // Deselect if clicking the same one
        }
        return new Set([containerId]);
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedContainers(null);
  };

  const sortedTasks = useMemo(() => {
    // Filter out notes and text-blocks - execution mode is only for actionable tasks
    let filtered = tasks.filter((t) => t.type !== 'note' && t.type !== 'text-block');

    // Filter by selected containers
    if (selectedContainers !== null && selectedContainers.size > 0) {
      // Get all container IDs that should be included (selected containers + their children)
      const includedContainerIds = new Set<string>();
      
      selectedContainers.forEach((containerId) => {
        includedContainerIds.add(containerId);
        // Add all child containers recursively
        const addChildContainers = (parentId: string) => {
          const children = containers.filter((c) => c.parentId === parentId);
          children.forEach((child) => {
            includedContainerIds.add(child.id);
            addChildContainers(child.id);
          });
        };
        addChildContainers(containerId);
      });

      filtered = filtered.filter((t) => includedContainerIds.has(t.containerId));
    }

    // Filter by completion status
    if (!showCompleted) {
      filtered = filtered.filter((t) => !t.completed);
    }

    return [...filtered].sort((a, b) => b.priority - a.priority);
  }, [tasks, showCompleted, selectedContainers, containers]);

  const activeTask = useMemo(() => {
    return sortedTasks.find((t) => t.id === activeId);
  }, [sortedTasks, activeId]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced distance for faster activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (over && active.id !== over.id) {
      reorderTasks(active.id as string, over.id as string);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Execute</h2>
        <p className="text-sm sm:text-base text-gray-600 mb-4">
          View and prioritize all your tasks. Drag and drop to reorder by priority.
        </p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{totalCount}</span> total tasks
            {completedCount > 0 && (
              <span className="ml-2">
                • <span className="font-medium">{completedCount}</span> completed
              </span>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded border-gray-300"
              style={{
                accentColor: defaultAccentColor,
              }}
            />
            Show completed tasks
          </label>
        </div>
        <ContainerFilter
          containers={containers}
          selectedContainers={selectedContainers}
          onToggleContainer={handleToggleContainer}
          onSelectAll={handleSelectAll}
          onReorderContainers={reorderContainers}
        />
      </div>

      {sortedTasks.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg px-4">
          <p className="text-gray-500 mb-2">
            {tasks.length === 0
              ? 'No tasks yet. Switch to Create to add tasks!'
              : 'No tasks to display. All tasks are completed or filtered out.'}
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {sortedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  containers={containers}
                  onToggle={() => toggleTaskCompletion(task.id)}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeTask ? (
              <TaskItem
                task={activeTask}
                containers={containers}
                onToggle={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
};
