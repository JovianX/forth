import React from 'react';
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
  searchQuery?: string; // For highlighting search matches
}

export const ContainerFilter: React.FC<ContainerFilterProps> = ({
  containers,
  selectedContainers,
  onToggleContainer,
  onSelectAll,
  searchQuery = '',
}) => {
  const rootContainers = containers
    .filter((c) => c.parentId === null)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  
  // Use first container color or default neutral color for "All" button
  const defaultContainerColor = rootContainers.length > 0 ? rootContainers[0].color : '#6B7280';
  const defaultLightColor = getContainerLightColor(defaultContainerColor);
  const defaultDarkColor = getContainerDarkColor(defaultContainerColor);
  const defaultBorderColor = getContainerColorWithOpacity(defaultContainerColor, 0.3);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectAll();
          }}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
            selectedContainers === null
              ? 'text-white shadow-sm hover:shadow-md ring-2 ring-offset-1'
              : 'border hover:shadow-sm bg-white'
          }`}
          style={{
            backgroundColor: selectedContainers === null ? defaultContainerColor : 'white',
            color: selectedContainers === null ? 'white' : defaultDarkColor,
            borderColor: selectedContainers === null ? defaultContainerColor : defaultBorderColor,
            ringColor: selectedContainers === null ? defaultContainerColor : undefined,
          }}
          onMouseEnter={(e) => {
            if (selectedContainers !== null) {
              e.currentTarget.style.backgroundColor = getContainerHoverColor(defaultContainerColor);
              e.currentTarget.style.borderColor = defaultContainerColor;
            }
          }}
          onMouseLeave={(e) => {
            if (selectedContainers !== null) {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = defaultBorderColor;
            }
          }}
          title={selectedContainers === null ? 'All containers selected • Click to filter' : 'Select all containers'}
        >
          All
        </button>
        {rootContainers.map((container) => (
          <ContainerFilterItem
            key={container.id}
            container={container}
            containers={containers}
            selectedContainers={selectedContainers}
            onToggleContainer={onToggleContainer}
            depth={0}
            searchQuery={searchQuery}
          />
        ))}
      </div>
    </div>
  );
};

interface ContainerFilterItemProps {
  container: Container;
  containers: Container[];
  selectedContainers: Set<string> | null;
  onToggleContainer: (containerId: string, event?: React.MouseEvent) => void;
  depth: number;
  searchQuery?: string;
}

const ContainerFilterItem: React.FC<ContainerFilterItemProps> = ({
  container,
  containers,
  selectedContainers,
  onToggleContainer,
  depth,
  searchQuery = '',
}) => {
  // Fix: "All" selected means no individual containers should appear selected
  const isSelected = selectedContainers !== null && selectedContainers.has(container.id);
  const childContainers = containers
    .filter((c) => c.parentId === container.id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  
  // Highlight search matches
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 rounded px-0.5">{part}</mark>
      ) : (
        part
      )
    );
  };
  
  // Derive colors from container color
  const containerLightColor = getContainerLightColor(container.color);
  const containerHoverColor = getContainerHoverColor(container.color);
  const containerDarkColor = getContainerDarkColor(container.color);
  const containerBorderColor = getContainerColorWithOpacity(container.color, 0.3);

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleContainer(container.id, e);
        }}
        className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
          isSelected
            ? 'text-white shadow-sm hover:shadow-md ring-2 ring-offset-1'
            : 'border hover:shadow-sm bg-white'
        }`}
        style={{
          backgroundColor: isSelected ? container.color : 'white',
          color: isSelected ? 'white' : containerDarkColor,
          borderColor: isSelected ? container.color : containerBorderColor,
          ringColor: isSelected ? container.color : undefined,
          marginLeft: depth > 0 ? '0' : '0',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = containerHoverColor;
            e.currentTarget.style.borderColor = container.color;
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.borderColor = containerBorderColor;
          }
        }}
        title={isSelected ? 'Click to deselect • Ctrl/Cmd+Click to keep selected' : 'Click to select only this • Ctrl/Cmd+Click to add to selection'}
      >
        {highlightMatch(container.name, searchQuery)}
      </button>
      {childContainers.length > 0 && (
        <div className="ml-4 mt-1 pl-2 border-l-2" style={{ borderColor: getContainerColorWithOpacity(container.color, 0.2) }}>
          {childContainers.map((child) => (
            <ContainerFilterItem
              key={child.id}
              container={child}
              containers={containers}
              selectedContainers={selectedContainers}
              onToggleContainer={onToggleContainer}
              depth={depth + 1}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </>
  );
};
