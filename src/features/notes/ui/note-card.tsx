import React, { useState } from 'react';
import { cn } from '~/shared/lib/cn';
import { Star, Trash2, Copy } from 'lucide-react';
import { renderMarkdown } from '~/features/notes/lib/markdown';
import { Button } from '~/shared/ui/button';
import type { AINote } from '~/infrastructure/storage/schema';

type NoteCardProps = {
  note: AINote;
  onToggleFavorite: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  onCopy: (noteId: string) => void;
};

export function NoteCard({
  note,
  onToggleFavorite,
  onDelete,
  onCopy
}: NoteCardProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-medium text-foreground truncate">
            {note.title}
          </h2>
          <div className="flex flex-wrap gap-2 mt-1">
            {note.tags.map((tag: string) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                # {tag}
              </span>
            ))}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            <span className="whitespace-nowrap">
              {new Date(note.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
            {note.promptId && (
              <span className="ml-3 whitespace-nowrap">• Linked to prompt</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onToggleFavorite(note.id)}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              note.isFavorite
                ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <Star className="h-4 w-4" />
          </button>
          <button
            onClick={() => onCopy(note.id)}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <div
          className="prose prose-sm max-w-none text-foreground/90"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
        />
        {note.aiResponseContent && (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              AI Response:
            </p>
            <div className="prose prose-sm max-w-none text-foreground/80">
              {note.aiResponseContent}
            </div>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full">
            Edit Note
          </Button>
        </div>
      )}
    </div>
  );
}