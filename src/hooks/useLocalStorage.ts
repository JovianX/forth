import { useEffect, useState } from 'react';
import { AppState } from '../types';
import { loadState, saveState, getDefaultState } from '../utils/storage';

export const useLocalStorage = () => {
  const [state, setState] = useState<AppState & { expandedContainers: Set<string> }>(() => {
    const saved = loadState();
    const defaultState = saved || getDefaultState();
    // Convert expandedContainers array to Set for internal use
    return {
      ...defaultState,
      expandedContainers: new Set(defaultState.expandedContainers || []),
    };
  });

  useEffect(() => {
    // Convert Set to array for storage
    const stateToSave: AppState = {
      ...state,
      expandedContainers: Array.from(state.expandedContainers),
    };
    saveState(stateToSave);
  }, [state]);

  return [state, setState] as const;
};
