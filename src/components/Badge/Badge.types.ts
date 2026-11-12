import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Semantic colour. Colour is never the only signal — always include meaningful text. @default 'neutral' */
  variant?: BadgeVariant;
  /** @default 'md' */
  size?: BadgeSize;
  /** Show a small decorative status dot before the text. Hidden from assistive tech. @default false */
  dot?: boolean;
  /** Badge text. Required: the text is what conveys the meaning. */
  children: ReactNode;
}
