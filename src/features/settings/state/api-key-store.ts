import { create } from 'zustand';

import { getLocalValue, setLocalValue } from '~/infrastructure/storage/local-store';

export const API_KEY_STORAGE_KEY = 'aidock.settings.openrouterApiKey';

type ApiKeyState = {
  apiKey: string;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setApiKey: (apiKey: string) => Promise<void>;
  clear: () => Promise<void>;
};

/**
 * Persists the optional OpenRouter API key used by Model Comparison.
 * The key is stored in local Chrome storage and never leaves the device
 * except in the user's own API calls to OpenRouter.
 */
export const useApiKeyStore = create<ApiKeyState>((set) => ({
  apiKey: '',
  hydrated: false,
  async hydrate() {
    const saved = await getLocalValue<string>(API_KEY_STORAGE_KEY);
    set({ apiKey: saved ?? '', hydrated: true });
  },
  async setApiKey(apiKey) {
    await setLocalValue(API_KEY_STORAGE_KEY, apiKey);
    set({ apiKey });
  },
  async clear() {
    await setLocalValue(API_KEY_STORAGE_KEY, '');
    set({ apiKey: '' });
  }
}));