import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import type { Persona } from '../../types';
import { generateId, getTimestamp } from '../../utils/taskUtils';
import {
  loadPersonas,
  savePersonas,
  loadDefaultPersonaId,
  saveDefaultPersonaId,
} from '../../utils/personaStorage';

export const PersonasSettings: React.FC = () => {
  const [personas, setPersonas] = useState<Persona[]>(loadPersonas);
  const [defaultId, setDefaultId] = useState<string | null>(loadDefaultPersonaId);
  const [newName, setNewName] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editInstructions, setEditInstructions] = useState('');

  useEffect(() => {
    savePersonas(personas);
  }, [personas]);

  useEffect(() => {
    saveDefaultPersonaId(defaultId);
  }, [defaultId]);

  useEffect(() => {
    if (personas.length === 0) {
      setDefaultId(null);
      return;
    }
    if (defaultId == null || !personas.some((p) => p.id === defaultId)) {
      setDefaultId(personas[0].id);
    }
  }, [personas, defaultId]);

  const startEdit = (p: Persona) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditInstructions(p.instructions);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditInstructions('');
  };

  const saveEdit = () => {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) return;
    setPersonas((prev) =>
      prev.map((p) =>
        p.id === editingId ? { ...p, name, instructions: editInstructions.trim() } : p
      )
    );
    cancelEdit();
  };

  const addPersona = () => {
    const name = newName.trim();
    if (!name) return;
    const p: Persona = {
      id: generateId(),
      name,
      instructions: newInstructions.trim(),
      createdAt: getTimestamp(),
    };
    setPersonas((prev) => [...prev, p]);
    if (defaultId == null || !personas.some((x) => x.id === defaultId)) {
      setDefaultId(p.id);
    }
    setNewName('');
    setNewInstructions('');
  };

  const removePersona = (id: string) => {
    setPersonas((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="px-4 py-3 border-t border-gray-200 space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Personas</h3>
      <p className="text-xs text-gray-500 leading-relaxed">
        Each persona&apos;s instructions become the AI system prompt when you use the sparkles button on a plan entry.
      </p>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {personas.length === 0 && (
          <p className="text-xs text-gray-400 italic py-2">No personas yet. Add one below.</p>
        )}
        {personas.map((p) => (
          <div
            key={p.id}
            className="rounded-lg border border-gray-200/80 bg-gray-50/50 p-2.5 space-y-2"
          >
            {editingId === p.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md"
                  placeholder="Name"
                />
                <textarea
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  rows={4}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md resize-y min-h-[80px]"
                  placeholder="How should this voice respond? (system prompt)"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    className="px-2 py-1 text-xs font-medium bg-amber-500 text-white rounded hover:bg-amber-600"
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-gray-900 truncate">{p.name}</span>
                      {defaultId === p.id && (
                        <Star size={14} className="text-amber-500 shrink-0 fill-amber-500" aria-label="Default" />
                      )}
                    </div>
                    {p.instructions && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 whitespace-pre-wrap">
                        {p.instructions}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDefaultId(p.id)}
                      className="p-1.5 text-gray-400 hover:text-amber-600 rounded-md hover:bg-amber-50"
                      title="Set as default"
                      aria-label={`Set ${p.name} as default persona`}
                    >
                      <Star size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
                      title="Edit"
                      aria-label={`Edit ${p.name}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePersona(p.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                      title="Delete"
                      aria-label={`Delete ${p.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-1 border-t border-dashed border-gray-200">
        <p className="text-xs font-medium text-gray-600">New persona</p>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Name (e.g. Writing coach)"
          className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
        />
        <textarea
          value={newInstructions}
          onChange={(e) => setNewInstructions(e.target.value)}
          rows={3}
          placeholder="Instructions: tone, role, what to focus on…"
          className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg resize-y min-h-[72px] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
        />
        <button
          type="button"
          onClick={addPersona}
          disabled={!newName.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 disabled:pointer-events-none"
        >
          <Plus size={14} />
          Add persona
        </button>
      </div>
    </div>
  );
};
