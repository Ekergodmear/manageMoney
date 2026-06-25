/**
 * Deep import must fail — package exports enforce single entry.
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '../..');

describe('Compat — deep import rejection', () => {
  it('rejects @stake/constraint-engine/core/solver at Node resolution', () => {
    const script = `
      import('@stake/constraint-engine/core/solver')
        .then(() => process.exit(2))
        .catch((err) => {
          const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
          if (code === 'ERR_PACKAGE_PATH_NOT_EXPORTED' || /not exported|Cannot find/.test(String(err))) {
            process.exit(0);
          }
          console.error(err);
          process.exit(1);
        });
    `;

    const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: ROOT,
      encoding: 'utf-8',
    });

    expect(result.status).toBe(0);
  });
});
