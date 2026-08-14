import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { syncEngine, type SyncResult, type SyncStatus } from '../services/sync-engine';

interface CloudSyncState {
  // State
  isSyncing: boolean;
  lastSyncedAt: number | null;
  pendingCount: number;
  error: string | null;
  autoSyncEnabled: boolean;
  isOnline: boolean;

  // Actions
  triggerSync: () => Promise<SyncResult>;
  setAutoSync: (enabled: boolean) => Promise<void>;
  checkPendingCount: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
}

export const useCloudSyncStore = create<CloudSyncState>()(
  persist(
    (set, get) => ({
      // Initial state
      isSyncing: false,
      lastSyncedAt: null,
      pendingCount: 0,
      error: null,
      autoSyncEnabled: false,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

      /**
       * Initialize the store - load persisted settings and set up listeners
       */
      initialize: async () => {
        // Load auto-sync setting from sync engine
        const autoSyncEnabled = await syncEngine.isAutoSyncEnabled();

        // Get initial pending count and last synced time
        const [pendingCount, lastSyncedAt] = await Promise.all([
          syncEngine.getPendingCount(),
          syncEngine.getLastSyncedAt()
        ]);

        // Get current sync status
        const status = syncEngine.getSyncStatus();

        set({
          autoSyncEnabled,
          pendingCount,
          lastSyncedAt,
          isOnline: status.isOnline,
          isSyncing: status.isSyncing
        });

        // Set up online/offline listeners
        if (typeof window !== 'undefined') {
          window.addEventListener('online', () => {
            set({ isOnline: true });
            // Trigger sync if auto-sync is enabled
            if (get().autoSyncEnabled && !get().isSyncing) {
              get().triggerSync();
            }
          });

          window.addEventListener('offline', () => {
            set({ isOnline: false });
          });
        }
      },

      /**
       * Trigger a manual sync
       */
      triggerSync: async () => {
        set({ isSyncing: true, error: null });

        const result = await syncEngine.triggerSync();

        if (result.success) {
          const [pendingCount, lastSyncedAt] = await Promise.all([
            syncEngine.getPendingCount(),
            syncEngine.getLastSyncedAt()
          ]);

          set({
            isSyncing: false,
            pendingCount,
            lastSyncedAt,
            error: null
          });
        } else {
          set({
            isSyncing: false,
            error: result.error ?? 'Sync failed'
          });
        }

        return result;
      },

      /**
       * Enable or disable auto-sync
       */
      setAutoSync: async (enabled: boolean) => {
        await syncEngine.setAutoSync(enabled);
        set({ autoSyncEnabled: enabled });
      },

      /**
       * Check and update pending count
       */
      checkPendingCount: async () => {
        const pendingCount = await syncEngine.getPendingCount();
        set({ pendingCount });
      },

      /**
       * Refresh all status from sync engine
       */
      refreshStatus: async () => {
        const [pendingCount, lastSyncedAt, status] = await Promise.all([
          syncEngine.getPendingCount(),
          syncEngine.getLastSyncedAt(),
          Promise.resolve(syncEngine.getSyncStatus())
        ]);

        set({
          pendingCount,
          lastSyncedAt,
          isSyncing: status.isSyncing,
          autoSyncEnabled: status.autoSyncEnabled,
          isOnline: status.isOnline
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'aidock.cloud-sync.store',
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          const { getLocalValue } = await import('~/infrastructure/storage/local-store');
          const value = await getLocalValue<string>(name);
          return value ?? null;
        },
        setItem: async (name, value) => {
          const { setLocalValue } = await import('~/infrastructure/storage/local-store');
          await setLocalValue(name, value);
        },
        removeItem: async (name) => {
          const { setLocalValue } = await import('~/infrastructure/storage/local-store');
          await setLocalValue(name, null);
        }
      })),
      partialize: (state) => ({
        autoSyncEnabled: state.autoSyncEnabled
      })
    }
  )
);