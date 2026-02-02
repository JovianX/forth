import React, { useState, useRef, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { useTaskContext } from '../../context/TaskContext';

interface CreateNoteProps {
  containerId: string;
  depth: number;
  isCreating: boolean;
  onCreated?: () => void;
  onCancel?: () => void;
  priority?: number;
}

export const CreateNote: React.FC<CreateNoteProps> = ({
  containerId,
  depth,
  isCreating,
  onCreated,
  onCancel,
  priority,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { addTask } = useTaskContext();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (title.trim() || content.trim()) {
      addTask(title.trim() || 'Untitled Note', containerId, priority, 'note', content.trim());
      setTitle('');
      setContent('');
      onCreated?.();
    } else {
      handleCancel();
    }
  };

  const handleCancel = () => {
    setTitle('');
    setContent('');
    onCancel?.();
  };

  useEffect(() => {
    if (isCreating) {
      setTitle('');
      setContent('');
      // Focus title first, then content after a short delay
      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
        }
      }, 0);
    }
  }, [isCreating]);

  if (!isCreating) {
    return null;
  }

  return (
    <div
      className="py-2 px-4 rounded-md group border-l-2 border-purple-300 bg-purple-50/30"
      style={{
        marginLeft: `${depth * 24}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-3">
        <div className="w-[20px] flex items-start pt-1">
          <FileText size={18} className="text-purple-500" />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className="px-1 py-0.5 bg-transparent border-none outline-none focus:outline-none text-gray-900 placeholder:text-gray-400 font-medium"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleCancel();
              } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                contentTextareaRef.current?.focus();
              }
            }}
            onBlur={(e) => {
              // Cancel if both empty
              if (!e.currentTarget.value.trim() && !content.trim()) {
                setTimeout(() => {
                  if (!title.trim() && !content.trim()) {
                    handleCancel();
                  }
                }, 200);
              }
            }}
          />
          <textarea
            ref={contentTextareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note..."
            rows={4}
            className="px-1 py-1 bg-transparent border-none outline-none focus:outline-none text-gray-700 placeholder:text-gray-400 resize-none text-sm min-h-[4rem]"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleCancel();
              } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            onBlur={(e) => {
              // Cancel if both empty
              if (!title.trim() && !e.currentTarget.value.trim()) {
                setTimeout(() => {
                  if (!title.trim() && !content.trim()) {
                    handleCancel();
                  }
                }, 200);
              }
            }}
          />
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500 ml-8">
        Press Ctrl/Cmd+Enter to save, Escape to cancel
      </div>
    </div>
  );
};
