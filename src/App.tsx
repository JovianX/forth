import React, { useState, useEffect, useRef } from 'react';
import { ModeSwitcher } from './components/ModeSwitcher';
import { ContainerTree } from './components/create-mode/ContainerTree';
import { TaskList } from './components/execution-mode/TaskList';
import { PlanView } from './components/plan-mode/PlanView';
import { ColorPalettePreview } from './components/ColorPalettePreview';
import { Login } from './components/Login';
import { useTaskContext } from './context/TaskContext';
import { useAuth } from './context/AuthContext';
import { getPalette } from './utils/paletteUtils';

const FILTER_STORAGE_KEY = 'forth-filter-state';

interface FilterState {
  selectedContainers: string[] | null;
  showCompleted: boolean;
}

function App() {
  const { mode, containers, loading: taskLoading } = useTaskContext();
  const { user, loading: authLoading } = useAuth();
  
  // Load filter state from localStorage
  const loadFilterState = (): FilterState => {
    try {
      const saved = localStorage.getItem(FILTER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as FilterState;
        return {
          selectedContainers: parsed.selectedContainers,
          showCompleted: parsed.showCompleted ?? true,
        };
      }
    } catch (e) {
      console.error('Error loading filter state:', e);
    }
    return {
      selectedContainers: null,
      showCompleted: true,
    };
  };

  // Filter state for prioritize mode
  const [selectedContainers, setSelectedContainers] = useState<Set<string> | null>(() => {
    const saved = loadFilterState();
    return saved.selectedContainers ? new Set(saved.selectedContainers) : null;
  });
  const [showCompleted, setShowCompleted] = useState(() => {
    const saved = loadFilterState();
    return saved.showCompleted ?? true;
  });

  // Save filter state to localStorage
  useEffect(() => {
    try {
      const stateToSave: FilterState = {
        selectedContainers: selectedContainers ? Array.from(selectedContainers) : null,
        showCompleted,
      };
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Error saving filter state:', e);
    }
  }, [selectedContainers, showCompleted]);
  const [showColorPreview, setShowColorPreview] = useState(false);
  const [backgroundGradient, setBackgroundGradient] = useState('from-amber-50 via-orange-50 to-red-50');
  const addContainerRef = useRef<(() => void) | null>(null);
  
  // Set Marck Script as default
  React.useEffect(() => {
    if (!localStorage.getItem('logoFont')) {
      const marckScript = { name: 'Marck Script', family: "'Marck Script', cursive", italic: false };
      localStorage.setItem('logoFont', JSON.stringify(marckScript));
    }
  }, []);

  // Set Rising Sun Path as default icon
  React.useEffect(() => {
    localStorage.setItem('logoIcon', JSON.stringify({ name: 'Rising Sun Path' }));
  }, []);

  // Load saved palette
  useEffect(() => {
    const savedPalette = getPalette();
    if (savedPalette) {
      setBackgroundGradient(savedPalette.backgroundGradient);
    }
  }, []);

  // Check URL parameter to show color preview
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('previewColors') === 'true') {
      setShowColorPreview(true);
    }
  }, []);

  if (showColorPreview) {
    return <ColorPalettePreview onClose={() => setShowColorPreview(false)} />;
  }

  if (authLoading || taskLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <div className="animate-pulse text-gray-500">
          {authLoading ? 'Loading...' : 'Loading your data...'}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleAddContainerClick = () => {
    addContainerRef.current?.();
  };

  const handleToggleContainer = (containerId: string, event?: React.MouseEvent) => {
    const isMultiSelect = event?.ctrlKey || event?.metaKey;
    
    setSelectedContainers((prev) => {
      if (isMultiSelect) {
        // Multi-select mode: toggle this container
        if (prev === null) {
          return new Set([containerId]);
        }
        const newSet = new Set(prev);
        if (newSet.has(containerId)) {
          newSet.delete(containerId);
          return newSet.size === 0 ? null : newSet;
        } else {
          newSet.add(containerId);
          return newSet;
        }
      } else {
        // Single-select mode: select only this container
        if (prev !== null && prev.size === 1 && prev.has(containerId)) {
          return null; // Deselect if clicking the same one
        }
        return new Set([containerId]);
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedContainers(null);
  };

  return (
    <div className={`h-screen flex flex-col bg-gradient-to-br ${backgroundGradient} overflow-hidden`}>
      <ModeSwitcher 
        onColorPaletteClick={() => setShowColorPreview(true)}
        onAddContainerClick={mode === 'create' ? handleAddContainerClick : undefined}
        filterMenuProps={
          mode === 'prioritize'
            ? {
                containers,
                selectedContainers,
                showCompleted,
                onToggleContainer: handleToggleContainer,
                onSelectAll: handleSelectAll,
                onShowCompletedChange: setShowCompleted,
              }
            : undefined
        }
      />
      <main className="flex-1 overflow-hidden w-full">
        <div className="transition-opacity duration-300 h-full">
          {mode === 'create' ? (
            <div className="h-full overflow-y-auto">
              <ContainerTree onAddContainerRef={(fn) => { addContainerRef.current = fn; }} />
            </div>
          ) : mode === 'prioritize' ? (
            <div className="h-full overflow-y-auto">
              <TaskList
                selectedContainers={selectedContainers}
                showCompleted={showCompleted}
                onSelectedContainersChange={setSelectedContainers}
                onShowCompletedChange={setShowCompleted}
              />
            </div>
          ) : (
            <PlanView />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
