import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export function measureBundleSize(dirs: readonly string[]): { bytes: number; files: number } {
  let bytes = 0;
  let files = 0;

  for (const dir of dirs) {
    walk(dir, (filePath) => {
      const stat = statSync(filePath);
      if (stat.isFile()) {
        bytes += stat.size;
        files += 1;
      }
    });
  }

  return { bytes, files };
}

function walk(dir: string, onFile: (path: string) => void): void {
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full, onFile);
      } else if (stat.isFile()) {
        onFile(full);
      }
    }
  } catch {
    // directory may not exist yet
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KiB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}
