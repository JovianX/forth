import React from 'react';

interface RichTextDisplayProps {
  content: string;
  className?: string;
}

export const RichTextDisplay: React.FC<RichTextDisplayProps> = ({ content, className = '' }) => {
  // If content is empty or just whitespace/empty tags, show placeholder
  const isEmpty = !content || 
    content.trim() === '' || 
    content.trim() === '<p></p>' || 
    content.trim() === '<p><br></p>' ||
    content.replace(/<[^>]*>/g, '').trim() === '';

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
