import { X } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Row } from '@/components/ui/Row';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
import { semanticBg, semanticBorder } from '@/design/tokens/colors';
import { elevationShadow } from '@/design/tokens/shadows';
import { zIndexClass } from '@/design/tokens/z-index';
import { cn } from '@/lib/utils';

export interface DrawerProps {
  readonly open: boolean;
  readonly title: string;
  readonly subtitle?: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly side?: 'right' | 'left';
}

export function Drawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  side = 'right',
}: DrawerProps): ReactNode {
  if (!open) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Đóng"
        className={cn('fixed inset-0 bg-black/40', zIndexClass.drawer)}
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed inset-y-0 flex w-full max-w-md flex-col border text-card-foreground',
          semanticBg.surface,
          semanticBorder.default,
          elevationShadow.overlay,
          zIndexClass.overlay,
          side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
        )}
      >
        <div className={cn('border-b', semanticBorder.default)}>
          <Row align="between" spacing={12} className="px-5 py-4">
            <Stack spacing={4}>
              <Text variant="caption" muted>
                {title}
              </Text>
              {subtitle !== undefined ? (
                <Text variant="body" emphasis>
                  {subtitle}
                </Text>
              ) : null}
            </Stack>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Đóng panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </Row>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
    </>
  );
}
