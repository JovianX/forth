import React from 'react';

/** Matches http(s)://... or www.... */
const URL_REGEX = /(https?:\/\/\S+)|(www\.\S+)/gi;

function ensureProtocol(href: string): string {
  if (/^https?:\/\//i.test(href)) return href;
  return `https://${href}`;
}

/** Trim trailing punctuation that's likely not part of the URL. */
function trimTrailingPunctuation(s: string): string {
  return s.replace(/[.,;:!?)]+$/, '');
}

interface LinkifyTextProps {
  text: string;
  className?: string;
}

/**
 * Renders text with URLs turned into clickable links (open in new tab).
 */
export const LinkifyText: React.FC<LinkifyTextProps> = ({ text, className = '' }) => {
  if (!text || typeof text !== 'string') {
    return <span className={className}>{text}</span>;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  // Reset regex state (global flag)
  URL_REGEX.lastIndex = 0;
  while ((m = URL_REGEX.exec(text)) !== null) {
    const fullMatch = m[0];
    const urlPart = trimTrailingPunctuation(fullMatch);
    const start = m.index;

    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    const href = ensureProtocol(urlPart);
    parts.push(
      <a
        key={start}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {urlPart}
      </a>
    );
    lastIndex = m.index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }
  if (parts.length === 1 && typeof parts[0] === 'string') {
    return <span className={className}>{parts[0]}</span>;
  }

  return <span className={className}>{parts}</span>;
};
