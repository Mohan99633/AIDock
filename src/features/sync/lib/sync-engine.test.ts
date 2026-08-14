import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Prompt, AINote, PromptCollection, Workspace } from '~/infrastructure/storage/schema';
import { mergeByUpdatedAt, parseBackupJson, BACKUP_VERSION } from './sync-engine';

describe('mergeByUpdatedAt', () => {
  type Item = { id: string; updatedAt: number; label: string };

  it('keeps the newer version of each entity by id', () => {
    const local: Item[] = [{ id: 'a', updatedAt: 100, label: 'old' }];
    const remote: Item[] = [{ id: 'a', updatedAt: 200, label: 'new' }];
    const merged = mergeByUpdatedAt(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.label).toBe('new');
  });

  it('keeps local when it is newer', () => {
    const local: Item[] = [{ id: 'a', updatedAt: 200, label: 'local' }];
    const remote: Item[] = [{ id: 'a', updatedAt: 100, label: 'remote' }];
    expect(mergeByUpdatedAt(local, remote)[0]!.label).toBe('local');
  });

  it('includes entities that exist on only one side', () => {
    const local: Item[] = [{ id: 'a', updatedAt: 100, label: 'a' }];
    const remote: Item[] = [{ id: 'b', updatedAt: 100, label: 'b' }];
    const merged = mergeByUpdatedAt(local, remote);
    expect(merged.map((i) => i.id).sort()).toEqual(['a', 'b']);
  });

  it('handles empty inputs', () => {
    expect(mergeByUpdatedAt([], [])).toEqual([]);
    const single: Item[] = [{ id: 'a', updatedAt: 1, label: 'a' }];
    expect(mergeByUpdatedAt(single, [])).toHaveLength(1);
  });
});

describe('parseBackupJson', () => {
  it('parses a valid backup', () => {
    const raw = JSON.stringify({
      app: 'aidock',
      version: 1,
      exportedAt: 123,
      data: { prompts: [{ id: 'p1' }], notes: [], history: [], collections: [], workspaces: [] }
    });
    const backup = parseBackupJson(raw);
    expect(backup.app).toBe('aidock');
    expect(backup.version).toBe(BACKUP_VERSION);
    expect(backup.data.prompts).toHaveLength(1);
  });

  it('tolerates missing arrays by defaulting to empty', () => {
    const raw = JSON.stringify({ app: 'aidock', data: {} });
    const backup = parseBackupJson(raw);
    expect(backup.data.notes).toEqual([]);
    expect(backup.data.workspaces).toEqual([]);
  });

  it('throws on invalid JSON', () => {
    expect(() => parseBackupJson('not json')).toThrow(/Invalid JSON/);
  });

  it('throws when the file is not from AIDock', () => {
    expect(() => parseBackupJson('{"app":"other"}')).toThrow(/not an AIDock backup/);
  });

  it('throws when data payload is missing', () => {
    expect(() => parseBackupJson('{"app":"aidock"}')).toThrow(/missing data payload/);
  });
});

// ─── importBackup via a mocked storage layer ───────────────────────────────

vi.mock('~/infrastructure/storage/storage.service', () => {
  const boxes: Record<string, unknown[]> = {};
  const service = <T>(key: string) => ({
    getAll: vi.fn(async () => [...(boxes[key] ?? [])]),
    setAll: vi.fn(async (items: T[]) => {
      boxes[key] = [...items];
    }),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    getById: vi.fn(),
    ensureDefault: vi.fn(async () => boxes[key] ?? [])
  });
  return {
    storage: {
      prompts: service<Prompt>('prompts'),
      notes: service<AINote>('notes'),
      history: service('history'),
      collections: service<PromptCollection>('collections'),
      workspaces: service<Workspace>('workspaces')
    },
    DEFAULT_WORKSPACE_ID: 'default'
  };
});

import { storage } from '~/infrastructure/storage/storage.service';
import { importBackup } from './sync-engine';

describe('importBackup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('replace mode overwrites local data', async () => {
    await storage.prompts.setAll([{ id: 'local', updatedAt: 1, title: 'L', content: 'c', tags: [], isFavorite: false, createdAt: 1 }]);
    const raw = JSON.stringify({
      app: 'aidock',
      version: 1,
      exportedAt: 1,
      data: {
        prompts: [{ id: 'remote', updatedAt: 2, title: 'R', content: 'c', tags: [], isFavorite: false, createdAt: 2 }],
        notes: [],
        history: [],
        collections: [],
        workspaces: []
      }
    });
    const result = await importBackup(raw, 'replace');
    expect(result.imported).toBe(true);
    const after = await storage.prompts.getAll();
    expect(after.map((p: Prompt) => p.id)).toEqual(['remote']);
  });

  it('merge mode keeps the newer prompt', async () => {
    await storage.prompts.setAll([{ id: 'p', updatedAt: 100, title: 'old', content: 'c', tags: [], isFavorite: false, createdAt: 1 }]);
    const raw = JSON.stringify({
      app: 'aidock',
      version: 1,
      exportedAt: 1,
      data: {
        prompts: [{ id: 'p', updatedAt: 200, title: 'new', content: 'c', tags: [], isFavorite: false, createdAt: 1 }],
        notes: [],
        history: [],
        collections: [],
        workspaces: []
      }
    });
    await importBackup(raw, 'merge');
    const after = await storage.prompts.getAll();
    expect(after[0]!.title).toBe('new');
  });
});
