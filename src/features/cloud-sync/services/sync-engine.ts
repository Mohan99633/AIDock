import type { Prompt, AINote, PromptHistoryEntry, PromptCollection, Workspace } from '~/infrastructure/storage/schema';
import { storage } from '~/infrastructure/storage/storage.service';
import { getSyncMetadata, setSyncMetadata } from '~/infrastructure/storage/sync-store';
import { getLocalValue, setLocalValue } from '~/infrastructure/storage/local-store';

/**
 * Cloud API client interface - to be implemented by backend integration
 */
export interface CloudApiClient {
  /**
   * Push local changes to the cloud
   */
  pushChanges(payload: SyncPayload): Promise<SyncPushResult>;

  /**
   * Pull remote changes from the cloud
   */
  pullChanges(lastSyncedAt: number): Promise<SyncPullResult>;
}

/**
 * Payload for pushing local changes to cloud
 */
export interface SyncPayload {
  prompts: Prompt[];
  notes: AINote[];
  history: PromptHistoryEntry[];
  collections: PromptCollection[];
  workspaces: Workspace[];
  lastSyncedAt: number;
}

/**
 * Result of pushing changes to cloud
 */
export interface SyncPushResult {
  success: boolean;
  syncedIds: {
    prompts: string[];
    notes: string[];
    history: string[];
    collections: string[];
    workspaces: string[];
  };
  serverTimestamp: number;
  error?: string;
}

/**
 * Result of pulling changes from cloud
 */
export interface SyncPullResult {
  success: boolean;
  data: SyncPayload | null;
  serverTimestamp: number;
  error?: string;
}

/**
 * Sync queue item for offline mutation tracking
 */
export interface SyncQueueItem {
  id: string;
  entityType: 'prompts' | 'notes' | 'history' | 'collections' | 'workspaces';
  operation: 'create' | 'update' | 'delete';
  entityId: string;
  payload?: unknown;
  timestamp: number;
  retryCount: number;
}

const SYNC_QUEUE_KEY = 'aidock.sync.queue';

/**
 * SyncEngine - handles bidirectional synchronization between local IndexedDB and cloud backend
 */
