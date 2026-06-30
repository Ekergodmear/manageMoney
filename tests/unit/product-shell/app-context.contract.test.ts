import { describe, expect, it } from 'vitest';

import { createAppContext } from '@/product-shell';
import type { AppContext } from '@/product-shell';

const ALLOWED_APP_CONTEXT_KEYS = [
  'navigate',
  'logger',
  'notifications',
  'flags',
  'services',
] as const satisfies readonly (keyof AppContext)[];

const FORBIDDEN_APP_CONTEXT_KEYS = [
  'activeSession',
  'drawerOpen',
  'selectedPlan',
  'workspaceState',
  'activeWorkspaceId',
  'currentWorkspace',
  'uiState',
] as const;

describe('AppContext contract', () => {
  it('exposes only dependency keys', () => {
    const ctx = createAppContext();
    const keys = Object.keys(ctx).sort();
    expect(keys).toEqual([...ALLOWED_APP_CONTEXT_KEYS].sort());
  });

  it('does not expose UI state keys', () => {
    const ctx = createAppContext();
    for (const key of FORBIDDEN_APP_CONTEXT_KEYS) {
      expect(Object.hasOwn(ctx, key)).toBe(false);
    }
  });

  it('matches the frozen AppContext type shape', () => {
    const _contractCheck: AppContext = {
      navigate: () => undefined,
      logger: { info: () => undefined, warn: () => undefined, error: () => undefined },
      notifications: { notify: () => undefined },
      flags: {},
      services: {},
    };
    expect(_contractCheck).toBeDefined();
  });
});
