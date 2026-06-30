import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createAppContext, createShellRuntime } from '@/product-shell';
import {
  BuildStatusProvider,
  CloudStatusProvider,
  CollectorStatusProvider,
  SessionStatusProvider,
  ShellProvider,
  StatusBar,
} from '@/product-shell/ui';

describe('StatusBar', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders provider snapshots without fetching', () => {
    const runtime = createShellRuntime();

    render(
      <ShellProvider runtime={runtime} appContext={createAppContext()}>
        <CollectorStatusProvider
          value={{
            id: 'collector',
            label: 'Collector 🟢',
            tone: 'ok',
          }}
        >
          <CloudStatusProvider
            value={{
              id: 'cloud',
              label: 'Cloud OFF',
              tone: 'disabled',
            }}
          >
            <SessionStatusProvider
              value={{
                id: 'session',
                label: 'Playing',
                detail: '3 rounds left',
                tone: 'ok',
              }}
            >
              <BuildStatusProvider
                value={{
                  id: 'build',
                  label: 'v0.8.0-dev',
                  tone: 'neutral',
                }}
              >
                <StatusBar />
              </BuildStatusProvider>
            </SessionStatusProvider>
          </CloudStatusProvider>
        </CollectorStatusProvider>
      </ShellProvider>,
    );

    expect(screen.getByLabelText('Application status')).toBeInTheDocument();
    expect(screen.getByText('Collector 🟢')).toBeInTheDocument();
    expect(screen.getByText(/Playing/)).toBeInTheDocument();
    expect(screen.getByText(/3 rounds left/)).toBeInTheDocument();
    expect(screen.getByText('Cloud OFF')).toBeInTheDocument();
    expect(screen.getByText('v0.8.0-dev')).toBeInTheDocument();
  });

  it('invokes segment click handlers', async () => {
    const user = userEvent.setup();
    const runtime = createShellRuntime();
    const collectorClick = vi.fn();
    const sessionClick = vi.fn();

    render(
      <ShellProvider runtime={runtime} appContext={createAppContext()}>
        <CollectorStatusProvider
          value={{
            id: 'collector',
            label: 'Collector 🟢',
            tone: 'ok',
            onClick: collectorClick,
          }}
        >
          <CloudStatusProvider
            value={{
              id: 'cloud',
              label: 'Cloud OFF',
              tone: 'disabled',
            }}
          >
            <SessionStatusProvider
              value={{
                id: 'session',
                label: 'Playing',
                detail: '3 rounds left',
                tone: 'ok',
                onClick: sessionClick,
              }}
            >
              <BuildStatusProvider
                value={{
                  id: 'build',
                  label: 'v0.8.0-dev',
                  tone: 'neutral',
                }}
              >
                <StatusBar />
              </BuildStatusProvider>
            </SessionStatusProvider>
          </CloudStatusProvider>
        </CollectorStatusProvider>
      </ShellProvider>,
    );

    await user.click(screen.getByRole('button', { name: /Collector/ }));
    await user.click(screen.getByRole('button', { name: /Playing/ }));
    expect(collectorClick).toHaveBeenCalledOnce();
    expect(sessionClick).toHaveBeenCalledOnce();
  });
});
