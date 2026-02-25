import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { NoteBlock } from '../../types';
import { TaskCheckbox } from '../shared/TaskCheckbox';
import { LinkifyText } from '../shared/LinkifyText';
import { WysiwygEditor } from '../shared/WysiwygEditor';
import { stripInvisibleWordBreaks } from '../../utils/textUtils';

interface NoteBlockProps {
  block: NoteBlock;
  noteId: string;
  onUpdate: (blockId: string, updates: Partial<NoteBlock>) => void;
  onDelete: (blockId: string) => void;
}

export const NoteBlockComponent: React.FC<NoteBlockProps> = ({
  block,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(block.type === 'text' ? (block.content || '') : (block.taskTitle || ''));
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.4 : 1,
  };

  useEffect(() => {
    if (isEditing) {
      if (block.type === 'task' && inputRef.current) {
        inputRef.current.focus();
        const length = inputRef.current.value.length;
        inputRef.current.setSelectionRange(length, length);
      }
    }
  }, [isEditing, block.type]);

  useEffect(() => {
    if (block.type === 'text') {
      setText(block.content || '');
    } else {
      setText(block.taskTitle || '');
    }
  }, [block.content, block.taskTitle, block.type]);

  const handleSave = () => {
    if (block.type === 'text') {
      onUpdate(block.id, { content: text });
    } else {
      onUpdate(block.id, { taskTitle: text });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (block.type === 'text') {
      setText(block.content || '');
    } else {
      setText(block.taskTitle || '');
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && block.type === 'task' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  if (block.type === 'task') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-2 py-1 group/block"
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 text-gray-400 hover:text-gray-600 touch-none opacity-0 group-hover/block:opacity-100 transition-opacity"
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </div>
        <TaskCheckbox
          checked={block.completed || false}
          onChange={() => onUpdate(block.id, { completed: !block.completed })}
        />
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={`flex-1 px-1 py-0.5 bg-transparent border-none outline-none focus:outline-none ${
              block.completed
                ? 'line-through text-gray-500'
                : 'text-gray-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={`flex-1 min-w-0 cursor-text px-1 py-0.5 break-words ${
              block.completed
                ? 'line-through text-gray-500'
                : 'text-gray-900'
            }`}
            onClick={() => setIsEditing(true)}
            title="Click to edit"
          >
            <LinkifyText text={block.taskTitle || 'Untitled task'} />
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(block.id);
          }}
          className="opacity-0 group-hover/block:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          aria-label="Delete block"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  }

  // Text block
  const hasTextContent = block.type === 'text' ? (text.replace(/<[^>]*>/g, '').trim().length > 0) : false;
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="py-1 group/block"
    >
      {isEditing ? (
        <WysiwygEditor
          value={text}
          onChange={setText}
          onBlur={handleSave}
          onSave={handleSave}
          placeholder="Write text..."
          className="w-full"
          autoFocus={true}
        />
      ) : (
        <div className="flex items-start gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-0.5 text-gray-400 hover:text-gray-600 touch-none opacity-0 group-hover/block:opacity-100 transition-opacity mt-1"
            aria-label="Drag to reorder"
          >
            <GripVertical size={14} />
          </div>
          <div
            className="flex-1 cursor-text wysiwyg-content"
            onClick={() => setIsEditing(true)}
            title="Click to edit"
            dangerouslySetInnerHTML={{ __html: hasTextContent ? stripInvisibleWordBreaks(text) : '<span class="text-gray-400 italic">Empty text block</span>' }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(block.id);
            }}
            className="opacity-0 group-hover/block:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            aria-label="Delete block"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
