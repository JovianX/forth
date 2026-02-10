import React, { useState } from 'react';
import { FilePlus } from 'lucide-react';

interface ContainerDividerProps {
  depth: number;
  insertAfterId?: string | null;
  hideWhenCreating?: boolean;
  onClick: () => void;
}

export const ContainerDivider: React.FC<ContainerDividerProps> = ({
  depth,
  hideWhenCreating = false,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  if (hideWhenCreating) {
    return null;
  }

  return (
    <div
      className="relative h-1 group"
      style={{ marginLeft: `${depth * 24}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {isHovered && (
        <div className="absolute inset-0 flex items-center justify-center cursor-pointer -my-1">
          <div className="h-px bg-blue-400 w-full" />
          <div className="absolute bg-blue-500 rounded-full p-1.5 shadow-md hover:bg-blue-600 transition-colors">
            <FilePlus size={14} className="text-white" />
          </div>
        </div>
      )}
    </div>
  );
};
