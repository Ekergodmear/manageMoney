import { useEffect, useState } from 'react';

import {
  fetchDrawFeedStatus,
  type DrawFeedStatus,
} from '@/features/game-data/adapters/draw-feed-status';

export function useDrawFeedStatus(pollMs = 60_000): DrawFeedStatus | null {
  const [status, setStatus] = useState<DrawFeedStatus | null>(null);

  useEffect(() => {
    const cancelledRef = { current: false };
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll(): Promise<void> {
      const next = await fetchDrawFeedStatus();
      if (!cancelledRef.current) {
        setStatus(next);
      }
      timer = setTimeout(() => {
        if (!cancelledRef.current) {
          void poll();
        }
      }, pollMs);
    }

    void poll();

    return () => {
      cancelledRef.current = true;
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    };
  }, [pollMs]);

  return status;
}
