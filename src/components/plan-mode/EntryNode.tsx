import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/** Compact entry times: single icon, tooltip shows created/edited so it doesn't take layout space */
const EntryTimesTooltip: React.FC<{
  createdAt: number;
  updatedAt?: number;
  formatExact: (t: number) => string;
}> = ({ createdAt, updatedAt, formatExact }) => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), 400);
  };
  const hide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
  };
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);
  const hasEdit = updatedAt != null && updatedAt !== createdAt;
  return (
    <span
      className="relative inline-flex opacity-0 group-hover:opacity-100 transition-opacity"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <span className="p-1.5 text-gray-400 rounded cursor-default" aria-label="Created and edited times">
        <Clock size={14} />
      </span>
      <span
        className={`absolute left-0 bottom-full mb-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-gray-800 rounded-lg shadow-lg whitespace-nowrap pointer-events-none z-50 transition-opacity duration-150 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        role="tooltip"
        aria-hidden={!visible}
      >
        Created: {formatExact(createdAt)}
        {hasEdit && (
          <>
            <br />
            Edited: {formatExact(updatedAt!)}
          </>
        )}
        <span className="absolute left-4 top-full -mt-0.5 border-4 border-transparent border-t-gray-800" aria-hidden />
      </span>
    </span>
  );
};

import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, ListTodo, Type, Clock } from 'lucide-react';
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
}

export const EntryNode: React.FC<EntryNodeProps> = ({
  entry,
  items,
  activeDragId,
  containerId,
}) => {
  const { tasks, deleteTask, updateTask, addTask, reorderTasksInEntry } = useTaskContext();
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [overItemId, setOverItemId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(entry.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

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
    addTask('', containerId, priorityAtEnd, 'text-block', '');
    setTimeout(() => {
      const allTasks = tasks.filter((t) => t.containerId === containerId);
      const newTask = allTasks.find((t) => !t.entryId && t.type === 'text-block');
      if (newTask) {
        updateTask(newTask.id, { entryId: entry.id });
      }
    }, 10);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-2 bg-white rounded-xl border border-gray-200/80 shadow-sm transition-all ${
        isOver && activeDragId && activeDragId !== entry.id && !tasks.find((t) => t.id === activeDragId)?.entryId
          ? 'border-blue-300 shadow-md ring-1 ring-blue-200/50'
          : 'hover:border-gray-300/80 hover:shadow'
      }`}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3 group rounded-lg transition-colors group-hover:bg-gray-50/50 -m-1 p-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1.5 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity rounded"
          >
            <GripVertical size={16} />
          </div>
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
              className="flex-1 min-w-0 text-left px-2 py-1 text-lg font-semibold tracking-tight text-gray-900 rounded-lg hover:bg-gray-100/80 transition-colors"
              title="Click to edit title"
            >
              {displayTitle}
            </button>
          )}
          <EntryTimesTooltip
            createdAt={entry.createdAt}
            updatedAt={entry.updatedAt}
            formatExact={formatExactTimestamp}
          />
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleAddTask}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 bg-white hover:bg-gray-100 rounded-lg border border-gray-200/80 hover:border-gray-300 shadow-sm hover:shadow transition-all"
              title="Add task"
            >
              <ListTodo size={14} className="shrink-0 opacity-80" />
              Add Task
            </button>
            <button
              onClick={handleAddTextBlock}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 bg-white hover:bg-gray-100 rounded-lg border border-gray-200/80 hover:border-gray-300 shadow-sm hover:shadow transition-all"
              title="Add text"
            >
              <Type size={14} className="shrink-0 opacity-80" />
              Add Text
            </button>
          </div>
          <button
            onClick={() => deleteTask(entry.id)}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {sortedItems.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm rounded-lg bg-gray-50/30 border border-dashed border-gray-200/80">
            Click "Add Task" or "Add Text" to add items to this entry
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
                        />
                      )}
                      {item.type === 'note' ? (
                        <NoteNode task={item} depth={0} isDragOver={isDragOver} hideSourceWhileDragging compact />
                      ) : item.type === 'text-block' ? (
                        <TextBlockNode task={item} depth={0} isDragOver={isDragOver} hideSourceWhileDragging compact />
                      ) : (
                        <TaskNode task={item} depth={0} isDragOver={isDragOver} hideSourceWhileDragging compact />
                      )}
                      <EntryDivider
                        entryId={entry.id}
                        containerId={containerId}
                        insertAtIndex={index + 1}
                        sortedItems={sortedItems}
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
  );
};
