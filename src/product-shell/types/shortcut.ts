export interface ShortcutSpec {
  readonly key: string;
  readonly modifiers?: readonly ('ctrl' | 'shift' | 'alt' | 'meta')[];
}

export interface ResolvedShortcut {
  readonly commandId: string;
  readonly spec: ShortcutSpec;
  readonly display: string;
}
