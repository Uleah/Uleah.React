import { forwardRef, useId } from 'react';
import { cx } from '../../utils/cx.js';
import { mergeIds } from '../../utils/mergeIds.js';
import type { InputProps } from './Input.types.js';

/**
 * A labelled text field built on the native `<input>`.
 *
 * Controlled (`value` + `onChange`) and uncontrolled (`defaultValue`) usage
 * work exactly as with a plain `<input>`. The ref points to the `<input>`.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hideLabel = false,
    helperText,
    error,
    size = 'md',
    id: idProp,
    className,
    style,
    inputClassName,
    disabled,
    readOnly,
    required,
    type = 'text',
    'aria-describedby': ariaDescribedBy,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const invalid = Boolean(error);
  const errorMessage = invalid && error !== true ? error : null;
  const message = errorMessage ?? helperText;
  const messageId = message ? `${id}-message` : undefined;

  return (
    <div
      className={cx(
        'ul-field',
        `ul-field--${size}`,
        invalid && 'ul-field--invalid',
        disabled && 'ul-field--disabled',
        readOnly && 'ul-field--readonly',
        className,
      )}
      style={style}
    >
      {label ? (
        <label htmlFor={id} className={cx('ul-field__label', hideLabel && 'ul-visually-hidden')}>
          {label}
          {required ? (
            <span className="ul-field__required" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      <input
        ref={ref}
        id={id}
        type={type}
        className={cx('ul-input', inputClassName)}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={mergeIds(ariaDescribedBy, messageId)}
        {...rest}
      />
      {message ? (
        <p
          id={messageId}
          className={cx('ul-field__message', errorMessage ? 'ul-field__message--error' : undefined)}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
});
