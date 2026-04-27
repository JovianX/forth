import React, { useState, useEffect } from 'react';
import {
  defaultOllamaBaseUrl,
  loadOllamaBaseUrl,
  loadOllamaModel,
  saveOllamaBaseUrl,
  saveOllamaModel,
  DEFAULT_OLLAMA_MODEL,
  loadPersonaAiBackend,
  savePersonaAiBackend,
  loadWebLlmModel,
  saveWebLlmModel,
  DEFAULT_WEBLLM_MODEL,
  type PersonaAiBackend,
} from '../../utils/personaStorage';
import { ollamaListTags } from '../../utils/ollamaClient';

export const OllamaSettings: React.FC = () => {
  const [backend, setBackend] = useState<PersonaAiBackend>(loadPersonaAiBackend);
  const [baseUrl, setBaseUrl] = useState(loadOllamaBaseUrl);
  const [model, setModel] = useState(loadOllamaModel);
  const [webLlmModelId, setWebLlmModelId] = useState(loadWebLlmModel);
  const [webLlmModelIds, setWebLlmModelIds] = useState<string[]>([]);
  const [testStatus, setTestStatus] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    savePersonaAiBackend(backend);
  }, [backend]);

  useEffect(() => {
    saveOllamaBaseUrl(baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    saveOllamaModel(model);
  }, [model]);

  useEffect(() => {
    saveWebLlmModel(webLlmModelId);
  }, [webLlmModelId]);

  useEffect(() => {
    let cancelled = false;
    import('@mlc-ai/web-llm')
      .then((m) => {
        if (cancelled) return;
        const ids = m.prebuiltAppConfig.model_list
          .filter(
            (rec) => rec.model_type === undefined || rec.model_type === m.ModelType.LLM
          )
          .map((rec) => rec.model_id);
        setWebLlmModelIds(ids);
      })
      .catch(() => {
        if (!cancelled) setWebLlmModelIds([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
      <h3 className="text-sm font-semibold text-gray-900">Persona AI (sparkles)</h3>
      <p className="text-xs text-gray-500 leading-relaxed">
        Choose how plan-entry sparkles runs: local{' '}
        <strong className="font-medium text-gray-700">Ollama</strong> or in-browser{' '}
        <strong className="font-medium text-gray-700">WebLLM</strong> (WebGPU; first run downloads
        the model).
      </p>

      <fieldset className="space-y-2">
        <legend className="sr-only">AI backend</legend>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="radio"
            name="persona-ai-backend"
            checked={backend === 'ollama'}
            onChange={() => setBackend('ollama')}
            className="mt-0.5"
          />
          <span className="text-xs text-gray-700">
            <span className="font-medium">Ollama</span> — local server (same prompts as before).
          </span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="radio"
            name="persona-ai-backend"
            checked={backend === 'webllm'}
            onChange={() => setBackend('webllm')}
            className="mt-0.5"
          />
          <span className="text-xs text-gray-700">
            <span className="font-medium">WebLLM</span> — runs in this browser; needs WebGPU and
            network for the first model fetch.
          </span>
        </label>
      </fieldset>

      {backend === 'ollama' && (
        <>
          <p className="text-xs text-gray-500 leading-relaxed">
            In dev, <code className="text-gray-700 bg-gray-100 px-1 rounded">/ollama</code> is
            proxied to Ollama (avoids CORS). Direct{' '}
            <code className="text-gray-700 bg-gray-100 px-1 rounded">http://127.0.0.1:11434</code>{' '}
            is rewritten to that proxy while developing. For a static/production build, use
            Ollama&apos;s <code className="text-gray-700 bg-gray-100 px-1 rounded">OLLAMA_ORIGINS</code>{' '}
            or your own proxy.
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
        </>
      )}

      {backend === 'webllm' && (
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-600" htmlFor="webllm-model">
            WebLLM model
          </label>
          {webLlmModelIds.length > 0 ? (
            <select
              id="webllm-model"
              value={webLlmModelIds.includes(webLlmModelId) ? webLlmModelId : ''}
              onChange={(e) => {
                const v = e.target.value;
                if (v) setWebLlmModelId(v);
              }}
              className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 bg-white"
            >
              <option value="">Other / custom (use field below)</option>
              {webLlmModelIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          ) : null}
          <input
            id="webllm-model-custom"
            type="text"
            value={webLlmModelId}
            onChange={(e) => setWebLlmModelId(e.target.value)}
            placeholder={DEFAULT_WEBLLM_MODEL}
            className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 font-mono text-xs"
          />
          <p className="text-[11px] text-gray-400">
            Pick from the list when available, or paste a prebuilt{' '}
            <code className="text-gray-600 bg-gray-100 px-0.5 rounded">model_id</code> from WebLLM
            docs.
          </p>
        </div>
      )}
    </div>
  );
};
