import React, { useState, useRef, useEffect } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { TaskCheckbox } from '../shared/TaskCheckbox';

interface CreateTaskProps {
  containerId: string;
  depth: number;
  isCreating: boolean;
  onCreated?: () => void;
  onCancel?: () => void;
  priority?: number;
}

export const CreateTask: React.FC<CreateTaskProps> = ({
  containerId,
  depth,
  isCreating,
  onCreated,
  onCancel,
  priority,
}) => {
  const [title, setTitle] = useState('');
  const { addTask, containers } = useTaskContext();
  const inputRef = useRef<HTMLInputElement>(null);

  const container = containers.find((c) => c.id === containerId);
  const containerColor = container?.color || '#3B82F6';

  const handleSubmit = () => {
    if (title.trim()) {
      addTask(title.trim(), containerId, priority, 'task');
      setTitle('');
      onCreated?.();
    } else {
      handleCancel();
    }
  };

  const handleCancel = () => {
    setTitle('');
    onCancel?.();
  };

  useEffect(() => {
    if (isCreating) {
      setTitle('');
      if (inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
          const length = inputRef.current?.value.length || 0;
          inputRef.current?.setSelectionRange(length, length);
        }, 0);
      }
    }
  }, [isCreating]);

  if (!isCreating) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-3 py-2 px-4 rounded-md group"
      style={{
        marginLeft: `${depth * 24}px`,
        backgroundColor: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = `${containerColor}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-[20px]" />
      <TaskCheckbox checked={false} onChange={() => {}} disabled />
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title..."
        className="flex-1 px-1 py-0.5 bg-transparent border-none outline-none focus:outline-none text-gray-900 placeholder:text-gray-400"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          } else if (e.key === 'Escape') {
            handleCancel();
          }
        }}
        onBlur={(e) => {
          // Cancel if empty
          if (!e.currentTarget.value.trim()) {
            setTimeout(() => {
              if (!e.currentTarget.value.trim()) {
                handleCancel();
              }
            }, 200);
          }
        }}
      />
    </div>
  );
};
