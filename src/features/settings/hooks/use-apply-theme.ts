import { useEffect } from 'react';

import type { ThemeMode } from '~/core/config/theme';

function getEffectiveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return mode;
}

/**
 * Applies the active theme class to the document root.
 */
export function useApplyTheme(mode: ThemeMode): void {
  useEffect(() => {
    const root = document.documentElement;
    const nextTheme = getEffectiveTheme(mode);

    root.classList.remove('dark', 'light');
    root.classList.add(nextTheme);
  }, [mode]);
}
