import type { Session } from '@/features/session/session-domain';
import { computeSessionStatistics } from '@/features/session/session-domain';

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportFullSessionJson(session: Session): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    format: 'stake-planner-session-v1',
    session,
    statistics: computeSessionStatistics(session),
  };
  const safeTitle = session.title.replace(/[^\w\s-]/g, '').trim() || `session-${String(session.sessionNumber)}`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  downloadBlob(`${safeTitle}.json`, blob);
}

export function exportLibraryJson(sessions: readonly Session[]): void {
  const blob = new Blob(
    [JSON.stringify({ exportedAt: new Date().toISOString(), sessions }, null, 2)],
    { type: 'application/json' },
  );
  downloadBlob('stakeplanner-library.json', blob);
}

export function exportHistoryJson(sessions: readonly Session[]): void {
  exportLibraryJson(sessions);
}
