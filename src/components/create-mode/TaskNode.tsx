import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Zap } from 'lucide-react';
import { Task } from '../../types';
import { TaskCheckbox } from '../shared/TaskCheckbox';
import { useTaskContext } from '../../context/TaskContext';

interface TaskNodeProps {
  task: Task;
  depth: number;
  isDragOver?: boolean;
}

export const TaskNode: React.FC<TaskNodeProps> = ({ task, depth, isDragOver = false }) => {
  const { toggleTaskCompletion, deleteTask, updateTask, containers } = useTaskContext();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);
  
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

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Place cursor at the end of the text
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);

  useEffect(() => {
    setTitle(task.title);
  }, [task.title]);

  const handleSave = () => {
    if (title.trim() && title.trim() !== task.title) {
      updateTask(task.id, { title: title.trim() });
    } else {
      setTitle(task.title);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(task.title);
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
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 py-1.5 px-4 rounded-md group ${
        isDragOver ? 'ring-2 ring-blue-400 ring-offset-1 bg-blue-50' : ''
      }`}
      onMouseEnter={(e) => {
        if (!isDragging && !isEditing && !isDragOver) {
          e.currentTarget.style.backgroundColor = `${containerColor}15`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging && !isEditing && !isDragOver) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
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
          className={`flex-1 px-1 py-0.5 bg-transparent border-none outline-none focus:outline-none ${
            task.completed
              ? 'line-through text-gray-500'
              : 'text-gray-900'
          }`}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="flex items-center gap-2 flex-1">
          <span
            className={`inline-block cursor-text px-1 py-0.5 ${
              task.completed
                ? 'line-through text-gray-500'
                : 'text-gray-900'
            }`}
            onClick={() => setIsEditing(true)}
            title="Click to edit"
          >
            {task.title}
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
        className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-all ml-auto"
        aria-label="Delete task"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};
