import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { CreateTask } from './CreateTask';
import { useTaskContext } from '../../context/TaskContext';
import { getPriorityBetween, getPriorityAfter, getPriorityBefore } from '../../utils/taskUtils';

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
  const { tasks } = useTaskContext();

  const handleClick = () => {
    setIsCreating(true);
  };

  const handleCreated = () => {
    setIsCreating(false);
  };

  const handleCancel = () => {
    setIsCreating(false);
  };

  // Calculate priority for inserting a task at this position
  // Note: Priorities are sorted DESCENDING (highest first), so:
  // - To insert AFTER a task (below it visually), we need a LOWER priority
  // - To insert BEFORE a task (above it visually), we need a HIGHER priority
  // 
  // afterPriority = task that appears ABOVE the insertion point (has HIGHER priority)
  // beforePriority = task that appears BELOW the insertion point (has LOWER priority)
  const getPriority = (): number | undefined => {
    const containerTasks = tasks.filter((t) => t.containerId === containerId);

    // Empty container - let addTask use default (0)
    if (containerTasks.length === 0) {
      return undefined;
    }

    if (afterPriority !== undefined && beforePriority !== undefined) {
      // Insert between two tasks - use average
      return getPriorityBetween(afterPriority, beforePriority);
    } else if (afterPriority !== undefined) {
      // Insert AFTER a task (below it) - need LOWER priority
      return getPriorityAfter(afterPriority);
    } else if (beforePriority !== undefined) {
      // Insert BEFORE a task (above it) - need HIGHER priority
      return getPriorityBefore(beforePriority);
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
