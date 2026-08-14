import type { ReactNode } from 'react';

/**
 * Splits `text` on case-insensitive occurrences of `query` and wraps each match
 * in a <mark> element so the UI can emphasize where the query appears.
 * Returns an empty array when query is empty.
 */
export function highlightText(text: string, query: string): ReactNode[] {
  const trimmed = query.trim();
  if (!trimmed || !text) return [text];

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let index = lowerText.indexOf(lowerQuery, cursor);
  let key = 0;

  while (index !== -1) {
    if (index > cursor) {
      nodes.push(text.slice(cursor, index));
    }
    nodes.push(
      <mark key={`m-${key}`} className="rounded-sm bg-primary/20 text-primary">
        {text.slice(index, index + trimmed.length)}
      </mark>
    );
    key += 1;
    cursor = index + trimmed.length;
    index = lowerText.indexOf(lowerQuery, cursor);
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes.length > 0 ? nodes : [text];
}