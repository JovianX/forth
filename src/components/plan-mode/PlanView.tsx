import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Zap, ChevronRight, Trash2, GripVertical, ChevronLeft } from 'lucide-react';
import { useTaskContext } from '../../context/TaskContext';
import { Container, Task } from '../../types';
import { EntryNode } from './EntryNode';
import { TaskNode } from '../create-mode/TaskNode';
import { NoteNode } from '../create-mode/NoteNode';
import { TextBlockNode } from '../create-mode/TextBlockNode';
import { CreateContainer } from '../create-mode/CreateContainer';
import { getPalette } from '../../utils/paletteUtils';
import {
  getContainerLightColor,
  getContainerDarkColor,
} from '../../utils/colorUtils';
import { Plus } from 'lucide-react';

export const PlanView: React.FC = () => {
  const { containers, tasks, reorderTasksInContainer, moveTaskToContainer, addTask, updateTask, addContainer, deleteContainer, updateContainer, reorderContainers } = useTaskContext();
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCreatingContainer, setIsCreatingContainer] = useState(false);
  const [insertAfterId, setInsertAfterId] = useState<string | null>(null);
  const processedEntriesRef = useRef<Set<string>>(new Set());
  const pendingEntryIdsRef = useRef<Map<string, string>>(new Map()); // Maps containerId to entryId
  
  const SIDEBAR_MIN = 180;
  const SIDEBAR_MAX = 480;
  const SIDEBAR_DEFAULT = 256;

  // Sidebar state - load from localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('planSidebarCollapsed');
    return saved === 'true';
  });
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('planSidebarWidth');
    if (saved) {
      const n = parseInt(saved, 10);
      if (!Number.isNaN(n) && n >= SIDEBAR_MIN && n <= SIDEBAR_MAX) return n;
    }
    return SIDEBAR_DEFAULT;
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);
  
  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('planSidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);
  useEffect(() => {
    localStorage.setItem('planSidebarWidth', String(sidebarWidth));
  }, [sidebarWidth]);

  // Draggable divider: global mouse listeners for resize
  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - resizeStartX.current;
      const next = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, resizeStartWidth.current + delta));
      setSidebarWidth(next);
    };
    const onUp = () => setIsResizing(false);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const palette = getPalette();
  const borderColor = palette?.accentColors.border || 'rgba(245, 158, 11, 0.3)';
  const primaryColor = palette?.accentColors.primary || '#F59E0B';
  const primaryDark = palette?.accentColors.primaryDark || '#D97706';
  const primaryLight = palette?.accentColors.primaryLight || '#FEF3C7';

  // Get root containers (topics)
  const rootContainers = useMemo(() => {
    return containers
      .filter((c) => c.parentId === null)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [containers]);

  // Get child containers recursively
  const getChildContainers = (parentId: string): Container[] => {
    return containers
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  };

  // Get entries and items for selected container
  const { entries, ungroupedItems } = useMemo(() => {
    if (!selectedContainerId) return { entries: [], ungroupedItems: [] };
    
    const allItems = tasks.filter((t) => t.containerId === selectedContainerId);
    const entriesList = allItems
      .filter((t) => t.type === 'entry')
      .sort((a, b) => b.priority - a.priority);
    
    const itemsByEntry = new Map<string, Task[]>();
    entriesList.forEach((entry) => {
      const entryItems = allItems.filter(
        (t) => t.entryId === entry.id && t.type !== 'entry'
      );
      itemsByEntry.set(entry.id, entryItems);
    });
    
    const ungrouped = allItems.filter(
      (t) => !t.entryId && t.type !== 'entry'
    ).sort((a, b) => b.priority - a.priority);
    
    return { entries: entriesList, ungroupedItems: ungrouped, itemsByEntry };
  }, [tasks, selectedContainerId]);
  
  const itemsByEntry = useMemo(() => {
    if (!selectedContainerId) return new Map<string, Task[]>();
    const allItems = tasks.filter((t) => t.containerId === selectedContainerId);
    const map = new Map<string, Task[]>();
    entries.forEach((entry) => {
      const entryItems = allItems.filter(
        (t) => t.entryId === entry.id && t.type !== 'entry'
      );
      map.set(entry.id, entryItems);
    });
    return map;
  }, [tasks, selectedContainerId, entries]);

  // Auto-select first container if none selected
  React.useEffect(() => {
    if (!selectedContainerId && rootContainers.length > 0) {
      setSelectedContainerId(rootContainers[0].id);
    }
  }, [selectedContainerId, rootContainers]);

  const selectedContainer = containers.find((c) => c.id === selectedContainerId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    // Check if dragging a container (topic)
    const activeContainer = containers.find((c) => c.id === activeIdStr);
    if (activeContainer) {
      // Check if dropping on another container
      const targetContainer = containers.find((c) => c.id === overIdStr);
      if (targetContainer && activeContainer.parentId === null && targetContainer.parentId === null) {
        // Only reorder root containers (topics)
        reorderContainers(activeIdStr, overIdStr);
      }
      return;
    }

    // If not dragging a container, check for tasks
    if (!selectedContainerId) return;

    // Find the active task
    const activeTask = tasks.find((t) => t.id === activeIdStr);
    if (!activeTask) return;

    // Check if dropping on an entry droppable area
    if (overIdStr.startsWith('entry-')) {
      const entryId = overIdStr.replace('entry-', '');
      if (activeTask.type !== 'entry' && activeTask.entryId !== entryId) {
        const entryItems = itemsByEntry.get(entryId) || [];
        const minPriority = entryItems.length > 0 ? Math.min(...entryItems.map((t) => t.priority)) : 0;
        updateTask(activeTask.id, { entryId, priority: minPriority - 1 });
      }
      return;
    }

    // Check if dropping on a container (from sidebar)
    const targetContainer = containers.find((c) => c.id === overIdStr);
    if (targetContainer) {
      if (activeTask.containerId !== targetContainer.id) {
        moveTaskToContainer(activeTask.id, targetContainer.id);
        if (selectedContainerId === activeTask.containerId) {
          setSelectedContainerId(targetContainer.id);
        }
      }
      return;
    }

    // Check if dropping on another task/entry
    const targetTask = tasks.find((t) => t.id === overIdStr);
    if (targetTask) {
      // If dragging an entry — reorder within the same container
      if (activeTask.type === 'entry') {
        if (targetTask.type === 'entry' && activeTask.containerId === targetTask.containerId) {
          reorderTasksInContainer(activeTask.containerId, activeIdStr, overIdStr);
        }
        return;
      }

      // If dropping a task/item on an entry
      if (targetTask.type === 'entry' && activeTask.containerId === targetTask.containerId) {
        const entryItems = itemsByEntry.get(targetTask.id) || [];
        const minPriority = entryItems.length > 0 ? Math.min(...entryItems.map((t) => t.priority)) : 0;
        updateTask(activeTask.id, { entryId: targetTask.id, priority: minPriority - 1 });
        return;
      }

      // Reordering within the same container
      if (activeTask.containerId === targetTask.containerId && selectedContainerId === activeTask.containerId) {
        reorderTasksInContainer(activeTask.containerId, activeIdStr, overIdStr);
      } else if (activeTask.containerId !== targetTask.containerId) {
        moveTaskToContainer(activeTask.id, targetTask.containerId);
        if (selectedContainerId === activeTask.containerId) {
          setSelectedContainerId(targetTask.containerId);
        }
      }
    }
  };

  const formatEntryTitleDefault = (date: Date) =>
    date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

  const handleCreateEntry = () => {
    if (!selectedContainerId) return;
    const maxOrder = entries.length > 0 ? Math.max(...entries.map((e) => e.entryOrder ?? 0)) : -1;
    addTask(formatEntryTitleDefault(new Date()), selectedContainerId, undefined, 'entry');
    setTimeout(() => {
      const allTasks = tasks.filter((t) => t.containerId === selectedContainerId && t.type === 'entry');
      const newEntry = allTasks.find((t) => !t.entryOrder && t.entryOrder !== 0);
      if (newEntry) {
        updateTask(newEntry.id, { entryOrder: maxOrder + 1 });
      }
    }, 10);
  };

  // Effect to automatically create text blocks for newly created entries
  useEffect(() => {
    // Find all entries that don't have an entryOrder set (newly created) and haven't been processed
    const allEntries = tasks.filter((t) => t.type === 'entry' && (t.entryOrder === undefined || t.entryOrder === null));
    
    allEntries.forEach((entry) => {
      // Skip if we've already processed this entry
      if (processedEntriesRef.current.has(entry.id)) return;
      
      // Mark as processed immediately to avoid duplicate processing
      processedEntriesRef.current.add(entry.id);
      
      const containerId = entry.containerId;
      const containerTasks = tasks.filter((t) => t.containerId === containerId && t.type === 'entry');
      const maxOrder = containerTasks.filter((t) => t.entryOrder !== undefined && t.entryOrder !== null).length > 0 
        ? Math.max(...containerTasks.filter((t) => t.entryOrder !== undefined && t.entryOrder !== null).map((e) => e.entryOrder ?? 0)) 
        : -1;
      
      // Set the entry order
      updateTask(entry.id, { entryOrder: maxOrder + 1 });
      
      // Store the entry ID for this container so we can associate the text block later
      pendingEntryIdsRef.current.set(containerId, entry.id);
      
      // Create text block
      addTask('', containerId, undefined, 'text-block', '');
    });
  }, [tasks, addTask, updateTask]);

  // Effect to associate newly created text blocks with pending entries
  useEffect(() => {
    // Find all text blocks without an entryId
    const textBlocksWithoutEntry = tasks.filter((t) => t.type === 'text-block' && !t.entryId);
    
    textBlocksWithoutEntry.forEach((textBlock) => {
      const containerId = textBlock.containerId;
      const entryId = pendingEntryIdsRef.current.get(containerId);
      
      if (entryId) {
        // Associate the text block with the entry
        updateTask(textBlock.id, { entryId: entryId, entryOrder: 0 });
        // Remove from pending map
        pendingEntryIdsRef.current.delete(containerId);
      }
    });
  }, [tasks, updateTask]);

  const createEntryForContainer = (containerId: string) => {
    // Create the entry - the useEffect will automatically create the text block
    addTask(formatEntryTitleDefault(new Date()), containerId, undefined, 'entry');
  };

  const activeItem = useMemo(() => {
    if (!activeId) return null;
    // Check if dragging a container (topic)
    const activeContainer = containers.find((c) => c.id === activeId);
    if (activeContainer) return { _type: 'container' as const, ...activeContainer };
    // Otherwise it's a task
    const activeTask = tasks.find((t) => t.id === activeId);
    return activeTask || null;
  }, [activeId, tasks, containers]);

  // Create Topic Form Component (matches ContainerItem editing state exactly)
  const CreateTopicForm: React.FC<{ insertAfterId?: string | null; onCreated: (containerId?: string) => void; onCancel: () => void }> = ({ insertAfterId, onCreated, onCancel }) => {
    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const previewColor = useMemo(() => {
      const rootContainers = containers.filter(c => c.parentId === null);
      const colors = ['#F59E0B', '#F97316', '#EA580C', '#DC2626', '#B91C1C', '#C2410C'];
      return colors[rootContainers.length % colors.length];
    }, [containers]);
    const containerDarkColor = useMemo(() => {
      return getContainerDarkColor(previewColor);
    }, [previewColor]);

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (name.trim()) {
          const containerId = addContainer(name.trim(), null, insertAfterId);
          setName('');
          onCreated(containerId);
        }
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };

    const handleBlur = () => {
      if (name.trim()) {
        const containerId = addContainer(name.trim(), null, insertAfterId);
        setName('');
        onCreated(containerId);
      } else {
        onCancel();
      }
    };

    return (
      <div className="group">
        <div
          className="group/item w-full text-left py-1.5 rounded-md transition-all flex items-center bg-white shadow-sm font-medium"
          style={{
            paddingLeft: '4px',
            paddingRight: '8px',
            borderLeft: `3px solid ${previewColor}`,
          }}
        >
          {/* Drag handle space (matches ContainerItem - invisible drag handle that appears on hover) */}
          <div
            className="p-0.5 touch-none opacity-0 flex-shrink-0 mr-1"
            style={{ width: '18px', height: '18px' }}
            aria-hidden="true"
          />
          {/* Spacer for root containers without children */}
          <div className="w-0 flex-shrink-0" />
          <Zap size={16} style={{ color: previewColor }} className="flex-shrink-0 mr-2" />
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Topic name..."
            className="flex-1 px-1 py-0.5 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-0"
            style={{ 
              color: containerDarkColor,
              fontWeight: 600
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    );
  };

  const ContainerItem: React.FC<{ container: Container; depth: number }> = ({ container, depth }) => {
    const childContainers = getChildContainers(container.id);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(container.name);
    const inputRef = useRef<HTMLInputElement>(null);
    const isSelected = selectedContainerId === container.id;
    const isRootContainer = depth === 0;
    
    // Make root containers sortable
    const {
      attributes,
      listeners,
      setNodeRef: setSortableRef,
      transform,
      transition,
      isDragging: isContainerDragging,
    } = useSortable({ 
      id: container.id,
      disabled: !isRootContainer, // Only root containers are sortable
    });
    
    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
      id: container.id,
    });

    // Combine refs for both sortable and droppable
    const setNodeRef = (node: HTMLElement | null) => {
      if (isRootContainer) {
        setSortableRef(node);
      }
      setDroppableRef(node);
    };

    const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;
    const activeContainer = activeId ? containers.find((c) => c.id === activeId) : null;
    const isDraggingOver = isOver && activeId && activeTask && activeTask.containerId !== container.id;
    const isDraggingContainer = activeContainer && activeContainer.id === container.id;
    const containerLightColor = getContainerLightColor(container.color);
    const containerDarkColor = getContainerDarkColor(container.color);
    
    const sortableStyle = {
      transform: CSS.Transform.toString(transform),
      transition: isContainerDragging ? 'none' : transition,
      opacity: isContainerDragging ? 0.5 : 1,
    };

    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
        // Place cursor at the end of the text
        const length = inputRef.current.value.length;
        inputRef.current.setSelectionRange(length, length);
      }
    }, [isEditing]);

    useEffect(() => {
      setName(container.name);
    }, [container.name]);

    const handleSave = () => {
      if (name.trim() && name.trim() !== container.name) {
        updateContainer(container.id, { name: name.trim() });
      } else {
        setName(container.name);
      }
      setIsEditing(false);
    };

    const handleCancel = () => {
      setName(container.name);
      setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isSelected) {
        // If deleting the selected topic, select another one or deselect
        const remainingContainers = rootContainers.filter(c => c.id !== container.id);
        if (remainingContainers.length > 0) {
          setSelectedContainerId(remainingContainers[0].id);
        } else {
          setSelectedContainerId(null);
        }
      }
      deleteContainer(container.id);
    };

    return (
      <div className="group">
        <div
          ref={setNodeRef}
          className={`group/item w-full text-left py-1.5 rounded-md transition-all flex items-center ${
            isSelected
              ? 'bg-white shadow-sm font-medium'
              : isDraggingOver
              ? 'bg-white shadow-md'
              : 'hover:bg-white/60'
          }`}
          style={{
            paddingLeft: isRootContainer ? '4px' : `${4 + depth * 16}px`,
            paddingRight: '8px',
            borderLeft: isSelected || isDraggingOver ? `3px solid ${container.color}` : '3px solid transparent',
            backgroundColor: isDraggingOver ? containerLightColor : undefined,
            ...(isRootContainer ? sortableStyle : {}),
          }}
        >
          {isRootContainer && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-0.5 touch-none opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mr-1"
              style={{
                color: containerDarkColor,
              }}
              onClick={(e) => e.stopPropagation()}
              aria-label="Drag to reorder topic"
            >
              <GripVertical size={14} />
            </div>
          )}
          {!isRootContainer && childContainers.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-0.5 hover:bg-gray-100 rounded flex-shrink-0 mr-1"
            >
              <ChevronRight
                size={14}
                className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            </button>
          )}
          {!isRootContainer && childContainers.length === 0 && <div className="w-[18px] flex-shrink-0" />}
          {isRootContainer && childContainers.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-0.5 hover:bg-gray-100 rounded flex-shrink-0 mr-1"
            >
              <ChevronRight
                size={14}
                className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            </button>
          )}
          {isRootContainer && childContainers.length === 0 && <div className="w-0 flex-shrink-0" />}
          <Zap size={16} style={{ color: container.color }} className="flex-shrink-0 mr-2" />
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="flex-1 px-1 py-0.5 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-0"
              style={{ 
                color: containerDarkColor,
                fontWeight: isSelected ? 600 : 400
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedContainerId(container.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="flex-1 min-w-0 text-left"
              title="Double-click to rename"
            >
              <span
                className={`truncate ${
                  isSelected || isDraggingOver ? 'font-medium text-gray-900' : 'text-gray-700'
                }`}
              >
                {container.name}
              </span>
              {isDraggingOver && (
                <span className="text-xs font-medium ml-auto" style={{ color: containerDarkColor }}>
                  Drop here
                </span>
              )}
            </button>
          )}
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all ml-auto flex-shrink-0"
            aria-label="Delete topic"
            title="Delete topic"
          >
            <Trash2 size={14} />
          </button>
        </div>
        {isExpanded && childContainers.length > 0 && (
          <div className="ml-2">
            {childContainers.map((child) => (
              <ContainerItem key={child.id} container={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full relative">
        {/* Left Sidebar - Topics */}
        <div
          className="relative h-full border-r bg-white/80 backdrop-blur-sm flex-shrink-0 overflow-y-auto"
          style={{
            borderColor,
            width: sidebarCollapsed ? 48 : sidebarWidth,
            transition: isResizing ? 'none' : 'width 0.2s ease-out',
          }}
        >
          {!sidebarCollapsed ? (
            <div className="p-4 flex flex-col h-full">
              <div className="flex items-center justify-between mb-3 px-1 pb-2 shrink-0 border-b border-gray-200/80">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Topics
                </h2>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => {
                      // Set insertAfterId to the last topic's ID, or null if no topics exist
                      const lastTopic = rootContainers.length > 0 ? rootContainers[rootContainers.length - 1] : null;
                      setInsertAfterId(lastTopic?.id || null);
                      setIsCreatingContainer(true);
                    }}
                    className={`p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-all ${
                      isCreatingContainer ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title="Add topic"
                    disabled={isCreatingContainer}
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-all"
                    title="Collapse sidebar"
                  >
                    <ChevronLeft size={16} />
                  </button>
                </div>
              </div>
            <div className="flex-1 min-h-0 overflow-y-auto -mx-4 px-4">
            {rootContainers.length === 0 && !isCreatingContainer ? (
              <div className="text-sm text-gray-500 py-4 px-2">
                No topics yet. Click the + button to create one.
              </div>
            ) : (
              <SortableContext
                items={rootContainers.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {rootContainers.map((container) => (
                    <React.Fragment key={container.id}>
                      <ContainerItem container={container} depth={0} />
                      {isCreatingContainer && insertAfterId === container.id && (
                        <CreateTopicForm
                          insertAfterId={insertAfterId}
                          onCreated={(containerId) => {
                            setIsCreatingContainer(false);
                            setInsertAfterId(null);
                            if (containerId) {
                              setSelectedContainerId(containerId);
                              // Automatically create an entry for the new topic
                              createEntryForContainer(containerId);
                            }
                          }}
                          onCancel={() => {
                            setIsCreatingContainer(false);
                            setInsertAfterId(null);
                          }}
                        />
                      )}
                    </React.Fragment>
                  ))}
                  {isCreatingContainer && (insertAfterId === null || rootContainers.length === 0) && (
                    <CreateTopicForm
                      insertAfterId={insertAfterId}
                      onCreated={(containerId) => {
                        setIsCreatingContainer(false);
                        setInsertAfterId(null);
                        if (containerId) {
                          setSelectedContainerId(containerId);
                          // Automatically create an entry for the new topic
                          createEntryForContainer(containerId);
                        }
                      }}
                      onCancel={() => {
                        setIsCreatingContainer(false);
                        setInsertAfterId(null);
                      }}
                    />
                  )}
                </div>
              </SortableContext>
            )}
            </div>
            </div>
          ) : (
            <div className="p-2 flex flex-col items-center gap-2 pt-2">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-all mb-1"
                title="Expand sidebar"
              >
                <ChevronRight size={18} />
              </button>
              {rootContainers.map((container) => {
                const isSelected = selectedContainerId === container.id;
                return (
                  <button
                    key={container.id}
                    onClick={() => setSelectedContainerId(container.id)}
                    className={`p-2 rounded transition-all ${
                      isSelected ? 'bg-white shadow-sm' : 'hover:bg-white/60'
                    }`}
                    style={{
                      borderLeft: isSelected ? `3px solid ${container.color}` : '3px solid transparent',
                    }}
                    title={container.name}
                  >
                    <Zap size={18} style={{ color: container.color }} />
                  </button>
                );
              })}
              <button
                onClick={() => {
                  // Expand the sidebar first
                  setSidebarCollapsed(false);
                  // Set insertAfterId to the last topic's ID, or null if no topics exist
                  const lastTopic = rootContainers.length > 0 ? rootContainers[rootContainers.length - 1] : null;
                  setInsertAfterId(lastTopic?.id || null);
                  setIsCreatingContainer(true);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-all mt-2"
                title="Add topic"
              >
                <Plus size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Draggable divider - only when sidebar is expanded */}
        {!sidebarCollapsed && (
          <div
            role="separator"
            aria-label="Resize sidebar"
            title="Drag to resize"
            className={`group flex-shrink-0 h-full cursor-col-resize flex justify-center items-center select-none touch-none relative transition-colors duration-150 ${
              isResizing ? 'bg-gray-100/60' : 'hover:bg-gray-100/50'
            }`}
            style={{
              width: 10,
              minWidth: 10,
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              resizeStartX.current = e.clientX;
              resizeStartWidth.current = sidebarWidth;
              setIsResizing(true);
            }}
          >
            {/* Vertical track - visible on hover or while dragging */}
            <div
              className={`absolute inset-y-0 left-1/2 -translate-x-1/2 rounded-full transition-opacity duration-150 ${
                isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
              style={{
                width: 3,
                backgroundColor: isResizing ? primaryColor : 'rgba(156, 163, 175, 0.5)',
                pointerEvents: 'none',
              }}
            />
            {/* Grip dots - visible on hover or while dragging */}
            <div
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 rounded-full p-0.5 transition-opacity duration-150 ${
                isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
              style={{ pointerEvents: 'none' }}
              aria-hidden
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full shrink-0"
                  style={{
                    backgroundColor: isResizing ? primaryColor : 'rgba(107, 114, 128, 0.7)',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Right Content Area - fixed middle block */}
        <div
          className={`flex-1 min-w-0 overflow-y-auto backdrop-blur-sm transition-shadow duration-200 ${
            isResizing ? 'bg-white/50' : 'bg-white/40'
          }`}
          style={{
            minWidth: 320,
            boxShadow: isResizing ? 'inset 2px 0 8px -4px rgba(0,0,0,0.06)' : undefined,
          }}
        >
          {selectedContainer ? (
            <div className="p-4 sm:p-6">
              {entries.length === 0 && ungroupedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 px-6">
                  <div className="flex flex-col items-center max-w-sm text-center rounded-xl p-10 bg-white border border-gray-200/80 shadow-sm hover:border-gray-300/80 hover:shadow transition-all">
                    <div
                      className="flex items-center justify-center w-12 h-12 rounded-full mb-4"
                      style={{ backgroundColor: primaryLight }}
                    >
                      <Plus size={24} style={{ color: primaryColor }} strokeWidth={2} />
                    </div>
                    <h3 className="text-base font-semibold text-gray-800 mb-1.5">
                      No entries yet
                    </h3>
                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                      Add your first entry to start planning. You can add tasks and text, and reorder anytime.
                    </p>
                    <button
                      onClick={handleCreateEntry}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg shadow-sm hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        backgroundColor: primaryColor,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = primaryDark;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = primaryColor;
                      }}
                    >
                      <Plus size={16} strokeWidth={2.5} />
                      Create entry
                    </button>
                  </div>
                </div>
              ) : (
                <SortableContext
                  items={entries.map((e) => e.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {entries.map((entry, index) => {
                      const entryItems = itemsByEntry.get(entry.id) || [];

                      return (
                        <React.Fragment key={entry.id}>
                          {index > 0 && (
                            <div
                              className="relative min-h-[12px] flex items-center group cursor-pointer -my-0.5"
                              onClick={handleCreateEntry}
                            >
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <div className="h-px bg-gray-300 w-full" />
                                <div className="absolute bg-gray-400 rounded-full p-1.5 shadow-md group-hover:bg-gray-500 transition-colors">
                                  <Plus size={12} className="text-white" />
                                </div>
                              </div>
                            </div>
                          )}
                          <EntryNode
                            entry={entry}
                            items={entryItems}
                            depth={0}
                            activeDragId={activeId}
                            containerId={selectedContainer.id}
                          />
                        </React.Fragment>
                      );
                    })}
                    {/* Add entry button at the end */}
                    <div
                      className="relative min-h-[12px] flex items-center group cursor-pointer -my-0.5"
                      onClick={handleCreateEntry}
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="h-px bg-gray-300 w-full" />
                        <div className="absolute bg-gray-400 rounded-full p-1.5 shadow-md group-hover:bg-gray-500 transition-colors">
                          <Plus size={12} className="text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </SortableContext>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
              <p className="text-gray-600 mb-2 text-lg">Select a topic to view its contents</p>
              <p className="text-sm text-gray-500">
                {rootContainers.length === 0
                  ? 'Switch to Create mode to add topics'
                  : 'Choose a topic from the sidebar'}
              </p>
              </div>
            </div>
          )}
        </div>
      </div>
      <DragOverlay>
        {activeItem ? (
          <div className="opacity-90">
            {'_type' in activeItem && activeItem._type === 'container' ? (
              <div className="bg-white rounded-md border-2 border-gray-200 shadow-lg px-2 py-1.5 flex items-center gap-2">
                <Zap size={16} style={{ color: activeItem.color }} className="flex-shrink-0" />
                <span className="text-gray-700 font-medium">{activeItem.name}</span>
              </div>
            ) : activeItem.type === 'entry' ? (
              <div className="bg-white rounded-lg border-2 border-gray-200 shadow-lg p-4">
                <div className="flex items-center gap-2">
                  <Zap size={18} style={{ color: '#6B7280' }} />
                  <span className="text-gray-700 font-medium">Topic</span>
                </div>
              </div>
            ) : activeItem.type === 'note' ? (
              <NoteNode task={activeItem} depth={0} />
            ) : activeItem.type === 'text-block' ? (
              <TextBlockNode task={activeItem} depth={0} />
            ) : (
              <TaskNode task={activeItem} depth={0} />
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
