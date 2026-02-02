import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { CreateTask } from './CreateTask';

interface TaskDividerProps {
  containerId: string;
  depth: number;
  afterPriority?: number; // Priority of task after which to insert
  beforePriority?: number; // Priority of task before which to insert
  hideWhenCreating?: boolean; // Hide divider when a task is being created elsewhere
}

export const TaskDivider: React.FC<TaskDividerProps> = ({
  containerId,
  depth,
  afterPriority,
  beforePriority,
  hideWhenCreating = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleClick = () => {
    setIsCreating(true);
  };

  const handleCreated = () => {
    setIsCreating(false);
  };

  const handleCancel = () => {
    setIsCreating(false);
  };

  // Calculate priority between the two tasks
  const getPriority = (): number | undefined => {
    if (afterPriority !== undefined && beforePriority !== undefined) {
      // Insert between two tasks - use average
      return (afterPriority + beforePriority) / 2;
    } else if (afterPriority !== undefined) {
      // Insert after a task - use a value slightly higher
      return afterPriority + 0.5;
    } else if (beforePriority !== undefined) {
      // Insert before a task - use a value slightly lower
      return beforePriority - 0.5;
    }
    // No priority specified - let addTask use default
    return undefined;
  };

  if (isCreating) {
    return (
      <CreateTask
        containerId={containerId}
        depth={depth}
        isCreating={true}
        onCreated={handleCreated}
        onCancel={handleCancel}
        priority={getPriority()}
      />
    );
  }

  if (hideWhenCreating) {
    return null;
  }

  return (
    <div
      className="relative h-2 group py-1"
      style={{ marginLeft: `${depth * 24}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {isHovered && (
        <div className="absolute inset-0 flex items-center justify-center cursor-pointer">
          <div className="h-px bg-blue-400 w-full" />
          <div className="absolute bg-blue-500 rounded-full p-1 shadow-md hover:bg-blue-600 transition-colors">
            <Plus size={12} className="text-white" />
          </div>
        </div>
      )}
    </div>
  );
};
