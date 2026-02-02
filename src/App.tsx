import React, { useState, useEffect } from 'react';
import { ModeSwitcher } from './components/ModeSwitcher';
import { ContainerTree } from './components/create-mode/ContainerTree';
import { TaskList } from './components/execution-mode/TaskList';
import { ColorPalettePreview } from './components/ColorPalettePreview';
import { useTaskContext } from './context/TaskContext';
import { getPalette } from './utils/paletteUtils';

function App() {
  const { mode } = useTaskContext();
  const [showColorPreview, setShowColorPreview] = useState(false);
  const [backgroundGradient, setBackgroundGradient] = useState('from-amber-50 via-orange-50 to-red-50');
  
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

  return (
    <div className={`min-h-screen bg-gradient-to-br ${backgroundGradient}`}>
      <ModeSwitcher onColorPaletteClick={() => setShowColorPreview(true)} />
      <main className="max-w-7xl mx-auto">
        <div className="transition-opacity duration-300">
          {mode === 'create' ? <ContainerTree /> : <TaskList />}
        </div>
      </main>
    </div>
  );
}

export default App;
