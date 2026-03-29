import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, ListTodo, Type, Sparkles } from 'lucide-react';
import { Task } from '../../types';
import { TaskNode } from '../create-mode/TaskNode';
import { TextBlockNode } from '../create-mode/TextBlockNode';
import { NoteNode } from '../create-mode/NoteNode';
import { EntryDivider } from './EntryDivider';
import { useTaskContext } from '../../context/TaskContext';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
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
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

interface EntryNodeProps {
  entry: Task;
  items: Task[];
  depth: number;
  activeDragId?: string | null;
  containerId: string;
  justCreated?: boolean;
  onPersonaSparkle?: (payload: {
    entry: Task;
    items: Task[];
    containerId: string;
  }) => void;
  /** True while Ollama request for this entry is in flight */
  personaRequestBusy?: boolean;
}

export const EntryNode: React.FC<EntryNodeProps> = ({
  entry,
  items,
  activeDragId,
  containerId,
  justCreated = false,
  onPersonaSparkle,
  personaRequestBusy = false,
}) => {
  const { tasks, deleteTask, updateTask, addTask, reorderTasksInEntry } = useTaskContext();
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [overItemId, setOverItemId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(entry.title);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const autoCreatedTextForEntryRef = useRef<string | null>(null);

  const formatEntryTitleDefault = (timestamp: number) =>
    new Date(timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

  const displayTitle = entry.title === 'New Entry' ? formatEntryTitleDefault(entry.createdAt) : entry.title;

  useEffect(() => {
    if (!isEditingTitle) {
      setTitle(entry.title === 'New Entry' ? formatEntryTitleDefault(entry.createdAt) : entry.title);
    }
  }, [entry.title, entry.createdAt, isEditingTitle]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleDeleteEntry = () => setDeleteConfirmOpen(true);

  const handleDeleteConfirm = () => {
    deleteTask(entry.id);
    setDeleteConfirmOpen(false);
  };

  useEffect(() => {
    if (!deleteConfirmOpen) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDeleteConfirmOpen(false);
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [deleteConfirmOpen]);

  // When entry is just created and empty, create a text block by default and focus it
  useEffect(() => {
    if (!justCreated || items.length > 0 || autoCreatedTextForEntryRef.current === entry.id) return;
    autoCreatedTextForEntryRef.current = entry.id;
    const priorityAtEnd = undefined;
    addTask('', containerId, priorityAtEnd, 'text-block', '', (newTaskId) => {
      updateTask(newTaskId, { entryId: entry.id });
      setNewlyCreatedTextBlockId(newTaskId);
    });
  }, [justCreated, items.length, entry.id, containerId, addTask, updateTask]);

  const handleTitleSave = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== entry.title) {
      updateTask(entry.id, { title: trimmed });
    } else {
      setTitle(entry.title === 'New Entry' ? formatEntryTitleDefault(entry.createdAt) : entry.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setTitle(entry.title === 'New Entry' ? formatEntryTitleDefault(entry.createdAt) : entry.title);
      setIsEditingTitle(false);
    }
  };

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `entry-${entry.id}`,
  });

  const setNodeRef = (node: HTMLElement | null) => {
    setSortableRef(node);
    setDroppableRef(node);
  };

  const sortedItems = [...items].sort((a, b) => b.priority - a.priority);

  const formatExactTimestamp = (timestamp: number): string =>
    new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    });

  const itemSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleItemDragStart = (event: DragStartEvent) => {
    setActiveItemId(event.active.id as string);
  };

  const handleItemDragOver = (event: DragOverEvent) => {
    setOverItemId(event.over?.id as string | null);
  };

  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItemId(null);
    setOverItemId(null);

    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    if (activeIdStr !== overIdStr) {
      const activeItem = tasks.find((t) => t.id === activeIdStr);
      const overItem = tasks.find((t) => t.id === overIdStr);

      if (activeItem && overItem && activeItem.entryId === entry.id && overItem.entryId === entry.id) {
        reorderTasksInEntry(entry.id, activeIdStr, overIdStr);
      }
    }
  };

  const activeItem = activeItemId ? sortedItems.find((item) => item.id === activeItemId) : null;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [newlyCreatedTextBlockId, setNewlyCreatedTextBlockId] = useState<string | null>(null);

  // Clear the "newly created" marker once the block has rendered (so we don't re-trigger edit mode)
  useEffect(() => {
    if (!newlyCreatedTextBlockId || !sortedItems.some((t) => t.id === newlyCreatedTextBlockId)) return;
    const id = setTimeout(() => setNewlyCreatedTextBlockId(null), 200);
    return () => clearTimeout(id);
  }, [newlyCreatedTextBlockId, sortedItems]);

  const handleAddTask = () => {
    const priorityAtEnd = sortedItems.length > 0 ? Math.min(...sortedItems.map((t) => t.priority)) - 1 : undefined;
    addTask('', containerId, priorityAtEnd, 'task');
    setTimeout(() => {
      const allTasks = tasks.filter((t) => t.containerId === containerId);
      const newTask = allTasks.find((t) => !t.entryId && t.type === 'task');
      if (newTask) {
        updateTask(newTask.id, { entryId: entry.id });
      }
    }, 10);
  };

  const handleAddTextBlock = () => {
    const priorityAtEnd = sortedItems.length > 0 ? Math.min(...sortedItems.map((t) => t.priority)) - 1 : undefined;
    addTask('', containerId, priorityAtEnd, 'text-block', '', (newTaskId) => {
      updateTask(newTaskId, { entryId: entry.id });
      setNewlyCreatedTextBlockId(newTaskId);
    });
  };

  const handleAiAction = () => {
    onPersonaSparkle?.({ entry, items, containerId });
  };

  return (
    <>
    <div
      ref={setNodeRef}
      style={style}
      className={`relative z-10 mb-2 bg-white rounded-xl border border-gray-200/80 shadow-sm transition-all ${
        isOver && activeDragId && activeDragId !== entry.id && !tasks.find((t) => t.id === activeDragId)?.entryId
          ? 'border-blue-300 shadow-md ring-1 ring-blue-200/50'
          : 'hover:border-gray-300/80 hover:shadow'
      }`}
    >
      <div className={`h-full rounded-xl ${justCreated ? 'new-entry-enter' : ''}`}>
      <div className="p-4">
        <div className="relative flex items-center gap-2 mb-3 group rounded-lg transition-colors group-hover:bg-gray-50/50 -m-1 p-1">
          <div
            {...attributes}
            {...listeners}
            className="flex items-center justify-center w-8 h-8 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded shrink-0"
          >
            <GripVertical size={16} />
          </div>
          <div className="flex-1 min-w-0 flex items-center">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="flex-1 min-w-0 px-2 py-1 text-lg font-semibold tracking-tight border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTitle(displayTitle);
                  setIsEditingTitle(true);
                }}
                className="flex-1 min-w-0 text-left px-2 py-1 text-lg font-semibold tracking-tight text-gray-900 rounded-lg hover:bg-gray-100/80 transition-colors truncate"
                title={
                  entry.updatedAt != null && entry.updatedAt !== entry.createdAt
                    ? `Created: ${formatExactTimestamp(entry.createdAt)} • Edited: ${formatExactTimestamp(entry.updatedAt)}`
                    : `Created: ${formatExactTimestamp(entry.createdAt)}`
                }
              >
                {displayTitle}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleAiAction}
            disabled={personaRequestBusy}
            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 z-10 shrink-0 disabled:opacity-40 disabled:pointer-events-none"
            title="Persona feedback (Ollama)"
            aria-label="Persona feedback"
          >
            <Sparkles size={18} className={personaRequestBusy ? 'animate-pulse' : undefined} />
          </button>
          <button
            type="button"
            onClick={handleDeleteEntry}
            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 z-10 shrink-0"
            title="Delete entry"
            aria-label="Delete entry"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {sortedItems.length === 0 ? (
          <div className="relative z-10 text-center py-10 px-4 rounded-lg bg-gray-50/30 border border-dashed border-gray-200/80">
            <p className="text-gray-500 text-sm font-medium mb-3">Start with</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddTextBlock();
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow transition-all"
              >
                <Type size={16} className="shrink-0 opacity-80" />
                Text
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddTask();
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow transition-all"
              >
                <ListTodo size={16} className="shrink-0 opacity-80" />
                Task
              </button>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={itemSensors}
            collisionDetection={closestCenter}
            onDragStart={handleItemDragStart}
            onDragOver={handleItemDragOver}
            onDragEnd={handleItemDragEnd}
          >
            <SortableContext items={sortedItems.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-0">
                {sortedItems.map((item, index) => {
                  const isDragOver = !!(activeItemId && activeItemId !== item.id && overItemId === item.id);

                  return (
                    <React.Fragment key={item.id}>
                      {index === 0 && (
                        <EntryDivider
                          entryId={entry.id}
                          containerId={containerId}
                          insertAtIndex={0}
                          sortedItems={sortedItems}
                          onTextBlockCreated={setNewlyCreatedTextBlockId}
                        />
                      )}
                      {item.type === 'note' ? (
                        <NoteNode task={item} depth={0} isDragOver={isDragOver} hideSourceWhileDragging compact />
                      ) : item.type === 'text-block' ? (
                        <TextBlockNode
                          task={item}
                          depth={0}
                          isDragOver={isDragOver}
                          hideSourceWhileDragging
                          compact
                          startInEditMode={item.id === newlyCreatedTextBlockId}
                        />
                      ) : (
                        <TaskNode task={item} depth={0} isDragOver={isDragOver} hideSourceWhileDragging compact />
                      )}
                      <EntryDivider
                        entryId={entry.id}
                        containerId={containerId}
                        insertAtIndex={index + 1}
                        sortedItems={sortedItems}
                        onTextBlockCreated={setNewlyCreatedTextBlockId}
                      />
                    </React.Fragment>
                  );
                })}
              </div>
            </SortableContext>
            {createPortal(
              <DragOverlay>
                {activeItem ? (
                  <div className="opacity-90">
                    {activeItem.type === 'note' ? (
                      <NoteNode task={activeItem} depth={0} />
                    ) : activeItem.type === 'text-block' ? (
                      <TextBlockNode task={activeItem} depth={0} />
                    ) : (
                      <TaskNode task={activeItem} depth={0} />
                    )}
                  </div>
                ) : null}
              </DragOverlay>,
              document.body
            )}
          </DndContext>
        )}
      </div>
      </div>
    </div>
    {deleteConfirmOpen &&
      createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-entry-dialog-title"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDeleteConfirmOpen(false)}
            aria-hidden="true"
          />
          <div
            className="relative z-10 w-full max-w-sm bg-white rounded-xl border border-gray-200 shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-entry-dialog-title" className="text-lg font-semibold text-gray-900 mb-2">
              Delete entry?
            </h2>
            <p className="text-gray-600 text-sm mb-5">
              This will remove the entry and all its tasks and text. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
