import { create } from 'zustand';

import { getLocalValue, setLocalValue } from '~/infrastructure/storage/local-store';
import { DEFAULT_WORKSPACE_ID } from '~/infrastructure/storage/storage.service';
import type { Workspace } from '~/infrastructure/storage/schema';

export const ACTIVE_WORKSPACE_KEY = 'aidock.workspace.activeId';

type WorkspaceState = {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setActiveWorkspace: (id: string) => Promise<void>;
  setWorkspaces: (workspaces: Workspace[]) => void;
};

/**
 * Holds the workspace list and the user's currently active workspace.
 * Hydrates the default workspace on first load.
 */
export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  activeWorkspaceId: DEFAULT_WORKSPACE_ID,
  hydrated: false,
  async hydrate() {
    const { storage } = await import('~/infrastructure/storage/storage.service');
    const workspaces = await storage.workspaces.ensureDefault();
    const saved = await getLocalValue<string>(ACTIVE_WORKSPACE_KEY);
    const activeWorkspaceId =
      saved && workspaces.some((w) => w.id === saved) ? saved : DEFAULT_WORKSPACE_ID;
    set({ workspaces, activeWorkspaceId, hydrated: true });
  },
  async setActiveWorkspace(id) {
    await setLocalValue(ACTIVE_WORKSPACE_KEY, id);
    set({ activeWorkspaceId: id });
  },
  setWorkspaces(workspaces) {
    set({ workspaces });
  }
}));