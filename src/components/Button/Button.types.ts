import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. @default 'primary' */
  variant?: ButtonVariant;
  /** Control height and padding. @default 'md' */
  size?: ButtonSize;
  /**
   * Show a spinner and block activation. The button stays focusable and is
   * announced as busy (`aria-busy`) and unavailable (`aria-disabled`).
   * @default false
   */
  loading?: boolean;
  /**
   * Accessible text announced while loading. Visually hidden.
   * @default 'Loading'
   */
  loadingLabel?: string;
  /** Stretch to the full width of the container. @default false */
  fullWidth?: boolean;
  /** Decorative element rendered before the label (e.g. an icon). Hidden from assistive tech. */
  startIcon?: ReactNode;
  /** Decorative element rendered after the label (e.g. an icon). Hidden from assistive tech. */
  endIcon?: ReactNode;
  /**
   * Native button type. Defaults to `'button'` (not the HTML default `'submit'`)
   * to avoid accidental form submissions. Pass `type="submit"` explicitly.
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset';
}