export class SyncEngine {
  private cloudApiClient: CloudApiClient | null = null;
  private isSyncing = false;
  private autoSyncEnabled = false;
  private onlineListener: (() => void) | null = null;
  private offlineListener: (() => void) | null = null;
  private syncIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.setupNetworkListeners();
  }

  /**
   * Set the cloud API client implementation
   */
  setCloudApiClient(client: CloudApiClient): void {
    this.cloudApiClient = client;
  }

  /**
   * Enable or disable auto-sync
   */
  setAutoSync(enabled: boolean): void {
    this.autoSyncEnabled = enabled;
    if (enabled) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
    // Persist the setting
    this.persistAutoSyncSetting(enabled);
  }

  /**
   * Check if auto-sync is enabled
   */
  async isAutoSyncEnabled(): Promise<boolean> {
    const metadata = await getSyncMetadata();
    return metadata.autoSyncEnabled;
  }

  /**
   * Trigger a manual sync
   */
  async triggerSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, error: 'Sync already in progress' };
    }

    if (!this.cloudApiClient) {
      return { success: false, error: 'Cloud API client not configured' };
    }

    this.isSyncing = true;
    const result = await this.performSync();
    this.isSyncing = false;
    return result;
  }

  /**
   * Get the count of pending items in the sync queue
   */
  async getPendingCount(): Promise<number> {
    const queue = await this.getSyncQueue();
    return queue.length;
  }

  /**
   * Get the last synced timestamp
   */
  async getLastSyncedAt(): Promise<number | null> {
    const metadata = await getSyncMetadata();
    return metadata.lastSyncAt;
  }

  /**
   * Clear the sync queue (for testing or manual reset)
   */
  async clearSyncQueue(): Promise<void> {
    await setLocalValue(SYNC_QUEUE_KEY, []);
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return {
      isSyncing: this.isSyncing,
      autoSyncEnabled: this.autoSyncEnabled,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
    };
  }

  /**
   * Add a mutation to the sync queue
   */
  async enqueueMutation(
    entityType: SyncQueueItem['entityType'],
    operation: SyncQueueItem['operation'],
    entityId: string,
    payload?: unknown
  ): Promise<void> {
    const queue = await this.getSyncQueue();
    const item: SyncQueueItem = {
      id: crypto.randomUUID(),
      entityType,
      operation,
      entityId,
      payload,
      timestamp: Date.now(),
      retryCount: 0
    };
    queue.push(item);
    await setLocalValue(SYNC_QUEUE_KEY, queue);
  }

  /**
   * Perform the full sync cycle: push local changes, pull remote changes
   */
  private async performSync(): Promise<SyncResult> {
    try {
      // Get last sync timestamp
      const metadata = await getSyncMetadata();
      const lastSyncedAt = metadata.lastSyncAt ?? 0;

      // Step 1: Read pending mutations from sync_queue
      const queue = await this.getSyncQueue();

      // Step 2: Build payload from queue + all entities (for full sync)
      const payload = await this.buildSyncPayload(lastSyncedAt, queue);

      // Step 3: Push changes to cloud
      const pushResult = await this.cloudApiClient!.pushChanges(payload);

      if (!pushResult.success) {
        throw new Error(pushResult.error ?? 'Push failed');
      }

      // Step 4: Remove successfully synced items from queue
      await this.removeSyncedFromQueue(pushResult.syncedIds);

      // Step 5: Update entity syncStatus to 'synced' in IndexedDB
      await this.markEntitiesSynced(pushResult.syncedIds);

      // Step 6: Pull remote changes
      const pullResult = await this.cloudApiClient!.pullChanges(pushResult.serverTimestamp);

      if (!pullResult.success) {
        throw new Error(pullResult.error ?? 'Pull failed');
      }

      // Step 7: Write pulled changes into local IndexedDB
      if (pullResult.data) {
        await this.applyRemoteChanges(pullResult.data);
      }

      // Step 8: Update lastSyncedAt timestamp
      await setSyncMetadata({
        lastSyncAt: pullResult.serverTimestamp,
        autoSyncEnabled: metadata.autoSyncEnabled
      });

      return {
        success: true,
        lastSyncedAt: pullResult.serverTimestamp,
        pushedCount: this.countSyncedIds(pushResult.syncedIds),
        pulledCount: pullResult.data ? this.countPayload(pullResult.data) : 0
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Build sync payload from local data and queue
   */
  private async buildSyncPayload(lastSyncedAt: number, queue: SyncQueueItem[]): Promise<SyncPayload> {
    // Get all entities that have been updated since last sync
    const [prompts, notes, history, collections, workspaces] = await Promise.all([
      storage.prompts.getAll(),
      storage.notes.getAll(),
      storage.history.getAll(),
      storage.collections.getAll(),
      storage.workspaces.getAll()
    ]);

    // Filter to only include items updated since last sync or in the queue
    const queueEntityIds = new Map<string, Set<string>>();
    for (const item of queue) {
      if (!queueEntityIds.has(item.entityType)) {
        queueEntityIds.set(item.entityType, new Set());
      }
      queueEntityIds.get(item.entityType)!.add(item.entityId);
    }

    const filterBySync = <T extends { updatedAt: number; id: string }>(
      items: T[],
      entityType: string
    ): T[] => {
      const queuedIds = queueEntityIds.get(entityType) ?? new Set();
      return items.filter(item => item.updatedAt > lastSyncedAt || queuedIds.has(item.id));
    };

    return {
      prompts: filterBySync(prompts, 'prompts'),
      notes: filterBySync(notes, 'notes'),
      history: filterBySync(history, 'history'),
      collections: filterBySync(collections, 'collections'),
      workspaces: filterBySync(workspaces, 'workspaces'),
      lastSyncedAt
    };
  }

  /**
   * Remove successfully synced items from the queue
   */
  private async removeSyncedFromQueue(syncedIds: SyncPushResult['syncedIds']): Promise<void> {
    const queue = await this.getSyncQueue();
    const syncedIdSet = new Set([
      ...syncedIds.prompts,
      ...syncedIds.notes,
      ...syncedIds.history,
      ...syncedIds.collections,
      ...syncedIds.workspaces
    ]);

    const filteredQueue = queue.filter(item => !syncedIdSet.has(item.entityId));
    await setLocalValue(SYNC_QUEUE_KEY, filteredQueue);
  }

  /**
   * Mark entities as synced in IndexedDB (update syncStatus if field exists)
   */
  private async markEntitiesSynced(syncedIds: SyncPushResult['syncedIds']): Promise<void> {
    // For each entity type, update the items that were synced
    // Note: Since our schema doesn't have a syncStatus field, we just ensure
    // the updatedAt is current. In a real implementation, you might add a
    // syncStatus field to the schema.
    // This is a no-op for now but provides the hook for future enhancement.
  }

  /**
   * Apply remote changes to local IndexedDB
   */
  private async applyRemoteChanges(payload: SyncPayload): Promise<void> {
    await Promise.all([
      storage.prompts.setAll(payload.prompts),
      storage.notes.setAll(payload.notes),
      storage.history.setAll(payload.history),
      storage.collections.setAll(payload.collections),
      storage.workspaces.setAll(payload.workspaces)
    ]);
  }

  /**
   * Get the sync queue from local storage
   */
  private async getSyncQueue(): Promise<SyncQueueItem[]> {
    const queue = await getLocalValue<SyncQueueItem[]>(SYNC_QUEUE_KEY);
    return queue ?? [];
  }

  /**
   * Persist auto-sync setting to metadata
   */
  private async persistAutoSyncSetting(enabled: boolean): Promise<void> {
    const metadata = await getSyncMetadata();
    await setSyncMetadata({
      ...metadata,
      autoSyncEnabled: enabled
    });
  }

  /**
   * Setup network online/offline listeners
   */
  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    this.onlineListener = () => {
      if (this.autoSyncEnabled && !this.isSyncing) {
        this.triggerSync();
      }
    };

    this.offlineListener = () => {
      // Could trigger UI notification here
    };

    window.addEventListener('online', this.onlineListener);
    window.addEventListener('offline', this.offlineListener);
  }

  /**
   * Start auto-sync interval
   */
  private startAutoSync(): void {
    if (this.syncIntervalId) return;

    // Sync every 5 minutes when online
    this.syncIntervalId = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.triggerSync();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Stop auto-sync interval
   */
  private stopAutoSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  /**
   * Cleanup listeners and intervals
   */
  destroy(): void {
    if (this.onlineListener) {
      window.removeEventListener('online', this.onlineListener);
    }
    if (this.offlineListener) {
      window.removeEventListener('offline', this.offlineListener);
    }
    this.stopAutoSync();
  }

  private countSyncedIds(syncedIds: SyncPushResult['syncedIds']): number {
    return syncedIds.prompts.length + syncedIds.notes.length +
           syncedIds.history.length + syncedIds.collections.length +
           syncedIds.workspaces.length;
  }

  private countPayload(payload: SyncPayload): number {
    return payload.prompts.length + payload.notes.length +
           payload.history.length + payload.collections.length +
           payload.workspaces.length;
  }
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  success: boolean;
  lastSyncedAt?: number;
  pushedCount?: number;
  pulledCount?: number;
  error?: string;
}

/**
 * Current sync status
 */
export interface SyncStatus {
  isSyncing: boolean;
  autoSyncEnabled: boolean;
  isOnline: boolean;
}

/**
 * Default singleton instance
 */
export const syncEngine = new SyncEngine();