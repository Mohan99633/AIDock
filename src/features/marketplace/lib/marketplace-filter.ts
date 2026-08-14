import type { MarketplaceKit } from '~/features/marketplace/data/marketplace-prompts';

export type MarketplaceSort = 'popular' | 'top-rated' | 'recent';

/**
 * Filters marketplace kits by category and search query (name, author, tags).
 */
export function filterKits(
  kits: readonly MarketplaceKit[],
  query: string,
  category: MarketplaceKit['category'] | 'All'
): readonly MarketplaceKit[] {
  const normalizedQuery = query.trim().toLowerCase();
  const byCategory =
    category === 'All' ? kits : kits.filter((k) => k.category === category);

  if (!normalizedQuery) return byCategory;

  return byCategory.filter((k) => {
    const haystack = [k.name, k.author, k.category, ...k.tags].join(' ').toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

/**
 * Sorts kits by a chosen ranking strategy without mutating the input.
 */
export function sortKits(
  kits: readonly MarketplaceKit[],
  sort: MarketplaceSort
): readonly MarketplaceKit[] {
  const copy = [...kits];
  switch (sort) {
    case 'popular':
      return copy.sort((a, b) => b.downloads - a.downloads);
    case 'top-rated':
      return copy.sort((a, b) => b.rating - a.rating || b.downloads - a.downloads);
    case 'recent':
      return copy.sort((a, b) => b.updatedAt - a.updatedAt);
  }
}

/** Formats a download count compactly (12,400 → 12.4k). */
export function formatDownloads(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return `${count}`;
}
