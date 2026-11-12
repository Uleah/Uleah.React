import { forwardRef, type MouseEvent } from 'react';
import { cx } from '../../utils/cx.js';
import type { ButtonProps } from './Button.types.js';

/**
 * A native `<button>` with Uleah variants, sizes and loading state.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingLabel = 'Loading',
    fullWidth = false,
    startIcon,
    endIcon,
    type = 'button',
    disabled,
    className,
    children,
    onClick,
    ...rest
  },
  ref,
) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      // Keep the button focusable while busy, but block activation
      // (including form submission).
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      className={cx(
        'ul-button',
        `ul-button--${variant}`,
        `ul-button--${size}`,
        fullWidth && 'ul-button--full-width',
        loading && 'ul-button--loading',
        className,
      )}
      onClick={handleClick}
      {...rest}
    >
      {loading ? (
        <span className="ul-button__spinner" aria-hidden="true" />
      ) : startIcon ? (
        <span className="ul-button__icon" aria-hidden="true">
          {startIcon}
        </span>
      ) : null}
      <span className="ul-button__label">{children}</span>
      {endIcon ? (
        <span className="ul-button__icon" aria-hidden="true">
          {endIcon}
        </span>
      ) : null}
      {loading ? (
        <>
          {/* Separate text node so the accessible name reads "Save Loading", not "SaveLoading". */}{' '}
          <span className="ul-visually-hidden">{loadingLabel}</span>
        </>
      ) : null}
    </button>
  );
});
