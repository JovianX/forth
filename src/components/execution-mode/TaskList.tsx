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
import { useTaskContext } from '../../context/TaskContext';

interface TaskListProps {
  selectedContainers: Set<string> | null;
  showCompleted: boolean;
  onSelectedContainersChange: (containers: Set<string> | null) => void;
  onShowCompletedChange: (show: boolean) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  selectedContainers,
  showCompleted,
  onShowCompletedChange,
}) => {
  const { tasks, containers, toggleTaskCompletion, reorderTasks } = useTaskContext();
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Use first container color or default neutral color for checkbox accent
  const rootContainers = containers.filter((c) => c.parentId === null);
  const defaultAccentColor = rootContainers.length > 0 ? rootContainers[0].color : '#6B7280';


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

  // Calculate actionable tasks (exclude notes and text-blocks)
  const actionableTasks = useMemo(() => {
    return tasks.filter((t) => t.type !== 'note' && t.type !== 'text-block');
  }, [tasks]);

  const totalActionableCount = actionableTasks.length;
  const completedActionableCount = actionableTasks.filter((t) => t.completed).length;
  const displayedCount = sortedTasks.length;
  const displayedCompletedCount = sortedTasks.filter((t) => t.completed).length;

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

  const isFiltered = selectedContainers !== null || !showCompleted;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Execute</h2>
        <p className="text-sm sm:text-base text-gray-600 mb-6">
          View and prioritize all your tasks. Drag and drop to reorder by priority.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50 shadow-sm mb-6">
          <div className="text-sm text-gray-700">
            {isFiltered ? (
              <>
                <span className="font-semibold text-gray-900">{displayedCount}</span> of{' '}
                <span className="font-medium">{totalActionableCount}</span> tasks shown
                {displayedCompletedCount > 0 && (
                  <span className="ml-2 text-gray-600">
                    • <span className="font-medium">{displayedCompletedCount}</span> completed
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="font-semibold text-gray-900">{totalActionableCount}</span> total tasks
                {completedActionableCount > 0 && (
                  <span className="ml-2 text-gray-600">
                    • <span className="font-medium">{completedActionableCount}</span> completed
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {sortedTasks.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg px-4 bg-white/40 backdrop-blur-sm">
          <p className="text-gray-600 mb-2 text-base">
            {totalActionableCount === 0
              ? 'No tasks yet. Switch to Create mode to add tasks!'
              : isFiltered
              ? 'No tasks match your current filters. Try adjusting your container selection or show completed tasks.'
              : 'All tasks are completed. Uncheck "Show completed tasks" to hide them.'}
          </p>
          {totalActionableCount === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Tasks you create will appear here for prioritization and execution.
            </p>
          )}
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
            <div className="space-y-3">
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
