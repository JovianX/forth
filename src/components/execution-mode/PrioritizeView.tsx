import React, {
  useState,
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from 'react';
import { ChevronRight, ChevronLeft, Zap, CheckSquare, Square, X } from 'lucide-react';
import { useTaskContext } from '../../context/TaskContext';
import { Container } from '../../types';
import { getPalette } from '../../utils/paletteUtils';
import { getContainerDarkColor } from '../../utils/colorUtils';
import { UserMenu } from '../UserMenu';
import { TaskList } from './TaskList';

const SIDEBAR_MIN = 180;
const SIDEBAR_MAX = 480;
const SIDEBAR_DEFAULT = 256;

interface PrioritizeTopicRowProps {
  container: Container;
  depth: number;
  containers: Container[];
  selectedContainers: Set<string> | null;
  onToggleContainer: (containerId: string, event?: React.MouseEvent) => void;
}

function getChildContainersList(containers: Container[], parentId: string): Container[] {
  return containers
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

const PrioritizeTopicRow: React.FC<PrioritizeTopicRowProps> = ({
  container,
  depth,
  containers,
  selectedContainers,
  onToggleContainer,
}) => {
  const childContainers = getChildContainersList(containers, container.id);
  const [isExpanded, setIsExpanded] = useState(false);
  const isRoot = depth === 0;
  const showSelectedChrome =
    selectedContainers !== null && selectedContainers.has(container.id);
  const containerDarkColor = getContainerDarkColor(container.color);

  return (
    <div className="group">
      <div
        className={`group/item w-full text-left py-1.5 rounded-md transition-all flex items-center ${
          showSelectedChrome ? 'bg-white shadow-sm font-medium' : 'hover:bg-white/60'
        }`}
        style={{
          paddingLeft: isRoot ? '4px' : `${4 + depth * 16}px`,
          paddingRight: '8px',
          borderLeft: showSelectedChrome ? `3px solid ${container.color}` : '3px solid transparent',
        }}
      >
        {isRoot && <div className="w-[18px] flex-shrink-0 mr-1" aria-hidden />}
        {!isRoot && childContainers.length > 0 && (
          <button
            type="button"
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
        {!isRoot && childContainers.length === 0 && <div className="w-[18px] flex-shrink-0" />}
        {isRoot && childContainers.length > 0 && (
          <button
            type="button"
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
        {isRoot && childContainers.length === 0 && <div className="w-0 flex-shrink-0" />}
        <Zap size={16} style={{ color: container.color }} className="flex-shrink-0 mr-2" />
        <button
          type="button"
          onClick={(e) => onToggleContainer(container.id, e)}
          className="flex-1 min-w-0 text-start"
          title="Click to filter this topic · ⌘/Ctrl+click for multiple"
        >
          <span
            dir="auto"
            className={`truncate ${
              showSelectedChrome ? 'font-medium text-gray-900' : 'text-gray-700'
            }`}
            style={{ color: showSelectedChrome ? undefined : containerDarkColor }}
          >
            {container.name}
          </span>
        </button>
      </div>
      {isExpanded && childContainers.length > 0 && (
        <div className="ml-2">
          {childContainers.map((child) => (
            <PrioritizeTopicRow
              key={child.id}
              container={child}
              depth={depth + 1}
              containers={containers}
              selectedContainers={selectedContainers}
              onToggleContainer={onToggleContainer}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface PrioritizeViewProps {
  onSettingsClick: () => void;
  onColorPaletteClick: () => void;
  selectedContainers: Set<string> | null;
  showCompleted: boolean;
  onToggleContainer: (containerId: string, event?: React.MouseEvent) => void;
  onSelectAll: () => void;
  onShowCompletedChange: (show: boolean) => void;
}

export const PrioritizeView: React.FC<PrioritizeViewProps> = ({
  onSettingsClick,
  onColorPaletteClick,
  selectedContainers,
  showCompleted,
  onToggleContainer,
  onSelectAll,
  onShowCompletedChange,
}) => {
  const { containers } = useTaskContext();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('captureSidebarCollapsed');
    return saved === 'true';
  });
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('captureSidebarWidth');
    if (saved) {
      const n = parseInt(saved, 10);
      if (!Number.isNaN(n) && n >= SIDEBAR_MIN && n <= SIDEBAR_MAX) return n;
    }
    return SIDEBAR_DEFAULT;
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  const [sidebarWidthTransition, setSidebarWidthTransition] = useState(true);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarWidthTransition(false);
    setSidebarCollapsed((c) => !c);
  }, []);

  useLayoutEffect(() => {
    if (sidebarWidthTransition) return;
    let inner: number | undefined;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        setSidebarWidthTransition(true);
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      if (inner !== undefined) cancelAnimationFrame(inner);
    };
  }, [sidebarWidthTransition]);

  useEffect(() => {
    localStorage.setItem('captureSidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);
  useEffect(() => {
    localStorage.setItem('captureSidebarWidth', String(sidebarWidth));
  }, [sidebarWidth]);

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

  const rootContainers = useMemo(() => {
    return containers
      .filter((c) => c.parentId === null)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [containers]);

  const totalRootContainers = rootContainers.length;
  const hasActiveTopicFilter =
    selectedContainers !== null &&
    selectedContainers.size > 0 &&
    selectedContainers.size < totalRootContainers;
  const hasCompletedFilter = !showCompleted;

  const selectedContainerNames = useMemo(() => {
    if (selectedContainers === null) return [];
    return Array.from(selectedContainers)
      .map((id) => containers.find((c) => c.id === id))
      .filter((c): c is Container => c !== undefined)
      .map((c) => ({ id: c.id, name: c.name, color: c.color }));
  }, [selectedContainers, containers]);

  return (
    <div className="flex h-full relative min-h-0">
      <div
        className="relative z-10 h-full min-h-0 border-r bg-white/80 backdrop-blur-sm flex-shrink-0 flex flex-col"
        style={{
          borderColor,
          width: sidebarCollapsed ? 48 : sidebarWidth,
          transition:
            isResizing || !sidebarWidthTransition ? 'none' : 'width 0.2s ease-out',
        }}
      >
        {!sidebarCollapsed ? (
          <div className="p-4 flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between mb-3 px-1 pb-2 shrink-0 border-b border-gray-200/80">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Topics</h2>
              <button
                type="button"
                onClick={toggleSidebarCollapsed}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-all"
                title="Collapse sidebar"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
            {selectedContainers !== null && (
              <div className="shrink-0 mb-2">
                <button
                  type="button"
                  onClick={onSelectAll}
                  className="w-full text-left text-xs font-medium px-2 py-1.5 rounded-md transition-colors text-gray-600 hover:bg-gray-100"
                  style={{ color: primaryDark }}
                >
                  All topics
                </button>
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar -mx-4 px-4">
              {rootContainers.length === 0 ? (
                <p className="text-sm text-gray-500 px-2 py-2">
                  No topics yet. Switch to Create mode to add topics.
                </p>
              ) : (
                <div className="space-y-1">
                  {rootContainers.map((container) => (
                    <PrioritizeTopicRow
                      key={container.id}
                      container={container}
                      depth={0}
                      containers={containers}
                      selectedContainers={selectedContainers}
                      onToggleContainer={onToggleContainer}
                    />
                  ))}
                </div>
              )}
              <label className="flex items-center gap-2.5 pt-4 mt-3 border-t border-gray-200/80 text-sm text-gray-700 cursor-pointer px-1">
                <div className="flex-shrink-0">
                  {showCompleted ? (
                    <CheckSquare size={18} className="transition-transform" style={{ color: primaryColor }} />
                  ) : (
                    <Square size={18} className="text-gray-400" />
                  )}
                </div>
                <span className="select-none font-medium">Show completed</span>
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={(e) => onShowCompletedChange(e.target.checked)}
                  className="sr-only"
                />
              </label>
            </div>
            <div className="shrink-0 pt-3 border-t border-gray-200/80 flex justify-start">
              <UserMenu
                onSettingsClick={onSettingsClick}
                onColorPaletteClick={onColorPaletteClick}
                variant="sidebar"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center h-full min-h-0 pt-2 pb-2 px-0 w-full">
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className="flex h-9 w-full items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors mb-1 shrink-0"
              title="Expand sidebar"
            >
              <ChevronRight size={16} />
            </button>
            <div
              className={`flex-1 min-h-0 w-full flex flex-col items-stretch gap-1 py-1 ${
                rootContainers.length > 0 ? 'overflow-y-auto hide-scrollbar' : 'overflow-hidden'
              }`}
            >
              {rootContainers.map((container) => {
                const showSelectedChrome =
                  selectedContainers !== null && selectedContainers.has(container.id);
                return (
                  <button
                    key={container.id}
                    type="button"
                    onClick={() => onToggleContainer(container.id)}
                    aria-current={showSelectedChrome ? 'true' : undefined}
                    aria-label={container.name}
                    className={`relative flex h-9 w-full shrink-0 items-center justify-center rounded-md transition-colors ${
                      showSelectedChrome ? 'bg-white shadow-sm font-medium' : 'hover:bg-white/60'
                    }`}
                    style={{
                      borderLeft: showSelectedChrome
                        ? `3px solid ${container.color}`
                        : '3px solid transparent',
                    }}
                    title={container.name}
                  >
                    <Zap
                      size={16}
                      style={{ color: container.color }}
                      className="shrink-0 pointer-events-none"
                      aria-hidden
                    />
                  </button>
                );
              })}
            </div>
            <div className="shrink-0 pt-2 mt-auto w-full flex justify-center border-t border-gray-200/80">
              <UserMenu
                onSettingsClick={onSettingsClick}
                onColorPaletteClick={onColorPaletteClick}
                variant="sidebar"
              />
            </div>
          </div>
        )}
      </div>

      {!sidebarCollapsed && (
        <div
          role="separator"
          aria-label="Resize sidebar"
          title="Drag to resize"
          className={`group relative z-10 flex-shrink-0 h-full cursor-col-resize flex justify-center items-center select-none touch-none transition-colors duration-150 ${
            isResizing ? 'bg-gray-100/60' : 'hover:bg-gray-100/50'
          }`}
          style={{ width: 10, minWidth: 10 }}
          onMouseDown={(e) => {
            e.preventDefault();
            resizeStartX.current = e.clientX;
            resizeStartWidth.current = sidebarWidth;
            setIsResizing(true);
          }}
        >
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

      <div
        className={`relative z-0 flex flex-1 min-w-0 min-h-0 flex-col overflow-hidden backdrop-blur-sm transition-shadow duration-200 ${
          isResizing ? 'bg-white/50' : 'bg-white/40'
        }`}
        style={{
          minWidth: 320,
          boxShadow: isResizing ? 'inset 2px 0 8px -4px rgba(0,0,0,0.06)' : undefined,
        }}
      >
        <div className="flex-1 min-w-0 min-h-0 overflow-y-auto flex flex-col">
          {(hasActiveTopicFilter || hasCompletedFilter) && (
            <div className="flex flex-wrap items-center gap-1.5 px-4 sm:px-6 pt-4 shrink-0">
              {hasActiveTopicFilter &&
                selectedContainerNames.map(({ id, name, color }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleContainer(id, e);
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-white transition-all hover:opacity-80 shadow-sm"
                    style={{ backgroundColor: color }}
                    title={`Remove ${name} filter`}
                  >
                    <span className="truncate max-w-[120px]">{name}</span>
                    <X size={10} className="flex-shrink-0" />
                  </button>
                ))}
              {hasCompletedFilter && (
                <button
                  type="button"
                  onClick={() => onShowCompletedChange(true)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-600 text-white transition-all hover:bg-gray-700 shadow-sm"
                  title="Show completed tasks"
                >
                  <span>Hiding completed</span>
                  <X size={10} className="flex-shrink-0" />
                </button>
              )}
            </div>
          )}
          <TaskList selectedContainers={selectedContainers} showCompleted={showCompleted} />
        </div>
      </div>
    </div>
  );
};
