import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface CollectorVersionInfo {
  readonly version: string;
  readonly commit: string | null;
}

const packageDir = dirname(fileURLToPath(import.meta.url));

export function getCollectorVersion(): CollectorVersionInfo {
  const pkgPath = join(packageDir, '..', '..', 'package.json');
  let version = '0.0.0';
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string };
    version = pkg.version ?? version;
  } catch {
    // keep default
  }
  const commit =
    process.env['COLLECTOR_GIT_COMMIT'] ??
    process.env['VERCEL_GIT_COMMIT_SHA'] ??
    process.env['GIT_COMMIT'] ??
    null;
  return { version, commit };
}
