import React, { useEffect } from 'react';
import { X, RefreshCw, FileDown } from 'lucide-react';

export interface PersonaResponsePanelProps {
  personaName: string | null;
  loading: boolean;
  /** Extra line while loading (e.g. WebLLM download progress) */
  loadingDetail?: string | null;
  error: string | null;
  response: string;
  onClose: () => void;
  onRegenerate: () => void;
  onInsert: () => void;
  insertDisabled: boolean;
  onOpenSettings?: () => void;
  primaryColor?: string;
  primaryDark?: string;
}

export const PersonaResponsePanel: React.FC<PersonaResponsePanelProps> = ({
  personaName,
  loading,
  loadingDetail,
  error,
  response,
  onClose,
  onRegenerate,
  onInsert,
  insertDisabled,
  onOpenSettings,
  primaryColor = '#F59E0B',
  primaryDark = '#D97706',
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const showRegenerate = Boolean(personaName && !error?.includes('Settings'));

  return (
    <aside
      className="flex flex-col w-full lg:w-[min(100%,380px)] shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200/80 bg-white/90 backdrop-blur-sm min-h-[200px] lg:min-h-0 lg:max-h-full"
      aria-label="Persona feedback"
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-gray-200/80 shrink-0">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">Persona feedback</h3>
          {personaName && <p className="text-xs text-gray-500 truncate">{personaName}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 shrink-0"
          aria-label="Close panel"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 text-sm text-gray-800">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-500">
            <div
              className="h-8 w-8 border-2 border-gray-200 rounded-full animate-spin"
              style={{ borderTopColor: primaryColor }}
              aria-hidden
            />
            <p className="text-xs text-center">Reading your entry…</p>
            {loadingDetail ? (
              <p className="text-[11px] text-center text-gray-400 max-w-[280px] leading-snug line-clamp-4">
                {loadingDetail}
              </p>
            ) : null}
          </div>
        )}
        {!loading && error && (
          <div className="space-y-3">
            <p dir="auto" className="text-gray-700 leading-relaxed">
              {error}
            </p>
            {error.includes('Settings') && onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="text-sm font-medium underline-offset-2 hover:underline"
                style={{ color: primaryDark }}
              >
                Open Settings
              </button>
            )}
          </div>
        )}
        {!loading && !error && response && (
          <div dir="auto" className="whitespace-pre-wrap leading-relaxed text-gray-800">
            {response}
          </div>
        )}
        {!loading && !error && !response && personaName && (
          <p className="text-gray-400 text-xs">No response yet.</p>
        )}
      </div>

      <div className="shrink-0 flex flex-wrap gap-2 px-3 py-2.5 border-t border-gray-200/80 bg-gray-50/80">
        {showRegenerate && (
          <button
            type="button"
            disabled={loading}
            onClick={onRegenerate}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Regenerate
          </button>
        )}
        <button
          type="button"
          disabled={insertDisabled || loading || !response}
          onClick={onInsert}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
          style={{ backgroundColor: primaryColor }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = primaryDark;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = primaryColor;
          }}
        >
          <FileDown size={14} />
          Insert into entry
        </button>
      </div>
    </aside>
  );
};
