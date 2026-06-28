import type { GenerateResult } from '@/features/planner/plan-service';
import type { ActiveSession, HistorySession } from '@/features/session/session-types';

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportSessionJson(
  generated: GenerateResult,
  meta: { sessionNumber: number; completedThroughRound: number },
): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    sessionNumber: meta.sessionNumber,
    completedThroughRound: meta.completedThroughRound,
    request: generated.request,
    statistics: generated.statistics,
    rounds: generated.strategy.rounds,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  downloadBlob(`stake-planner-session-${String(meta.sessionNumber)}.json`, blob);
}

export function exportHistoryJson(history: readonly HistorySession[]): void {
  const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
  downloadBlob(`stake-planner-history.json`, blob);
}

export function printSession(
  session: ActiveSession | HistorySession,
  completedThroughRound: number,
): void {
  const { generated } = session;
  const rows = generated.strategy.rounds
    .map((round) => {
      const done = round.index <= completedThroughRound ? '✓' : ' ';
      return `<tr><td>${done}</td><td>${String(round.index)}</td><td>${round.betAmount.toLocaleString('vi-VN')}</td></tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Stake Planner — Phiên #${String(session.sessionNumber)}</title>
<style>body{font-family:system-ui,sans-serif;padding:2rem}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:6px 10px;text-align:left}th{background:#f4f4f4}</style>
</head><body>
<h1>Stake Planner — Phiên #${String(session.sessionNumber)}</h1>
<p>Vòng: ${String(completedThroughRound)} / ${String(generated.strategy.rounds.length)}</p>
<table><thead><tr><th></th><th>Vòng</th><th>Cược</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`;

  const win = window.open('', '_blank');
  if (win === null) {
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}
