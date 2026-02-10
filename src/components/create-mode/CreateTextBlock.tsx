import React, { useState, useEffect, useRef } from 'react';
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
  const rootRef = useRef<HTMLDivElement>(null);
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

  // Scroll the form into view when opened so it's aligned with where the user triggered "Add text"
  useEffect(() => {
    if (isCreating && rootRef.current) {
      rootRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isCreating]);

  if (!isCreating) {
    return null;
  }

  return (
    <div
      ref={rootRef}
      className="flex items-start gap-2 py-1.5 px-4 border-l-2 group bg-gray-50/20 hover:bg-gray-50/40 transition-colors"
      style={{
        marginLeft: `${depth * 24}px`,
        borderLeftColor: containerColor,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = `${containerColor}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(249, 250, 251, 0.2)'; /* gray-50/20 */
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Same width as TextBlockNode drag handle (p-1 + 16px icon) so editor aligns with existing text blocks */}
      <div className="p-1 flex-shrink-0 w-6 min-w-6 flex items-center justify-center opacity-0 pointer-events-none" aria-hidden>
        <div className="w-4 h-4" />
      </div>
      {/* Spacer to align text with task row (same as TextBlockNode) */}
      <div className="w-5 h-5 flex-shrink-0" aria-hidden />
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
