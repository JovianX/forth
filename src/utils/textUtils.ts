/** Strip HTML tags and return plain text */
export const stripHtml = (html: string): string =>
  String(html || '').replace(/<[^>]*>/g, '').trim();

/** True if content has no meaningful text (empty or only whitespace/HTML) */
export const isEmptyHtml = (content: string | undefined): boolean =>
  !content || stripHtml(content) === '';

/**
 * Remove invisible soft-break characters that can split words in view mode.
 * Display-only sanitizer; does not mutate persisted content.
 */
export const stripInvisibleWordBreaks = (content: string): string =>
  String(content || '')
    .replace(/&nbsp;|&#160;|&#xA0;/gi, ' ')
    .replace(/&shy;|&#173;/gi, '')
    .replace(/[\u00A0\u00AD\u202F\u2007\u200B\u200C\u200D\u2060\uFEFF]/g, ' ');
