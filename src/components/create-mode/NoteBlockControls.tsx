import React from 'react';
import { FileText, CheckSquare } from 'lucide-react';

interface NoteBlockControlsProps {
  onAddTextBlock: () => void;
  onAddTaskBlock: () => void;
}

export const NoteBlockControls: React.FC<NoteBlockControlsProps> = ({
  onAddTextBlock,
  onAddTaskBlock,
}) => {
  return (
    <div className="flex items-center gap-1 px-1 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddTextBlock();
        }}
        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
        title="Add text block"
      >
        <FileText size={12} />
        <span>Text</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddTaskBlock();
        }}
        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
        title="Add task block"
      >
        <CheckSquare size={12} />
        <span>Task</span>
      </button>
    </div>
  );
};
