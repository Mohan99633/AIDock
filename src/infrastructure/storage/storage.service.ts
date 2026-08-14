import { getLocalValue, setLocalValue } from './local-store';
import {
  Prompt,
  AINote,
  PromptHistoryEntry,
  PromptCollection,
  Workspace,
  OBJECT_STORES
} from './schema';

/**
 * Storage Service for AIDock
 * Provides CRUD operations for prompts, notes, history, collections, and workspaces
 * Uses chrome.storage.local via the plasmo storage wrapper
 */

const STORAGE_KEYS = {
  PROMPTS: 'aidock-prompts',
  NOTES: 'aidock-notes',
  HISTORY: 'aidock-history',
  COLLECTIONS: 'aidock-collections',
  WORKSPACES: 'aidock-workspaces'
} as const;

/** The id of the fallback workspace created on first run. */
export const DEFAULT_WORKSPACE_ID = 'default';

/**
 * Generic storage helper for arrays of items
 */
class StorageService<T> {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  /**
   * Get all items from storage
   */
  async getAll(): Promise<T[]> {
    const data = await getLocalValue<T[]>(this.key);
    return data ?? [];
  }

  /**
   * Get item by ID
   */
  async getById(id: string): Promise<T | undefined> {
    const items = await this.getAll();
    return items.find(item => (item as any).id === id);
  }

  /**
   * Add a new item
   */
  async add(item: Partial<T> & { id?: string }): Promise<string> {
    const items = await this.getAll();
    const id = (item as any).id || crypto.randomUUID();
    const newItem = {
      ...item,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now()
    } as unknown as T;

    items.push(newItem);
    await this.saveAll(items);
    return id;
  }

  /**
   * Update an existing item by ID
   */
  async update(id: string, updates: Partial<T>): Promise<boolean> {
    const items = await this.getAll();
    const index = items.findIndex(item => (item as any).id === id);

    if (index === -1) return false;

    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: Date.now()
    } as T;

    await this.saveAll(items);
    return true;
  }

  /**
   * Delete an item by ID
   */
  async delete(id: string): Promise<boolean> {
    const items = await this.getAll();
    const initialLength = items.length;
    const filteredItems = items.filter(item => (item as any).id !== id);

    if (filteredItems.length === initialLength) return false;

    await this.saveAll(filteredItems);
    return true;
  }

  /**
   * Replace all items (use with caution)
   */
  async setAll(items: T[]): Promise<void> {
    await this.saveAll(items);
  }

  /**
   * Clear all items
   */
  async clear(): Promise<void> {
    await setLocalValue<T[]>(this.key, []);
  }

  /**
   * Save array to storage
   */
  private async saveAll(items: T[]): Promise<void> {
    await setLocalValue<T[]>(this.key, items);
  }
}

/**
 * Storage instances for each entity type
 */
export const promptStorage = new StorageService<Prompt>(STORAGE_KEYS.PROMPTS);
export const noteStorage = new StorageService<AINote>(STORAGE_KEYS.NOTES);
export const historyStorage = new StorageService<PromptHistoryEntry>(STORAGE_KEYS.HISTORY);
export const collectionStorage = new StorageService<PromptCollection>(STORAGE_KEYS.COLLECTIONS);
export const workspaceStorage = new StorageService<Workspace>(STORAGE_KEYS.WORKSPACES);

/**
 * Utility functions for common operations
 */
