import React, { useState, useEffect, useRef } from 'react';
import { X, Palette } from 'lucide-react';
import { ModeSwitcher } from './components/ModeSwitcher';
import { ContainerTree } from './components/create-mode/ContainerTree';
import { TaskList } from './components/execution-mode/TaskList';
import { PlanView } from './components/plan-mode/PlanView';
import { ColorPalettePreview } from './components/ColorPalettePreview';
import { Login } from './components/Login';
import { useTaskContext } from './context/TaskContext';
import { useAuth } from './context/AuthContext';
import { getPalette } from './utils/paletteUtils';
import { PersonasSettings } from './components/settings/PersonasSettings';
import { OllamaSettings } from './components/settings/OllamaSettings';
import { loadPersonaAiBackend, loadWebLlmModel } from './utils/personaStorage';
import { preloadWebLlmEngine } from './utils/webLlmPersonaChat';

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
  const [showSettings, setShowSettings] = useState(false);
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

  // When WebLLM is selected, start loading the model in the background after the shell is up.
  useEffect(() => {
    if (authLoading || taskLoading || !user) return;
    if (loadPersonaAiBackend() !== 'webllm') return;
    const modelId = loadWebLlmModel();
    const t = window.setTimeout(() => {
      void preloadWebLlmEngine(modelId).catch((e) => {
        console.warn('[WebLLM] Background preload failed (will retry on sparkles):', e);
      });
    }, 200);
    return () => window.clearTimeout(t);
  }, [user, authLoading, taskLoading]);

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

  const palette = getPalette();
  const settingsPrimary = palette?.accentColors.primary || '#F59E0B';
  const settingsPrimaryDark = palette?.accentColors.primaryDark || '#D97706';
  const settingsPrimaryLight = palette?.accentColors.primaryLight || '#FEF3C7';

  return (
    <div className={`h-screen flex flex-col bg-gradient-to-br ${backgroundGradient} overflow-hidden`}>
      {showSettings && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-dialog-title"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowSettings(false)}
            aria-hidden="true"
          />
          <div
            className="relative z-10 w-full max-w-md max-h-[min(85vh,720px)] bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
              <h2 id="settings-dialog-title" className="text-lg font-semibold text-gray-900">
                Settings
              </h2>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                aria-label="Close settings"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0">
              <p className="px-4 pt-3 text-xs text-gray-500">Appearance and preferences</p>
              <div className="p-2 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSettings(false);
                    setShowColorPreview(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm rounded-lg transition-colors"
                  style={{ color: settingsPrimaryDark }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = settingsPrimaryLight;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Palette size={18} style={{ color: settingsPrimary }} />
                  <span>Theme</span>
                </button>
              </div>
              <PersonasSettings />
              <OllamaSettings />
              <div className="h-3 shrink-0" aria-hidden />
            </div>
          </div>
        </div>
      )}
      <ModeSwitcher 
        onSettingsClick={() => setShowSettings(true)}
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
            <PlanView
              onSettingsClick={() => setShowSettings(true)}
              onColorPaletteClick={() => setShowColorPreview(true)}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
