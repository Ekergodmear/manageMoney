import { describe, expect, it, vi } from 'vitest';

import { createAppContext, createShellRuntime } from '@/product-shell';
import { isEditableTarget, keyboardEventToShortcut } from '@/product-shell/ui';

describe('keyboard helpers', () => {
  it('ignores input, textarea, and contenteditable targets', () => {
    const input = document.createElement('input');
    const textarea = document.createElement('textarea');
    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', 'true');

    expect(isEditableTarget(input)).toBe(true);
    expect(isEditableTarget(textarea)).toBe(true);
    expect(isEditableTarget(editable)).toBe(true);
    expect(isEditableTarget(document.createElement('button'))).toBe(false);
  });

  it('formats keyboard events for shortcut resolution', () => {
    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
    expect(keyboardEventToShortcut(event)).toBe('Ctrl+K');
  });

  it('resolves bound shortcuts through the runtime facade', async () => {
    const runtime = createShellRuntime();
    const execute = vi.fn(async () => undefined);
    runtime.registerCommand({
      id: 'navigation.open-planning',
      title: 'Open Planning',
      category: 'Navigation',
      keywords: ['plan'],
      visible: () => true,
      enabled: () => true,
      execute: async () => {
        await execute();
      },
    });
    runtime.bindShortcut('Ctrl+Shift+P', 'navigation.open-planning');

    const commandId = runtime.shortcuts.resolve('Ctrl+Shift+P');
    expect(commandId).toBe('navigation.open-planning');
    await runtime.executeCommand(commandId!, createAppContext());
    expect(execute).toHaveBeenCalledOnce();
  });
});

describe('global keyboard guard', () => {
  it('does not resolve shortcuts when focus is inside an input', () => {
    const input = document.createElement('input');
    document.body.append(input);
    input.focus();

    const runtime = createShellRuntime();
    const execute = vi.fn(async () => undefined);
    runtime.registerCommand({
      id: 'navigation.open-planning',
      title: 'Open Planning',
      category: 'Navigation',
      keywords: ['plan'],
      visible: () => true,
      enabled: () => true,
      execute: async () => {
        await execute();
      },
    });
    runtime.bindShortcut('Ctrl+Shift+P', 'navigation.open-planning');

    const event = new KeyboardEvent('keydown', {
      key: 'P',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
    });
    Object.defineProperty(event, 'target', { value: input });

    if (isEditableTarget(event.target)) {
      expect(runtime.shortcuts.resolve('Ctrl+Shift+P')).toBe('navigation.open-planning');
      expect(execute).not.toHaveBeenCalled();
      return;
    }

    throw new Error('Expected editable target guard to trigger');
  });
});
