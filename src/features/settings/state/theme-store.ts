import { create } from 'zustand';

import { THEME_STORAGE_KEY, type ThemeMode } from '~/core/config/theme';
import { getLocalValue, setLocalValue } from '~/infrastructure/storage/local-store';

type ThemeState = {
  mode: ThemeMode;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
};

/**
 * Manages persisted theme state for extension UIs.
 */
export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  hydrated: false,
  async hydrate() {
    const savedMode = await getLocalValue<ThemeMode>(THEME_STORAGE_KEY);
    set({ mode: savedMode ?? 'system', hydrated: true });
  },
  async setMode(mode) {
    await setLocalValue(THEME_STORAGE_KEY, mode);
    set({ mode });
  }
}));
