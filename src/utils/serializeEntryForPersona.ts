import type { NoteBlock, Task } from '../types';
import { stripHtml } from './textUtils';

function formatEntryDisplayTitle(entry: Task): string {
  if (entry.title !== 'New Entry') return entry.title;
  return new Date(entry.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function sortedNoteBlocks(blocks: NoteBlock[]): NoteBlock[] {
  return [...blocks].sort((a, b) => a.order - b.order);
}

function flattenNoteBlocks(blocks: NoteBlock[]): string[] {
  const lines: string[] = [];
  for (const block of sortedNoteBlocks(blocks)) {
    if (block.type === 'text') {
      const t = stripHtml(block.content || '');
      if (t) lines.push(t);
    } else {
      const title = (block.taskTitle || '').trim();
      if (title) {
        const mark = block.completed ? '[x]' : '[ ]';
        lines.push(`${mark} ${title}`);
      }
    }
  }
  return lines;
}

function serializeChildItem(item: Task): string | null {
  if (item.type === 'text-block') {
    const t = stripHtml(item.content || '');
    return t ? t : null;
  }
  if (item.type === 'task') {
    const title = item.title.trim();
    if (!title) return null;
    return `${item.completed ? '[x]' : '[ ]'} ${title}`;
  }
  if (item.type === 'note') {
    const parts = flattenNoteBlocks(item.blocks || []);
    if (parts.length === 0) return null;
    const noteTitle = item.title.trim();
    const header = noteTitle ? `Note: ${noteTitle}` : 'Note';
    return `${header}\n${parts.join('\n')}`;
  }
  return null;
}

export interface SerializeEntryResult {
  /** Full user message body for the model */
  fullText: string;
  /** True when there is no meaningful journal content (no child blocks with text) */
  isEmpty: boolean;
}

/**
 * Build plain text from an entry and its child items (same sort as EntryNode: priority desc).
 */
export function serializeEntryForPersona(entry: Task, sortedChildren: Task[]): SerializeEntryResult {
  const lines: string[] = [];
  lines.push('--- Entry title ---');
  lines.push(formatEntryDisplayTitle(entry));
  lines.push('');
  lines.push('--- Entry body ---');

  const bodyLines: string[] = [];
  for (const item of sortedChildren) {
    const chunk = serializeChildItem(item);
    if (chunk) bodyLines.push(chunk);
  }

  if (bodyLines.length === 0) {
    return {
      fullText: lines.join('\n'),
      isEmpty: true,
    };
  }

  lines.push(bodyLines.join('\n\n'));

  return {
    fullText: lines.join('\n'),
    isEmpty: false,
  };
}
