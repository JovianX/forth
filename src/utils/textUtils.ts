/** Strip HTML tags and return plain text */
export const stripHtml = (html: string): string =>
  String(html || '').replace(/<[^>]*>/g, '').trim();

/** True if content has no meaningful text (empty or only whitespace/HTML) */
export const isEmptyHtml = (content: string | undefined): boolean =>
  !content || stripHtml(content) === '';
