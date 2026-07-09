import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ActionToastProps {
  readonly message: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly onClose: () => void;
}

export function ActionToast({
  message,
  actionLabel,
  onAction,
  onClose,
}: ActionToastProps): React.ReactNode {
  return (
    <div
      role="status"
      className={cn(
        'fixed bottom-6 left-1/2 z-50 flex max-w-md -translate-x-1/2 items-center gap-3',
        'rounded-xl border border-border bg-card px-4 py-3 shadow-lg',
      )}
    >
      <span className="text-sm">{message}</span>
      {actionLabel !== undefined && onAction !== undefined ? (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-muted-foreground"
        onClick={onClose}
      >
        ✕
      </Button>
    </div>
  );
}
