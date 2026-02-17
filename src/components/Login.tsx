import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DEV_AUTH_BYPASS } from '../context/AuthContext';
import { getPalette } from '../utils/paletteUtils';

export const Login: React.FC = () => {
  const { signInWithGoogle, signInAsDev } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const savedPalette = getPalette();
  const backgroundGradient = savedPalette?.backgroundGradient ?? 'from-amber-50 via-orange-50 to-red-50';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br ${backgroundGradient} p-4`}>
      <div className="max-w-sm w-full text-center space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Welcome to Forth</h1>
          <p className="text-gray-600">
            {DEV_AUTH_BYPASS ? 'Use dev bypass to test without a browser popup' : 'Sign in with your Google account to continue'}
          </p>
        </div>

        <div className="space-y-4">
          {DEV_AUTH_BYPASS ? (
            <button
              type="button"
              onClick={() => signInAsDev()}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-amber-100 border border-amber-300 rounded-lg shadow-sm hover:bg-amber-200 hover:shadow transition-all duration-200 text-amber-900 font-medium"
            >
              Continue as Dev User
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:shadow transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-gray-700 font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </button>
          )}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};
