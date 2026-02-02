import React, { useState } from 'react';
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
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Container } from '../../types';
import {
  getContainerLightColor,
  getContainerHoverColor,
  getContainerDarkColor,
  getContainerColorWithOpacity,
} from '../../utils/colorUtils';

interface ContainerFilterProps {
  containers: Container[];
  selectedContainers: Set<string> | null; // null means all selected
  onToggleContainer: (containerId: string, event?: React.MouseEvent) => void;
  onSelectAll: () => void;
  onReorderContainers: (activeId: string, overId: string | null) => void;
}

export const ContainerFilter: React.FC<ContainerFilterProps> = ({
  containers,
  selectedContainers,
  onToggleContainer,
  onSelectAll,
  onReorderContainers,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const rootContainers = containers
    .filter((c) => c.parentId === null)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  
  // Use first container color or default neutral color for "All" button
  const defaultContainerColor = rootContainers.length > 0 ? rootContainers[0].color : '#6B7280';
  const defaultLightColor = getContainerLightColor(defaultContainerColor);
  const defaultDarkColor = getContainerDarkColor(defaultContainerColor);
  const defaultBorderColor = getContainerColorWithOpacity(defaultContainerColor, 0.3);

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

    if (over && active.id !== over.id) {
      onReorderContainers(active.id as string, over.id as string);
    }
  };

  const activeContainer = rootContainers.find((c) => c.id === activeId);

  return (
    <div className="mb-4 group">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <button
            onClick={onSelectAll}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              selectedContainers === null
                ? 'text-white shadow-md'
                : 'border'
            }`}
            style={{
              backgroundColor: selectedContainers === null ? defaultContainerColor : defaultLightColor,
              color: selectedContainers === null ? 'white' : defaultDarkColor,
              borderColor: selectedContainers === null ? undefined : defaultBorderColor,
            }}
            onMouseEnter={(e) => {
              if (selectedContainers !== null) {
                e.currentTarget.style.backgroundColor = getContainerHoverColor(defaultContainerColor);
              }
            }}
            onMouseLeave={(e) => {
              if (selectedContainers !== null) {
                e.currentTarget.style.backgroundColor = defaultLightColor;
              }
            }}
          >
            All
          </button>
          <SortableContext
            items={rootContainers.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            {rootContainers.map((container) => (
              <SortableContainerFilterItem
                key={container.id}
                container={container}
                containers={containers}
                selectedContainers={selectedContainers}
                onToggleContainer={onToggleContainer}
                depth={0}
              />
            ))}
          </SortableContext>
        </div>
        <DragOverlay>
          {activeContainer ? (
            <div
              className={`px-3 py-1.5 text-sm rounded-md font-medium flex items-center gap-2 shadow-lg border-2 ${
                selectedContainers === null || selectedContainers.has(activeContainer.id)
                  ? 'text-white'
                  : 'bg-white'
              }`}
              style={{
                backgroundColor:
                  selectedContainers === null || selectedContainers.has(activeContainer.id)
                    ? activeContainer.color
                    : undefined,
                color: selectedContainers === null || selectedContainers.has(activeContainer.id) 
                  ? 'white' 
                  : getContainerDarkColor(activeContainer.color),
                borderColor: activeContainer.color,
                transform: 'rotate(2deg)',
              }}
            >
              <GripVertical size={14} className="opacity-70" />
              {activeContainer.name}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <p className="text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5" style={{ color: defaultDarkColor }}>
        <span>Click to select •</span>
        <kbd className="px-1.5 py-0.5 rounded text-xs font-mono border" style={{ backgroundColor: defaultLightColor, borderColor: defaultBorderColor }}>Ctrl</kbd>/<kbd className="px-1.5 py-0.5 rounded text-xs font-mono border" style={{ backgroundColor: defaultLightColor, borderColor: defaultBorderColor }}>Cmd</kbd>
        <span>+Click for multiple •</span>
        <span className="flex items-center gap-1">
          <GripVertical size={12} style={{ color: defaultContainerColor }} />
          <span>Drag to reorder</span>
        </span>
      </p>
    </div>
  );
};

interface SortableContainerFilterItemProps {
  container: Container;
  containers: Container[];
  selectedContainers: Set<string> | null;
  onToggleContainer: (containerId: string, event?: React.MouseEvent) => void;
  depth: number;
}

const SortableContainerFilterItem: React.FC<SortableContainerFilterItemProps> = ({
  container,
  containers,
  selectedContainers,
  onToggleContainer,
  depth,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: container.id });

  const isSelected = selectedContainers === null || selectedContainers.has(container.id);
  const childContainers = containers.filter((c) => c.parentId === container.id);
  
  // Derive colors from container color
  const containerLightColor = getContainerLightColor(container.color);
  const containerHoverColor = getContainerHoverColor(container.color);
  const containerDarkColor = getContainerDarkColor(container.color);
  const containerBorderColor = getContainerColorWithOpacity(container.color, 0.3);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.4 : 1,
    marginLeft: depth > 0 ? `${depth * 8}px` : '0',
  };

  return (
    <>
      <div ref={setNodeRef} style={style} className="flex items-center gap-1.5 group/item">
        <div
          {...attributes}
          {...listeners}
          className={`cursor-grab active:cursor-grabbing p-1.5 rounded-md touch-none transition-all ${
            isDragging
              ? 'opacity-100'
              : 'opacity-0 group-hover/item:opacity-100'
          }`}
          style={{
            backgroundColor: isDragging ? containerLightColor : undefined,
            color: isDragging ? container.color : container.color,
          }}
          onMouseEnter={(e) => {
            if (!isDragging) {
              e.currentTarget.style.color = containerDarkColor;
              e.currentTarget.style.backgroundColor = containerLightColor;
            }
          }}
          onMouseLeave={(e) => {
            if (!isDragging) {
              e.currentTarget.style.color = container.color;
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
          aria-label="Drag to reorder"
          title="Drag to reorder"
        >
          <GripVertical size={16} strokeWidth={2} />
        </div>
        <button
          onClick={(e) => onToggleContainer(container.id, e)}
          className={`px-3 py-1.5 text-sm rounded-md font-medium transition-all ${
            isDragging
              ? 'ring-2 ring-offset-1'
              : ''
          } ${
            isSelected
              ? 'text-white shadow-sm'
              : 'border'
          }`}
          style={{
            backgroundColor: isSelected ? container.color : containerLightColor,
            color: isSelected ? 'white' : containerDarkColor,
            borderColor: isDragging ? container.color : containerBorderColor,
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = containerHoverColor;
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = containerLightColor;
            }
          }}
          title={isSelected ? 'Click to deselect, Ctrl+Click to keep selected' : 'Click to select only this, Ctrl+Click to add to selection'}
        >
          {container.name}
        </button>
      </div>
      {childContainers.map((child) => (
        <ContainerFilterItem
          key={child.id}
          container={child}
          containers={containers}
          selectedContainers={selectedContainers}
          onToggleContainer={onToggleContainer}
          depth={depth + 1}
        />
      ))}
    </>
  );
};

interface ContainerFilterItemProps {
  container: Container;
  containers: Container[];
  selectedContainers: Set<string> | null;
  onToggleContainer: (containerId: string, event?: React.MouseEvent) => void;
  depth: number;
}

const ContainerFilterItem: React.FC<ContainerFilterItemProps> = ({
  container,
  containers,
  selectedContainers,
  onToggleContainer,
  depth,
}) => {
  const isSelected = selectedContainers === null || selectedContainers.has(container.id);
  const childContainers = containers.filter((c) => c.parentId === container.id);
  
  // Derive colors from container color
  const containerDarkColor = getContainerDarkColor(container.color);

  return (
    <>
      <button
        onClick={(e) => onToggleContainer(container.id, e)}
        className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors flex items-center gap-2 ${
          isSelected
            ? 'text-white'
            : ''
        }`}
        style={{
          backgroundColor: isSelected ? container.color : undefined,
          color: isSelected ? 'white' : containerDarkColor,
          marginLeft: depth > 0 ? `${depth * 8}px` : '0',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
        title={isSelected ? 'Click to deselect, Ctrl+Click to keep selected' : 'Click to select only this, Ctrl+Click to add to selection'}
      >
        {container.name}
      </button>
      {childContainers.map((child) => (
        <ContainerFilterItem
          key={child.id}
          container={child}
          containers={containers}
          selectedContainers={selectedContainers}
          onToggleContainer={onToggleContainer}
          depth={depth + 1}
        />
      ))}
    </>
  );
};
