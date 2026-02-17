import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from '../firebase';

const BYPASS_STORAGE_KEY = 'forth-dev-bypass';

function getDevBypassEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const noBypassParam = new URLSearchParams(window.location.search).get('noBypass') === '1';
  if (noBypassParam) return false;
  const fromInlineScript = (window as unknown as { __FORTH_DEV_BYPASS__?: boolean }).__FORTH_DEV_BYPASS__;
  if (fromInlineScript) return true;
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const hasStoredBypass = localStorage.getItem(BYPASS_STORAGE_KEY) === '1';
  return import.meta.env.VITE_DEV_AUTH_BYPASS === 'true' || isLocalhost || hasStoredBypass;
}

/** When set, skip real auth and use a mock user (for testing in Cursor where popup doesn't work) */
export const DEV_AUTH_BYPASS = getDevBypassEnabled();
export const DEV_BYPASS_UID = 'dev-bypass-user';

function createDevBypassUser(): User {
  return {
    uid: DEV_BYPASS_UID,
    email: 'dev@localhost',
    displayName: 'Dev User',
    photoURL: null,
    phoneNumber: null,
    providerId: 'dev-bypass',
    emailVerified: true,
    isAnonymous: false,
    metadata: {} as User['metadata'],
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: () => Promise.resolve(),
    getIdToken: () => Promise.resolve(''),
    getIdTokenResult: () => Promise.resolve({} as never),
    reload: () => Promise.resolve(),
    toJSON: () => ({}),
  } as unknown as User;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Only available when DEV_AUTH_BYPASS is enabled */
  signInAsDev: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (DEV_AUTH_BYPASS) {
      if (typeof window !== 'undefined') localStorage.setItem(BYPASS_STORAGE_KEY, '1');
      return createDevBypassUser();
    }
    return null;
  });
  const [loading, setLoading] = useState(() => !DEV_AUTH_BYPASS);

  useEffect(() => {
    if (DEV_AUTH_BYPASS) {
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    if (DEV_AUTH_BYPASS) return;
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (DEV_AUTH_BYPASS) {
      localStorage.removeItem(BYPASS_STORAGE_KEY);
      setUser(null);
      return;
    }
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const signInAsDev = () => {
    if (DEV_AUTH_BYPASS) {
      localStorage.setItem(BYPASS_STORAGE_KEY, '1');
      setUser(createDevBypassUser());
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    signOut,
    signInAsDev,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
