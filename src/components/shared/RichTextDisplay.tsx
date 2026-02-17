import React from 'react';
import { isEmptyHtml } from '../../utils/textUtils';

interface RichTextDisplayProps {
  content: string;
  className?: string;
}

export const RichTextDisplay: React.FC<RichTextDisplayProps> = ({ content, className = '' }) => {
  const isEmpty = isEmptyHtml(content);

  if (isEmpty) {
    return (
      <div className={`text-gray-400 italic ${className}`}>
        Empty text block - click to edit
      </div>
    );
  }

  return (
    <div
      className={`text-gray-700 cursor-text ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
