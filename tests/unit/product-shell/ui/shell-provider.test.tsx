import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { createAppContext, createShellRuntime } from '@/product-shell';
import { ShellProvider, useShell } from '@/product-shell/ui';

function RuntimeProbe(): null {
  const { runtime, appContext } = useShell();
  expect(runtime).toBeDefined();
  expect(appContext.navigate).toBeTypeOf('function');
  return null;
}

describe('ShellProvider', () => {
  afterEach(() => {
    cleanup();
  });

  it('injects runtime and app context into useShell', () => {
    const runtime = createShellRuntime();
    const appContext = createAppContext();
    render(
      <ShellProvider runtime={runtime} appContext={appContext}>
        <RuntimeProbe />
      </ShellProvider>,
    );
  });

  it('opens the palette through the shell command shortcut', async () => {
    const user = userEvent.setup();
    const runtime = createShellRuntime();
    const appContext = createAppContext();

    render(
      <ShellProvider runtime={runtime} appContext={appContext}>
        <div>App body</div>
      </ShellProvider>,
    );

    await user.keyboard('{Control>}k{/Control}');
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();
  });
});
