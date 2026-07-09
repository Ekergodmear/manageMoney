import type { Session } from '@/features/session/session-domain';
import { computeSessionStatistics, getCurrentPlan } from '@/features/session/session-domain';

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
  const safeTitle =
    session.title.replace(/[^\w\s-]/g, '').trim() || `session-${String(session.sessionNumber)}`;
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

export function exportSessionPrint(session: Session, presetName: string): void {
  const stats = computeSessionStatistics(session);
  const plan = getCurrentPlan(session);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${session.title}</title>
<style>body{font-family:system-ui,sans-serif;padding:24px;max-width:640px;margin:0 auto}
h1{font-size:1.25rem}table{width:100%;border-collapse:collapse;margin-top:16px}
td,th{border:1px solid #ddd;padding:8px;text-align:left;font-size:14px}
th{background:#f5f5f5}</style></head><body>
<h1>${session.title}</h1>
<p>${presetName} · ${session.status}</p>
<table><tr><th>Metric</th><th>Value</th></tr>
<tr><td>Vòng</td><td>${String(stats.roundsPlayed)}</td></tr>
<tr><td>Plans</td><td>${String(stats.planCount)}</td></tr>
<tr><td>Continue</td><td>${String(stats.continueCount)}</td></tr>
<tr><td>Cải thiện</td><td>${String(stats.improveCount)}</td></tr>
<tr><td>Cược cao nhất</td><td>${String(stats.highestBet)}</td></tr>
<tr><td>Hệ số</td><td>${plan !== null ? `×${plan.formValues.rewardMultiplier}` : '—'}</td></tr>
</table>
<p style="margin-top:24px;font-size:12px;color:#666">Stake Planner · ${new Date().toLocaleString('vi-VN')}</p>
</body></html>`;
  const win = window.open('', '_blank');
  if (win === null) {
    return;
  }
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  win.location.assign(url);
  win.addEventListener(
    'load',
    () => {
      URL.revokeObjectURL(url);
      win.focus();
      win.print();
    },
    { once: true },
  );
}

export function exportHistoryJson(sessions: readonly Session[]): void {
  exportLibraryJson(sessions);
}
