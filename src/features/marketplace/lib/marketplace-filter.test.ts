import { describe, expect, it } from 'vitest';
import { MARKETPLACE_KITS } from '~/features/marketplace/data/marketplace-prompts';
import { filterKits, sortKits, formatDownloads } from './marketplace-filter';

describe('filterKits', () => {
  it('returns all kits for "All" category and empty query', () => {
    expect(filterKits(MARKETPLACE_KITS, '', 'All')).toHaveLength(MARKETPLACE_KITS.length);
  });

  it('filters by category', () => {
    const coding = filterKits(MARKETPLACE_KITS, '', 'Coding');
    expect(coding.length).toBeGreaterThan(0);
    expect(coding.every((k) => k.category === 'Coding')).toBe(true);
  });

  it('matches by name, author, and tags', () => {
    expect(filterKits(MARKETPLACE_KITS, 'architect', 'All')).toHaveLength(1);
    expect(filterKits(MARKETPLACE_KITS, 'StoryCraft', 'All').length).toBeGreaterThan(0);
    expect(filterKits(MARKETPLACE_KITS, 'rag', 'All').length).toBeGreaterThan(0);
  });

  it('is case-insensitive', () => {
    expect(filterKits(MARKETPLACE_KITS, 'LLM', 'All')).toHaveLength(
      filterKits(MARKETPLACE_KITS, 'llm', 'All').length
    );
  });

  it('returns no results for a non-matching query', () => {
    expect(filterKits(MARKETPLACE_KITS, 'zzz-nope', 'All')).toHaveLength(0);
  });
});

describe('sortKits', () => {
  it('sorts by downloads descending for popular', () => {
    const sorted = sortKits(MARKETPLACE_KITS, 'popular');
    expect(sorted[0]!.downloads).toBeGreaterThanOrEqual(sorted[1]!.downloads);
  });

  it('sorts by rating (then downloads) for top-rated', () => {
    const sorted = sortKits(MARKETPLACE_KITS, 'top-rated');
    expect(sorted[0]!.rating).toBeGreaterThanOrEqual(sorted[1]!.rating);
  });

  it('sorts by updatedAt descending for recent', () => {
    const sorted = sortKits(MARKETPLACE_KITS, 'recent');
    expect(sorted[0]!.updatedAt).toBeGreaterThanOrEqual(sorted[1]!.updatedAt);
  });

  it('does not mutate the input array', () => {
    const before = MARKETPLACE_KITS.map((k) => k.id);
    sortKits(MARKETPLACE_KITS, 'popular');
    expect(MARKETPLACE_KITS.map((k) => k.id)).toEqual(before);
  });
});

describe('formatDownloads', () => {
  it('formats counts with k/M suffixes', () => {
    expect(formatDownloads(500)).toBe('500');
    expect(formatDownloads(12400)).toBe('12.4k');
    expect(formatDownloads(1_500_000)).toBe('1.5M');
  });
});
