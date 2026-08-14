import { useEffect, useState } from 'react';
import { cn } from '~/shared/lib/cn';
import { Button } from '~/shared/ui/button';
import { useCloudSyncStore } from '../store/useCloudSyncStore';
import { syncEngine } from '../services/sync-engine';

/**
 * SyncSettingsPanel - Settings UI for cloud sync
 * - Auto-sync toggle
 * - "Sync Now" button
 * - Last synced timestamp formatting
 * - Clear sync outbox button
 */
export function SyncSettingsPanel({
  className
}: {
  className?: string;
} = {}) {
  const {
    autoSyncEnabled,
    isSyncing,
    lastSyncedAt,
    pendingCount,
    error,
    setAutoSync,
    triggerSync,
    checkPendingCount,
    clearError,
    initialize,
    refreshStatus
  } = useCloudSyncStore();

  const [mounted, setMounted] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Refresh status periodically
    const interval = setInterval(() => {
      refreshStatus();
      checkPendingCount();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [refreshStatus, checkPendingCount]);

  const formatTimestamp = (timestamp: number | null): string => {
    if (!timestamp) return 'Never synced';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSyncNow = async () => {
    const result = await triggerSync();
    if (result.success) {
      // Success toast could be added here
    }
  };

  const handleClearQueue = async () => {
    await syncEngine.clearSyncQueue();
    await checkPendingCount();
    setShowClearConfirm(false);
  };

  if (!mounted) {
    return (
      <div className={cn('space-y-4 p-4', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/4" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const status = syncEngine.getSyncStatus();

  return (
    <div className={cn('space-y-6 p-4', className)}>
      {/* Sync Status Section */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Sync Status</h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground">Status</span>
            <span className={cn(
              'font-medium',
              status.isSyncing && 'text-blue-600 dark:text-blue-400',
              !status.isOnline && 'text-muted-foreground',
              !status.isSyncing && status.isOnline && pendingCount === 0 && 'text-emerald-600 dark:text-emerald-400',
              !status.isSyncing && status.isOnline && pendingCount > 0 && 'text-amber-600 dark:text-amber-400',
              error && 'text-red-600 dark:text-red-400'
            )}>
              {status.isSyncing ? 'Syncing...' :
               !status.isOnline ? 'Offline' :
               error ? 'Error' :
               pendingCount > 0 ? `Pending (${pendingCount})` : 'Synced'}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground">Last Synced</span>
            <span className="font-medium font-mono text-xs">{formatTimestamp(lastSyncedAt)}</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <svg className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</span>
            <Button variant="ghost" size="xs" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        )}

        {pendingCount > 0 && !status.isSyncing && !error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <svg className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-amber-700 dark:text-amber-300">
              {pendingCount} change{pendingCount !== 1 ? 's' : ''} waiting to sync
            </span>
          </div>
        )}
      </section>

      {/* Auto-Sync Section */}
      <section className="space-y-3 pt-4 border-t border-border">
        <h3 className="text-sm font-semibold text-foreground">Automatic Sync</h3>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Auto-sync</label>
            <p className="text-xs text-muted-foreground">
              Automatically sync changes when online (every 5 minutes)
            </p>
          </div>

          <button
            role="switch"
            aria-checked={autoSyncEnabled}
            aria-label={autoSyncEnabled ? 'Disable auto-sync' : 'Enable auto-sync'}
            onClick={() => setAutoSync(!autoSyncEnabled)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/60',
              autoSyncEnabled ? 'bg-primary' : 'bg-muted'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                autoSyncEnabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </section>

      {/* Manual Actions Section */}
      <section className="space-y-3 pt-4 border-t border-border">
        <h3 className="text-sm font-semibold text-foreground">Manual Actions</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={handleSyncNow}
            disabled={isSyncing || !status.isOnline}
            className="w-full"
            variant="primary"
          >
            {isSyncing ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Syncing...
              </>
            ) : (
              'Sync Now'
            )}
          </Button>

          <Button
            onClick={() => setShowClearConfirm(true)}
            disabled={pendingCount === 0}
            variant="secondary"
            className="w-full"
          >
            Clear Outbox ({pendingCount})
          </Button>
        </div>
      </section>

      {/* Network Status */}
      <section className="space-y-3 pt-4 border-t border-border">
        <h3 className="text-sm font-semibold text-foreground">Network</h3>

        <div className="flex items-center gap-3 text-sm">
          <div className={cn(
            'h-2 w-2 rounded-full',
            status.isOnline ? 'bg-emerald-500' : 'bg-muted-foreground'
          )} />
          <span className={cn(
            'font-medium',
            status.isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
          )}>
            {status.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </section>

      {/* Clear Queue Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-background rounded-xl border border-border p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground mb-2">Clear Sync Outbox?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              This will remove all {pendingCount} pending change{pendingCount !== 1 ? 's' : ''} from the sync queue.
              These changes will not be synced to the cloud. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={handleClearQueue}>
                Clear Outbox
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}