import React, { useState, useEffect } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { WysiwygEditor } from '../shared/WysiwygEditor';

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

  const container = containers.find((c) => c.id === containerId);
  const containerColor = container?.color || '#3B82F6';

  const handleSubmit = () => {
    // Check if content has actual text (strip HTML tags)
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    if (textContent) {
      addTask('', containerId, priority, 'text-block', content);
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
      <div className="w-5 h-5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-col">
          <WysiwygEditor
            value={content}
            onChange={setContent}
            onSave={handleSubmit}
            onBlur={() => {
              // Check if empty and cancel, otherwise submit
              const textContent = content.replace(/<[^>]*>/g, '').trim();
              if (!textContent) {
                setTimeout(() => {
                  const currentTextContent = content.replace(/<[^>]*>/g, '').trim();
                  if (!currentTextContent) {
                    handleCancel();
                  }
                }, 200);
              } else {
                handleSubmit();
              }
            }}
            placeholder="Write text..."
            className="w-full"
            autoFocus={true}
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
