import React, { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Store, Star, Download, Check, X } from 'lucide-react';
import { cn } from '~/shared/lib/cn';
import { storage } from '~/infrastructure/storage/storage.service';
import { useWorkspaceStore } from '~/features/workspaces/state/workspace-store';
import { canAddPrompt } from '~/features/premium/lib/gating';
import { useLicenseStore } from '~/features/premium/state/license-store';
import { MARKETPLACE_KITS, type MarketplaceKit } from '~/features/marketplace/data/marketplace-prompts';
import { filterKits, sortKits, formatDownloads, type MarketplaceSort } from '~/features/marketplace/lib/marketplace-filter';
import { Button } from '~/shared/ui/button';

type Category = MarketplaceKit['category'] | 'All';

const CATEGORIES: readonly Category[] = [
  'All',
  'Coding',
  'Writing',
  'Business',
  'Marketing',
  'Study',
  'AI Agents'
];

export function MarketplaceShell(): JSX.Element {
  const queryClient = useQueryClient();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const license = useLicenseStore();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const [sort, setSort] = useState<MarketplaceSort>('popular');
  const [selected, setSelected] = useState<MarketplaceKit | null>(null);

  const filtered = useMemo(
    () => sortKits(filterKits(MARKETPLACE_KITS, query, category), sort),
    [query, category, sort]
  );

  return (
    <div className="flex flex-col h-full w-[380px] bg-background">
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <h1 className="text-base font-semibold">Marketplace</h1>
        </div>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
          {MARKETPLACE_KITS.length} kits
        </span>
      </div>

      <div className="px-4 pb-3 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search kits..."
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-colors border',
                category === cat
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{filtered.length} kits</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as MarketplaceSort)}
            className="appearance-none bg-transparent text-xs text-muted-foreground outline-none cursor-pointer hover:text-foreground"
          >
            <option value="popular">Most popular</option>
            <option value="top-rated">Top rated</option>
            <option value="recent">Recently updated</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Store className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No kits match "{query.trim()}".</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-4 pb-4">
          <div className="space-y-2">
            {filtered.map((kit) => (
              <KitCard key={kit.id} kit={kit} onClick={() => setSelected(kit)} />
            ))}
          </div>
        </div>
      )}

      {selected && (
        <KitDetailDialog
          kit={selected}
          onClose={() => setSelected(null)}
          onImport={() => {
            void importKit(selected, activeWorkspaceId);
            setSelected(null);
            void queryClient.invalidateQueries({ queryKey: ['prompts'] });
          }}
          canImport={canAddPrompt(license.tier, 0)}
        />
      )}
    </div>
  );
}

async function importKit(kit: MarketplaceKit, workspaceId: string): Promise<void> {
  for (const prompt of kit.prompts) {
    await storage.prompts.add({
      title: prompt.title,
      content: prompt.content,
      category: kit.category,
      tags: kit.tags,
      isFavorite: false,
      workspaceId,
      wordCount: prompt.content.split(/\s+/).filter(Boolean).length,
      characterCount: prompt.content.length,
      enhancementHistory: []
    });
  }
}

function KitCard({ kit, onClick }: { kit: MarketplaceKit; onClick: () => void }): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group w-full text-left rounded-lg border border-border bg-card p-3 transition-colors',
        'hover:border-primary/40 hover:bg-muted/50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-foreground">{kit.name}</h3>
          <p className="text-xs text-muted-foreground">by {kit.author}</p>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
          {kit.category}
        </span>
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{kit.description}</p>
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-0.5 text-amber-500">
          <Star className="h-3 w-3 fill-current" />
          {kit.rating.toFixed(1)}
        </span>
        <span className="inline-flex items-center gap-0.5">
          <Download className="h-3 w-3" />
          {formatDownloads(kit.downloads)}
        </span>
        <span>{kit.prompts.length} prompts</span>
      </div>
    </button>
  );
}

function KitDetailDialog({
  kit,
  onClose,
  onImport,
  canImport
}: {
  kit: MarketplaceKit;
  onClose: () => void;
  onImport: () => void;
  canImport: boolean;
}): JSX.Element {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-[380px] flex-col rounded-xl border border-border bg-card shadow-premium"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-2 p-4 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                {kit.category}
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs text-amber-500">
                <Star className="h-3 w-3 fill-current" />
                {kit.rating.toFixed(1)}
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                <Download className="h-3 w-3" />
                {formatDownloads(kit.downloads)}
              </span>
            </div>
            <h2 className="mt-2 text-base font-semibold">{kit.name}</h2>
            <p className="text-xs text-muted-foreground">by {kit.author}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-auto px-4 pb-4 space-y-3">
          <p className="text-xs text-muted-foreground">{kit.description}</p>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Included prompts ({kit.prompts.length})
            </p>
            <ul className="space-y-1.5">
              {kit.prompts.map((p) => (
                <li key={p.title} className="rounded-lg border border-border bg-background/50 px-2.5 py-2">
                  <p className="text-xs font-medium text-foreground">{p.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{p.content}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <footer className="border-t border-border p-4">
          {canImport ? (
            <Button variant="primary" className="w-full" onClick={onImport}>
              <Check className="h-4 w-4" />
              Import kit to current workspace
            </Button>
          ) : (
            <p className="rounded-lg border border-dashed border-border px-3 py-2 text-center text-xs text-muted-foreground">
              Upgrade to Pro to import more prompts.
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}