import { Button } from '@/components/ui/button';

export function ComingSoonToast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 flex max-w-sm -translate-x-1/2 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg"
    >
      <span className="text-sm">{message}</span>
      <Button variant="secondary" size="sm" onClick={onClose}>
        Đóng
      </Button>
    </div>
  );
}
