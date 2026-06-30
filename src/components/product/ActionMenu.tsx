import { MoreVertical } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
import { semanticBg, semanticBorder } from '@/design/tokens/colors';
import { elevationShadow } from '@/design/tokens/shadows';
import { radius } from '@/design/tokens/radius';
import { zIndexClass } from '@/design/tokens/z-index';
import { cn } from '@/lib/utils';

export interface ActionMenuItem {
  readonly label: string;
  readonly onClick: () => void;
}

export interface ActionMenuSection {
  readonly title?: string;
  readonly items: readonly ActionMenuItem[];
}

export interface ActionMenuProps {
  readonly sections: readonly ActionMenuSection[];
  readonly ariaLabel?: string;
}

export function ActionMenu({ sections, ariaLabel = 'Thêm hành động' }: ActionMenuProps): ReactNode {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function handleClickOutside(event: MouseEvent): void {
      if (menuRef.current !== null && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative ml-auto" ref={menuRef}>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={() => {
          setOpen((value) => !value);
        }}
        aria-label={ariaLabel}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>
      {open ? (
        <div
          className={cn(
            'absolute right-0 top-full mt-1 min-w-[9rem] border py-1',
            radius.sm,
            semanticBg.surface,
            semanticBorder.default,
            elevationShadow.popup,
            zIndexClass.dropdown,
          )}
        >
          {sections.map((section, sectionIndex) => (
            <Stack key={section.title ?? sectionIndex} spacing={2}>
              {section.title !== undefined ? (
                <Text variant="caption" muted className="px-3 py-1">
                  {section.title}
                </Text>
              ) : null}
              {section.items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={cn('w-full px-3 py-1.5 text-left', radius.xs, 'hover:bg-muted')}
                  onClick={() => {
                    item.onClick();
                    setOpen(false);
                  }}
                >
                  <Text variant="body">{item.label}</Text>
                </button>
              ))}
            </Stack>
          ))}
        </div>
      ) : null}
    </div>
  );
}
