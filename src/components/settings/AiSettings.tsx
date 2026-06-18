import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AiAgent } from '../../types';
import {
  DEFAULT_GEMINI_MODEL,
  loadGeminiApiKey,
  loadGeminiModel,
  saveGeminiApiKey,
  saveGeminiModel,
} from '../../utils/geminiStorage';
import { createAgent, loadAgents, saveAgents } from '../../utils/agentStorage';
import { geminiTestConnection } from '../../utils/geminiClient';

export const AiSettings: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState(loadGeminiApiKey);
  const [model, setModel] = useState(loadGeminiModel);
  const [agents, setAgents] = useState<AiAgent[]>(loadAgents);
  const [testStatus, setTestStatus] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    saveGeminiApiKey(apiKey);
  }, [apiKey]);

  useEffect(() => {
    saveGeminiModel(model);
  }, [model]);

  useEffect(() => {
    saveAgents(agents);
  }, [agents]);

  const updateAgent = (id: string, updates: Partial<Pick<AiAgent, 'name' | 'systemPrompt'>>) => {
    setAgents((current) =>
      current.map((agent) => (agent.id === id ? { ...agent, ...updates } : agent))
    );
  };

  const addAgent = () => {
    setAgents((current) => [...current, createAgent()]);
  };

  const removeAgent = (id: string) => {
    setAgents((current) => current.filter((agent) => agent.id !== id));
  };

  const handleTest = async () => {
    setTesting(true);
    setTestStatus('idle');
    setTestMessage('');
    try {
      const result = await geminiTestConnection(apiKey, model);
      if (result.ok) {
        setTestStatus('ok');
      } else {
        setTestStatus('fail');
        setTestMessage(result.message);
      }
    } catch {
      setTestStatus('fail');
      setTestMessage('Unexpected error while testing.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="px-4 py-3 border-t border-gray-200 space-y-4">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">AI</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          Connect to Google AI Studio using your API key. The default model is{' '}
          <strong className="font-medium text-gray-700">Gemma 4 31B</strong>{' '}
          (<code className="text-gray-700 bg-gray-100 px-1 rounded">{DEFAULT_GEMINI_MODEL}</code>).
        </p>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-600" htmlFor="gemini-api-key">
            API key
          </label>
          <input
            id="gemini-api-key"
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setTestStatus('idle');
              setTestMessage('');
            }}
            placeholder="Paste your Google AI Studio API key"
            autoComplete="off"
            spellCheck={false}
            className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 font-mono"
          />
          <p className="text-[11px] text-gray-400">
            Create a key at{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-700 hover:underline"
            >
              Google AI Studio
            </a>
            . Stored locally in this browser.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-600" htmlFor="gemini-model">
            Model
          </label>
          <input
            id="gemini-model"
            type="text"
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              setTestStatus('idle');
              setTestMessage('');
            }}
            placeholder={DEFAULT_GEMINI_MODEL}
            className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 font-mono text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !apiKey.trim()}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-50 transition-colors shrink-0"
          >
            {testing ? 'Testing…' : 'Test connection'}
          </button>
          {testStatus === 'ok' && (
            <span className="text-xs text-green-600">Connected</span>
          )}
          {testStatus === 'fail' && (
            <span className="text-xs text-red-600">{testMessage || 'Could not reach Gemini'}</span>
          )}
          {testStatus === 'ok' && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="ml-auto px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shrink-0"
            >
              Close
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 pt-1 border-t border-gray-100">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Agents</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Each agent has a system prompt. Run agents on entries, text blocks, and tasks.
            </p>
          </div>
          <button
            type="button"
            onClick={addAgent}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors shrink-0"
          >
            <Plus size={14} />
            Add
          </button>
        </div>

        {agents.length === 0 ? (
          <p className="text-xs text-gray-400 rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center">
            No agents yet. Add one to run AI on your entries, text, and tasks.
          </p>
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="rounded-lg border border-gray-200 bg-gray-50/40 p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={agent.name}
                    onChange={(e) => updateAgent(agent.id, { name: e.target.value })}
                    placeholder="Agent name"
                    className="flex-1 min-w-0 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeAgent(agent.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    aria-label={`Delete ${agent.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-gray-500">
                    System prompt
                  </label>
                  <textarea
                    value={agent.systemPrompt}
                    onChange={(e) => updateAgent(agent.id, { systemPrompt: e.target.value })}
                    placeholder="Instructions for the model when this agent runs…"
                    rows={4}
                    className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 bg-white resize-y min-h-[5rem]"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
