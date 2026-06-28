import { MessageCircle } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { FEEDBACK_URL } from '@/config/feedback';

export function FeedbackButton(): ReactNode {
  return (
    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild>
      <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="h-3.5 w-3.5" />
        Gửi góp ý
      </a>
    </Button>
  );
}
