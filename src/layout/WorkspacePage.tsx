import type { ReactNode } from 'react';

import { cn } from '@/lib/utils'; 

export type WorkspacePageWidth = 'content' | 'wide' | 'full';

const WIDTH_CLASS: Record<WorkspacePageWidth, string> = {
  content: 'max-w-3xl',
  wide: 'max-w-6xl',
  full: 'max-w-none',
};

export interface WorkspacePageProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly width?: WorkspacePageWidth;
}

/** Full-width workspace shell — avoids narrow `max-w-lg` columns on desktop. */
export function WorkspacePage({
  children,
  className,
  width = 'wide',
}: WorkspacePageProps): ReactNode {
  return (
    <div className={cn('mx-auto w-full space-y-6', WIDTH_CLASS[width], className)}>{children}</div>
  );
}

export interface WorkspacePageGridProps {
  readonly header?: ReactNode;
  readonly primary: ReactNode;
  readonly secondary?: ReactNode;
  readonly width?: WorkspacePageWidth;
}

/** Two-column dashboard-style layout: primary (actions) + secondary (data/widgets). */
export function WorkspacePageGrid({
  header,
  primary,
  secondary,
  width = 'wide',
}: WorkspacePageGridProps): ReactNode {
  return (
    <WorkspacePage width={width}>
      {header}
      {secondary !== undefined ? (
        <div className="grid items-start gap-6 lg:grid-cols-2 xl:grid-cols-12">
          <div className="flex flex-col gap-6 xl:col-span-5">{primary}</div>
          <div className="flex flex-col gap-6 xl:col-span-7">{secondary}</div>
        </div>
      ) : (
        primary
      )}
    </WorkspacePage>
  );
}
