import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Star, Calendar } from 'lucide-react';
import { cn } from '~/shared/lib/cn';
import { storage, DEFAULT_WORKSPACE_ID } from '~/infrastructure/storage/storage.service';
import { useWorkspaceStore } from '~/features/workspaces/state/workspace-store';
import type { AINote } from '~/infrastructure/storage/schema';
import { Button } from '~/shared/ui/button';

/** Scopes an item to the active workspace (unset = default workspace). */
function belongsToWorkspace(workspaceId: string | undefined, activeWorkspaceId: string): boolean {
  return (workspaceId ?? DEFAULT_WORKSPACE_ID) === activeWorkspaceId;
}
import { NoteCard } from './note-card';
import { renderMarkdown } from '~/features/notes/lib/markdown';

type View = 'all' | 'favorites';
type SortBy = 'updatedAt' | 'createdAt' | 'title';
type FilterFormat = 'all' | 'markdown' | 'plain' | 'code';

const FORMAT_LABELS: Record<FilterFormat, string> = {
  all: 'All',
  markdown: 'Markdown',
  plain: 'Plain',
  code: 'Code'
};

export function NotesShell(): JSX.Element {
  const queryClient = useQueryClient();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<FilterFormat>('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('updatedAt');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: () => storage.notes.getAll()
  });

  const scopedNotes = notes.filter((n) => belongsToWorkspace(n.workspaceId, activeWorkspaceId));

  const insertMutation = useMutation({
    mutationFn: (note: Omit<AINote, 'id' | 'createdAt' | 'updatedAt'>) =>
      storage.notes.add({ ...note, workspaceId: activeWorkspaceId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AINote> }) =>
      storage.notes.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => storage.notes.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] })
  });

  const filteredNotes = scopedNotes.filter((note) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches = note.title.toLowerCase().includes(q) ||
                     note.content.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (selectedFormat !== 'all' && note.format !== selectedFormat) return false;
    if (showFavorites && !note.isFavorite) return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'updatedAt': return b.updatedAt - a.updatedAt;
      case 'createdAt': return b.createdAt - a.createdAt;
      case 'title': return a.title.localeCompare(b.title);
      default: return 0;
    }
  });

  return (
    <div className="flex flex-col h-full w-[380px] bg-background">
      <NotesHeader onCreateClick={() => setShowCreateForm(true)} />
      <div className="px-4 pb-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as FilterFormat)}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-muted-foreground outline-none focus:border-primary"
          >
            {Object.entries(FORMAT_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={cn(
              'h-8 rounded-full flex items-center gap-1 px-2.5 text-xs',
              showFavorites ? 'bg-amber-500/10 text-amber-500' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Star className="h-3 w-3" />
            Favorites
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-muted-foreground outline-none focus:border-primary"
          >
            <option value="updatedAt">Recently Updated</option>
            <option value="createdAt">Recently Created</option>
            <option value="title">Alphabetical</option>
          </select>
        </div>
        <span className="text-xs text-muted-foreground block">{filteredNotes.length} notes</span>
      </div>

      {isLoading ? (
        <div className="flex-1 space-y-3 p-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            {searchQuery ? 'No notes match your search.' : 'No notes yet. Create one to get started!'}
          </p>
          {!searchQuery && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create Note
            </Button>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-4 pb-4">
          <div className="space-y-3">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onToggleFavorite={() => updateMutation.mutate({ id: note.id, updates: { isFavorite: !note.isFavorite } })}
                onDelete={() => deleteMutation.mutate(note.id)}
                onCopy={() => {
                  navigator.clipboard.writeText(note.content);
                  // Optional: show a toast or temporary feedback
                }}
              />
            ))}
          </div>
        </div>
      )}

      {showCreateForm && (
        <CreateNoteDialog
          onClose={() => setShowCreateForm(false)}
          onSubmit={(data) => {
            insertMutation.mutate(data, { onSuccess: () => setShowCreateForm(false) });
          }}
        />
      )}
    </div>
  );
}

function NotesHeader({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 pb-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" />
        <h1 className="text-base font-semibold">Notes</h1>
      </div>
      <Button variant="primary" size="sm" onClick={onCreateClick}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function CreateNoteDialog({
  onClose,
  onSubmit
}: {
  onClose: () => void;
  onSubmit: (data: Omit<AINote, 'id' | 'createdAt' | 'updatedAt'>) => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [format, setFormat] = useState<'markdown' | 'plain' | 'code'>('markdown');
  const [tags, setTags] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [linkedPromptId, setLinkedPromptId] = useState<string | null>(null);
  const [linkedResponse, setLinkedResponse] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    onSubmit({
      title: title.trim(),
      content: content.trim(),
      format,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      isFavorite,
      // Optional links
      promptId: linkedPromptId || undefined,
      aiResponseContent: linkedResponse || undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl p-5 w-[340px] shadow-premium space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Create Note</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background outline-none focus:border-primary placeholder:text-muted-foreground"
        />

        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as 'markdown' | 'plain' | 'code')}
          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background outline-none focus:border-primary"
        >
          <option value="markdown">Markdown</option>
          <option value="plain">Plain Text</option>
          <option value="code">Code</option>
        </select>

        {/* Content textarea - adjust rows based on format */}
        {format === 'code' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter code snippet..."
            rows={8}
            className="w-full font-mono text-sm border border-border rounded-lg px-3 py-2 bg-background outline-none resize-none focus:border-primary placeholder:text-muted-foreground"
          />
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter note content..."
            rows={5}
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background outline-none resize-none focus:border-primary placeholder:text-muted-foreground"
          />
        )}

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

        <div className="mt-2">
          <label className="block text-xs text-muted-foreground mb-1">Link to prompt (optional)</label>
          <input
            value={linkedPromptId ?? ''}
            onChange={(e) => setLinkedPromptId(e.target.value || null)}
            placeholder="Prompt ID or title"
            className="w-full text-xs border border-border rounded px-2 py-1 bg-background outline-none focus:border-primary"
          />
        </div>

        <div className="mt-2">
          <label className="block text-xs text-muted-foreground mb-1">Linked AI response (optional)</label>
          <textarea
            value={linkedResponse ?? ''}
            onChange={(e) => setLinkedResponse(e.target.value || null)}
            placeholder="Paste AI response here..."
            rows={2}
            className="w-full text-xs border border-border rounded px-2 py-1 bg-background outline-none focus:border-primary"
          />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim()}
          >
            Create Note
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