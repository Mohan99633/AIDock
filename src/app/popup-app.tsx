import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { createQueryClient } from '~/app/providers/query-client';
import { DashboardShell } from '~/features/dashboard/ui/dashboard-shell';
import { LibraryShell } from '~/features/library/ui/library-shell';
import { HistoryShell } from '~/features/history/ui/history-shell';
import { NotesShell } from '~/features/notes/ui/notes-shell';
import { SearchShell } from '~/features/search/ui/search-shell';
import { TemplatesShell } from '~/features/templates/ui/templates-shell';
import { ComparisonShell } from '~/features/model-comparison/ui/comparison-shell';
import { OptimizerShell } from '~/features/optimizer/ui/optimizer-shell';
import { PricingShell } from '~/features/premium/ui/pricing-shell';
import { MarketplaceShell } from '~/features/marketplace/ui/marketplace-shell';
import { useApplyTheme } from '~/features/settings/hooks/use-apply-theme';
import { useThemeStore } from '~/features/settings/state/theme-store';
import { useLicenseStore } from '~/features/premium/state/license-store';
import { useWorkspaceStore } from '~/features/workspaces/state/workspace-store';
import { WorkspaceSwitcher } from '~/features/workspaces/ui/workspace-switcher';
import { WorkspaceManagerDialog } from '~/features/workspaces/ui/workspace-manager-dialog';
import { cn } from '~/shared/lib/cn';

const queryClient = createQueryClient();

enum Tab {
  Dashboard = 'Dashboard',
  Library = 'Library',
  History = 'History',
  Notes = 'Notes',
  Search = 'Search',
  Templates = 'Templates',
  Optimizer = 'Optimizer',
  Compare = 'Compare',
  Pro = 'Pro',
  Marketplace = 'Marketplace'
}

const TABS = [
  Tab.Dashboard,
  Tab.Library,
  Tab.History,
  Tab.Notes,
  Tab.Search,
  Tab.Templates,
  Tab.Optimizer,
  Tab.Compare,
  Tab.Pro,
  Tab.Marketplace
];

/**
 * Root app for extension popup surface.
 */
export function PopupApp(): JSX.Element {
  const { mode, hydrate } = useThemeStore();
  const hydrateLicense = useLicenseStore((s) => s.hydrate);
  const hydrateWorkspaces = useWorkspaceStore((s) => s.hydrate);
  const workspacesHydrated = useWorkspaceStore((s) => s.hydrated);
  useApplyTheme(mode);
  const [tab, setTab] = useState<Tab>(Tab.Dashboard);
  const [showWorkspaceManager, setShowWorkspaceManager] = useState(false);

  useEffect(() => {
    void hydrate();
    void hydrateLicense();
    void hydrateWorkspaces();
  }, [hydrate, hydrateLicense, hydrateWorkspaces]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex items-center gap-2 border-b border-border bg-background px-2 py-1.5">
        {workspacesHydrated && <WorkspaceSwitcher onManage={() => setShowWorkspaceManager(true)} />}
        <div className="flex flex-1 items-center gap-2 overflow-x-auto scrollbar-thin">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium transition-colors',
                tab === t
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      {tab === Tab.Dashboard && <DashboardShell />}
      {tab === Tab.Library && <LibraryShell />}
      {tab === Tab.History && <HistoryShell />}
      {tab === Tab.Notes && <NotesShell />}
      {tab === Tab.Search && <SearchShell onNavigate={(t) => setTab(t as Tab)} />}
      {tab === Tab.Templates && <TemplatesShell />}
      {tab === Tab.Optimizer && <OptimizerShell />}
      {tab === Tab.Compare && <ComparisonShell />}
      {tab === Tab.Pro && <PricingShell />}
      {tab === Tab.Marketplace && <MarketplaceShell />}
      {showWorkspaceManager && <WorkspaceManagerDialog onClose={() => setShowWorkspaceManager(false)} />}
    </QueryClientProvider>
  );
}