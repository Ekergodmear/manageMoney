import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { zIndexClass } from '@/design/tokens/z-index';
import { cn } from '@/lib/utils';

import { useShell } from '@/product-shell/ui/shell-context';
import {
  buildPaletteRows,
  listSelectableItems,
  type PaletteRow,
} from '@/product-shell/ui/palette/palette-items';

export interface CommandPaletteProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

function outcomeGlyph(outcome: 'success' | 'failure'): string {
  return outcome === 'success' ? '✓' : '✕';
}

export function CommandPalette({ open, onClose }: CommandPaletteProps): ReactNode {
  const { runtime, appContext } = useShell();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [executing, setExecuting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const rows = useMemo((): readonly PaletteRow[] => {
    if (!open) {
      return [];
    }
    return buildPaletteRows({
      query,
      recent: runtime.actionHistory.recent(10),
      visibleCommands: runtime.searchCommands('', appContext).map((entry) => entry.command),
      resolveCommandTitle: (commandId) => runtime.commands.get(commandId)?.title,
    });
  }, [appContext, open, query, runtime]);

  const selectableItems = useMemo(() => listSelectableItems(rows), [rows]);

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

  async function runSelectedItem(): Promise<void> {
    const selected = selectableItems[selectedIndex];
    if (selected === undefined || executing) {
      return;
    }
    setExecuting(true);
    try {
      const commandId = selected.kind === 'recent' ? selected.commandId : selected.command.id;
      await runtime.executeCommand(commandId, appContext);
      onClose();
    } catch {
      // Failure is recorded in action history; palette stays open.
    } finally {
      setExecuting(false);
    }
  }

  if (!open) {
    return null;
  }

  let selectableCursor = -1;

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
            setSelectedIndex((index) =>
              Math.min(index + 1, Math.max(selectableItems.length - 1, 0)),
            );
            return;
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedIndex((index) => Math.max(index - 1, 0));
            return;
          }
          if (event.key === 'Enter') {
            event.preventDefault();
            void runSelectedItem();
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
          {rows.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">No matching commands</li>
          ) : (
            rows.map((row, index) => {
              if (row.kind === 'header') {
                return (
                  <li
                    key={`header-${row.label}-${index}`}
                    className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {row.label}
                  </li>
                );
              }

              selectableCursor += 1;
              const active = selectableCursor === selectedIndex;
              const label = row.kind === 'recent' ? row.title : row.command.title;
              const description = row.kind === 'command' ? row.command.description : undefined;

              return (
                <li key={row.kind === 'recent' ? `recent-${row.commandId}` : row.command.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={cn(
                      'flex w-full items-start gap-2 px-4 py-2 text-left text-sm transition-colors',
                      active ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
                    )}
                    onMouseEnter={() => {
                      setSelectedIndex(selectableCursor);
                    }}
                    onClick={() => {
                      setSelectedIndex(selectableCursor);
                      void runSelectedItem();
                    }}
                  >
                    {row.kind === 'recent' ? (
                      <span aria-hidden className="mt-0.5 w-4 shrink-0 text-xs">
                        {outcomeGlyph(row.outcome)}
                      </span>
                    ) : null}
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium">{label}</span>
                      {description !== undefined ? (
                        <span className="text-xs text-muted-foreground">{description}</span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
