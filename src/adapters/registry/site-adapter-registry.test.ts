import { describe, expect, it } from 'vitest';

import { getAllSiteAdapters, resolveSiteAdapterByHost } from '~/adapters/registry/site-adapter-registry';

describe('site adapter registry', () => {
  it('returns all supported adapters', () => {
    expect(getAllSiteAdapters()).toHaveLength(8);
  });

  it('resolves adapter from hostname', () => {
    expect(resolveSiteAdapterByHost('chatgpt.com')?.id).toBe('chatgpt');
    expect(resolveSiteAdapterByHost('www.perplexity.ai')?.id).toBe('perplexity');
    expect(resolveSiteAdapterByHost('unknown.com')).toBeNull();
  });
});
