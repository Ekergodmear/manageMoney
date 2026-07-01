import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createAppContext, createShellRuntime } from '@/product-shell';
import type { AppCommand } from '@/product-shell';
import { ShellProvider } from '@/product-shell/ui';

function planningCommand(execute: () => Promise<void>): AppCommand {
  return {
    id: 'planning.generate',
    title: 'Generate Plan',
    category: 'Planning',
    keywords: ['plan', 'generate'],
    visible: () => true,
    enabled: () => true,
    execute: () => execute(),
  };
}

describe('CommandPalette', () => {
  afterEach(() => {
    cleanup();
  });

  it('searches commands and executes on Enter', async () => {
    const user = userEvent.setup();
    const runtime = createShellRuntime();
    const execute = vi.fn(() => Promise.resolve());
    runtime.registerCommand(planningCommand(execute));

    render(
      <ShellProvider runtime={runtime} appContext={createAppContext()}>
        <div />
      </ShellProvider>,
    );

    await user.keyboard('{Control>}k{/Control}');
    const input = screen.getByRole('textbox', { name: 'Search commands' });
    await user.clear(input);
    await user.type(input, 'plan');
    expect(screen.getByRole('option', { name: /Generate Plan/i })).toBeInTheDocument();

    await user.keyboard('{Enter}');
    expect(execute).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument();
    expect(runtime.actionHistory.recent(1)[0]).toEqual(
      expect.objectContaining({ commandId: 'planning.generate', outcome: 'success' }),
    );
  });

  it('shows recent commands when opened with an empty query', async () => {
    const user = userEvent.setup();
    const runtime = createShellRuntime();
    runtime.registerCommand(planningCommand(() => Promise.resolve()));
    runtime.actionHistory.recordSuccess('planning.generate');
    runtime.actionHistory.recordFailure('planning.export');

    render(
      <ShellProvider runtime={runtime} appContext={createAppContext()}>
        <div />
      </ShellProvider>,
    );

    await user.keyboard('{Control>}k{/Control}');
    expect(screen.getByText('Recent')).toBeInTheDocument();
    expect(screen.getByText('Generate Plan')).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const runtime = createShellRuntime();

    render(
      <ShellProvider runtime={runtime} appContext={createAppContext()}>
        <div />
      </ShellProvider>,
    );

    await user.keyboard('{Control>}k{/Control}');
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument();
  });
});
