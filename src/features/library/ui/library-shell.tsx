import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, FolderOpen, Star, Tag, Trash2, Copy, Sparkles, BookOpen, ChevronDown } from 'lucide-react';
import { cn } from '~/shared/lib/cn';
import { storage, DEFAULT_WORKSPACE_ID } from '~/infrastructure/storage/storage.service';
import { useLicenseStore } from '~/features/premium/state/license-store';
import { canAddPrompt, freeUsageSummary } from '~/features/premium/lib/gating';
import { useWorkspaceStore } from '~/features/workspaces/state/workspace-store';
import type { Prompt, PromptCollection } from '~/infrastructure/storage/schema';
import { Button } from '~/shared/ui/button';
import { DropdownMenu } from '~/shared/ui/dropdown-menu';

/** Scopes an item to the active workspace (unset = default workspace). */
function belongsToWorkspace(workspaceId: string | undefined, activeWorkspaceId: string): boolean {
  return (workspaceId ?? DEFAULT_WORKSPACE_ID) === activeWorkspaceId;
}

type View = 'all' | 'favorites' | 'collections';
type SortBy = 'updatedAt' | 'createdAt' | 'title' | 'wordCount';

const CATEGORIES = ['All', 'Coding', 'Writing', 'Research', 'Business', 'Study', 'AI Agents', 'Marketing', 'Emails'] as const;
const ENHANCEMENT_TYPES = ['Professional', 'Detailed', 'Shorter', 'Longer', 'Technical', 'Beginner Friendly', 'Creative', 'Academic', 'Marketing', 'Coding'] as const;

export function LibraryShell(): JSX.Element {
  const queryClient = useQueryClient();
  const license = useLicenseStore();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('updatedAt');
  const [currentView, setCurrentView] = useState<View>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: prompts = [], isLoading: promptsLoading } = useQuery({
    queryKey: ['prompts'],
    queryFn: () => storage.prompts.getAll()
  });

  const { data: collections = [], isLoading: collectionsLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: () => storage.collections.getAll()
  });

  // Scope to the active workspace.
  const scopedPrompts = prompts.filter((p) => belongsToWorkspace(p.workspaceId, activeWorkspaceId));

  const insertMutation = useMutation({
    mutationFn: (prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) =>
      storage.prompts.add({ ...prompt, workspaceId: activeWorkspaceId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prompts'] })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Prompt> }) => storage.prompts.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prompts'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => storage.prompts.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prompts'] })
  });

  // Build all unique tags
  const allTags = Array.from(new Set(scopedPrompts.flatMap((p) => p.tags ?? []))).sort();

  // Filter & sort
  const filteredPrompts = scopedPrompts.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches = p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (selectedTag && !(p.tags ?? []).includes(selectedTag)) return false;
    if (currentView === 'favorites' && !p.isFavorite) return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'updatedAt': return b.updatedAt - a.updatedAt;
      case 'createdAt': return b.createdAt - a.createdAt;
      case 'title': return a.title.localeCompare(b.title);
      case 'wordCount': return (b.wordCount ?? 0) - (a.wordCount ?? 0);
      default: return 0;
    }
  });

  const isLoading = promptsLoading || collectionsLoading;
  const canCreatePrompt = canAddPrompt(license.tier, scopedPrompts.length);
  const openCreateForm = (): void => {
    if (canCreatePrompt) setShowCreateForm(true);
  };

  return (
    <div className="flex flex-col h-full w-[380px] bg-background">
      <LibraryHeader onCreateClick={openCreateForm} />
      {!license.hydrated ? null : !canCreatePrompt ? (
        <div className="mx-4 mb-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
            Free limit reached ({freeUsageSummary(license.tier, scopedPrompts.length, 0)}).
          </p>
          <Button
            variant="secondary"
            size="xs"
            className="mt-1.5"
            onClick={() => license.checkoutUrl && window.open(license.checkoutUrl, '_blank')}
          >
            Upgrade to Pro
          </Button>
        </div>
      ) : null}
      <LibraryTabs currentView={currentView} onViewChange={setCurrentView} />

      <div className="px-4 pb-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompts..."
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <CategoryPills categories={CATEGORIES} selected={selectedCategory} onSelect={setSelectedCategory} />
        </div>
        {allTags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {allTags.slice(0, 8).map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                  selectedTag === tag
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                <Tag className="h-3 w-3" />
                {tag}
              </button>
            ))}
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
              >
                Clear
              </button>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? 's' : ''}
          </span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="appearance-none bg-transparent text-xs text-muted-foreground pr-5 outline-none cursor-pointer hover:text-foreground"
            >
              <option value="updatedAt">Recently Updated</option>
              <option value="createdAt">Recently Created</option>
              <option value="title">Alphabetical</option>
              <option value="wordCount">Longest First</option>
            </select>
            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 space-y-3 p-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            {searchQuery ? 'No prompts match your search.' : 'No prompts saved yet. Create one to get started!'}
          </p>
          {!searchQuery && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={openCreateForm}
              disabled={!canCreatePrompt}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {canCreatePrompt ? 'Create Prompt' : 'Upgrade to add more'}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-4 pb-4">
          <div className="space-y-2">
            {filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onUpdate={(updates) => updateMutation.mutate({ id: prompt.id, updates })}
                onDelete={() => deleteMutation.mutate(prompt.id)}
                onToggleFavorite={() => updateMutation.mutate({ id: prompt.id, updates: { isFavorite: !prompt.isFavorite } })}
              />
            ))}
          </div>
        </div>
      )}

      {showCreateForm && (
        <CreatePromptDialog
          onClose={() => setShowCreateForm(false)}
          onSubmit={(data) => {
            insertMutation.mutate(data, { onSuccess: () => setShowCreateForm(false) });
          }}
          categories={CATEGORIES.slice(1)}
        />
      )}
    </div>
  );
}

