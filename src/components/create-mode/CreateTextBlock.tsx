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
      className="flex items-start gap-3 py-2 px-4 rounded-md group border-l-2 border-gray-300 bg-gray-50/30"
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
      <div className="w-[20px] flex items-start pt-1">
        <AlignLeft size={18} className="text-gray-500" />
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write text..."
        rows={3}
        className="flex-1 px-1 py-1 bg-transparent border-none outline-none focus:outline-none text-gray-700 placeholder:text-gray-400 resize-none min-h-[3rem]"
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
      />
    </div>
  );
};
