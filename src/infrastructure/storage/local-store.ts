import { Storage } from '@plasmohq/storage';

const storage = new Storage({ area: 'local' });

/**
 * Reads a typed value from extension local storage.
 */
export async function getLocalValue<T>(key: string): Promise<T | null> {
  const value = await storage.get<T>(key);
  return value ?? null;
}

/**
 * Writes a typed value into extension local storage.
 */
export async function setLocalValue<T>(key: string, value: T): Promise<void> {
  await storage.set(key, value);
}
