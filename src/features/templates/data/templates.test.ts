import { describe, expect, it } from 'vitest';
import {
  TEMPLATES,
  extractVariables,
  fillTemplate,
  getTemplateById,
  getTemplatesByCategory
} from './templates';

describe('templates catalog', () => {
  it('every template has a unique id', () => {
    const ids = TEMPLATES.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every template has the required fields', () => {
    for (const t of TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.category).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.content.length).toBeGreaterThan(20);
      expect(Array.isArray(t.tags)).toBe(true);
    }
  });

  it('every template belongs to a known category', () => {
    const cats = new Set(['Resume', 'Coding', 'Research', 'Business', 'Marketing', 'Study', 'AI Agents', 'Writing', 'Emails']);
    for (const t of TEMPLATES) {
      expect(cats.has(t.category)).toBe(true);
    }
  });

  it('has at least 3 templates per category', () => {
    const categories = new Set(TEMPLATES.map((t) => t.category));
    for (const cat of categories) {
      const inCat = TEMPLATES.filter((t) => t.category === cat);
      expect(inCat.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('extractVariables', () => {
  it('returns unique sorted-ish list of variables', () => {
    const content = 'Hello {{name}}, age {{age}}. Repeat: {{name}}.';
    expect(extractVariables(content)).toEqual(['name', 'age']);
  });

  it('returns empty array when no variables', () => {
    expect(extractVariables('plain text')).toEqual([]);
  });

  it('handles underscores and digits', () => {
    expect(extractVariables('{{var_one}} and {{var2}}')).toEqual(['var_one', 'var2']);
  });
});

describe('fillTemplate', () => {
  it('replaces variables with provided values', () => {
    const result = fillTemplate('Hello {{name}}', { name: 'World' });
    expect(result).toBe('Hello World');
  });

  it('leaves unmatched variables as-is', () => {
    const result = fillTemplate('Hello {{name}}', {});
    expect(result).toBe('Hello {{name}}');
  });

  it('leaves empty values as placeholders', () => {
    const result = fillTemplate('Hello {{name}}', { name: '' });
    expect(result).toBe('Hello {{name}}');
  });

  it('replaces multiple occurrences', () => {
    const result = fillTemplate('{{x}} and {{x}}', { x: 'Y' });
    expect(result).toBe('Y and Y');
  });

  it('is case-insensitive on variable names', () => {
    const result = fillTemplate('{{Name}}', { name: 'Alice' });
    expect(result).toBe('Alice');
  });
});

describe('getTemplatesByCategory', () => {
  it('returns only templates for the given category', () => {
    const coding = getTemplatesByCategory('Coding');
    expect(coding.length).toBeGreaterThan(0);
    expect(coding.every((t) => t.category === 'Coding')).toBe(true);
  });
});

describe('getTemplateById', () => {
  it('returns the template when found', () => {
    const t = getTemplateById('code-review');
    expect(t).toBeDefined();
    expect(t?.name).toBe('Code Review Assistant');
  });

  it('returns undefined when not found', () => {
    expect(getTemplateById('does-not-exist')).toBeUndefined();
  });
});