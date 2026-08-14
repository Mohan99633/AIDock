import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Sparkles, BookOpen, Clock, FolderOpen, type LucideIcon } from 'lucide-react';
import { cn } from '~/shared/lib/cn';
import { storage, DEFAULT_WORKSPACE_ID } from '~/infrastructure/storage/storage.service';
import { useWorkspaceStore } from '~/features/workspaces/state/workspace-store';
import { searchAll, type SearchResult, type SearchResultKind } from '~/features/search/lib/search';
import { highlightText } from '~/features/search/lib/highlight';

type Tab = 'Library' | 'Notes' | 'History' | 'Search';

const KIND_LABELS: Record<SearchResultKind, string> = {
  prompt: 'Prompts',
  note: 'Notes',
  history: 'History',
  collection: 'Collections'
};

const KIND_ICONS: Record<SearchResultKind, LucideIcon> = {
  prompt: BookOpen,
  note: Sparkles,
  history: Clock,
  collection: FolderOpen
};

const KIND_BADGES: Record<SearchResultKind, string> = {
  prompt: 'bg-blue-500/10 text-blue-500',
  note: 'bg-emerald-500/10 text-emerald-500',
  history: 'bg-amber-500/10 text-amber-500',
  collection: 'bg-violet-500/10 text-violet-500'
};

export function SearchShell({ onNavigate }: { onNavigate: (tab: Tab) => void }): JSX.Element {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const belongs = (id?: string) => (id ?? DEFAULT_WORKSPACE_ID) === activeWorkspaceId;
  const [query, setQuery] = useState('');

  const promptsQuery = useQuery({
    queryKey: ['prompts'],
    queryFn: () => storage.prompts.getAll()
  });
  const notesQuery = useQuery({
    queryKey: ['notes'],
    queryFn: () => storage.notes.getAll()
  });
  const historyQuery = useQuery({
    queryKey: ['history'],
    queryFn: () => storage.history.getAll()
  });
  const collectionsQuery = useQuery({
    queryKey: ['collections'],
    queryFn: () => storage.collections.getAll()
  });

  const isLoading =
    promptsQuery.isLoading ||
    notesQuery.isLoading ||
    historyQuery.isLoading ||
    collectionsQuery.isLoading;

  const results = useMemo(() => {
    return searchAll(
      {
        prompts: (promptsQuery.data ?? []).filter((p) => belongs(p.workspaceId)),
        notes: (notesQuery.data ?? []).filter((n) => belongs(n.workspaceId)),
        history: (historyQuery.data ?? []).filter((h) => belongs(h.workspaceId)),
        collections: (collectionsQuery.data ?? []).filter((c) => belongs(c.workspaceId))
      },
      query
    );
  }, [
    query,
    activeWorkspaceId,
    promptsQuery.data,
    notesQuery.data,
    historyQuery.data,
    collectionsQuery.data
  ]);

  const grouped = useMemo(() => {
    const map: Record<SearchResultKind, SearchResult[]> = {
      prompt: [],
      note: [],
      history: [],
      collection: []
    };
    for (const r of results) map[r.kind].push(r);
    return map;
  }, [results]);

  return (
    <div className="flex flex-col h-full w-[380px] bg-background">
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          <h1 className="text-base font-semibold">Universal Search</h1>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search prompts, notes, history, collections..."
            autoFocus
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted-foreground"
          />
        </div>
        {!isLoading && query.trim() && (
          <span className="text-xs text-muted-foreground block pt-2">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex-1 space-y-3 p-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !query.trim() ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Search className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            Search across all your prompts, notes, history, and collections.
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Search className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            No results for "{query.trim()}".
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-4 pb-4 space-y-4">
          {(Object.keys(grouped) as SearchResultKind[]).map((kind) => {
            const items = grouped[kind];
            if (items.length === 0) return null;
            const Icon = KIND_ICONS[kind];
            if (!Icon) return null;
            return (
              <section key={kind}>
                <header className="flex items-center gap-1.5 px-1 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                  {KIND_LABELS[kind]} ({items.length})
                </header>
                <ul className="space-y-1.5">
                  {items.map((r) => (
                    <li key={`${r.kind}-${(r.item as { id: string }).id}`}>
                      <ResultRow result={r} query={query} onClick={() => onNavigate(kindToTab(kind))} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function kindToTab(kind: SearchResultKind): Tab {
  switch (kind) {
    case 'prompt':
    case 'collection':
      return 'Library';
    case 'note':
      return 'Notes';
    case 'history':
      return 'History';
    default:
      return 'Search';
  }
}

function ResultRow({
  result,
  query,
  onClick
}: {
  result: SearchResult;
  query: string;
  onClick: () => void;
}) {
  const { title, snippet } = pickTitleAndSnippet(result);
  return (
    <button
      onClick={onClick}
      className={cn(
        'group w-full text-left rounded-lg border border-border bg-card p-3 transition-colors',
        'hover:border-primary/40 hover:bg-accent/30'
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            KIND_BADGES[result.kind]
          )}
        >
          {result.kind}
        </span>
        <span className="text-xs text-muted-foreground/60">
          score {result.score}
        </span>
      </div>
      <p className="text-sm font-medium text-foreground truncate">
        {highlightText(title, query)}
      </p>
      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
        {highlightText(snippet, query)}
      </p>
    </button>
  );
}

function pickTitleAndSnippet(result: SearchResult): { title: string; snippet: string } {
  switch (result.kind) {
    case 'prompt':
      return { title: result.item.title, snippet: result.item.content };
    case 'note':
      return { title: result.item.title, snippet: result.item.content };
    case 'history':
      return { title: result.item.promptContent, snippet: result.item.aiResponseContent };
    case 'collection':
      return { title: result.item.name, snippet: result.item.description ?? '' };
  }
}