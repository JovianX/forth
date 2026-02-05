import React, { useState, useRef, useEffect } from 'react';
import { Filter, X, Search, CheckSquare, Square } from 'lucide-react';
import { ContainerFilter } from './ContainerFilter';
import { Container } from '../../types';
import { getPalette } from '../../utils/paletteUtils';
import {
  getContainerLightColor,
  getContainerColorWithOpacity,
} from '../../utils/colorUtils';

interface FilterMenuProps {
  containers: Container[];
  selectedContainers: Set<string> | null;
  showCompleted: boolean;
  onToggleContainer: (containerId: string, event?: React.MouseEvent) => void;
  onSelectAll: () => void;
  onShowCompletedChange: (show: boolean) => void;
}

export const FilterMenu: React.FC<FilterMenuProps> = ({
  containers,
  selectedContainers,
  showCompleted,
  onToggleContainer,
  onSelectAll,
  onShowCompletedChange,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        setSearchQuery('');
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showMenu) {
        setShowMenu(false);
        setSearchQuery('');
      }
      // Focus search when menu opens and '/' is pressed
      if (event.key === '/' && showMenu && !searchInputRef.current?.matches(':focus')) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMenu]);

  // Focus search input when menu opens
  useEffect(() => {
    if (showMenu && searchInputRef.current) {
      // Small delay to ensure menu is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [showMenu]);

  // Get palette colors for styling
  const palette = getPalette();
  const primaryColor = palette?.accentColors.primary || '#F59E0B';
  const primaryDark = palette?.accentColors.primaryDark || '#D97706';
  const primaryLight = palette?.accentColors.primaryLight || '#FEF3C7';
  const borderColor = palette?.accentColors.border || 'rgba(245, 158, 11, 0.3)';

  // Count selected containers for badge
  const totalRootContainers = containers.filter(c => c.parentId === null).length;
  const selectedCount = selectedContainers === null 
    ? totalRootContainers 
    : selectedContainers.size;
  // Show badge only when filters are active (not all containers selected)
  const hasActiveFilters = selectedContainers !== null && selectedContainers.size > 0 && selectedContainers.size < totalRootContainers;
  const hasCompletedFilter = !showCompleted;

  // Get selected container names for chips
  const selectedContainerNames = selectedContainers === null
    ? []
    : Array.from(selectedContainers)
        .map(id => containers.find(c => c.id === id))
        .filter((c): c is Container => c !== undefined)
        .map(c => ({ id: c.id, name: c.name, color: c.color }));

  // Filter containers by search query
  const filteredContainers = containers.filter(c => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(query);
  });

  const handleClearAll = () => {
    onSelectAll(); // This sets selectedContainers to null (all selected)
    setSearchQuery('');
  };

  return (
    <div className="relative flex flex-col items-end" ref={menuRef}>
      {/* Active Filter Chips - shown when menu is closed and filters are active */}
      {!showMenu && (hasActiveFilters || hasCompletedFilter) && (
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap justify-end max-w-xs sm:max-w-md">
          {selectedContainerNames.map(({ id, name, color }) => (
            <button
              key={id}
              onClick={(e) => {
                e.stopPropagation();
                onToggleContainer(id);
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-white transition-all hover:opacity-80 shadow-sm"
              style={{
                backgroundColor: color,
              }}
              title={`Remove ${name} filter`}
            >
              <span className="truncate max-w-[80px]">{name}</span>
              <X size={10} className="flex-shrink-0" />
            </button>
          ))}
          {hasCompletedFilter && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShowCompletedChange(true);
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-600 text-white transition-all hover:bg-gray-700 shadow-sm"
              title="Show completed tasks"
            >
              <span>Hiding completed</span>
              <X size={10} className="flex-shrink-0" />
            </button>
          )}
        </div>
      )}

      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 relative"
        style={{
          backgroundColor: showMenu ? 'white' : `${primaryLight}80`,
          border: `1px solid ${showMenu ? primaryColor : borderColor}`,
          color: primaryDark,
        }}
        onMouseEnter={(e) => {
          if (!showMenu) {
            e.currentTarget.style.backgroundColor = `${primaryLight}CC`;
            e.currentTarget.style.borderColor = primaryColor;
          }
        }}
        onMouseLeave={(e) => {
          if (!showMenu) {
            e.currentTarget.style.backgroundColor = `${primaryLight}80`;
            e.currentTarget.style.borderColor = borderColor;
          }
        }}
        aria-label="Filter tasks"
      >
        <Filter size={18} />
        <span className="hidden sm:inline">Filters</span>
        {(hasActiveFilters || hasCompletedFilter) && (
          <span 
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {(hasActiveFilters ? selectedCount : 0) + (hasCompletedFilter ? 1 : 0)}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div 
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl z-50 max-h-[80vh] flex flex-col"
          style={{
            border: `1px solid ${borderColor}`,
          }}
        >
          {/* Header */}
          <div className="px-4 py-4 border-b" style={{ borderColor: primaryLight }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Filter Tasks</h3>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setSearchQuery('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close filter menu"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Search Box */}
            <div className="relative mb-3">
              <Search 
                size={16} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search containers..."
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors"
                style={{
                  borderColor: searchQuery ? primaryColor : borderColor,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = primaryColor;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${primaryLight}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = borderColor;
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchQuery('');
                    e.currentTarget.blur();
                  }
                }}
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={onSelectAll}
                className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md border transition-all hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                style={{
                  borderColor: borderColor,
                  color: primaryDark,
                }}
                disabled={selectedContainers === null}
                title="Select all containers"
              >
                Select All
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md border transition-all hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                style={{
                  borderColor: borderColor,
                  color: primaryDark,
                }}
                disabled={!hasActiveFilters && showCompleted}
                title="Clear all filters (show all)"
              >
                Clear Filters
              </button>
            </div>
            
            {/* Selected Count */}
            {hasActiveFilters && (
              <div className="text-xs text-gray-500 mb-1">
                <span className="font-medium text-gray-700">{selectedCount}</span> of <span className="font-medium text-gray-700">{totalRootContainers}</span> containers selected
              </div>
            )}
          </div>

          {/* Show Completed Toggle */}
          <div className="px-4 py-3 border-b bg-gray-50/50" style={{ borderColor: primaryLight }}>
            <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer hover:text-gray-900 transition-colors group">
              <div className="flex-shrink-0">
                {showCompleted ? (
                  <CheckSquare 
                    size={18} 
                    className="transition-transform group-hover:scale-110"
                    style={{ color: primaryColor }}
                  />
                ) : (
                  <Square 
                    size={18} 
                    className="transition-all group-hover:scale-110 text-gray-400 group-hover:text-gray-600"
                  />
                )}
              </div>
              <span className="select-none font-medium">Show completed tasks</span>
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => onShowCompletedChange(e.target.checked)}
                className="sr-only"
              />
            </label>
          </div>

          {/* Container Filter */}
          <div className="px-4 py-4 overflow-y-auto flex-1 min-h-0">
            {filteredContainers.length > 0 ? (
              <ContainerFilter
                containers={filteredContainers}
                selectedContainers={selectedContainers}
                onToggleContainer={onToggleContainer}
                onSelectAll={onSelectAll}
                searchQuery={searchQuery}
              />
            ) : searchQuery ? (
              <div className="text-center py-12">
                <div className="text-sm text-gray-500 mb-1">No containers found</div>
                <div className="text-xs text-gray-400">Try a different search term</div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-sm text-gray-500 mb-1">No containers available</div>
                <div className="text-xs text-gray-400">Create containers in Create mode</div>
              </div>
            )}
          </div>

          {/* Footer Hint */}
          <div className="px-4 py-2 border-t bg-gray-50/50 text-xs text-gray-500" style={{ borderColor: primaryLight }}>
            <div className="flex flex-wrap items-center gap-2 justify-center">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-300 text-gray-700 font-mono">Esc</kbd>
                <span>close</span>
              </span>
              <span className="text-gray-400">•</span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-300 text-gray-700 font-mono">/</kbd>
                <span>search</span>
              </span>
              <span className="text-gray-400">•</span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-300 text-gray-700 font-mono">Ctrl</kbd>
                <span className="text-gray-400">/</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-300 text-gray-700 font-mono">Cmd</kbd>
                <span>+Click for multiple</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
