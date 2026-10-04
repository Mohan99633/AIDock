import React, { useState } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { useWorkspaceStore } from '~/features/workspaces/state/workspace-store';
import { cn } from '~/shared/lib/cn';

type WorkspaceSwitcherProps = {
  /** Called when the user asks to create/edit workspaces. */
  onManage?: () => void;
};

/**
 * Dropdown switcher for choosing the active workspace.
 * Renders the active workspace's name/color chip; opening it lists all workspaces.
 */
export function WorkspaceSwitcher({ onManage }: WorkspaceSwitcherProps): JSX.Element {
  const { workspaces, activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore();
  const [open, setOpen] = useState(false);

  const active = workspaces.find((w) => w.id === activeWorkspaceId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: active?.color ?? '#6366f1' }}
        />
        <span className="max-w-[90px] truncate">{active?.name ?? 'Workspace'}</span>
        <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-52 max-h-[80vh] overflow-y-auto overflow-x-hidden rounded-lg border border-border bg-card shadow-premium animate-in fade-in zoom-in-95 duration-100">
            <ul className="py-1">
              {workspaces.map((ws) => (
                <li key={ws.id}>
                  <button
                    onClick={() => {
                      void setActiveWorkspace(ws.id);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-muted',
                      ws.id === activeWorkspaceId && 'text-primary'
                    )}
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: ws.color }}
                    />
                    <span className="flex-1 truncate">{ws.name}</span>
                    {ws.id === activeWorkspaceId && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-border p-1">
              <button
                onClick={() => {
                  setOpen(false);
                  onManage?.();
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Manage workspaces…
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}