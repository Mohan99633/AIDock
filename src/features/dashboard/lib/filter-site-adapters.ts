import type { AiSiteAdapter } from '~/core/contracts/site-adapter';

/**
 * Filters supported AI site adapters by display name, id, or domain.
 */
export function filterSiteAdapters(
  adapters: readonly AiSiteAdapter[],
  query: string
): readonly AiSiteAdapter[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return adapters;
  }

  return adapters.filter((adapter) => {
    const searchableValues = [adapter.displayName, adapter.id, ...adapter.hostPatterns];
    return searchableValues.some((value) => value.toLowerCase().includes(normalizedQuery));
  });
}
