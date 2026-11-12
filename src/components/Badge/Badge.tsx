import { forwardRef } from 'react';
import { cx } from '../../utils/cx.js';
import type { BadgeProps } from './Badge.types.js';

/** A compact, non-interactive label for status or metadata. */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = 'neutral', size = 'md', dot = false, className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx('ul-badge', `ul-badge--${variant}`, `ul-badge--${size}`, className)}
      {...rest}
    >
      {dot ? <span className="ul-badge__dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
});
