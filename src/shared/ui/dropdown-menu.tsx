import React, { useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { cn } from '~/shared/lib/cn';

type DropdownMenuItem = {
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  destructive?: boolean;
};

type DropdownMenuProps = {
  items: DropdownMenuItem[];
};

export function DropdownMenu({ items }: DropdownMenuProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<'bottom-right' | 'top-right'>('bottom-right');

  // Handle outside click and escape key
  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  // Adjust position dynamically
  useEffect(() => {
    if (open && containerRef.current && menuRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (rect.bottom + menuRect.height > viewportHeight && rect.top - menuRect.height > 0) {
        setPosition('top-right');
      } else {
        setPosition('bottom-right');
      }
    }
  }, [open]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
          open && "bg-muted text-foreground"
        )}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          className={cn(
            "absolute z-50 min-w-[140px] rounded-md border border-border bg-card p-1 shadow-premium outline-none animate-in fade-in zoom-in-95 duration-100",
            position === 'bottom-right' ? "top-full right-0 mt-1" : "bottom-full right-0 mb-1"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  item.onClick();
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs outline-none transition-colors",
                  item.destructive
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
