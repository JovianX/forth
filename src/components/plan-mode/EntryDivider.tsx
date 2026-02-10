import React, { useState } from 'react';
import { ListTodo, Type } from 'lucide-react';
import { useTaskContext } from '../../context/TaskContext';
import { Task } from '../../types';
import { getPriorityAfter, getPriorityBefore, getPriorityBetween } from '../../utils/taskUtils';

interface EntryDividerProps {
  entryId: string;
  containerId: string;
  insertAtIndex: number;
  sortedItems: Task[];
}

export const EntryDivider: React.FC<EntryDividerProps> = ({
  entryId,
  containerId,
  insertAtIndex,
  sortedItems,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { addTask, updateTask } = useTaskContext();

  const insertItem = (type: 'task' | 'text-block') => {
    const priority =
      sortedItems.length === 0
        ? undefined
        : insertAtIndex === 0
          ? getPriorityBefore(sortedItems[0].priority)
          : insertAtIndex >= sortedItems.length
            ? getPriorityAfter(sortedItems[sortedItems.length - 1].priority)
            : getPriorityBetween(sortedItems[insertAtIndex - 1].priority, sortedItems[insertAtIndex].priority);

    const onCreated = (newTaskId: string) => {
      updateTask(newTaskId, { entryId });
    };

    if (type === 'task') {
      addTask('', containerId, priority, 'task', undefined, onCreated);
    } else {
      addTask('', containerId, priority, 'text-block', '', onCreated);
    }
  };

  return (
    <div
      className="relative h-0.5 group min-h-[10px] flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Subtle divider line and actions only on hover */}
      {isHovered && (
        <>
          <div className="absolute inset-x-0 h-px bg-gray-200" />
          <div className="absolute inset-0 flex items-center justify-center gap-1 -my-1 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                insertItem('task');
              }}
              className="flex items-center gap-1 px-1.5 py-1 text-gray-500 bg-gray-100/80 hover:bg-gray-200/80 hover:text-gray-700 rounded text-xs transition-colors"
              title="Add task"
            >
              <ListTodo size={12} />
              Task
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                insertItem('text-block');
              }}
              className="flex items-center gap-1 px-1.5 py-1 text-gray-500 bg-gray-100/80 hover:bg-gray-200/80 hover:text-gray-700 rounded text-xs transition-colors"
              title="Add text"
            >
              <Type size={12} />
              Text
            </button>
          </div>
        </>
      )}
    </div>
  );
};
