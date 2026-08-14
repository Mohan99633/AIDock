import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '~/features/notes/lib/markdown';

describe('renderMarkdown', () => {
  it('returns empty string for empty input', () => {
    expect(renderMarkdown('')).toBe('');
  });

  it('renders paragraphs and line breaks', () => {
    const html = renderMarkdown('First line.\n\nSecond line.');
    expect(html).toContain('<p>First line.</p>');
    expect(html).toContain('<p>Second line.</p>');
  });

  it('renders bold and italic', () => {
    const html = renderMarkdown('This is **bold** and *italic*.');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
  });

  it('renders headings', () => {
    expect(renderMarkdown('# Heading 1')).toContain('<h1>Heading 1</h1>');
    expect(renderMarkdown('## Heading 2')).toContain('<h2>Heading 2</h2>');
    expect(renderMarkdown('### Heading 3')).toContain('<h3>Heading 3</h3>');
  });

  it('renders inline code and code blocks', () => {
    expect(renderMarkdown('Use `const x = 1` inline.')).toContain('<code>const x = 1</code>');
    const block = renderMarkdown('```\nconst x = 1;\n```');
    expect(block).toContain('<pre><code>');
    expect(block).toContain('const x = 1;');
    expect(block).toContain('</code></pre>');
  });

  it('renders unordered lists', () => {
    const html = renderMarkdown('- Item 1\n- Item 2\n- Item 3');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>Item 1</li>');
    expect(html).toContain('<li>Item 2</li>');
    expect(html).toContain('<li>Item 3</li>');
    expect(html).toContain('</ul>');
  });

  it('renders numbered lists', () => {
    const html = renderMarkdown('1. First\n2. Second\n3. Third');
    expect(html).toContain('<ol>');
    expect(html).toContain('<li>First</li>');
    expect(html).toContain('<li>Second</li>');
    expect(html).toContain('<li>Third</li>');
    expect(html).toContain('</ol>');
  });

  it('renders checklists', () => {
    const html = renderMarkdown('- [ ] Todo one\n- [x] Done');
    expect(html).toContain('<input type="checkbox" disabled="true">');
    expect(html).toContain('checked="checked"');
    expect(html).toContain('Todo one');
    expect(html).toContain('Done');
  });

  it('renders links with safe http(s) URLs only', () => {
    const html = renderMarkdown('[Example](https://example.com)');
    expect(html).toContain('<a href="https://example.com">Example</a>');
    // Disallow non-http schemes
    const malicious = renderMarkdown('[Bad](javascript:alert(1))');
    expect(malicious).not.toContain('<a');
  });

  it('escapes HTML to prevent XSS', () => {
    const html = renderMarkdown('<script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});