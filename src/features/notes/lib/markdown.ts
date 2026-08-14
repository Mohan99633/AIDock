/**
 * Minimal Markdown-to-HTML renderer focused on the subset users need in AI notes:
 * - Headers (#, ##, ###)
 * - Bold (**text**) and Italic (*text*)
 * - Inline code (`code`)
 * - Code blocks (```...```)
 * - Unordered lists (- item)
 * - Numbered lists (1. item)
 * - Links [label](url)
 * - Checklists (- [ ] / - [x])
 * - Paragraphs and line breaks
 *
 * Output is sanitized against XSS via a strict allowlist of HTML tags.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'code', 'pre',
  'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'input'
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ['href'],
  input: ['type', 'checked', 'disabled']
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitize(html: string): string {
  return html.replace(/<(\/?)([a-zA-Z0-9]+)([^>]*)>/g, (_match, slash, tag, attrs) => {
    const lowerTag = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(lowerTag)) return '';
    const allowedAttrs = ALLOWED_ATTRS[lowerTag] ?? [];
    if (slash) return `</${lowerTag}>`;
    let cleanAttrs = '';
    attrs.replace(/([a-zA-Z-]+)\s*=\s*"([^"]*)"/g, (_a: string, name: string, value: string) => {
      const lowerName = name.toLowerCase();
      if (allowedAttrs.includes(lowerName)) {
        if (lowerTag === 'a' && lowerName === 'href' && !/^https?:\/\//.test(value)) {
          // Block non-http(s) hrefs
          return;
        }
        cleanAttrs += ` ${lowerName}="${value.replace(/"/g, '&quot;')}"`;
      }
      return '';
    });
    // For <a> tags, if href attribute is missing or invalid, remove the entire tag
    if (lowerTag === 'a' && !cleanAttrs.includes('href=')) {
      return '';
    }
    return `<${lowerTag}${cleanAttrs}>`;
  });
}

function inlineFormat(text: string): string {
  let out = escapeHtml(text);

  // Inline code first (so its content isn't touched by other transforms).
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold (**text**)
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic (*text*) — but avoid matching across bold markers
  out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');

  // Links [label](url)
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');

  return out;
}

export function renderMarkdown(input: string): string {
  if (!input) return '';

  const lines = input.split('\n');
  const html: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !(lines[i] ?? '').startsWith('```')) {
        codeLines.push(lines[i] ?? '');
        i += 1;
      }
      html.push(`<pre><code${lang ? ` data-lang="${escapeHtml(lang)}"` : ''}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      i += 1;
      continue;
    }

    // Headers
    const headerMatch = /^(#{1,3})\s+(.*)$/.exec(line);
    if (headerMatch) {
      const level = headerMatch[1]?.length ?? 1;
      const text = headerMatch[2] ?? '';
      html.push(`<h${level}>${inlineFormat(text)}</h${level}>`);
      i += 1;
      continue;
    }

    // Unordered list / checklist
    if (/^(\s*)- \[( |x|X)\]/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^(\s*)- \[( |x|X)\]/.test(lines[i] ?? '')) {
        const m = /^(\s*)- \[( |x|X)\]\s+(.*)$/.exec(lines[i] ?? '');
        if (m) {
          const isChecked = (m[2] ?? '').toLowerCase() === 'x';
          const checkedAttr = isChecked ? ' checked="checked"' : '';
          items.push(`<li><input type="checkbox"${checkedAttr} disabled="true" /> ${inlineFormat(m[3] ?? '')}</li>`);
        }
        i += 1;
      }
      html.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    if (/^(\s*)- /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^(\s*)- /.test(lines[i] ?? '')) {
        const m = /^(\s*)- (.*)$/.exec(lines[i] ?? '');
        if (m) items.push(`<li>${inlineFormat(m[2] ?? '')}</li>`);
        i += 1;
      }
      html.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^(\s*)\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^(\s*)\d+\.\s/.test(lines[i] ?? '')) {
        const m = /^(\s*)\d+\.\s+(.*)$/.exec(lines[i] ?? '');
        if (m) items.push(`<li>${inlineFormat(m[2] ?? '')}</li>`);
        i += 1;
      }
      html.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // Empty line -> paragraph break
    if (line.trim() === '') {
      i += 1;
      continue;
    }

    // Paragraph (consume consecutive non-empty, non-block lines)
    const para: string[] = [];
    while (
      i < lines.length &&
      (lines[i] ?? '').trim() !== '' &&
      !/^(#{1,3})\s/.test(lines[i] ?? '') &&
      !/^(\s*)- /.test(lines[i] ?? '') &&
      !/^(\s*)\d+\.\s/.test(lines[i] ?? '') &&
      !(lines[i] ?? '').startsWith('```')
    ) {
      para.push(lines[i] ?? '');
      i += 1;
    }
    html.push(`<p>${inlineFormat(para.join(' '))}</p>`);
  }

  return sanitize(html.join(''));
}