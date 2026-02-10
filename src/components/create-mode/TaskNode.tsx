import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Zap } from 'lucide-react';
import { Task } from '../../types';
import { TaskCheckbox } from '../shared/TaskCheckbox';
import { useTaskContext } from '../../context/TaskContext';
import { getPriorityAfter } from '../../utils/taskUtils';

interface TaskNodeProps {
  task: Task;
  depth: number;
  isDragOver?: boolean;
  /** When true and dragging, hide the source so only DragOverlay is visible (fixes wrong position) */
  hideSourceWhileDragging?: boolean;
  /** Tighter spacing for list-like layouts (e.g. plan entries) */
  compact?: boolean;
}

const NEW_TASK_EDIT_WINDOW_MS = 2000;

export const TaskNode: React.FC<TaskNodeProps> = ({ task, depth, isDragOver = false, hideSourceWhileDragging = false, compact = false }) => {
  const { tasks, toggleTaskCompletion, deleteTask, updateTask, addTask } = useTaskContext();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAutoFocusedRef = useRef(false);

  useEffect(() => {
    if (hasAutoFocusedRef.current) return;
    if (Date.now() - task.createdAt > NEW_TASK_EDIT_WINDOW_MS) return;
    hasAutoFocusedRef.current = true;
    setIsEditing(true);
  }, [task.id, task.createdAt]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const isSourceHidden = hideSourceWhileDragging && isDragging;
  const style = {
    transform: isSourceHidden ? undefined : CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isSourceHidden ? 0 : (isDragging ? 0.4 : 1),
    marginLeft: `${depth * 24}px`,
    backgroundColor: 'transparent',
    pointerEvents: isSourceHidden ? 'none' as const : undefined,
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);

  useEffect(() => {
    setTitle(task.title);
  }, [task.title]);

  const isNewTask = Date.now() - task.createdAt <= NEW_TASK_EDIT_WINDOW_MS;

  const handleSave = () => {
    if (!title.trim()) {
      if (isNewTask) {
        deleteTask(task.id);
        return;
      }
      setTitle(task.title);
    } else if (title.trim() !== task.title) {
      updateTask(task.id, { title: title.trim() });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(task.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!title.trim() && isNewTask) {
        deleteTask(task.id);
        return;
      }
      handleSave();
      // Create a new task below so user can keep typing without clicking "Add task"
      const newOrder = task.entryId != null ? (task.entryOrder ?? 0) + 1 : undefined;
      const onCreated =
        task.entryId != null && newOrder != null
          ? (newTaskId: string) => {
              updateTask(newTaskId, { entryId: task.entryId, entryOrder: newOrder });
              tasks
                .filter(
                  (t) =>
                    t.entryId === task.entryId &&
                    (t.entryOrder ?? 0) >= newOrder &&
                    t.id !== newTaskId
                )
                .forEach((item) => {
                  updateTask(item.id, { entryOrder: (item.entryOrder ?? 0) + 1 });
                });
            }
          : undefined;
      addTask('', task.containerId, getPriorityAfter(task.priority), 'task', undefined, onCreated);
    } else if (e.key === 'Escape') {
      if (!title.trim() && isNewTask) {
        deleteTask(task.id);
      } else {
        handleCancel();
      }
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-md group ${
        compact ? 'py-0.5 px-3' : 'py-1.5 px-4'
      } ${
        isDragOver ? 'ring-2 ring-blue-400 ring-offset-1 bg-blue-50' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 touch-none opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </div>
      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
        <TaskCheckbox
          checked={task.completed}
          onChange={() => toggleTaskCompletion(task.id)}
        />
      </div>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder="What needs to be done?"
          className={`flex-1 px-1 py-0.5 bg-transparent border-none outline-none focus:outline-none placeholder:text-gray-400 ${
            task.completed
              ? 'line-through text-gray-500'
              : 'text-gray-900'
          }`}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className={`inline-block cursor-text px-1 py-0.5 truncate ${
              task.completed
                ? 'line-through text-gray-500'
                : task.title.trim() ? 'text-gray-900' : 'text-gray-400 italic'
            }`}
            onClick={() => setIsEditing(true)}
            title="Click to edit"
          >
            {task.title.trim() || 'Add task…'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateTask(task.id, { isQuickTask: !task.isQuickTask });
            }}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium transition-all ${
              task.isQuickTask
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 opacity-0 group-hover:opacity-100'
            }`}
            title={task.isQuickTask ? 'Unmark as quick task' : 'Mark as quick task (2 min)'}
            aria-label={task.isQuickTask ? 'Unmark as quick task' : 'Mark as quick task'}
          >
            <Zap size={12} fill={task.isQuickTask ? 'currentColor' : 'none'} />
            <span>2 min</span>
          </button>
        </div>
      )}
      <button
        onClick={() => deleteTask(task.id)}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all ml-auto"
        aria-label="Delete task"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};
