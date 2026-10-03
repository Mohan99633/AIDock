import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, LayoutTemplate, Star, Copy, BookOpen, Check, X } from 'lucide-react';
import { cn } from '~/shared/lib/cn';
import { storage } from '~/infrastructure/storage/storage.service';
import {
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  extractVariables,
  fillTemplate,
  type PromptTemplate,
  type TemplateCategory
} from '~/features/templates/data/templates';
import { filterTemplates } from '~/features/templates/lib/filter-templates';
import { Button } from '~/shared/ui/button';

type CategoryFilter = TemplateCategory | 'All';

export function TemplatesShell(): JSX.Element {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('All');
  const [selected, setSelected] = useState<PromptTemplate | null>(null);

  const filtered = useMemo(
    () => filterTemplates(TEMPLATES, searchQuery, category),
    [searchQuery, category]
  );

  const addToLibraryMutation = useMutation({
    mutationFn: (content: { title: string; body: string }) =>
      storage.prompts.add({
        title: content.title,
        content: content.body,
        category: selected?.category,
        tags: selected?.tags ?? [],
        isFavorite: false,
        wordCount: content.body.split(/\s+/).filter(Boolean).length,
        characterCount: content.body.length,
        enhancementHistory: []
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    }
  });

  return (
    <div className="flex flex-col h-full w-[380px] bg-background">
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-5 w-5 text-primary" />
          <h1 className="text-base font-semibold">Templates</h1>
        </div>
      </div>

      <div className="px-4 pb-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['All', ...TEMPLATE_CATEGORIES] as CategoryFilter[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-colors border',
                category === cat
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground block">
          {filtered.length} template{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <LayoutTemplate className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            No templates match "{searchQuery.trim()}".
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-4 pb-4">
          <div className="space-y-2">
            {filtered.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={() => setSelected(template)}
              />
            ))}
          </div>
        </div>
      )}

      {selected && (
        <TemplateDetailDialog
          template={selected}
          onClose={() => setSelected(null)}
          onUse={(title, body) => {
            addToLibraryMutation.mutate({ title, body });
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

function TemplateCard({ template, onClick }: { template: PromptTemplate; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group w-full text-left rounded-lg border border-border bg-card p-3 transition-colors',
        'hover:border-primary/40 hover:bg-muted/50'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground">{template.name}</h3>
        <span className="inline-flex shrink-0 items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
          {template.category}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{template.description}</p>
      <div className="mt-2 flex items-center gap-1.5">
        {(template.tags ?? []).slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}

function TemplateDetailDialog({
  template,
  onClose,
  onUse
}: {
  template: PromptTemplate;
  onClose: () => void;
  onUse: (title: string, body: string) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const variables = useMemo(() => extractVariables(template.content), [template.content]);

  const filledBody = fillTemplate(template.content, values);
  const hasUnfilled = variables.some((v) => !(values[v] ?? '').trim());
  const usableTitle = template.name;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(filledBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-[380px] flex-col rounded-xl border border-border bg-card shadow-premium"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-2 p-4 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                {template.category}
              </span>
              <Star className="h-4 w-4 text-amber-400" />
            </div>
            <h2 className="mt-2 text-base font-semibold">{template.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-auto px-4 pb-4 space-y-4">
          <p className="text-xs text-muted-foreground">{template.description}</p>

          {variables.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Fill in variables
              </p>
              {variables.map((v) => (
                <label key={v} className="block">
                  <span className="mb-1 block text-xs text-muted-foreground">
                    {v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                  <input
                    value={values[v] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, [v]: e.target.value }))}
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  />
                </label>
              ))}
            </div>
          )}

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Prompt preview
            </p>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-2.5 text-xs text-foreground">
              {filledBody}
            </pre>
          </div>

          {hasUnfilled && (
            <p className="rounded-lg border border-dashed border-border px-2.5 py-1.5 text-xs text-muted-foreground">
              {'Unfilled variables will be left as {{placeholder}}.'}
            </p>
          )}
        </div>

        <footer className="flex gap-2 border-t border-border p-4">
          <Button variant="secondary" size="sm" className="flex-1" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={() => onUse(usableTitle, filledBody)}
          >
            <BookOpen className="h-4 w-4" />
            Save to Library
          </Button>
        </footer>
      </div>
    </div>
  );
}