import { useEffect, useState } from 'react';
import { cn } from '~/shared/lib/cn';
import { useCloudSyncStore } from '../store/useCloudSyncStore';

/**
 * SyncStatusBadge - Compact status indicator for header/options bar
 * Shows: Synced / Syncing... / Offline / Pending [Count]
 * With spin animation when syncing
 */
export function SyncStatusBadge({
  className,
  showLabel = true,
  compact = false
}: {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
} = {}) {
  const { isSyncing, isOnline, pendingCount, lastSyncedAt, error } = useCloudSyncStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className={cn('inline-flex items-center gap-1.5', className)}>Loading...</span>;
  }

  // Determine status
  let status: 'synced' | 'syncing' | 'offline' | 'pending' | 'error' = 'synced';
  let label = 'Synced';

  if (!isOnline) {
    status = 'offline';
    label = 'Offline';
  } else if (isSyncing) {
    status = 'syncing';
    label = 'Syncing...';
  } else if (error) {
    status = 'error';
    label = 'Error';
  } else if (pendingCount > 0) {
    status = 'pending';
    label = `Pending ${pendingCount}`;
  } else if (lastSyncedAt) {
    status = 'synced';
    label = 'Synced';
  }

  const statusColors = {
    synced: 'text-emerald-600 dark:text-emerald-400',
    syncing: 'text-blue-600 dark:text-blue-400',
    offline: 'text-muted-foreground',
    pending: 'text-amber-600 dark:text-amber-400',
    error: 'text-red-600 dark:text-red-400'
  };

  const bgColors = {
    synced: 'bg-emerald-100 dark:bg-emerald-900/30',
    syncing: 'bg-blue-100 dark:bg-blue-900/30',
    offline: 'bg-muted',
    pending: 'bg-amber-100 dark:bg-amber-900/30',
    error: 'bg-red-100 dark:bg-red-900/30'
  };

  const iconColors = {
    synced: 'text-emerald-600 dark:text-emerald-400',
    syncing: 'text-blue-600 dark:text-blue-400',
    offline: 'text-muted-foreground',
    pending: 'text-amber-600 dark:text-amber-400',
    error: 'text-red-600 dark:text-red-400'
  };

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors',
          bgColors[status],
          statusColors[status],
          className
        )}
        title={label}
      >
        {status === 'syncing' && (
          <svg
            className="animate-spin h-3 w-3"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {status === 'synced' && (
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {status === 'offline' && (
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
        {status === 'pending' && (
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {status === 'error' && (
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {showLabel && <span>{label}</span>}
      </span>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors',
        'border-border/50 bg-background/80 backdrop-blur-sm',
        className
      )}
    >
      <div className={cn('flex items-center gap-2', iconColors[status])}>
        {status === 'syncing' && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {status === 'synced' && (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {status === 'offline' && (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
        {status === 'pending' && (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {status === 'error' && (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>

      {showLabel && (
        <span className={cn('text-sm font-medium', statusColors[status])}>
          {label}
        </span>
      )}

      {status === 'pending' && pendingCount > 0 && (
        <span className={cn(
          'inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-mono',
          bgColors.pending,
          statusColors.pending
        )}>
          {pendingCount}
        </span>
      )}
    </div>
  );
}