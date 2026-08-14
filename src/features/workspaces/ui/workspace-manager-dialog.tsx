import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, X } from 'lucide-react';
import { storage, DEFAULT_WORKSPACE_ID } from '~/infrastructure/storage/storage.service';
import { useWorkspaceStore } from '~/features/workspaces/state/workspace-store';
import { canAddWorkspace } from '~/features/premium/lib/gating';
import { useLicenseStore } from '~/features/premium/state/license-store';
import { Button } from '~/shared/ui/button';

const WORKSPACE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

export function WorkspaceManagerDialog({ onClose }: { onClose: () => void }): JSX.Element {
  const queryClient = useQueryClient();
  const { workspaces, setWorkspaces, activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore();
  const license = useLicenseStore();
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(WORKSPACE_COLORS[0] ?? '#6366f1');
  const [error, setError] = useState('');

  const refresh = async (): Promise<void> => {
    setWorkspaces(await storage.workspaces.getAll());
    await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
  };

  const createMutation = useMutation({
    mutationFn: () => storage.workspaces.add({ name: name.trim(), color, isDefault: false }),
    onSuccess: () => {
      setName('');
      setColor(WORKSPACE_COLORS[0] ?? '#6366f1');
      void refresh();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => storage.workspaces.delete(id),
    onSuccess: () => {
      void refresh();
    }
  });

  const handleCreate = (): void => {
    if (!name.trim()) return;
    if (!canAddWorkspace(license.tier, workspaces.length)) {
      setError(`Free plan is limited to a few workspaces. Upgrade to Pro for unlimited workspaces.`);
      return;
    }
    setError('');
    createMutation.mutate();
  };

  const handleDelete = (id: string): void => {
    // Can't delete the last/default workspace.
    if (workspaces.length <= 1) {
      setError('You need at least one workspace.');
      return;
    }
    if (id === activeWorkspaceId) {
      const next = workspaces.find((w) => w.id !== id);
      if (next) void setActiveWorkspace(next.id);
    }
    deleteMutation.mutate(id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[340px] rounded-xl border border-border bg-card shadow-premium"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-sm font-semibold">Workspaces</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-3 p-4">
          <ul className="space-y-1.5">
            {workspaces.map((ws) => (
              <li key={ws.id} className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: ws.color }} />
                <span className="flex-1 truncate text-sm">{ws.name}</span>
                {ws.isDefault && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Default
                  </span>
                )}
                {ws.id !== DEFAULT_WORKSPACE_ID && (
                  <button
                    onClick={() => handleDelete(ws.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Delete ${ws.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>

          {error && <p className="text-xs text-rose-500">{error}</p>}

          <div className="space-y-2 border-t border-border pt-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="New workspace name"
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {WORKSPACE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className="inline-block h-5 w-5 rounded-full transition-transform hover:scale-110"
                    style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: 1 }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
              <Button variant="primary" size="sm" onClick={handleCreate} disabled={!name.trim() || createMutation.isPending}>
                <Plus className="h-3.5 w-3.5" />
                Create
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}