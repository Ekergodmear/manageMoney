import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DiagnosticSnapshot } from '@/product-shell/types/diagnostics';
import { createDiagnosticCapabilities } from '@/product-shell/ui/diagnostics/create-capabilities';
import { DiagnosticsPage } from '@/product-shell/ui/diagnostics/DiagnosticsPage';
import { DiagnosticsProvider } from '@/product-shell/ui/diagnostics/DiagnosticsProvider';

function snapshot(summary: string, severity: DiagnosticSnapshot['severity']): DiagnosticSnapshot {
  return {
    status: severity === 'critical' ? 'error' : severity === 'warning' ? 'warning' : 'ok',
    severity,
    summary,
    rows: [{ label: 'Detail', value: summary }],
    checkedAt: '2026-06-30T00:00:00.000Z',
  };
}

function refresh(summary: string, severity: DiagnosticSnapshot['severity']): () => Promise<DiagnosticSnapshot> {
  return () => Promise.resolve(snapshot(summary, severity));
}

function renderDiagnostics(
  overrides: Partial<{
    refreshCollector: () => Promise<DiagnosticSnapshot>;
  }> = {},
): void {
  const capabilities = createDiagnosticCapabilities({
    refreshCollector: overrides.refreshCollector ?? refresh('Collector unreachable', 'critical'),
    refreshStorage: refresh('3 sessions stored locally', 'info'),
    refreshRuntime: refresh('Runtime healthy', 'info'),
    refreshNotifications: refresh('0 unread notifications', 'info'),
    refreshStatistics: refresh('Statistics ready', 'info'),
    refreshCloud: refresh('Cloud disabled', 'info'),
  });

  render(
    <DiagnosticsProvider capabilities={capabilities}>
      <DiagnosticsPage />
    </DiagnosticsProvider>,
  );
}

describe('DiagnosticsProvider and page', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders six capability sections', async () => {
    renderDiagnostics();
    await waitFor(() => {
      expect(screen.getByLabelText('Collector')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Storage')).toBeInTheDocument();
    expect(screen.getByLabelText('Runtime')).toBeInTheDocument();
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
    expect(screen.getByLabelText('Statistics')).toBeInTheDocument();
    expect(screen.getByLabelText('Cloud')).toBeInTheDocument();
  });

  it('refreshes all capabilities from the page action', async () => {
    const user = userEvent.setup();
    const refreshCollector = vi
      .fn()
      .mockResolvedValueOnce(snapshot('Collector unreachable', 'critical'))
      .mockResolvedValue(snapshot('42 draws · bingo18', 'info'));
    renderDiagnostics({ refreshCollector });

    await waitFor(() => {
      expect(screen.getByText('Collector unreachable')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Refresh All' }));
    await waitFor(() => {
      expect(refreshCollector.mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('42 draws · bingo18')).toBeInTheDocument();
    });
  });

  it('survives offline collector without crashing', async () => {
    renderDiagnostics({
      refreshCollector: refresh('Collector unreachable', 'critical'),
    });
    await waitFor(() => {
      expect(screen.getByText('Collector unreachable')).toBeInTheDocument();
    });
    expect(screen.getAllByText('critical').length).toBeGreaterThan(0);
  });
});
