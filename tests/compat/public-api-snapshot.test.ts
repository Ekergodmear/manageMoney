/**
 * Public API compat — runtime snapshot + ValidationCodes registry freeze.
 * @see docs/design/public-api-spec.md §5
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import * as SDK from '@stake/constraint-engine';

import { PUBLIC_RUNTIME_EXPORTS, PUBLIC_TYPE_EXPORTS } from './public-api-manifest';

const ROOT = join(import.meta.dirname, '../..');
const PUBLIC_INDEX = join(ROOT, 'src/public/index.ts');

function parseExportedNames(source: string): { runtime: string[]; types: string[] } {
  const runtime = new Set<string>();
  const types = new Set<string>();

  const valueExportRegex = /export\s*\{([^}]+)\}\s*from/g;
  const typeExportRegex = /export\s+type\s*\{([^}]+)\}\s*from/g;

  for (const regex of [valueExportRegex, typeExportRegex]) {
    const isType = regex === typeExportRegex;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(source)) !== null) {
      const block = match[1] ?? '';
      for (const part of block.split(',')) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        const name = trimmed.split(/\s+as\s+/)[0]?.trim();
        if (!name) continue;
        if (isType) {
          types.add(name);
        } else {
          runtime.add(name);
        }
      }
    }
  }

  return {
    runtime: [...runtime].sort(),
    types: [...types].sort(),
  };
}

describe('Compat — public API runtime snapshot', () => {
  it('exports exactly the frozen runtime surface', () => {
    expect(Object.keys(SDK).sort()).toEqual([...PUBLIC_RUNTIME_EXPORTS]);
  });

  it('freezes ValidationCodes at the public boundary', () => {
    expect(Object.isFrozen(SDK.ValidationCodes)).toBe(true);
  });

  it('matches ValidationCodes registry snapshot', () => {
    expect(SDK.ValidationCodes).toMatchSnapshot();
  });
});

describe('Compat — public API contract file', () => {
  it('index.ts exports match frozen type manifest', () => {
    const source = readFileSync(PUBLIC_INDEX, 'utf-8');
    const { types } = parseExportedNames(source);
    expect(types).toEqual([...PUBLIC_TYPE_EXPORTS]);
  });

  it('index.ts value exports match frozen runtime manifest', () => {
    const source = readFileSync(PUBLIC_INDEX, 'utf-8');
    const { runtime } = parseExportedNames(source);
    expect(runtime).toEqual([...PUBLIC_RUNTIME_EXPORTS]);
  });
});
