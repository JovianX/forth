import React, { useState, useRef, useEffect } from 'react';
import { AlignLeft } from 'lucide-react';
import { useTaskContext } from '../../context/TaskContext';

interface CreateTextBlockProps {
  containerId: string;
  depth: number;
  isCreating: boolean;
  onCreated?: () => void;
  onCancel?: () => void;
  priority?: number;
}

export const CreateTextBlock: React.FC<CreateTextBlockProps> = ({
  containerId,
  depth,
  isCreating,
  onCreated,
  onCancel,
  priority,
}) => {
  const [content, setContent] = useState('');
  const { addTask, containers } = useTaskContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const container = containers.find((c) => c.id === containerId);
  const containerColor = container?.color || '#3B82F6';

  const handleSubmit = () => {
    if (content.trim()) {
      addTask('', containerId, priority, 'text-block', content.trim());
      setContent('');
      onCreated?.();
    } else {
      handleCancel();
    }
  };

  const handleCancel = () => {
    setContent('');
    onCancel?.();
  };

  useEffect(() => {
    if (isCreating) {
      setContent('');
      if (textareaRef.current) {
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 0);
      }
    }
  }, [isCreating]);

  if (!isCreating) {
    return null;
  }

  return (
    <div
      className="flex items-start gap-2 py-1.5 px-4 rounded-md group border-l-2 border-gray-300 bg-gray-50/30"
      style={{
        marginLeft: `${depth * 24}px`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = `${containerColor}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-1 flex-shrink-0 opacity-0 pointer-events-none">
        <div className="w-4 h-4" />
      </div>
      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
        <AlignLeft size={18} className="text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={Math.max(2, content.split('\n').length || 1)}
            className="w-full px-1 py-1 bg-transparent border-none outline-none focus:outline-none text-gray-700 resize-none min-h-[2rem]"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleCancel();
              } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSubmit();
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
      </div>
    </div>
  );
};
