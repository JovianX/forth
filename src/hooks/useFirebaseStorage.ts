import { useEffect, useState, useRef, useCallback } from 'react';
import {
  doc,
  onSnapshot,
  setDoc,
  type DocumentSnapshot,
  type FirestoreError,
} from 'firebase/firestore';
import { db } from '../firebase';
import { AppState } from '../types';
import { migrateState, getDefaultState, loadState, clearLocalState, saveState } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import { DEV_BYPASS_UID } from '../context/AuthContext';

const COLLECTION = 'users';
const DEBOUNCE_MS = 500;

/** Firestore document shape - matches AppState with serializable expandedContainers */
interface FirestoreStateDoc extends Omit<AppState, 'expandedContainers'> {
  expandedContainers: string[];
}

/** Recursively removes undefined values - Firestore rejects undefined */
function stripUndefined<T>(obj: T): T {
  if (obj === undefined || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(stripUndefined) as T;
  if (typeof obj === 'object' && obj.constructor === Object) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)])
    ) as T;
  }
  return obj;
}

function toFirestoreDoc(state: AppState & { expandedContainers: Set<string> }): FirestoreStateDoc {
  return stripUndefined({
    ...state,
    expandedContainers: Array.from(state.expandedContainers),
  });
}

function fromFirestoreDoc(snap: DocumentSnapshot): AppState | null {
  const data = snap.data();
  if (!data || !snap.exists()) return null;
  const migrated = migrateState({
    mode: data.mode ?? 'create',
    containers: data.containers ?? [],
    tasks: data.tasks ?? [],
    expandedContainers: data.expandedContainers ?? [],
  });
  return migrated;
}

export const useFirebaseStorage = (): [
  state: AppState & { expandedContainers: Set<string> },
  setState: React.Dispatch<React.SetStateAction<AppState & { expandedContainers: Set<string> }>>,
  loading: boolean,
] => {
  const { user } = useAuth();
  const isBypass = user?.uid === DEV_BYPASS_UID;
  const [state, setState] = useState<AppState & { expandedContainers: Set<string> }>(() => ({
    ...getDefaultState(),
    expandedContainers: new Set<string>(),
  }));
  const [loading, setLoading] = useState(!!user);
  const lastWriteIdRef = useRef<string | null>(null);
  const writeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistToFirebase = useCallback(
    (newState: AppState & { expandedContainers: Set<string> }) => {
      if (!user?.uid) return;
      const writeId = crypto.randomUUID();
      lastWriteIdRef.current = writeId;
      const docData = {
        ...toFirestoreDoc(newState),
        _writeId: writeId,
        _updatedAt: Date.now(),
      };
      setDoc(doc(db, COLLECTION, user.uid), docData).catch((err) => {
        console.error('Error saving state to Firestore:', err);
        lastWriteIdRef.current = null;
      });
    },
    [user?.uid]
  );

  // Dev bypass: use localStorage instead of Firestore
  useEffect(() => {
    if (!isBypass) return;
    const loaded = loadState() || getDefaultState();
    setState({
      ...loaded,
      expandedContainers: new Set(
        Array.isArray(loaded.expandedContainers) ? loaded.expandedContainers : []
      ),
    });
    setLoading(false);
  }, [isBypass]);

  // Debounced write when state changes
  useEffect(() => {
    if (!user?.uid) return;

    if (isBypass) {
      const scheduleWrite = () => {
        if (writeTimeoutRef.current) clearTimeout(writeTimeoutRef.current);
        writeTimeoutRef.current = setTimeout(() => {
          writeTimeoutRef.current = null;
          saveState({
            ...state,
            expandedContainers: Array.from(state.expandedContainers),
          });
        }, DEBOUNCE_MS);
      };
      scheduleWrite();
      return () => {
        if (writeTimeoutRef.current) clearTimeout(writeTimeoutRef.current);
      };
    }

    const scheduleWrite = () => {
      if (writeTimeoutRef.current) clearTimeout(writeTimeoutRef.current);
      writeTimeoutRef.current = setTimeout(() => {
        writeTimeoutRef.current = null;
        persistToFirebase(state);
      }, DEBOUNCE_MS);
    };

    if (!loading) {
      scheduleWrite();
    }
    return () => {
      if (writeTimeoutRef.current) clearTimeout(writeTimeoutRef.current);
    };
  }, [state, user?.uid, loading, isBypass, persistToFirebase]);

  // Firestore real-time listener (skip when using dev bypass)
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      setState(() => ({
        ...getDefaultState(),
        expandedContainers: new Set<string>(),
      }));
      return;
    }

    if (isBypass) return;

    setLoading(true);
    const docRef = doc(db, COLLECTION, user.uid);

    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        const data = snap.data();
        const writeId = data?._writeId;
        if (writeId && writeId === lastWriteIdRef.current) {
          lastWriteIdRef.current = null;
          setLoading(false);
          return;
        }

        let loaded = fromFirestoreDoc(snap);
        if (!loaded) {
          const localState = loadState();
          if (localState) {
            loaded = localState;
            persistToFirebase({
              ...loaded,
              expandedContainers: new Set(Array.isArray(loaded.expandedContainers) ? loaded.expandedContainers : []),
            });
            clearLocalState();
          }
        }
        const nextState = loaded || getDefaultState();
        setState({
          ...nextState,
          expandedContainers: new Set(
            Array.isArray(nextState.expandedContainers)
              ? nextState.expandedContainers
              : []
          ),
        });
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error('Firestore snapshot error:', err);
        setState(() => ({
          ...getDefaultState(),
          expandedContainers: new Set<string>(),
        }));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  return [state, setState, loading];
};
