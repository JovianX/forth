import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Zap } from 'lucide-react';
import { ContainerNode } from './ContainerNode';
import { CreateContainer } from './CreateContainer';
import { ContainerDivider } from './ContainerDivider';
import { TaskNode } from './TaskNode';
import { NoteNode } from './NoteNode';
import { TextBlockNode } from './TextBlockNode';
import { useTaskContext } from '../../context/TaskContext';

interface ContainerTreeProps {
  onAddContainerRef?: (fn: () => void) => void;
}

export const ContainerTree: React.FC<ContainerTreeProps> = ({ onAddContainerRef }) => {
  const { containers, tasks, reorderTasksInContainer, moveTaskToContainer, reorderContainers } = useTaskContext();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [isCreatingRootContainer, setIsCreatingRootContainer] = useState(false);
  const [creatingDividerIndex, setCreatingDividerIndex] = useState<number | null>(null);
  
  // Register the add container function with parent
  React.useEffect(() => {
    if (onAddContainerRef) {
      onAddContainerRef(() => {
        if (!isCreatingRootContainer && creatingDividerIndex === null) {
          setIsCreatingRootContainer(true);
        }
      });
    }
  }, [onAddContainerRef, isCreatingRootContainer, creatingDividerIndex]);
  
  const rootContainers = containers
    .filter((c) => c.parentId === null)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string | null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    // Check if dragging a container
    const activeContainer = containers.find((c) => c.id === activeIdStr);
    if (activeContainer) {
      // Check if dropping on another container
      const targetContainer = containers.find((c) => c.id === overIdStr);
      if (targetContainer) {
        reorderContainers(activeIdStr, overIdStr);
      }
      return;
    }

    // Check if dragging a task
    const activeTask = tasks.find((t) => t.id === activeIdStr);
    if (!activeTask) return;

    // Check if dropping on a container
    const targetContainer = containers.find((c) => c.id === overIdStr);
    if (targetContainer) {
      // Moving task to a different container
      if (activeTask.containerId !== targetContainer.id) {
        moveTaskToContainer(activeTask.id, targetContainer.id);
      }
      return;
    }

    // Check if dropping on another task
    const targetTask = tasks.find((t) => t.id === overIdStr);
    if (targetTask) {
      // Reordering within the same container
      if (activeTask.containerId === targetTask.containerId) {
        reorderTasksInContainer(activeTask.containerId, activeIdStr, overIdStr);
      } else {
        // Moving to a different container
        moveTaskToContainer(activeTask.id, targetTask.containerId);
      }
    }
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;
  const activeContainer = activeId ? containers.find((c) => c.id === activeId) : null;

  return (
    <div className="p-4 sm:p-6">
      {rootContainers.length === 0 && containers.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Zap size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No topics yet</h3>
            <p className="text-sm text-gray-500 px-4 max-w-md mx-auto">
              Click "Add Topic" in the main menu to create your first topic.
            </p>
          </div>
          {isCreatingRootContainer && (
            <div className="flex justify-center">
              <CreateContainer
                parentId={null}
                depth={0}
                isCreating={isCreatingRootContainer}
                onCreated={() => setIsCreatingRootContainer(false)}
                onCancel={() => setIsCreatingRootContainer(false)}
              />
            </div>
          )}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={rootContainers.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-0">
              {/* Containers List with Dividers */}
              {rootContainers.map((container, index) => (
                <React.Fragment key={container.id}>
                  {index > 0 && (
                    <ContainerDivider
                      depth={0}
                      insertAfterId={rootContainers[index - 1].id}
                      hideWhenCreating={creatingDividerIndex === index - 1}
                      onClick={() => setCreatingDividerIndex(index - 1)}
                    />
                  )}
                  {creatingDividerIndex === index - 1 && (
                    <CreateContainer
                      parentId={null}
                      depth={0}
                      insertAfterId={rootContainers[index - 1].id}
                      isCreating={true}
                      onCreated={() => setCreatingDividerIndex(null)}
                      onCancel={() => setCreatingDividerIndex(null)}
                    />
                  )}
                  <ContainerNode 
                    container={container} 
                    depth={0}
                    activeDragId={activeId}
                    overId={overId}
                  />
                </React.Fragment>
              ))}
              
              {/* Add Container Section - for header button (at end) */}
              {isCreatingRootContainer && creatingDividerIndex === null && rootContainers.length > 0 && (
                <CreateContainer
                  parentId={null}
                  depth={0}
                  isCreating={isCreatingRootContainer}
                  onCreated={() => setIsCreatingRootContainer(false)}
                  onCancel={() => setIsCreatingRootContainer(false)}
                />
              )}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeContainer ? (
              <div
                className="flex items-center gap-2 py-2 px-4 rounded-md border-l-4 shadow-lg"
                style={{
                  borderLeftColor: activeContainer.color,
                  backgroundColor: `${activeContainer.color}15`,
                }}
              >
                <Zap size={18} style={{ color: activeContainer.color }} />
                <span className="font-medium text-gray-900">{activeContainer.name}</span>
              </div>
            ) : activeTask ? (
              activeTask.type === 'note' ? (
                <NoteNode task={activeTask} depth={1} />
              ) : activeTask.type === 'text-block' ? (
                <TextBlockNode task={activeTask} depth={1} />
              ) : (
                <TaskNode task={activeTask} depth={1} />
              )
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
};
