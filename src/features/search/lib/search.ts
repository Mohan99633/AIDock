/**
 * Search types and utilities for Universal Search.
 */

export interface SearchInput {
  prompts: Array<{ title: string; content: string; category?: string; tags: string[]; }>;
  notes: Array<{ title: string; content: string; tags: string[]; }>;
  history: Array<{ promptContent: string; aiResponseContent: string; aiPlatform: string; tags?: string[]; }>;
  collections: Array<{ name: string; description?: string; }>;
}

export interface SearchResult {
  kind: 'prompt' | 'note' | 'history' | 'collection';
  item: any; // Typed by caller
  score: number;
  snippet: string;
}

export type SearchResultKind = SearchResult['kind'];

/**
 * Build a short snippet centered on the first match of `query` in `text`.
 * If no match, return the first 80 chars (with ellipsis if truncated).
 */
export function buildSnippet(text: string, query: string): string {
  if (!text) return '';
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const matchIdx = lower.indexOf(q);
  if (matchIdx === -1) {
    return text.length > 80 ? `${text.slice(0, 80)}…` : text;
  }
  const pad = 32;
  const start = Math.max(0, matchIdx - pad);
  const end = Math.min(text.length, matchIdx + q.length + pad);
  const lead = start > 0 ? '…' : '';
  const tail = end < text.length ? '…' : '';
  return `${lead}${text.slice(start, end)}${tail}`;
}

/**
 * Score an item based on which fields contain the query.
 * Returns null if no match; otherwise returns an object with total score and the field
 * that contributed the highest weight (used for snippet source).
 */
function scoreItem(
  query: string,
  fields: Array<[string | undefined | null, number]>
): { score: number; snippetSource: string } | null {
  const q = query.toLowerCase();
  let total = 0;
  let bestSource: { score: number; source: string } | null = null;
  for (const [value, weight] of fields) {
    if (!value) continue;
    if (value.toLowerCase().includes(q)) {
      total += weight;
      if (!bestSource || weight > bestSource.score) {
        bestSource = { score: weight, source: value };
      }
    }
  }
  return total === 0 || !bestSource ? null : { score: total, snippetSource: bestSource.source };
}

/**
 * Perform a search across all provided data.
 * Results are sorted by score descending.
 */
export function searchAll(input: SearchInput, query: string): SearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const results: SearchResult[] = [];

  // Prompts
  for (const p of input.prompts) {
    const scored = scoreItem(trimmed, [
      [p.title, 2],
      [p.content, 1],
      [p.category, 1],
      [(p.tags ?? []).join(' '), 1]
    ]);
    if (scored) {
      results.push({
        kind: 'prompt',
        item: p,
        score: scored.score,
        snippet: buildSnippet(scored.snippetSource, trimmed)
      });
    }
  }

  // Notes
  for (const n of input.notes) {
    const scored = scoreItem(trimmed, [
      [n.title, 2],
      [n.content, 1],
      [(n.tags ?? []).join(' '), 1]
    ]);
    if (scored) {
      results.push({
        kind: 'note',
        item: n,
        score: scored.score,
        snippet: buildSnippet(scored.snippetSource, trimmed)
      });
    }
  }

  // History
  for (const h of input.history) {
    const scored = scoreItem(trimmed, [
      [h.promptContent, 2],
      [h.aiResponseContent, 1],
      [h.aiPlatform, 1],
      [(h.tags ?? []).join(' '), 1]
    ]);
    if (scored) {
      results.push({
        kind: 'history',
        item: h,
        score: scored.score,
        snippet: buildSnippet(scored.snippetSource, trimmed)
      });
    }
  }

  // Collections
  for (const c of input.collections) {
    const scored = scoreItem(trimmed, [
      [c.name, 2],
      [c.description, 1]
    ]);
    if (scored) {
      results.push({
        kind: 'collection',
        item: c,
        score: scored.score,
        snippet: buildSnippet(scored.snippetSource, trimmed)
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return results;
}