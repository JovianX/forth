import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, AlignLeft } from 'lucide-react';
import { Task } from '../../types';
import { useTaskContext } from '../../context/TaskContext';

interface TextBlockNodeProps {
  task: Task;
  depth: number;
  isDragOver?: boolean;
}

export const TextBlockNode: React.FC<TextBlockNodeProps> = ({ task, depth, isDragOver = false }) => {
  const { deleteTask, updateTask, containers } = useTaskContext();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(task.content || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setContent(task.content || '');
  }, [task.content]);

  const handleSave = () => {
    if (content !== (task.content || '')) {
      updateTask(task.id, { content: content });
    } else {
      setContent(task.content || '');
    }
    setIsEditing(false);
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    // For older dates, show date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleCancel = () => {
    setContent(task.content || '');
    setIsEditing(false);
  };

  const hasContent = content.trim().length > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 py-1.5 px-4 rounded-md group border-l-2 border-gray-300 bg-gray-50/20 hover:bg-gray-50/40 transition-colors ${
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
      onClick={(e) => {
        // Don't toggle if clicking on interactive elements
        const target = e.target as HTMLElement;
        if (
          target.closest('textarea') ||
          target.closest('button') ||
          target.closest('[data-drag-handle]') ||
          isEditing
        ) {
          return;
        }
        setIsEditing(true);
      }}
    >
      <div
        {...attributes}
        {...listeners}
        data-drag-handle
        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 touch-none flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={16} />
      </div>
      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
        <AlignLeft size={18} className="text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex flex-col">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleCancel();
                } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSave();
                }
              }}
              rows={Math.max(2, content.split('\n').length || 1)}
              className="w-full px-1 py-1 bg-transparent border-none outline-none focus:outline-none text-gray-700 resize-none min-h-[2rem]"
              onClick={(e) => e.stopPropagation()}
              placeholder="Write text..."
            />
            <div className="flex items-center gap-1.5 mt-1 px-1 text-xs text-gray-400">
              <kbd className="px-1.5 py-0.5 rounded text-xs font-mono border border-gray-300 bg-gray-50">
                {navigator.platform.toLowerCase().includes('mac') || navigator.userAgent.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}
              </kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 rounded text-xs font-mono border border-gray-300 bg-gray-50">
                Enter
              </kbd>
              <span>to save</span>
              <span className="mx-1">•</span>
              <kbd className="px-1.5 py-0.5 rounded text-xs font-mono border border-gray-300 bg-gray-50">
                Esc
              </kbd>
              <span>to cancel</span>
            </div>
          </div>
        ) : (
          <div
            className="px-1 py-1 text-gray-700 cursor-text whitespace-pre-wrap min-h-[1.5rem]"
            title="Click to edit"
          >
            {hasContent ? content : <span className="text-gray-400 italic">Empty text block - click to edit</span>}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span>Created: {formatTimestamp(task.createdAt)}</span>
          {task.updatedAt && task.updatedAt !== task.createdAt && (
            <span>•</span>
          )}
          {task.updatedAt && task.updatedAt !== task.createdAt && (
            <span>Edited: {formatTimestamp(task.updatedAt)}</span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteTask(task.id);
          }}
          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-all flex-shrink-0"
          aria-label="Delete text block"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
