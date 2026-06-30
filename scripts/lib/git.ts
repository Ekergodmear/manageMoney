import { execSync } from 'node:child_process';

export function readGitCommitSha(): string {
  try {
    return execSync('git rev-parse HEAD', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'unknown';
  }
}

export function readGitBranch(): string {
  try {
    return execSync('git branch --show-current', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim() || 'HEAD';
  } catch {
    return 'unknown';
  }
}

export function isGitClean(): boolean {
  try {
    const status = execSync('git status --porcelain', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return status.length === 0;
  } catch {
    return false;
  }
}
