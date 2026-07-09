import { StickyNote } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DEBOUNCE_MS = 300;

interface SessionNotesPanelProps {
  readonly notes: string;
  readonly readOnly?: boolean;
  readonly onNotesChange: (notes: string) => void;
}

export function SessionNotesPanel({
  notes,
  readOnly = false,
  onNotesChange,
}: SessionNotesPanelProps): ReactNode {
  const [draft, setDraft] = useState(notes);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(false);

  useEffect(() => {
    skipNextSave.current = true;
    setDraft(notes);
  }, [notes]);

  useEffect(() => {
    if (readOnly) {
      return;
    }
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      if (draft !== notes) {
        onNotesChange(draft);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [draft, notes, onNotesChange, readOnly]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <StickyNote className="h-4 w-4" />
          Ghi chú
        </CardTitle>
      </CardHeader>
      <CardContent>
        <textarea
          className="min-h-[120px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
          }}
          placeholder="Casino đông. Đổi bàn. VIP..."
          rows={5}
          readOnly={readOnly}
          disabled={readOnly}
        />
        {!readOnly ? (
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            Tự lưu sau {String(DEBOUNCE_MS)}ms
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
