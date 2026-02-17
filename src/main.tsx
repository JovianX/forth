import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { TaskProvider } from './context/TaskContext.tsx'
import { AuthProvider } from './context/AuthContext.tsx'

// Register service worker for PWA (skip in dev to avoid HMR/WebSocket interference)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    // Use base URL from Vite config (handles GitHub Pages base path)
    const baseUrl = import.meta.env.BASE_URL;
    const swPath = `${baseUrl}sw.js`;
    const scope = baseUrl;
    
    navigator.serviceWorker.register(swPath, { scope })
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <TaskProvider>
        <App />
      </TaskProvider>
    </AuthProvider>
  </React.StrictMode>,
)
