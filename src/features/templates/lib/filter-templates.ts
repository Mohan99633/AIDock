import type { PromptTemplate, TemplateCategory } from '~/features/templates/data/templates';

/**
 * Filters templates by category and a search query over name, description, and tags.
 */
export function filterTemplates(
  templates: readonly PromptTemplate[],
  query: string,
  category: TemplateCategory | 'All'
): readonly PromptTemplate[] {
  const normalizedQuery = query.trim().toLowerCase();
  const categoryFiltered =
    category === 'All' ? templates : templates.filter((t) => t.category === category);

  if (!normalizedQuery) {
    return categoryFiltered;
  }

  return categoryFiltered.filter((t) => {
    const haystack = [t.name, t.description, t.category, ...t.tags].join(' ').toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}