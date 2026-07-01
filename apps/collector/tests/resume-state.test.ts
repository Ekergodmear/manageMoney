import { describe, expect, it } from 'vitest';

import {
  deriveResumeStateOnStart,
  finalizeResumeSession,
  formatResumeStateLabel,
} from '../src/resume/resume-state.js';
import { initialCollectorState } from '../src/types/collector-state.js';

describe('resume state', () => {
  it('deriveResumeStateOnStart marks fresh when no last draw', () => {
    const result = deriveResumeStateOnStart(initialCollectorState());
    expect(result).toEqual({
      resumeState: 'fresh',
      catchUpCount: 0,
      resumedFromDrawKey: null,
    });
  });

  it('deriveResumeStateOnStart marks resumed when last draw exists', () => {
    const loaded = {
      ...initialCollectorState(),
      lastDrawKey: '20260629200000',
    };
    const result = deriveResumeStateOnStart(loaded);
    expect(result.resumeState).toBe('resumed');
    expect(result.resumedFromDrawKey).toBe('20260629200000');
    expect(result.catchUpCount).toBe(0);
  });

  it('finalizeResumeSession marks catch-up when draws inserted after resume', () => {
    const state = {
      ...initialCollectorState(),
      resumeState: 'resumed' as const,
      resumedFromDrawKey: '20260629200000',
      catchUpCount: 0,
    };
    const result = finalizeResumeSession(state, 2);
    expect(result).toEqual({ resumeState: 'catch-up', catchUpCount: 2 });
  });

  it('formatResumeStateLabel title-cases values', () => {
    expect(formatResumeStateLabel('fresh')).toBe('Fresh');
    expect(formatResumeStateLabel('resumed')).toBe('Resumed');
    expect(formatResumeStateLabel('catch-up')).toBe('Catch-up');
  });
});
