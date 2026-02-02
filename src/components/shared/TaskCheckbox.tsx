import React from 'react';
import { Check } from 'lucide-react';

interface TaskCheckboxProps {
  checked: boolean;
  onChange: () => void;
  className?: string;
  disabled?: boolean;
}

export const TaskCheckbox: React.FC<TaskCheckboxProps> = ({
  checked,
  onChange,
  className = '',
  disabled = false,
}) => {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`
        w-5 h-5 rounded border-2 flex items-center justify-center
        transition-colors duration-200
        ${checked
          ? 'bg-blue-600 border-blue-600 text-white'
          : 'bg-white border-gray-300 hover:border-gray-400'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      aria-label={checked ? 'Mark as incomplete' : 'Mark as complete'}
    >
      {checked && <Check size={14} />}
    </button>
  );
};
