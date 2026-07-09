/**
 * Architecture — Core Services import boundaries
 * @see docs/adr/0005-domain-event-architecture.md
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '../..');
const SRC = join(ROOT, 'src');

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist' || entry === 'dist-app') {
        continue;
      }
      files.push(...collectSourceFiles(full));
      continue;
    }
    if (/\.(tsx?)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

function filesUnder(relativeDir: string): string[] {
  const dir = join(SRC, relativeDir);
  return collectSourceFiles(dir);
}

function fileImportsPattern(filePath: string, pattern: RegExp): boolean {
  const content = readFileSync(filePath, 'utf8');
  return pattern.test(content);
}

describe('Architecture — features/ must not read import.meta.env', () => {
  for (const file of filesUnder('features')) {
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    it(rel, () => {
      expect(fileImportsPattern(file, /import\.meta\.env/)).toBe(false);
    });
  }
});

describe('Architecture — features/ must not import config internals directly', () => {
  const forbidden = [
    /@\/services\/config\/Environment/,
    /@\/services\/config\/AppConfig/,
    /@\/services\/config\/BuildInfo/,
  ];

  for (const file of filesUnder('features')) {
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    for (const pattern of forbidden) {
      it(`${rel} must not match ${pattern.source}`, () => {
        expect(fileImportsPattern(file, pattern)).toBe(false);
      });
    }
  }
});

describe('Architecture — features/ must not import storage drivers or logger sinks', () => {
  const forbidden = [
    /@\/services\/storage\/StorageDriver/,
    /@\/services\/storage\/IndexedDbDriver/,
    /@\/services\/storage\/MemoryStorageDriver/,
    /@\/services\/logger\/sinks\/console-sink/,
    /@\/services\/logger\/sinks\/log-sink/,
    /getAppServices\s*\(/,
  ];

  const allowedGetAppServices = new Set([
    'src/features/session/session-persistence.ts',
    'src/services/registry/app-services.ts',
    'src/services/registry/AppServicesProvider.tsx',
  ]);

  for (const file of filesUnder('features')) {
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    for (const pattern of forbidden) {
      if (pattern.source.includes('getAppServices') && allowedGetAppServices.has(rel)) {
        continue;
      }
      it(`${rel} must not match ${pattern.source}`, () => {
        expect(fileImportsPattern(file, pattern)).toBe(false);
      });
    }
  }
});

describe('Architecture — telemetry/ must not import React', () => {
  for (const file of filesUnder('services/telemetry')) {
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    it(rel, () => {
      expect(fileImportsPattern(file, /from ['"]react['"]/)).toBe(false);
    });
  }
});

describe('Architecture — logger/ must not import React', () => {
  for (const file of filesUnder('services/logger')) {
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    it(rel, () => {
      expect(fileImportsPattern(file, /from ['"]react['"]/)).toBe(false);
    });
  }
});

describe('Architecture — health/ must not import React', () => {
  for (const file of filesUnder('services/health')) {
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    it(rel, () => {
      expect(fileImportsPattern(file, /from ['"]react['"]/)).toBe(false);
    });
  }
});

describe('Architecture — EventStore must not reference IndexedDB API', () => {
  it('event-store.ts uses StorageDriver only', () => {
    const file = join(SRC, 'services/telemetry/event-store.ts');
    const content = readFileSync(file, 'utf8');
    expect(content).not.toMatch(/indexedDB/);
  });
});
