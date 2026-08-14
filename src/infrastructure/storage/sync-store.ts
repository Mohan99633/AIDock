/**
 * Lightweight wrapper around chrome.storage.sync.
 *
 * chrome.storage.sync mirrors small amounts of data across the user's signed-in
 * Chrome browsers (free, no backend). Chrome caps it at ~100KB total, so this is
 * used for small metadata (last-sync timestamp, sync toggle) rather than full
 * entity payloads. For robust cross-device data transfer, use the JSON
 * export/import engine in `src/features/sync/`.
 */

import { getLocalValue, setLocalValue } from '~/infrastructure/storage/local-store';

export const SYNC_METADATA_KEY = 'aidock.sync.metadata';

export type SyncMetadata = {
  lastSyncAt: number | null;
  autoSyncEnabled: boolean;
};

/** Reads sync metadata, falling back to local storage when chrome.storage.sync is unavailable. */
export async function getSyncMetadata(): Promise<SyncMetadata> {
  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    const result = await chrome.storage.sync.get(SYNC_METADATA_KEY);
    const value = result[SYNC_METADATA_KEY] as SyncMetadata | undefined;
    if (value) return value;
  }
  const fallback = await getLocalValue<SyncMetadata>(SYNC_METADATA_KEY);
  return fallback ?? { lastSyncAt: null, autoSyncEnabled: false };
}

/** Writes sync metadata (mirrors to chrome.storage.sync when available). */
export async function setSyncMetadata(metadata: SyncMetadata): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    await chrome.storage.sync.set({ [SYNC_METADATA_KEY]: metadata });
  }
  await setLocalValue(SYNC_METADATA_KEY, metadata);
}
