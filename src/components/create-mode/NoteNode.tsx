import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { GripVertical, Trash2, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { Task } from '../../types';
import { useTaskContext } from '../../context/TaskContext';
import { NoteBlockComponent } from './NoteBlock';
import { NoteBlockControls } from './NoteBlockControls';

interface NoteNodeProps {
  task: Task;
  depth: number;
  isDragOver?: boolean;
}

export const NoteNode: React.FC<NoteNodeProps> = ({ task, depth, isDragOver = false }) => {
  const { deleteTask, updateTask, containers, addNoteBlock, updateNoteBlock, deleteNoteBlock, reorderNoteBlocks } = useTaskContext();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const blocks = task.blocks || [];
  const hasBlocks = blocks.length > 0;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const container = containers.find((c) => c.id === task.containerId);
  const containerColor = container?.color || '#3B82F6';

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.4 : 1,
    marginLeft: `${depth * 24}px`,
    backgroundColor: 'transparent',
  };

  const blockSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      const length = titleInputRef.current.value.length;
      titleInputRef.current.setSelectionRange(length, length);
    }
  }, [isEditingTitle]);

  useEffect(() => {
    setTitle(task.title);
  }, [task.title]);

  const handleSaveTitle = () => {
    if (title.trim() && title.trim() !== task.title) {
      updateTask(task.id, { title: title.trim() });
    } else {
      setTitle(task.title);
    }
    setIsEditingTitle(false);
  };

  const handleNoteClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('button') ||
      target.closest('[data-drag-handle]') ||
      isEditingTitle
    ) {
      return;
    }
    
    // Toggle expand/collapse
    if (hasBlocks) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleBlockDragStart = (event: DragStartEvent) => {
    setActiveBlockId(event.active.id as string);
  };

  const handleBlockDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveBlockId(null);

    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    reorderNoteBlocks(task.id, activeIdStr, overIdStr);
  };

  const activeBlock = activeBlockId ? blocks.find((b) => b.id === activeBlockId) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`py-2 px-4 rounded-md group border-l-2 border-purple-300 bg-purple-50/20 hover:bg-purple-50/40 transition-colors cursor-pointer ${
        isDragOver ? 'ring-2 ring-blue-400 ring-offset-1 bg-blue-50' : ''
      }`}
      onClick={handleNoteClick}
      onMouseEnter={(e) => {
        if (!isDragging && !isEditingTitle && !isDragOver) {
          e.currentTarget.style.backgroundColor = `${containerColor}15`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging && !isEditingTitle && !isDragOver) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          data-drag-handle
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 touch-none flex-shrink-0"
          aria-label="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </div>
        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
          <FileText size={18} className="text-purple-500" />
        </div>
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveTitle();
                  } else if (e.key === 'Escape') {
                    setTitle(task.title);
                    setIsEditingTitle(false);
                  }
                }}
                className="flex-1 px-1 py-0.5 bg-transparent border-none outline-none focus:outline-none text-gray-900 font-medium"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <span
                  className="inline-block cursor-text px-1 py-0.5 text-gray-900 font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingTitle(true);
                  }}
                  title="Click to edit title"
                >
                  {task.title}
                </span>
                {hasBlocks && (
                  <div className="text-gray-400">
                    {isExpanded ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </div>
                )}
                <NoteBlockControls
                  onAddTextBlock={() => {
                    addNoteBlock(task.id, 'text');
                    setIsExpanded(true);
                  }}
                  onAddTaskBlock={() => {
                    addNoteBlock(task.id, 'task');
                    setIsExpanded(true);
                  }}
                />
              </div>
            )}
          </div>
          {hasBlocks && isExpanded && (
            <div className="pl-1 pt-1 space-y-1" onClick={(e) => e.stopPropagation()}>
              <DndContext
                sensors={blockSensors}
                collisionDetection={closestCenter}
                onDragStart={handleBlockDragStart}
                onDragEnd={handleBlockDragEnd}
              >
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  {blocks.map((block) => (
                    <NoteBlockComponent
                      key={block.id}
                      block={block}
                      noteId={task.id}
                      onUpdate={(blockId, updates) => updateNoteBlock(task.id, blockId, updates)}
                      onDelete={(blockId) => deleteNoteBlock(task.id, blockId)}
                    />
                  ))}
                </SortableContext>
                <DragOverlay>
                  {activeBlock ? (
                    <div className="py-1 px-2 bg-white shadow-lg rounded border border-gray-200">
                      {activeBlock.type === 'task' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                          <span className="text-sm text-gray-700">
                            {activeBlock.taskTitle || 'Untitled task'}
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-700">
                          {activeBlock.content || 'Empty text block'}
                        </div>
                      )}
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          )}
          {!hasBlocks && isExpanded && (
            <div className="pl-1 pt-1 text-gray-400 italic text-sm" onClick={(e) => e.stopPropagation()}>
              No blocks yet. Add a text or task block to get started.
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteTask(task.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-all flex-shrink-0"
          aria-label="Delete note"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
