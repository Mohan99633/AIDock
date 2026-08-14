import { describe, expect, it } from 'vitest';

import { getAllSiteAdapters } from '~/adapters/registry/site-adapter-registry';
import { filterSiteAdapters } from '~/features/dashboard/lib/filter-site-adapters';

describe('filterSiteAdapters', () => {
  const adapters = getAllSiteAdapters();

  it('returns all adapters for empty query', () => {
    expect(filterSiteAdapters(adapters, '  ')).toHaveLength(adapters.length);
  });

  it('matches display names case-insensitively', () => {
    const filtered = filterSiteAdapters(adapters, 'chatgpt');
    expect(filtered.map((adapter) => adapter.id)).toEqual(['chatgpt']);
  });

  it('matches adapter ids and host patterns', () => {
    expect(filterSiteAdapters(adapters, 'openrouter').map((adapter) => adapter.id)).toEqual([
      'openrouter'
    ]);
    expect(filterSiteAdapters(adapters, 'perplexity.ai').map((adapter) => adapter.id)).toEqual([
      'perplexity'
    ]);
  });

  it('returns no adapters when there are no matches', () => {
    expect(filterSiteAdapters(adapters, 'not-a-real-site')).toHaveLength(0);
  });
});
