import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';

import { createQueryClient } from '~/app/providers/query-client';
import type { ThemeMode } from '~/core/config/theme';
import { useApplyTheme } from '~/features/settings/hooks/use-apply-theme';
import { useThemeStore } from '~/features/settings/state/theme-store';
import { SettingsShell } from '~/features/settings/ui/settings-shell';

const queryClient = createQueryClient();

/**
 * Root app for extension options surface.
 */
export function OptionsApp(): JSX.Element {
  const { mode, hydrate, setMode } = useThemeStore();
  useApplyTheme(mode);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const handleThemeChange = (nextMode: ThemeMode): void => {
    void setMode(nextMode);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsShell themeMode={mode} onThemeModeChange={handleThemeChange} />
    </QueryClientProvider>
  );
}
