import type {
  Prompt,
  AINote,
  PromptHistoryEntry,
  PromptCollection,
  Workspace
} from '~/infrastructure/storage/schema';
import { storage } from '~/infrastructure/storage/storage.service';

export type SyncDataType = {
  prompts: Prompt[];
  notes: AINote[];
  history: PromptHistoryEntry[];
  collections: PromptCollection[];
  workspaces: Workspace[];
};

export type BackupFile = {
  app: 'aidock';
  version: number;
  exportedAt: number;
  data: SyncDataType;
};

export type ImportMode = 'merge' | 'replace';

export type ImportResult = {
  imported: boolean;
  counts: {
    prompts: number;
    notes: number;
    history: number;
    collections: number;
    workspaces: number;
  };
  skipped: number;
  message: string;
};

export const BACKUP_VERSION = 1;

type Timestamped = { id: string; updatedAt: number };

/**
 * Merges two arrays of timestamped entities using last-write-wins by `updatedAt`,
 * keyed by `id`. The result keeps the newer version of each entity, and includes
 * entities that exist in only one side.
 */
export function mergeByUpdatedAt<T extends Timestamped>(local: readonly T[], remote: readonly T[]): T[] {
  const byId = new Map<string, T>();
  for (const item of local) {
    byId.set(item.id, item);
  }
  for (const item of remote) {
    const existing = byId.get(item.id);
    if (!existing || item.updatedAt > existing.updatedAt) {
      byId.set(item.id, item);
    }
  }
  return [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Builds a full backup object from the current local stores. */
export async function buildBackup(): Promise<BackupFile> {
  const [prompts, notes, history, collections, workspaces] = await Promise.all([
    storage.prompts.getAll(),
    storage.notes.getAll(),
    storage.history.getAll(),
    storage.collections.getAll(),
    storage.workspaces.getAll()
  ]);
  return {
    app: 'aidock',
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    data: { prompts, notes, history, collections, workspaces }
  };
}

/** Serializes a full backup to a formatted JSON string. */
export async function exportBackupJson(): Promise<string> {
  const backup = await buildBackup();
  return JSON.stringify(backup, null, 2);
}

/** Validates raw JSON into a BackupFile, throwing on malformed input. */
export function parseBackupJson(raw: string): BackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON: the backup file could not be parsed.');
  }

  if (parsed === null || typeof parsed !== 'object') {
    throw new Error('Invalid backup: expected an object.');
  }

  const backup = parsed as Partial<BackupFile>;
  if (backup.app !== 'aidock') {
    throw new Error('Invalid backup: this is not an AIDock backup file.');
  }
  if (typeof backup.data !== 'object' || backup.data === null) {
    throw new Error('Invalid backup: missing data payload.');
  }

  const data = backup.data as Partial<SyncDataType>;
  return {
    app: 'aidock',
    version: typeof backup.version === 'number' ? backup.version : BACKUP_VERSION,
    exportedAt: typeof backup.exportedAt === 'number' ? backup.exportedAt : Date.now(),
    data: {
      prompts: Array.isArray(data.prompts) ? data.prompts : [],
      notes: Array.isArray(data.notes) ? data.notes : [],
      history: Array.isArray(data.history) ? data.history : [],
      collections: Array.isArray(data.collections) ? data.collections : [],
      workspaces: Array.isArray(data.workspaces) ? data.workspaces : []
    }
  };
}

/**
 * Imports a backup into local storage.
 * - `merge`: merges entity-by-entity with last-write-wins on `updatedAt`.
 * - `replace`: overwrites every store with the backup's contents.
 * Returns a summary of what changed.
 */
export async function importBackup(raw: string, mode: ImportMode): Promise<ImportResult> {
  const backup = parseBackupJson(raw);
  const incoming = backup.data;

  if (mode === 'replace') {
    await Promise.all([
      storage.prompts.setAll(incoming.prompts),
      storage.notes.setAll(incoming.notes),
      storage.history.setAll(incoming.history),
      storage.collections.setAll(incoming.collections),
      storage.workspaces.setAll(incoming.workspaces)
    ]);
    return {
      imported: true,
      counts: {
        prompts: incoming.prompts.length,
        notes: incoming.notes.length,
        history: incoming.history.length,
        collections: incoming.collections.length,
        workspaces: incoming.workspaces.length
      },
      skipped: 0,
      message: 'Replaced local data with backup.'
    };
  }

  // merge mode
  const [localPrompts, localNotes, localHistory, localCollections, localWorkspaces] = await Promise.all([
    storage.prompts.getAll(),
    storage.notes.getAll(),
    storage.history.getAll(),
    storage.collections.getAll(),
    storage.workspaces.getAll()
  ]);

  const mergedPrompts = mergeByUpdatedAt(localPrompts, incoming.prompts);
  const mergedNotes = mergeByUpdatedAt(localNotes, incoming.notes);
  const mergedHistory = mergeByUpdatedAt(localHistory, incoming.history);
  const mergedCollections = mergeByUpdatedAt(localCollections, incoming.collections);
  const mergedWorkspaces = mergeByUpdatedAt(localWorkspaces, incoming.workspaces);

  await Promise.all([
    storage.prompts.setAll(mergedPrompts),
    storage.notes.setAll(mergedNotes),
    storage.history.setAll(mergedHistory),
    storage.collections.setAll(mergedCollections),
    storage.workspaces.setAll(mergedWorkspaces)
  ]);

  return {
    imported: true,
    counts: {
      prompts: mergedPrompts.length,
      notes: mergedNotes.length,
      history: mergedHistory.length,
      collections: mergedCollections.length,
      workspaces: mergedWorkspaces.length
    },
    skipped: 0,
    message: 'Merged backup into local data (newer versions won).'
  };
}