export const storage = {
  // Prompt operations
  prompts: {
    getAll: () => promptStorage.getAll(),
    getById: (id: string) => promptStorage.getById(id),
    setAll: (items: Prompt[]) => promptStorage.setAll(items),
    add: (prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) =>
          promptStorage.add(prompt),
    update: (id: string, updates: Partial<Prompt>) => promptStorage.update(id, updates),
    delete: (id: string) => promptStorage.delete(id),
    clear: () => promptStorage.clear()
  },

  // Note operations
  notes: {
    getAll: () => noteStorage.getAll(),
    getById: (id: string) => noteStorage.getById(id),
    setAll: (items: AINote[]) => noteStorage.setAll(items),
    add: (note: Omit<AINote, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) =>
          noteStorage.add(note),
    update: (id: string, updates: Partial<AINote>) => noteStorage.update(id, updates),
    delete: (id: string) => noteStorage.delete(id),
    clear: () => noteStorage.clear()
  },

  // History operations
  history: {
    getAll: () => historyStorage.getAll(),
    getById: (id: string) => historyStorage.getById(id),
    setAll: (items: PromptHistoryEntry[]) => historyStorage.setAll(items),
    add: (entry: Omit<PromptHistoryEntry, 'id' | 'timestamp' | 'updatedAt'> & { id?: string }) =>
          historyStorage.add({
            ...entry,
            timestamp: Date.now(),
            updatedAt: Date.now(),
            id: entry.id || crypto.randomUUID()
          }),
    update: (id: string, updates: Partial<PromptHistoryEntry>) => historyStorage.update(id, updates),
    delete: (id: string) => historyStorage.delete(id),
    clear: () => historyStorage.clear(),
    // Add a history entry from a prompt and response
    addFromInteraction: async (
      promptContent: string,
      aiResponseContent: string,
      aiPlatform: PromptHistoryEntry['aiPlatform'],
      url: string,
      options: { category?: string; tags?: string[]; isFavorite?: boolean } = {}
    ) => {
      await historyStorage.add({
        promptContent,
        aiResponseContent,
        aiPlatform,
        url,
        ...options,
        tags: options.tags || [],
        isFavorite: options.isFavorite || false
      });
    }
  },

  // Collection operations
  collections: {
    getAll: () => collectionStorage.getAll(),
    getById: (id: string) => collectionStorage.getById(id),
    setAll: (items: PromptCollection[]) => collectionStorage.setAll(items),
    add: (collection: Omit<PromptCollection, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) =>
          collectionStorage.add(collection),
    update: (id: string, updates: Partial<PromptCollection>) => collectionStorage.update(id, updates),
    delete: (id: string) => collectionStorage.delete(id),
    clear: () => collectionStorage.clear(),
    // Add a prompt to a collection
    addPromptToCollection: async (collectionId: string, promptId: string) => {
      const collection = await collectionStorage.getById(collectionId);
      if (!collection) return false;

      const updatedCollection = {
        ...collection,
        promptIds: [...new Set([...collection.promptIds, promptId])],
        updatedAt: Date.now()
      };

      return await collectionStorage.update(collectionId, updatedCollection);
    },
    // Remove a prompt from a collection
    removePromptFromCollection: async (collectionId: string, promptId: string) => {
      const collection = await collectionStorage.getById(collectionId);
      if (!collection) return false;

      const updatedCollection = {
        ...collection,
        promptIds: collection.promptIds.filter(id => id !== promptId),
        updatedAt: Date.now()
      };

      return await collectionStorage.update(collectionId, updatedCollection);
    }
  },

  // Workspace operations
  workspaces: {
    getAll: () => workspaceStorage.getAll(),
    getById: (id: string) => workspaceStorage.getById(id),
    setAll: (items: Workspace[]) => workspaceStorage.setAll(items),
    add: (workspace: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) =>
          workspaceStorage.add(workspace),
    update: (id: string, updates: Partial<Workspace>) => workspaceStorage.update(id, updates),
    delete: (id: string) => workspaceStorage.delete(id),
    clear: () => workspaceStorage.clear(),
    /**
     * Ensures at least one workspace exists. Creates the default "My Workspace"
     * on first run and returns the list.
     */
    ensureDefault: async () => {
      const workspaces = await workspaceStorage.getAll();
      if (workspaces.length > 0) return workspaces;
      const id = DEFAULT_WORKSPACE_ID;
      const now = Date.now();
      const defaultWorkspace: Workspace = {
        id,
        name: 'My Workspace',
        description: 'Your default AIDock workspace',
        color: '#6366f1',
        isDefault: true,
        createdAt: now,
        updatedAt: now
      };
      await workspaceStorage.setAll([defaultWorkspace]);
      return [defaultWorkspace];
    }
  }
};