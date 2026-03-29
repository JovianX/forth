import React, { useState, useEffect } from 'react';
import {
  defaultOllamaBaseUrl,
  loadOllamaBaseUrl,
  loadOllamaModel,
  saveOllamaBaseUrl,
  saveOllamaModel,
  DEFAULT_OLLAMA_MODEL,
} from '../../utils/personaStorage';
import { ollamaListTags } from '../../utils/ollamaClient';

export const OllamaSettings: React.FC = () => {
  const [baseUrl, setBaseUrl] = useState(loadOllamaBaseUrl);
  const [model, setModel] = useState(loadOllamaModel);
  const [testStatus, setTestStatus] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    saveOllamaBaseUrl(baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    saveOllamaModel(model);
  }, [model]);

  const handleTest = async () => {
    setTesting(true);
    setTestStatus('idle');
    try {
      const ok = await ollamaListTags(baseUrl);
      setTestStatus(ok ? 'ok' : 'fail');
    } catch {
      setTestStatus('fail');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="px-4 py-3 border-t border-gray-200 space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Ollama</h3>
      <p className="text-xs text-gray-500 leading-relaxed">
        Local AI server. In dev, <code className="text-gray-700 bg-gray-100 px-1 rounded">/ollama</code> is proxied to Ollama
        (avoids CORS). Direct <code className="text-gray-700 bg-gray-100 px-1 rounded">http://127.0.0.1:11434</code> is
        rewritten to that proxy while developing. For a static/production build, use Ollama&apos;s{' '}
        <code className="text-gray-700 bg-gray-100 px-1 rounded">OLLAMA_ORIGINS</code> or your own proxy.
      </p>
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-gray-600" htmlFor="ollama-base-url">
          Base URL
        </label>
        <input
          id="ollama-base-url"
          type="text"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder={defaultOllamaBaseUrl()}
          className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
        />
      </div>
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-gray-600" htmlFor="ollama-model">
          Model name
        </label>
        <input
          id="ollama-model"
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={DEFAULT_OLLAMA_MODEL}
          className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleTest}
          disabled={testing || !baseUrl.trim()}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          {testing ? 'Testing…' : 'Test connection'}
        </button>
        {testStatus === 'ok' && <span className="text-xs text-green-600">Connected</span>}
        {testStatus === 'fail' && <span className="text-xs text-red-600">Could not reach Ollama</span>}
      </div>
    </div>
  );
};
