import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkspacePage } from '@/layout/WorkspacePage';
import { cn } from '@/lib/utils';

export function NavBadgePill({ badge }: { badge: 'beta' | 'soon' }): ReactNode {
  return (
    <Badge
      variant={badge === 'beta' ? 'secondary' : 'outline'}
      className={cn(
        'shrink-0 px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide',
        badge === 'soon' && 'border-muted-foreground/30 text-muted-foreground',
      )}
    >
      {badge === 'beta' ? 'Beta' : 'Soon'}
    </Badge>
  );
}

interface FeaturePlaceholderProps {
  readonly title: string;
  readonly description: string;
  readonly body?: string;
  readonly comingLabel?: string;
  readonly bullets?: readonly string[];
}

export function FeaturePlaceholder({
  title,
  description,
  body,
  comingLabel = 'Coming soon.',
  bullets = [],
}: FeaturePlaceholderProps): ReactNode {
  return (
    <WorkspacePage width="content" className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        {body != null && body !== '' ? (
          <p className="mt-2 text-sm leading-relaxed text-foreground">{body}</p>
        ) : null}
      </div>
      <Card className="border-dashed shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <NavBadgePill badge="soon" />
            {comingLabel}
          </CardTitle>
        </CardHeader>
        {bullets.length > 0 ? (
          <CardContent className="space-y-1.5 pt-0 text-sm text-muted-foreground">
            {bullets.map((bullet) => (
              <p key={bullet}>· {bullet}</p>
            ))}
          </CardContent>
        ) : null}
      </Card>
    </WorkspacePage>
  );
}

export function GuidePreviewScreen(): ReactNode {
  const steps = ['Generate', 'Improve', 'Continue', 'Simulation'] as const;

  return (
    <WorkspacePage width="content" className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Hướng dẫn</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Lộ trình tính năng Stake Planner — bạn đang dùng bản Preview.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            Feature Preview
            <NavBadgePill badge="beta" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-center">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-1">
                <span
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm font-medium',
                    index === 0
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {step}
                </span>
                {index < steps.length - 1 ? (
                  <span className="hidden text-muted-foreground sm:inline" aria-hidden>
                    ↓
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Generate</strong> — Tạo kế hoạch từ mục tiêu và
              luật game. <span className="text-primary">Đã có.</span>
            </p>
            <p>
              <strong className="text-foreground">Improve</strong> — Cải thiện kế hoạch khi thiếu
              vốn. Coming soon.
            </p>
            <p>
              <strong className="text-foreground">Continue</strong> — Mở rộng phiên khi chưa thắng.
              Coming soon.
            </p>
            <p>
              <strong className="text-foreground">Simulation</strong> — Mô phỏng nếu thắng ở vòng N.
              Beta preview.
            </p>
          </div>
        </CardContent>
      </Card>
    </WorkspacePage>
  );
}
