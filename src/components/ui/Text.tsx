import { createElement, forwardRef, type HTMLAttributes } from 'react';

import { semanticText } from '@/design/tokens/colors';
import type { TypographyVariant } from '@/design/tokens/typography';
import { typography } from '@/design/tokens/typography';
import { cn } from '@/lib/utils';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  readonly variant?: TypographyVariant;
  readonly muted?: boolean;
  readonly emphasis?: boolean;
  readonly accent?: boolean;
  readonly truncate?: boolean;
  readonly as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'div';
}

const defaultElement: Record<TypographyVariant, NonNullable<TextProps['as']>> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  body: 'p',
  small: 'p',
  caption: 'span',
  mono: 'p',
  metric: 'p',
};

export const Text = forwardRef<HTMLElement, TextProps>(
  (
    {
      variant = 'body',
      muted = false,
      emphasis = false,
      accent = false,
      truncate = false,
      as,
      className,
      ...props
    },
    ref,
  ) => {
    const element = as ?? defaultElement[variant];
    return createElement(element, {
      ref,
      className: cn(
        typography[variant],
        muted ? semanticText.muted : undefined,
        emphasis ? 'font-medium text-foreground' : undefined,
        accent ? semanticText.primary : undefined,
        truncate ? 'truncate' : undefined,
        className,
      ),
      ...props,
    });
  },
);
Text.displayName = 'Text';
