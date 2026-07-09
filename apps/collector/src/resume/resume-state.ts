import type { CollectorState, ResumeState } from '../types/collector-state.js';

export function deriveResumeStateOnStart(
  loaded: CollectorState,
): Pick<CollectorState, 'resumeState' | 'catchUpCount' | 'resumedFromDrawKey'> {
  if (loaded.lastDrawKey === null) {
    return { resumeState: 'fresh', catchUpCount: 0, resumedFromDrawKey: null };
  }
  return {
    resumeState: 'resumed',
    catchUpCount: 0,
    resumedFromDrawKey: loaded.lastDrawKey,
  };
}

export function finalizeResumeSession(
  state: CollectorState,
  insertedCount: number,
): Pick<CollectorState, 'resumeState' | 'catchUpCount'> {
  if (insertedCount > 0 && state.resumedFromDrawKey !== null) {
    return {
      resumeState: 'catch-up',
      catchUpCount: state.catchUpCount + insertedCount,
    };
  }
  if (state.resumeState === 'fresh') {
    return { resumeState: 'fresh', catchUpCount: state.catchUpCount };
  }
  return { resumeState: 'resumed', catchUpCount: state.catchUpCount };
}

export function formatResumeStateLabel(state: ResumeState): string {
  switch (state) {
    case 'fresh':
      return 'Fresh';
    case 'resumed':
      return 'Resumed';
    case 'catch-up':
      return 'Catch-up';
  }
}
