import { describe, expect, it } from 'vitest';
import { filterTemplates } from './filter-templates';
import { TEMPLATES } from '~/features/templates/data/templates';

describe('filterTemplates', () => {
  it('returns all templates for "All" category and empty query', () => {
    expect(filterTemplates(TEMPLATES, '', 'All')).toHaveLength(TEMPLATES.length);
  });

  it('filters by category', () => {
    const results = filterTemplates(TEMPLATES, '', 'Coding');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((t) => t.category === 'Coding')).toBe(true);
  });

  it('matches by name', () => {
    const results = filterTemplates(TEMPLATES, 'flashcard', 'All');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.name.toLowerCase()).toContain('flashcard');
  });

  it('matches by description and tags', () => {
    const results = filterTemplates(TEMPLATES, 'seo', 'All');
    expect(results.length).toBeGreaterThan(0);
  });

  it('is case-insensitive', () => {
    const upper = filterTemplates(TEMPLATES, 'RESUME', 'All');
    const lower = filterTemplates(TEMPLATES, 'resume', 'All');
    expect(upper).toHaveLength(lower.length);
  });

  it('returns no results for a non-matching query', () => {
    expect(filterTemplates(TEMPLATES, 'zzzz-not-a-template', 'All')).toHaveLength(0);
  });

  it('combines category and query filters', () => {
    const results = filterTemplates(TEMPLATES, 'email', 'Emails');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((t) => t.category === 'Emails')).toBe(true);
  });
});