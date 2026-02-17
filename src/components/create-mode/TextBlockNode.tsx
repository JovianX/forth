import React, { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { Task } from '../../types';
import { useTaskContext } from '../../context/TaskContext';
import { isEmptyHtml } from '../../utils/textUtils';
import { WysiwygEditor } from '../shared/WysiwygEditor';

interface TextBlockNodeProps {
  task: Task;
  depth: number;
  isDragOver?: boolean;
  /** When true and dragging, hide the source so only DragOverlay is visible (fixes wrong position) */
  hideSourceWhileDragging?: boolean;
  /** Tighter spacing for list-like layouts (e.g. plan entries) */
  compact?: boolean;
  /** When true, start in edit mode immediately (for newly created blocks) */
  startInEditMode?: boolean;
}

export const TextBlockNode: React.FC<TextBlockNodeProps> = ({ task, depth, isDragOver = false, hideSourceWhileDragging = false, compact = false, startInEditMode = false }) => {
  const { deleteTask, updateTask } = useTaskContext();
  const [isEditing, setIsEditing] = useState(() => startInEditMode || isEmptyHtml(task.content));
  const [content, setContent] = useState(task.content || '');
  const [showShortcutHint, setShowShortcutHint] = useState(true);
  const blockRef = useRef<HTMLDivElement | null>(null) as React.MutableRefObject<HTMLDivElement | null>;

  useEffect(() => {
    if (startInEditMode && isEditing && blockRef.current) {
      blockRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [startInEditMode, isEditing]);

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
    setContent(task.content || '');
  }, [task.content]);

  // Fade out shortcut hint after entering edit mode
  useEffect(() => {
    if (isEditing) {
      setShowShortcutHint(true);
      const t = setTimeout(() => setShowShortcutHint(false), 2500);
      return () => clearTimeout(t);
    }
  }, [isEditing]);

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

  const hasContent = !isEmptyHtml(content);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        blockRef.current = node;
      }}
      style={style}
      className={`flex items-start gap-2 rounded-md group transition-colors ${
        compact ? 'py-0.5 px-3' : 'py-1.5 px-4 border-l-2 border-gray-300 bg-gray-50/20 hover:bg-gray-50/40'
      } ${
        isDragOver ? 'ring-2 ring-blue-400 ring-offset-1 bg-blue-50' : ''
      }`}
      onClick={(e) => {
        // Don't toggle if clicking on interactive elements
        const target = e.target as HTMLElement;
        if (
          target.closest('.ql-editor') ||
          target.closest('.ql-toolbar') ||
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
      {/* Spacer to align text with task title (same width as task checkbox) */}
      <div className="w-5 h-5 flex-shrink-0" aria-hidden />
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div 
            className="flex flex-col"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
              }
            }}
            tabIndex={-1}
          >
            <div className="relative">
              <WysiwygEditor
                value={content}
                onChange={setContent}
                onBlur={handleSave}
                onSave={handleSave}
                placeholder="Write text..."
                className="w-full"
                autoFocus={true}
                focusImmediately={startInEditMode || isEmptyHtml(content)}
              />
              <div className={`absolute left-0 top-full pt-1.5 z-10 flex items-center gap-1.5 text-xs text-gray-500 pointer-events-none transition-opacity duration-300 ${showShortcutHint ? 'opacity-100' : 'opacity-0'}`}>
                <kbd className="px-1.5 py-0.5 rounded font-mono border border-gray-300 bg-gray-100/90">
                  {navigator.platform.toLowerCase().includes('mac') || navigator.userAgent.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}
                </kbd>
                <span>+</span>
                <kbd className="px-1.5 py-0.5 rounded font-mono border border-gray-300 bg-gray-100/90">Enter</kbd>
                <span>to save</span>
                <span className="mx-1">·</span>
                <kbd className="px-1.5 py-0.5 rounded font-mono border border-gray-300 bg-gray-100/90">Esc</kbd>
                <span>to cancel</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="cursor-text wysiwyg-content py-0.5 px-1"
            title="Click to edit"
            dangerouslySetInnerHTML={{ __html: hasContent ? content : '<span class="text-gray-400 italic">Empty text block - click to edit</span>' }}
            onClick={() => setIsEditing(true)}
          />
        )}
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
        {!task.entryId && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>Created: {formatTimestamp(task.createdAt)}</span>
            {task.updatedAt && task.updatedAt !== task.createdAt && (
              <span>•</span>
            )}
            {task.updatedAt && task.updatedAt !== task.createdAt && (
              <span>Edited: {formatTimestamp(task.updatedAt)}</span>
            )}
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteTask(task.id);
          }}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
          aria-label="Delete text block"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
