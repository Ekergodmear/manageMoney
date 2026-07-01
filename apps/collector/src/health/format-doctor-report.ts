import { formatDiagnosisCause } from '../diagnostics/diagnosis-cause.js';
import type { CollectorHealthSnapshot } from '../diagnostics/types.js';
import { formatOperationalStatus } from './operational-status.js';

function row(label: string, value: string): string {
  return `${label.padEnd(18)}${value}`;
}

function formatFailureClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function formatDoctorReport(snapshot: CollectorHealthSnapshot): string {
  const lines: string[] = ['Collector', '──────────────'];
  const summary = snapshot.summary;

  lines.push(row('Status', formatOperationalStatus(summary.status)));
  lines.push(row('Adapter', summary.adapter));
  lines.push(row('Last Success', summary.lastSuccess ?? 'never'));
  lines.push(row('Last Poll', summary.lastPoll ?? 'never'));
  lines.push(row('Latest Draw', summary.latestDraw ?? 'none'));
  lines.push(row('Resume State', summary.resumeState));
  if (snapshot.details.resumedFromDrawKey !== null) {
    lines.push(row('Resumed From', snapshot.details.resumedFromDrawKey));
  }
  lines.push(row('Retry Count', String(summary.retryCount)));
  lines.push(row('Catch-up Count', String(summary.catchUpCount)));
  lines.push(row('Duplicates Skip', String(summary.duplicatesSkipped)));
  lines.push('');
  lines.push(row('Last Draw Age', snapshot.freshness.lastDrawAgeLabel));
  if (snapshot.freshness.warning !== null) {
    lines.push(row('Freshness', snapshot.freshness.warning));
  }

  if (snapshot.lastFailure !== null) {
    const failure = snapshot.lastFailure;
    lines.push('');
    lines.push('Last Error');
    lines.push('');
    lines.push(row('Type', formatDiagnosisCause(failure.cause)));
    lines.push(row('At', formatFailureClock(failure.at)));
    lines.push(row('Retry', `${String(failure.retryAttempt)} / ${String(failure.retryMax)}`));
    if (failure.durationMs !== null) {
      lines.push(row('Duration', `${String(Math.round(failure.durationMs / 1000))}s`));
    }
  }

  if (snapshot.diagnosis !== null && snapshot.lastFailure === null) {
    lines.push('');
    lines.push(row('Diagnosis', formatDiagnosisCause(snapshot.diagnosis)));
  }

  return lines.join('\n');
}
