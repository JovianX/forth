import { Task } from '../types';
import { stripHtml } from './textUtils';

function formatEntryTitle(entry: Task): string {
  if (entry.title !== 'New Entry') return entry.title;
  return new Date(entry.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function serializeEntry(entry: Task, allTasks: Task[]): string {
  const items = allTasks
    .filter((t) => t.entryId === entry.id)
    .sort((a, b) => (b.entryOrder ?? b.priority) - (a.entryOrder ?? a.priority));

  const lines = [`# Entry: ${formatEntryTitle(entry)}`, ''];

  for (const item of items) {
    if (item.type === 'text-block') {
      const text = stripHtml(item.content || '');
      lines.push('## Text', text || '(empty)', '');
      continue;
    }
    if (item.type === 'task') {
      const status = item.completed ? 'done' : 'todo';
      lines.push(`## Task [${status}]`, item.title.trim() || '(empty)', '');
    }
  }

  return lines.join('\n').trim();
}

function serializeTextBlock(task: Task): string {
  return stripHtml(task.content || '').trim();
}

function serializeTask(task: Task): string {
  const status = task.completed ? 'done' : 'todo';
  const title = task.title.trim() || '(empty)';
  return `[${status}] ${title}`;
}

export function serializeAgentInput(task: Task, allTasks: Task[]): string {
  switch (task.type) {
    case 'entry':
      return serializeEntry(task, allTasks);
    case 'text-block':
      return serializeTextBlock(task);
    case 'task':
      return serializeTask(task);
    default:
      throw new Error(`Agents cannot run on ${task.type} objects.`);
  }
}

export function agentInputLabel(task: Task): string {
  switch (task.type) {
    case 'entry':
      return 'Entry';
    case 'text-block':
      return 'Text';
    case 'task':
      return 'Task';
    default:
      return 'Object';
  }
}
