import { useCallback, useEffect, useRef } from 'react';

/** Aligns with useFirebaseStorage debounce so bursts of typing coalesce before cloud write. */
export const EDITOR_PERSIST_DEBOUNCE_MS = 450;

/**
 * Debounces persisting rich-text drafts to global state so each keystroke does not
 * trigger an immediate context update. Flushes when the tab is hidden or the
 * component unmounts so edits are not left only in local refs.
 */
export function useDebouncedEditorPersist(
  serverValue: string,
  isEditing: boolean,
  getDraft: () => string,
  persist: (next: string) => void,
  debounceMs = EDITOR_PERSIST_DEBOUNCE_MS
) {
  const lastPersistedRef = useRef(serverValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistRef = useRef(persist);
  persistRef.current = persist;

  useEffect(() => {
    if (!isEditing) {
      lastPersistedRef.current = serverValue;
    }
  }, [serverValue, isEditing]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const flush = useCallback(() => {
    clearTimer();
    const latest = getDraft();
    if (latest !== lastPersistedRef.current) {
      persistRef.current(latest);
      lastPersistedRef.current = latest;
    }
  }, [getDraft, clearTimer]);

  const schedule = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const latest = getDraft();
      if (latest !== lastPersistedRef.current) {
        persistRef.current(latest);
        lastPersistedRef.current = latest;
      }
    }, debounceMs);
  }, [getDraft, debounceMs, clearTimer]);

  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      flush();
    };
  }, [flush]);

  return { schedulePersist: schedule, flushPersist: flush, cancelPersistTimer: clearTimer };
}
