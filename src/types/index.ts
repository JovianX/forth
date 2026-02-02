export interface NoteBlock {
  id: string;
  type: 'text' | 'task';
  content?: string; // For text blocks
  taskTitle?: string; // For task blocks
  completed?: boolean; // For task blocks
  order: number; // Order within the note
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: number; // Used in execution mode
  containerId: string;
  createdAt: number;
  type: 'task' | 'note' | 'text-block'; // Type of item
  content?: string; // For notes and text-blocks - deprecated for notes, use blocks instead
  blocks?: NoteBlock[]; // For notes - array of text and task blocks
  isQuickTask?: boolean; // 2-minute quick task indicator
}

export interface Container {
  id: string;
  name: string;
  parentId: string | null; // null for root containers
  color: string; // Color hex code for the container
  order: number; // Order for display in execution mode filter
  createdAt: number;
}

export interface AppState {
  mode: 'create' | 'execution';
  containers: Container[];
  tasks: Task[];
  expandedContainers: Set<string> | string[]; // Store as array for JSON serialization
}

export type Mode = 'create' | 'execution';
