/**
 * Consumer smoke — npm pack → install → import public API.
 * @see docs/design/sprint-2.7c-spec.md §2.7C.3
 */
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '../..');
const CONSUMER_DIR = join(ROOT, 'tests', 'consumer');
const PACK_DIR = join(CONSUMER_DIR, '.pack');
const NODE_MODULES = join(CONSUMER_DIR, 'node_modules');

function run(command: string, args: string[], cwd: string): void {
  const result = spawnSync(command, args, {
    cwd,
    shell: process.platform === 'win32',
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed (${String(result.status)}):\n${result.stderr}\n${result.stdout}`,
    );
  }
}

describe('Consumer — npm pack smoke', () => {
  it('packs, installs tarball, and runs public API pipeline', () => {
    expect(existsSync(join(ROOT, 'dist', 'index.js'))).toBe(true);
    expect(existsSync(join(ROOT, 'dist', 'index.d.ts'))).toBe(true);

    rmSync(PACK_DIR, { recursive: true, force: true });
    rmSync(NODE_MODULES, { recursive: true, force: true });
    mkdirSync(PACK_DIR, { recursive: true });

    run('pnpm', ['pack', '--pack-destination', PACK_DIR], ROOT);

    const tarballs = readdirSync(PACK_DIR).filter((f) => f.endsWith('.tgz'));
    expect(tarballs.length).toBe(1);
    const tarball = tarballs[0];
    if (tarball === undefined) {
      throw new Error('missing tarball');
    }

    run('npm', ['install', join('.pack', tarball)], CONSUMER_DIR);
    run('node', ['smoke.mjs'], CONSUMER_DIR);
  }, 120_000);
});
