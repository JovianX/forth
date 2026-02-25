import React, { useState, useRef, useEffect } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, Zap, Trash2, CheckSquare, AlignLeft, GripVertical } from 'lucide-react';
import { Container } from '../../types';
import { TaskNode } from './TaskNode';
import { NoteNode } from './NoteNode';
import { TextBlockNode } from './TextBlockNode';
import { CreateContainer } from './CreateContainer';
import { CreateTask } from './CreateTask';
import { CreateTextBlock } from './CreateTextBlock';
import { TaskDivider } from './TaskDivider';
import { useTaskContext } from '../../context/TaskContext';
import {
  getContainerLightColor,
  getContainerHoverColor,
  getContainerDarkColor,
  getContainerColorWithOpacity,
} from '../../utils/colorUtils';

interface ContainerNodeProps {
  container: Container;
  depth: number;
  activeDragId?: string | null;
  overId?: string | null;
}

export const ContainerNode: React.FC<ContainerNodeProps> = ({ container, depth, activeDragId, overId }) => {
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isCreatingTextBlock, setIsCreatingTextBlock] = useState(false);
  const [isCreatingContainer, setIsCreatingContainer] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(container.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const { containers, tasks, deleteContainer, updateContainer, isContainerExpanded, toggleContainerExpanded } = useTaskContext();
  
  const isExpanded = isContainerExpanded(container.id);

  const childContainers = containers
    .filter((c) => c.parentId === container.id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const allItems = tasks.filter((t) => t.containerId === container.id);
  // Combine tasks and notes, sort by priority (highest first)
  const directItems = allItems.sort((a, b) => b.priority - a.priority);

  const hasChildren = childContainers.length > 0 || directItems.length > 0;

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging: isContainerDragging,
  } = useSortable({ id: container.id });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: container.id,
  });

  // Combine refs for both sortable and droppable
  const setNodeRef = (node: HTMLElement | null) => {
    setSortableRef(node);
    setDroppableRef(node);
  };

  const activeTask = activeDragId ? tasks.find((t) => t.id === activeDragId) : null;
  const isDraggingOverContainer = isOver && activeDragId && activeTask && activeTask.containerId !== container.id;
  
  // Derive colors from container color
  const containerLightColor = getContainerLightColor(container.color);
  const containerHoverColor = getContainerHoverColor(container.color);
  const containerDarkColor = getContainerDarkColor(container.color);
  
  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition: isContainerDragging ? 'none' : transition,
    opacity: isContainerDragging ? 0.4 : 1,
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Place cursor at the end of the text
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);

  useEffect(() => {
    setName(container.name);
  }, [container.name]);

  const handleSave = () => {
    if (name.trim() && name.trim() !== container.name) {
      updateContainer(container.id, { name: name.trim() });
    } else {
      setName(container.name);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(container.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="mb-0.5">
      <div
        ref={setNodeRef}
        style={{
          ...sortableStyle,
          marginLeft: `${depth * 24}px`,
          borderLeftColor: container.color,
          borderLeftWidth: isDraggingOverContainer ? '6px' : '4px',
          backgroundColor: isDraggingOverContainer ? containerLightColor : 'transparent',
        }}
        className={`flex items-center gap-2 py-1.5 px-4 rounded-md group border-l-4 transition-all cursor-pointer relative pr-8 ${
          isDraggingOverContainer ? 'shadow-lg scale-[1.02]' : ''
        }`}
        onClick={(e) => {
          // Only toggle if not clicking on text or icons
          const target = e.target as HTMLElement;
          if (!target.closest('input') && !target.closest('button') && !target.closest('.edit-text')) {
            if (hasChildren) {
              toggleContainerExpanded(container.id);
            }
          }
        }}
        onMouseEnter={(e) => {
          if (!isDraggingOverContainer && !isEditing) {
            e.currentTarget.style.backgroundColor = getContainerColorWithOpacity(container.color, 0.15);
          }
        }}
        onMouseLeave={(e) => {
          if (!isDraggingOverContainer && !isEditing) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 touch-none opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          style={{
            color: getContainerColorWithOpacity(container.color, 0.6),
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = containerDarkColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = getContainerColorWithOpacity(container.color, 0.6);
          }}
          aria-label="Drag to reorder container"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </div>
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleContainerExpanded(container.id);
            }}
            className="p-1 rounded transition-colors"
            style={{
              color: containerDarkColor,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = containerHoverColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown size={18} style={{ color: containerDarkColor }} />
            ) : (
              <ChevronRight size={18} style={{ color: containerDarkColor }} />
            )}
          </button>
        ) : (
          <div className="w-[26px]" />
        )}
        <Zap size={18} style={{ color: container.color }} />
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="flex-1 px-1 py-0.5 bg-transparent border-none outline-none focus:outline-none font-medium"
            style={{ color: containerDarkColor }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="flex-1 font-medium cursor-text px-1 py-0.5 edit-text"
            style={{ color: containerDarkColor }}
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            title="Click to edit"
          >
            {container.name}
          </span>
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsCreatingTextBlock(true)}
            className="p-1 rounded transition-colors"
            style={{
              color: getContainerColorWithOpacity(container.color, 0.6),
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = containerDarkColor;
              e.currentTarget.style.backgroundColor = containerHoverColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = getContainerColorWithOpacity(container.color, 0.6);
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Add text block"
          >
            <AlignLeft size={16} />
          </button>
          <button
            onClick={() => setIsCreatingTask(true)}
            className="p-1 rounded transition-colors"
            style={{
              color: getContainerColorWithOpacity(container.color, 0.6),
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = containerDarkColor;
              e.currentTarget.style.backgroundColor = containerHoverColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = getContainerColorWithOpacity(container.color, 0.6);
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Add task"
          >
            <CheckSquare size={16} />
          </button>
          <button
            onClick={() => setIsCreatingContainer(true)}
            className="p-1 rounded transition-colors"
            style={{
              color: getContainerColorWithOpacity(container.color, 0.6),
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = containerDarkColor;
              e.currentTarget.style.backgroundColor = containerHoverColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = getContainerColorWithOpacity(container.color, 0.6);
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Add container"
          >
            <Zap size={16} />
          </button>
        </div>
        <button
          onClick={() => deleteContainer(container.id)}
          className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          aria-label="Delete container"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {isExpanded && (
        <div>
          {isCreatingTask && (
            <CreateTask
              containerId={container.id}
              depth={depth + 1}
              isCreating={isCreatingTask}
              onCreated={() => setIsCreatingTask(false)}
              onCancel={() => setIsCreatingTask(false)}
            />
          )}
          {isCreatingTextBlock && (
            <CreateTextBlock
              containerId={container.id}
              depth={depth + 1}
              isCreating={isCreatingTextBlock}
              onCreated={() => setIsCreatingTextBlock(false)}
              onCancel={() => setIsCreatingTextBlock(false)}
            />
          )}
          {directItems.length > 0 ? (
            <SortableContext
              items={directItems.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div>
                {/* Divider before first item */}
                <TaskDivider
                  containerId={container.id}
                  depth={depth + 1}
                  beforePriority={directItems[0].priority}
                  hideWhenCreating={isCreatingTask || isCreatingTextBlock}
                />
                {directItems.map((item, index) => {
                  const isDragOver = !!(activeDragId && activeDragId !== item.id && overId === item.id);
                  const activeTask = activeDragId ? tasks.find((t) => t.id === activeDragId) : null;
                  const isMovingToDifferentContainer = !!(activeTask && activeTask.containerId !== container.id);
                  const showInsertBefore = isDragOver && activeDragId && isMovingToDifferentContainer;
                  
                  return (
                    <React.Fragment key={item.id}>
                      {showInsertBefore && (
                        <div 
                          className="h-1 my-2 rounded-full shadow-lg relative"
                          style={{ 
                            marginLeft: `${(depth + 1) * 24 + 16}px`, 
                            marginRight: '16px',
                            backgroundColor: container.color,
                          }}
                        >
                          <div 
                            className="absolute inset-0 rounded-full animate-pulse" 
                            style={{ backgroundColor: getContainerColorWithOpacity(container.color, 0.7) }}
                          />
                        </div>
                      )}
                      {item.type === 'note' ? (
                        <NoteNode task={item} depth={depth + 1} isDragOver={isDragOver} />
                      ) : item.type === 'text-block' ? (
                        <TextBlockNode task={item} depth={depth + 1} isDragOver={isDragOver} />
                      ) : (
                        <TaskNode task={item} depth={depth + 1} isDragOver={isDragOver} />
                      )}
                      {/* Divider after each item */}
                      <TaskDivider
                        containerId={container.id}
                        depth={depth + 1}
                        afterPriority={item.priority}
                        beforePriority={index < directItems.length - 1 ? directItems[index + 1].priority : undefined}
                        hideWhenCreating={isCreatingTask || isCreatingTextBlock}
                      />
                      {/* Show insertion indicator after last item if dragging over container */}
                      {index === directItems.length - 1 && isOver && activeDragId && activeTask && activeTask.containerId !== container.id && (
                        <div 
                          className="h-1 my-2 rounded-full shadow-lg relative"
                          style={{ 
                            marginLeft: `${(depth + 1) * 24 + 16}px`, 
                            marginRight: '16px',
                            backgroundColor: container.color,
                          }}
                        >
                          <div 
                            className="absolute inset-0 rounded-full animate-pulse" 
                            style={{ backgroundColor: getContainerColorWithOpacity(container.color, 0.7) }}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </SortableContext>
          ) : (
            <>
              {!isCreatingTask && (
                <TaskDivider
                  containerId={container.id}
                  depth={depth + 1}
                  hideWhenCreating={isCreatingTask || isCreatingTextBlock}
                />
              )}
              {isOver && activeDragId && !isCreatingTask && directItems.length === 0 && activeTask && activeTask.containerId !== container.id && (
                <div
                  className="py-6 px-4 border-2 border-dashed rounded-lg shadow-lg animate-pulse"
                  style={{ 
                    marginLeft: `${(depth + 1) * 24}px`,
                    borderColor: container.color,
                    backgroundColor: containerLightColor,
                  }}
                >
                  <p className="text-sm text-center font-semibold" style={{ color: containerDarkColor }}>
                    Drop here to add to this container
                  </p>
                </div>
              )}
            </>
          )}
          {childContainers.length > 0 && (
            <SortableContext
              items={childContainers.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {childContainers.map((childContainer) => (
                <ContainerNode
                  key={childContainer.id}
                  container={childContainer}
                  depth={depth + 1}
                  activeDragId={activeDragId}
                  overId={overId}
                />
              ))}
            </SortableContext>
          )}
          {isCreatingContainer && (
            <CreateContainer
              parentId={container.id}
              depth={depth + 1}
              isCreating={isCreatingContainer}
              onCreated={() => setIsCreatingContainer(false)}
              onCancel={() => setIsCreatingContainer(false)}
            />
          )}
        </div>
      )}
    </div>
  );
};
