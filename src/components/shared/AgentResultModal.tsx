import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check } from 'lucide-react';

interface AgentResultModalProps {
  agentName: string;
  inputLabel: string;
  inputPreview: string;
  output: string;
  onClose: () => void;
}

export const AgentResultModal: React.FC<AgentResultModalProps> = ({
  agentName,
  inputLabel,
  inputPreview,
  output,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="agent-result-title"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        className="relative z-10 flex w-full max-w-2xl max-h-[85vh] flex-col rounded-xl border border-gray-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div className="min-w-0">
            <h2 id="agent-result-title" className="text-lg font-semibold text-gray-900 truncate">
              {agentName}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Ran on {inputLabel.toLowerCase()}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 px-5 py-4 space-y-4">
          <details className="rounded-lg border border-gray-200 bg-gray-50/60">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-gray-600">
              Input sent to model
            </summary>
            <pre className="whitespace-pre-wrap break-words px-3 pb-3 text-xs text-gray-700 font-mono">
              {inputPreview}
            </pre>
          </details>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-gray-600">Response</h3>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              >
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 whitespace-pre-wrap break-words">
              {output}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-5 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
