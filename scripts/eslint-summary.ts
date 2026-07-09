import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseEslintJson, runLintJson, summarizeEslintRules } from './lib/eslint.js';
import { REPORTS_DIR } from './report.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const WAVES_PATH = join(REPORTS_DIR, 'eslint-waves.json');

interface WaveEntry {
  readonly wave: string;
  readonly total: number;
  readonly at: string;
}

function loadWaves(): WaveEntry[] {
  if (!existsSync(WAVES_PATH)) {
    return [{ wave: 'R1 baseline', total: 253, at: '2026-06-30T05:37:58.000Z' }];
  }
  try {
    return JSON.parse(readFileSync(WAVES_PATH, 'utf-8')) as WaveEntry[];
  } catch {
    return [];
  }
}

function appendWave(waves: WaveEntry[], label: string, total: number): WaveEntry[] {
  const last = waves[waves.length - 1];
  if (last !== undefined && last.total === total && last.wave === label) {
    return waves;
  }
  return [...waves, { wave: label, total, at: new Date().toISOString() }];
}

async function main(): Promise<void> {
  const waveLabel = process.argv[2] ?? 'report';
  mkdirSync(REPORTS_DIR, { recursive: true });
  const jsonPath = join(REPORTS_DIR, 'eslint.json');
  const summaryPath = join(REPORTS_DIR, 'eslint-summary.md');

  console.log('Running ESLint (JSON)…');
  const result = runLintJson(jsonPath);
  const issues = parseEslintJson(jsonPath);
  const summary = summarizeEslintRules(issues);

  let waves = loadWaves();
  if (waveLabel !== 'report') {
    waves = appendWave(waves, waveLabel, summary.total);
    writeFileSync(WAVES_PATH, `${JSON.stringify(waves, null, 2)}\n`, 'utf-8');
  } else if (waves.length === 0 || waves[waves.length - 1]?.total !== summary.total) {
    waves = appendWave(waves, 'latest', summary.total);
    writeFileSync(WAVES_PATH, `${JSON.stringify(waves, null, 2)}\n`, 'utf-8');
  }

  const lines: string[] = [
    '# ESLint Summary',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Exit code: ${result.exitCode}`,
    `Total issues: ${summary.total}`,
    '',
  ];

  if (waves.length > 1) {
    lines.push('## Waves', '');
    for (let i = 1; i < waves.length; i += 1) {
      const prev = waves[i - 1];
      const curr = waves[i];
      if (prev !== undefined && curr !== undefined) {
        lines.push(`${prev.total} → ${curr.total}  (${curr.wave})`);
      }
    }
    lines.push('');
  }

  lines.push('| Rule | Count |', '| --- | ---: |');
  for (const row of summary.byRule) {
    lines.push(`| ${row.rule} | ${row.count} |`);
  }

  lines.push('', '---', '', 'Raw JSON: `reports/eslint.json`', '');

  writeFileSync(summaryPath, lines.join('\n'), 'utf-8');
  console.log(`ESLint JSON → ${jsonPath}`);
  console.log(`ESLint summary → ${summaryPath}`);
  console.log(`Total: ${summary.total} issues across ${summary.byRule.length} rule(s)`);

  process.exit(result.ok ? 0 : 1);
}

void main();
