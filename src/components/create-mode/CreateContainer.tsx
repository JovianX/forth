import React, { useState, useRef, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { useTaskContext } from '../../context/TaskContext';
import { getNextContainerColorPreview } from '../../utils/taskUtils';

interface CreateContainerProps {
  parentId: string | null;
  depth: number;
  isCreating: boolean;
  insertAfterId?: string | null;
  onCreated?: (containerId?: string) => void;
  onCancel?: () => void;
}

export const CreateContainer: React.FC<CreateContainerProps> = ({
  parentId,
  depth,
  isCreating,
  insertAfterId,
  onCreated,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const { addContainer, containers } = useTaskContext();
  const inputRef = useRef<HTMLInputElement>(null);

  // Get the color that this container will have when created
  const previewColor = getNextContainerColorPreview(containers, parentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const containerId = addContainer(name.trim(), parentId, insertAfterId);
      setName('');
      onCreated?.(containerId);
    }
  };

  const handleCancel = () => {
    setName('');
    onCancel?.();
  };

  useEffect(() => {
    if (isCreating) {
      setName('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isCreating]);

  if (!isCreating) {
    return null;
  }

  return (
    <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem', display: 'block' }}>
      <div
        className="flex items-center gap-2 py-2 px-4 rounded-md group border-l-4 transition-all relative z-10"
        style={{
          marginLeft: `${depth * 24}px`,
          borderLeftColor: previewColor,
          backgroundColor: `${previewColor}15`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = `${previewColor}15`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = `${previewColor}15`;
        }}
      >
        <div className="w-[26px]" />
        <Zap size={18} style={{ color: previewColor }} />
        <form onSubmit={handleSubmit} className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Topic name..."
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium h-7"
            style={{ lineHeight: '1.25rem' }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleCancel();
              }
            }}
            onBlur={(e) => {
              // Cancel if empty
              if (!e.currentTarget.value.trim()) {
                handleCancel();
              }
            }}
          />
        </form>
      </div>
    </div>
  );
};
