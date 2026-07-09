/**
 * Sprint 3.6 — minimal consumer runs against built dist like a real package install.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '../..');
const EXAMPLE = join(ROOT, 'examples', 'minimal-consumer', 'index.ts');
const TSCONFIG = join(ROOT, 'examples', 'minimal-consumer', 'tsconfig.json');

function runExample(): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync('pnpm', ['exec', 'tsx', '--tsconfig', TSCONFIG, EXAMPLE], {
    cwd: ROOT,
    shell: process.platform === 'win32',
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

describe('Examples — minimal consumer', () => {
  it('runs full public API workflow against dist', () => {
    expect(existsSync(join(ROOT, 'dist', 'index.js'))).toBe(true);
    expect(existsSync(join(ROOT, 'dist', 'index.d.ts'))).toBe(true);

    const { status, stdout, stderr } = runExample();

    if (status !== 0) {
      throw new Error(`minimal-consumer failed (${String(status)}):\n${stderr}\n${stdout}`);
    }

    expect(stdout).toContain('Required bankroll');
    expect(stdout).toContain('Suggested plan');
    expect(stdout).toContain('Simulation');
    expect(stdout).toContain('↓');
  });
});
