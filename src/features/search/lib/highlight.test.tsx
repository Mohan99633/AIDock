import { describe, expect, it } from 'vitest';
import type React from 'react';
import { highlightText } from './highlight';

/**
 * Recursively counts <mark> elements and collects their text content.
 * This lets us assert on the highlight output without pulling in a DOM testing library.
 */
function inspect(nodes: React.ReactNode): { markCount: number; text: string } {
  let markCount = 0;
  let text = '';
  const walk = (n: React.ReactNode): void => {
    if (n == null || typeof n === 'boolean') return;
    if (typeof n === 'string' || typeof n === 'number') {
      text += String(n);
      return;
    }
    if (Array.isArray(n)) {
      n.forEach(walk);
      return;
    }
    const element = n as React.ReactElement;
    if (element.type === 'mark') {
      markCount += 1;
    }
    if (element.props && element.props.children) {
      walk(element.props.children);
    }
  };
  walk(nodes);
  return { markCount, text };
}

describe('highlightText', () => {
  it('returns plain text for empty query', () => {
    const result = inspect(highlightText('hello world', ''));
    expect(result.markCount).toBe(0);
    expect(result.text).toBe('hello world');
  });

  it('returns plain text for empty text', () => {
    const result = inspect(highlightText('', 'hello'));
    expect(result.markCount).toBe(0);
    expect(result.text).toBe('');
  });

  it('wraps single match in <mark>', () => {
    const result = inspect(highlightText('hello world', 'world'));
    expect(result.markCount).toBe(1);
    expect(result.text).toBe('hello world');
  });

  it('matches case-insensitively preserving original casing', () => {
    const result = inspect(highlightText('Hello WORLD', 'world'));
    expect(result.markCount).toBe(1);
    expect(result.text).toBe('Hello WORLD');
  });

  it('wraps multiple matches', () => {
    const result = inspect(highlightText('foo bar foo baz foo', 'foo'));
    expect(result.markCount).toBe(3);
    expect(result.text).toBe('foo bar foo baz foo');
  });

  it('returns plain text when no match', () => {
    const result = inspect(highlightText('hello world', 'xyz'));
    expect(result.markCount).toBe(0);
    expect(result.text).toBe('hello world');
  });
});