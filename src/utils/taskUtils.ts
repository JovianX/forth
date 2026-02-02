import { Task, Container } from '../types';
import { getContainerColors } from './paletteUtils';
import { findMostDifferentColor } from './colorUtils';

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const getTimestamp = (): number => {
  return Date.now();
};

// Default color palette for containers - optimized for visual distinction
// Colors are evenly distributed across the HSL hue spectrum (0-360 degrees)
// Each color is spaced approximately 30 degrees apart for maximum distinction
const DEFAULT_CONTAINER_COLORS = [
  '#EF4444', // Red (0°) - vibrant
  '#F97316', // Orange (30°) - warm
  '#F59E0B', // Amber (60°) - golden
  '#EAB308', // Yellow (90°) - bright
  '#84CC16', // Lime (120°) - fresh green
  '#10B981', // Emerald (150°) - natural
  '#14B8A6', // Teal (180°) - balanced
  '#06B6D4', // Cyan (210°) - cool
  '#3B82F6', // Blue (240°) - deep
  '#6366F1', // Indigo (270°) - rich
  '#8B5CF6', // Purple (300°) - creative
  '#EC4899', // Pink (330°) - energetic
];

// Get container colors from localStorage or use default
const getContainerColorsList = (): string[] => {
  const savedColors = getContainerColors();
  return savedColors.length > 0 ? savedColors : DEFAULT_CONTAINER_COLORS;
};

export const getNextContainerColor = (_parentId: string | null, containers: Container[]): string => {
  const CONTAINER_COLORS = getContainerColorsList();
  
  // Prioritize recent containers - weight colors by recency
  // Sort containers by creation time (newest first) and give more weight to recent colors
  const sortedContainers = [...containers].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  
  // Take the most recent 5 containers (or all if less than 5)
  // These are weighted more heavily to avoid similar consecutive colors
  const recentColors = sortedContainers.slice(0, 5).map(c => c.color);
  
  // Also include all colors for overall diversity
  const allUsedColors = containers.map(c => c.color);
  
  // Use smart color selection prioritizing recent colors
  return findMostDifferentColor(CONTAINER_COLORS, recentColors, allUsedColors);
};

export const getNextContainerColorPreview = (
  containers: Container[],
  _parentId: string | null = null
): string => {
  const CONTAINER_COLORS = getContainerColorsList();
  
  // Prioritize recent containers for preview too
  const sortedContainers = [...containers].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const recentColors = sortedContainers.slice(0, 5).map(c => c.color);
  const allUsedColors = containers.map(c => c.color);
  
  return findMostDifferentColor(CONTAINER_COLORS, recentColors, allUsedColors);
};


export const getContainerPath = (
  containerId: string,
  containers: Container[]
): string[] => {
  const path: string[] = [];
  let currentId: string | null = containerId;

  while (currentId) {
    const container = containers.find((c) => c.id === currentId);
    if (!container) break;
    path.unshift(container.name);
    currentId = container.parentId;
  }

  return path;
};

export const getContainerName = (
  containerId: string,
  containers: Container[]
): string => {
  const container = containers.find((c) => c.id === containerId);
  return container?.name || 'Unknown';
};

export const getAllTasksFromContainer = (
  containerId: string,
  tasks: Task[],
  containers: Container[]
): Task[] => {
  const directTasks = tasks.filter((t) => t.containerId === containerId);
  const childContainers = containers.filter((c) => c.parentId === containerId);
  
  const childTasks = childContainers.flatMap((child) =>
    getAllTasksFromContainer(child.id, tasks, containers)
  );

  return [...directTasks, ...childTasks];
};

export const validateContainerParent = (
  containerId: string,
  parentId: string | null,
  containers: Container[]
): boolean => {
  if (parentId === null) return true;
  if (containerId === parentId) return false;

  let currentId: string | null = parentId;
  while (currentId) {
    if (currentId === containerId) return false;
    const container = containers.find((c) => c.id === currentId);
    if (!container) break;
    currentId = container.parentId;
  }

  return true;
};