function LibraryHeader({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 pb-3">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h1 className="text-base font-semibold">Prompt Library</h1>
      </div>
      <Button variant="primary" size="sm" onClick={onCreateClick}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function LibraryTabs({ currentView, onViewChange }: { currentView: View; onViewChange: (v: View) => void }) {
  const tabs: { key: View; label: string; icon?: React.ReactNode }[] = [
    { key: 'all', label: 'All' },
    { key: 'favorites', label: 'Favorites', icon: <Star className="h-3.5 w-3.5" /> },
    { key: 'collections', label: 'Collections', icon: <FolderOpen className="h-3.5 w-3.5" /> }
  ];

  return (
    <div className="flex border-b border-border">
      {tabs.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => onViewChange(key)}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2',
            currentView === key
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}

function CategoryPills({ categories, selected, onSelect }: { categories: readonly string[]; selected: string; onSelect: (c: string) => void }) {
  return (
    <>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={cn(
            'whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors border',
            selected === cat
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'
          )}
        >
          {cat}
        </button>
      ))}
    </>
  );
}

function PromptCard({
  prompt,
  onUpdate,
  onDelete,
  onToggleFavorite
}: {
  prompt: Prompt;
  onUpdate: (updates: Partial<Prompt>) => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(prompt.title);
  const [editContent, setEditContent] = useState(prompt.content);
  const [editCategory, setEditCategory] = useState(prompt.category ?? '');
  const [editTags, setEditTags] = useState(prompt.tags?.join(', ') ?? '');

  const handleSaveEdit = () => {
    onUpdate({
      title: editTitle,
      content: editContent,
      category: editCategory || undefined,
      tags: editTags.split(',').map(t => t.trim()).filter(Boolean)
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="rounded-lg border border-primary/50 bg-background p-3 space-y-2">
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Title"
          className="w-full text-sm font-medium bg-transparent border-b border-border pb-1 outline-none focus:border-primary"
        />
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          placeholder="Prompt content"
          rows={3}
          className="w-full text-xs bg-muted/30 rounded p-2 outline-none resize-none"
        />
        <input
          value={editCategory}
          onChange={(e) => setEditCategory(e.target.value)}
          placeholder="Category (optional)"
          className="w-full text-xs bg-muted/30 rounded p-2 outline-none"
        />
        <input
          value={editTags}
          onChange={(e) => setEditTags(e.target.value)}
          placeholder="Tags (comma-separated)"
          className="w-full text-xs bg-muted/30 rounded p-2 outline-none"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSaveEdit}>Save</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-foreground truncate">{prompt.title}</h3>
            {prompt.isFavorite && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />}
          </div>
          <p className={cn('text-xs text-muted-foreground mt-1', !isExpanded && 'line-clamp-1')}>
            {isExpanded ? prompt.content : prompt.content.slice(0, 80)}
            {prompt.content.length > 80 && !isExpanded && '...'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {prompt.category && (
              <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                {prompt.category}
              </span>
            )}
            {(prompt.tags ?? []).map((tag) => (
              <span key={tag} onClick={(e) => { e.stopPropagation(); }}>
                <TagButton tag={tag} />
              </span>
            ))}
            <span className="text-xs text-muted-foreground/60">
              {new Date(prompt.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="flex items-center  flex-shrink-0">
          <DropdownMenu
            items={[
              { label: 'Enhance', icon: Sparkles, onClick: () => {} },
              { label: 'Use', icon: Copy, onClick: () => {} },
              { label: 'Favorite', icon: Star, onClick: onToggleFavorite },
              { label: 'Delete', icon: Trash2, onClick: onDelete, destructive: true }
            ]}
          />
        </div>
      </div>
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
          <pre className="whitespace-pre-wrap text-xs bg-muted/40 rounded p-2.5 max-h-40 overflow-auto">
            {prompt.content}
          </pre>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="xs" onClick={() => { setIsEditing(true); setIsExpanded(false); }}>
              Edit
            </Button>
            <Button variant="ghost" size="xs" onClick={() => setIsExpanded(false)}>
              Collapse
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TagButton({ tag }: { tag: string }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary cursor-pointer hover:bg-primary/20 transition-colors"
    >
      <Tag className="h-2.5 w-2.5" />
      {tag}
    </span>
  );
}


function CreatePromptDialog({
  onClose,
  onSubmit,
  categories
}: {
  onClose: () => void;
  onSubmit: (data: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => void;
  categories: string[];
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    onSubmit({
      title: title.trim(),
      content: content.trim(),
      category: category || undefined,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      isFavorite,
      wordCount: content.split(/\s+/).filter(Boolean).length,
      characterCount: content.length,
      enhancementHistory: []
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl p-5 w-[340px] shadow-premium space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Create Prompt</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Prompt title"
          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background outline-none focus:border-primary placeholder:text-muted-foreground"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Your prompt content..."
          rows={5}
          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background outline-none resize-none focus:border-primary placeholder:text-muted-foreground"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background outline-none focus:border-primary"
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (comma-separated)"
          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background outline-none focus:border-primary placeholder:text-muted-foreground"
        />

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isFavorite}
            onChange={(e) => setIsFavorite(e.target.checked)}
            className="w-4 h-4 rounded accent-primary"
          />
          <span className="text-xs text-muted-foreground">Mark as favorite</span>
        </label>

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim()}
          >
            Create Prompt
          </Button>
        </div>

        {content.trim() && (
          <div className="text-xs text-muted-foreground pt-1 border-t border-border">
            {content.split(/\s+/).filter(Boolean).length} words · {content.length} characters
          </div>
        )}
      </div>
    </div>
  );
}