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
  const [showShortcutHint, setShowShortcutHint] = useState(true);
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
      setShowShortcutHint(true);
      const t = setTimeout(() => setShowShortcutHint(false), 1200);
      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
        }
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isCreating]);

  if (!isCreating) {
    return null;
  }

  return (
    <div
      className="py-2 px-4 rounded-md group border-l-2 border-purple-300 bg-purple-50/30 relative"
      style={{
        marginLeft: `${depth * 24}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-3">
        <div className="w-[20px] flex items-start pt-1">
          <FileText size={18} className="text-purple-500" />
        </div>
        <div className="flex-1 flex flex-col gap-2 relative">
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
          <div className={`absolute left-0 top-full pt-1.5 z-10 flex items-center gap-1.5 text-xs text-gray-500 pointer-events-none transition-opacity duration-300 ${showShortcutHint ? 'opacity-100' : 'opacity-0'}`}>
            <kbd className="px-1.5 py-0.5 rounded font-mono border border-gray-300 bg-purple-50/95">
              {navigator.platform.toLowerCase().includes('mac') || navigator.userAgent.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}
            </kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 rounded font-mono border border-gray-300 bg-purple-50/95">Enter</kbd>
            <span>to save</span>
            <span className="mx-1">·</span>
            <kbd className="px-1.5 py-0.5 rounded font-mono border border-gray-300 bg-purple-50/95">Esc</kbd>
            <span>to cancel</span>
          </div>
        </div>
      </div>
    </div>
  );
};
