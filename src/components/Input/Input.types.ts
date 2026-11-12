import type { CSSProperties, InputHTMLAttributes, ReactNode } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Visible label, associated with the input via `<label for>`.
   * If omitted, provide `aria-label` or `aria-labelledby` instead.
   */
  label?: ReactNode;
  /** Visually hide the label while keeping it as the accessible name. @default false */
  hideLabel?: boolean;
  /** Supporting text below the input, linked via `aria-describedby`. */
  helperText?: ReactNode;
  /**
   * Marks the input invalid (`aria-invalid`). Pass a message to display it
   * (linked via `aria-describedby`; replaces `helperText` while present), or
   * `true` to mark the field invalid without a message.
   */
  error?: ReactNode;
  /** Control height and font size. @default 'md' */
  size?: InputSize;
  /** Class name for the root wrapper element (`.ul-field`). */
  className?: string;
  /** Inline styles for the root wrapper element (`.ul-field`). */
  style?: CSSProperties;
  /** Class name forwarded to the native `<input>` element. */
  inputClassName?: string;
}
