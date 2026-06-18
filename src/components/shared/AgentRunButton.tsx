import React, { useEffect, useRef, useState } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { Task } from '../../types';
import { useTaskContext } from '../../context/TaskContext';
import { loadAgents } from '../../utils/agentStorage';
import { agentInputLabel, serializeAgentInput } from '../../utils/agentInput';
import { runAgent } from '../../utils/runAgent';
import { AgentResultModal } from './AgentResultModal';

interface AgentRunButtonProps {
  task: Task;
  className?: string;
}

export const AgentRunButton: React.FC<AgentRunButtonProps> = ({ task, className = '' }) => {
  const { tasks } = useTaskContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    agentName: string;
    inputPreview: string;
    output: string;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const agents = loadAgents();

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setError(null);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [menuOpen]);

  const handleRun = async (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;

    setRunningAgentId(agentId);
    setError(null);
    setMenuOpen(false);

    try {
      const input = serializeAgentInput(task, tasks);
      const output = await runAgent({ agent, input });
      setResult({
        agentName: agent.name,
        inputPreview: input,
        output,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Agent run failed.');
      setMenuOpen(true);
    } finally {
      setRunningAgentId(null);
    }
  };

  const isRunning = runningAgentId !== null;
  const inputLabel = agentInputLabel(task);

  return (
    <>
      <div ref={menuRef} className={`relative ${className}`}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((open) => !open);
            setError(null);
          }}
          disabled={isRunning}
          className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all disabled:opacity-50"
          title="Run AI agent"
          aria-label={`Run AI agent on ${inputLabel.toLowerCase()}`}
        >
          {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
        </button>

        {menuOpen && (
          <div className="absolute end-0 top-full mt-1 z-20 w-56 rounded-lg border border-gray-200 bg-white shadow-lg py-1">
            {agents.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-500">
                No agents configured. Add one in Settings → AI.
              </p>
            ) : (
              agents.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleRun(agent.id);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-amber-50 transition-colors truncate"
                  title={agent.systemPrompt || agent.name}
                >
                  {agent.name}
                </button>
              ))
            )}
            {error && (
              <p className="px-3 py-2 text-xs text-red-600 border-t border-gray-100">{error}</p>
            )}
          </div>
        )}
      </div>

      {result && (
        <AgentResultModal
          agentName={result.agentName}
          inputLabel={inputLabel}
          inputPreview={result.inputPreview}
          output={result.output}
          onClose={() => setResult(null)}
        />
      )}
    </>
  );
};
