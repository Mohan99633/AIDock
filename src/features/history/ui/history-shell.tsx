import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Search, Clock, Star, Trash2 } from 'lucide-react';
import { cn } from '~/shared/lib/cn';
import { storage, DEFAULT_WORKSPACE_ID } from '~/infrastructure/storage/storage.service';
import { useWorkspaceStore } from '~/features/workspaces/state/workspace-store';
import type { PromptHistoryEntry } from '~/infrastructure/storage/schema';
import { Button } from '~/shared/ui/button';

/** Scopes an item to the active workspace (unset = default workspace). */
function belongsToWorkspace(workspaceId: string | undefined, activeWorkspaceId: string): boolean {
  return (workspaceId ?? DEFAULT_WORKSPACE_ID) === activeWorkspaceId;
}

type FilterPlatform = PromptHistoryEntry['aiPlatform'] | 'all';

const PLATFORM_LABELS: Record<FilterPlatform, string> = {
  all: 'All',
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  perplexity: 'Perplexity',
  copilot: 'Copilot',
  grok: 'Grok',
  poe: 'Poe',
  openrouter: 'OpenRouter'
};

const PLATFORM_BADGES: Record<PromptHistoryEntry['aiPlatform'], string> = {
  chatgpt: 'bg-emerald-500/10 text-emerald-500',
  claude: 'bg-amber-500/10 text-amber-500',
  gemini: 'bg-blue-500/10 text-blue-500',
  perplexity: 'bg-violet-500/10 text-violet-500',
  copilot: 'bg-sky-500/10 text-sky-500',
  grok: 'bg-gray-700/10 text-gray-700',
  poe: 'bg-pink-500/10 text-pink-500',
  openrouter: 'bg-cyan-500/10 text-cyan-500'
};

function Header({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 pb-3">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        <h1 className="text-base font-semibold">Prompt History</h1>
      </div>
      <button
        onClick={onClear}
        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
      >
        Clear all
      </button>
    </div>
  );
}

export function HistoryShell(): JSX.Element {
  const queryClient = useQueryClient();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<FilterPlatform>('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: () => storage.history.getAll(),
    refetchInterval: 5000
  });

  const clearMutation = useMutation({
    mutationFn: () => storage.history.clear(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] })
  });

  const filtered = useMemo(() => {
    let entries = history
      .filter((h) => belongsToWorkspace(h.workspaceId, activeWorkspaceId))
      .sort((a, b) => b.timestamp - a.timestamp);

    // Date range
    const now = Date.now();
    switch (dateRange) {
      case 'today':
        entries = entries.filter((h) => now - h.timestamp < 24 * 60 * 60 * 1000);
        break;
      case 'week':
        entries = entries.filter((h) => now - h.timestamp < 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        entries = entries.filter((h) => now - h.timestamp < 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Platform
    if (platformFilter !== 'all') {
      entries = entries.filter((h) => h.aiPlatform === platformFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter((h) =>
        h.promptContent.toLowerCase().includes(q) ||
        h.aiResponseContent.toLowerCase().includes(q)
      );
    }

    // Favorites
    if (showFavorites) {
      entries = entries.filter((h) => h.isFavorite);
    }

    return entries;
  }, [history, searchQuery, platformFilter, showFavorites, dateRange, activeWorkspaceId]);

  const handleToggleFavorite = (entry: PromptHistoryEntry) => {
    storage.history.update(entry.id, { isFavorite: !entry.isFavorite });
    queryClient.invalidateQueries({ queryKey: ['history'] });
  };

  const handleDelete = (entry: PromptHistoryEntry) => {
    storage.history.delete(entry.id);
    queryClient.invalidateQueries({ queryKey: ['history'] });
  };

  return (
    <div className="flex flex-col h-full w-[380px] bg-background">
      <Header onClear={() => clearMutation.mutate()} />
      <div className="px-4 pb-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search past prompts..."
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as FilterPlatform)}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-muted-foreground outline-none focus:border-primary"
          >
            {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-muted-foreground outline-none focus:border-primary"
          >
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
          </select>
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={cn(
              'h-8 rounded-full flex items-center gap-1 px-2.5 text-xs',
              showFavorites ? 'bg-amber-500/10 text-amber-500' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Star className="h-3 w-3" />
            Favorites
          </button>
        </div>

        <span className="text-xs text-muted-foreground block">{filtered.length} entries</span>
      </div>

      {isLoading ? (
        <div className="flex-1 space-y-3 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          message={searchQuery ? 'No entries match your filters.' : 'No history yet. Visit an AI site to auto-save prompts.'}
        />
      ) : (
        <div className="flex-1 overflow-auto px-4 pb-4">
          <div className="space-y-2">
            {filtered.map((entry) => (
              <HistoryCard
                key={entry.id}
                entry={entry}
                onToggleFavorite={() => handleToggleFavorite(entry)}
                onDelete={() => handleDelete(entry)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryCard({
  entry,
  onToggleFavorite,
  onDelete
}: {
  entry: PromptHistoryEntry;
  onToggleFavorite: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="group rounded-lg border border-border bg-card p-3 transition-colors hover:border-muted-foreground/30">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <p className={cn('text-xs text-foreground', !expanded && 'line-clamp-2')}>
            {expanded ? entry.promptContent : entry.promptContent.slice(0, 100)}
            {entry.promptContent.length > 100 && !expanded && '...'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', PLATFORM_BADGES[entry.aiPlatform])}>
              {entry.aiPlatform}
            </span>
            <span className="text-xs text-muted-foreground/60">
              {new Date(entry.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </span>
            {entry.isFavorite && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
          </div>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            title="Favorite"
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Star className="h-3.5 w-3.5" />
          </button>
          <button
            title="Delete"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
          <pre className="whitespace-pre-wrap text-xs bg-muted/40 rounded p-2.5 max-h-40 overflow-auto">
            {entry.promptContent}
          </pre>
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-medium">AI Response:</p>
            <div className="whitespace-pre-wrap text-xs bg-muted/40 rounded p-2.5 max-h-40 overflow-auto">
              {entry.aiResponseContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <Clock className="h-12 w-12 text-muted-foreground/50 mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}