import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { zIndexClass } from '@/design/tokens/z-index';
import { cn } from '@/lib/utils';
import type { CommandSearchResult } from '@/product-shell/types/command';

import { useShell } from '@/product-shell/ui/shell-context';

export interface CommandPaletteProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps): ReactNode {
  const { runtime, appContext } = useShell();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [executing, setExecuting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo((): readonly CommandSearchResult[] => {
    if (!open) {
      return [];
    }
    if (query.trim().length === 0) {
      return runtime.searchCommands('', appContext).slice(0, 12);
    }
    return runtime.searchCommands(query, appContext);
  }, [appContext, open, query, runtime]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelectedIndex(0);
      setExecuting(false);
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  async function runCommandAt(index: number): Promise<void> {
    const selected = results[index];
    if (selected === undefined || executing) {
      return;
    }
    setExecuting(true);
    try {
      await runtime.executeCommand(selected.command.id, appContext);
      onClose();
    } catch {
      // Failure is recorded in action history; palette stays open.
    } finally {
      setExecuting(false);
    }
  }

  async function runSelected(): Promise<void> {
    await runCommandAt(selectedIndex);
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className={cn('fixed inset-0 flex items-start justify-center bg-black/50 px-4 pt-[12vh]', zIndexClass.commandPalette)}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
            return;
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSelectedIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
            return;
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedIndex((index) => Math.max(index - 1, 0));
            return;
          }
          if (event.key === 'Enter') {
            event.preventDefault();
            void runSelected();
          }
        }}
      >
        <div className="border-b border-border px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder="Search commands…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Search commands"
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
        </div>
        <ul className="max-h-80 overflow-y-auto py-2" role="listbox">
          {results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">No matching commands</li>
          ) : (
            results.map((entry, index) => (
              <li key={entry.command.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={index === selectedIndex}
                  className={cn(
                    'flex w-full flex-col items-start px-4 py-2 text-left text-sm transition-colors',
                    index === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
                  )}
                  onMouseEnter={() => {
                    setSelectedIndex(index);
                  }}
                  onClick={() => {
                    void runCommandAt(index);
                  }}
                >
                  <span className="font-medium">{entry.command.title}</span>
                  {entry.command.description !== undefined ? (
                    <span className="text-xs text-muted-foreground">{entry.command.description}</span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
