import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, FileText, Zap } from 'lucide-react';
import { Task, Container } from '../../types';
import { TaskCheckbox } from '../shared/TaskCheckbox';
import { getContainerPath } from '../../utils/taskUtils';
import {
  getContainerLightColor,
  getContainerColorWithOpacity,
} from '../../utils/colorUtils';

interface TaskItemProps {
  task: Task;
  containers: Container[];
  onToggle: () => void;
  justDropped?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  containers,
  onToggle,
  justDropped = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    animateLayoutChanges: () => false, // Prevents weird animation when dropping at first (or any) position
  });

  const containerPath = getContainerPath(task.containerId, containers);
  const containerName = containerPath.length > 0 ? containerPath[containerPath.length - 1] : 'Unknown';
  const container = containers.find((c) => c.id === task.containerId);
  
  // Use container color or default neutral color
  const containerColor = container?.color || '#6B7280';
  const containerLightColor = getContainerLightColor(containerColor);
  const containerBorderColor = getContainerColorWithOpacity(containerColor, 0.3);
  
  const isNote = task.type === 'note';
  const isTextBlock = task.type === 'text-block';

  const style = {
    transform: justDropped ? undefined : CSS.Transform.toString(transform),
    transition: isDragging || justDropped ? 'none' : transition,
    opacity: isDragging ? 0.5 : 1,
    borderColor: containerBorderColor,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 border-2 rounded-xl group transition-all
        ${task.completed
          ? 'shadow-sm bg-white/60'
          : 'bg-white shadow-md hover:shadow-lg'
        }
        ${isDragging ? 'opacity-50' : ''}
      `}
      onMouseEnter={(e) => {
        if (!task.completed && !isDragging) {
          e.currentTarget.style.borderColor = containerColor;
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!task.completed) {
          e.currentTarget.style.borderColor = containerBorderColor;
          e.currentTarget.style.transform = '';
        }
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto group/item">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 touch-none opacity-0 group-hover/item:opacity-100 transition-opacity"
          aria-label="Drag to reorder"
        >
          <GripVertical size={20} />
        </div>
        {isNote ? (
          <FileText size={20} className="flex-shrink-0" style={{ color: containerColor }} />
        ) : isTextBlock ? (
          <div className="w-5 h-5 flex-shrink-0" />
        ) : (
          <TaskCheckbox checked={task.completed} onChange={onToggle} />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {!isTextBlock && (
              <div
                className={`
                  font-semibold text-base sm:text-lg
                  ${task.completed && !isNote && !isTextBlock
                    ? 'line-through text-gray-400'
                    : 'text-gray-900'
                  }
                `}
              >
                {task.title}
              </div>
            )}
            {!isNote && !isTextBlock && task.isQuickTask && (
              <div 
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border"
                style={{
                  backgroundColor: containerLightColor,
                  color: containerColor,
                  borderColor: containerBorderColor,
                }}
              >
                <Zap size={12} fill="currentColor" />
                <span>2 min</span>
              </div>
            )}
          </div>
          {isTextBlock && task.content && (
            <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap break-words">
              {task.content}
            </div>
          )}
          {isNote && task.blocks && task.blocks.length > 0 && (
            <div className="text-sm text-gray-600 mt-2 space-y-1">
              {task.blocks.map((block) => (
                <div key={block.id} className="flex items-start gap-2">
                  {block.type === 'task' ? (
                    <>
                      <div className={`w-3 h-3 border-2 rounded mt-1 flex-shrink-0 ${
                        block.completed ? 'bg-gray-400 border-gray-400' : 'border-gray-300'
                      }`}>
                        {block.completed && (
                          <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`min-w-0 flex-1 break-words ${block.completed ? 'line-through text-gray-500' : ''}`}>
                        {block.taskTitle || 'Untitled task'}
                      </span>
                    </>
                  ) : (
                    <div className="whitespace-pre-wrap break-words text-gray-600 min-w-0 flex-1">
                      {block.content || <span className="text-gray-400 italic">Empty text block</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {isNote && (!task.blocks || task.blocks.length === 0) && task.content && (
            <div className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
              {task.content}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-lg text-white text-xs font-semibold shadow-sm"
              style={{
                backgroundColor: containerColor,
              }}
            >
              {containerName}
            </span>
            {containerPath.length > 1 && (
              <span className="text-xs text-gray-500 hidden sm:inline">
                {containerPath.slice(0, -1).join(' / ')}
              </span>
            )}
            {!isNote && !isTextBlock && (
              <div className="text-xs text-gray-500 font-medium">
                Priority: <span className="text-gray-700">{task.priority}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
