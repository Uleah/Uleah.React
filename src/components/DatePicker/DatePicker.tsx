import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../../utils/cx.js';
import { useFloating } from '../../utils/floating.js';
import { mergeIds } from '../../utils/mergeIds.js';
import { Calendar } from './Calendar.js';
import type {
  DatePickerPreset,
  DatePickerProps,
  DatePickerRangeProps,
  DatePickerSingleProps,
  DateRange,
} from './DatePicker.types.js';
import { isSameDay, startOfDay, toISODate } from './dateUtils.js';

type AnyDatePickerProps = Omit<
  DatePickerSingleProps,
  'mode' | 'value' | 'defaultValue' | 'onChange' | 'presets' | 'formatValue'
> &
  Partial<Pick<DatePickerRangeProps, 'startName' | 'endName'>> & {
    mode?: 'single' | 'range';
    value?: Date | DateRange | null;
    defaultValue?: Date | DateRange | null;
    onChange?: DatePickerSingleProps['onChange'] | DatePickerRangeProps['onChange'];
    presets?: readonly DatePickerPreset<Date | DateRange>[];
    formatValue?: (value: never) => ReactNode;
  };

const EMPTY_RANGE: DateRange = { start: null, end: null };
const DEFAULT_FORMAT: Intl.DateTimeFormatOptions = { dateStyle: 'medium' };

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

function sameValue(a: Date | DateRange | null, b: Date | DateRange | null): boolean {
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && isSameDay(a, b);
  }
  if (!a || !b) return a === b;
  return (
    (a.start === b.start || isSameDay(a.start, b.start)) &&
    (a.end === b.end || isSameDay(a.end, b.end))
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
      <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
    </svg>
  );
}

/**
 * A date field: a trigger showing the chosen date (or range) that opens a calendar popup.
 *
 * `mode="range"` picks a start and an end, with a hover preview and two months side by side on
 * wide screens. Supports min/max and disabled days, presets, locales, forms (`YYYY-MM-DD`), and an
 * adaptive popup that flips above the trigger and is never clipped by its container.
 * The ref points to the trigger button.
 */
export const DatePicker = forwardRef<HTMLButtonElement, AnyDatePickerProps>(function DatePicker(
  {
    mode = 'single',
    value: valueProp,
    defaultValue,
    onChange,
    presets,
    formatValue,
    name,
    startName,
    endName,
    label,
    hideLabel = false,
    helperText,
    error,
    placeholder,
    size = 'md',
    disabled = false,
    required = false,
    min,
    max,
    isDateDisabled,
    locale,
    weekStartsOn,
    numberOfMonths,
    showOutsideDays,
    today,
    formatOptions = DEFAULT_FORMAT,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    closeOnSelect = true,
    placement,
    portal = true,
    clearable = false,
    clearLabel = 'Clear date',
    requiredLabel = 'required',
    dialogLabel,
    presetsLabel = 'Presets',
    footer,
    previousMonthLabel,
    nextMonthLabel,
    className,
    style,
    triggerClassName,
    popupClassName,
    id: idProp,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    onClick,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const isRange = mode === 'range';
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  const messageId = `${id}-message`;

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Value and open state (controlled / uncontrolled)
  // ---------------------------------------------------------------------------
  const isValueControlled = valueProp !== undefined;
  const [internalValue, setInternalValue] = useState<Date | DateRange | null>(
    () => defaultValue ?? (isRange ? EMPTY_RANGE : null),
  );
  const value = isValueControlled ? valueProp : internalValue;
  const date = !isRange && value instanceof Date ? value : null;
  const range: DateRange = isRange && value && !(value instanceof Date) ? value : EMPTY_RANGE;

  const commit = (next: Date | DateRange | null) => {
    if (!isValueControlled) setInternalValue(next);
    if (isRange)
      (onChange as DatePickerRangeProps['onChange'])?.((next ?? EMPTY_RANGE) as DateRange);
    else (onChange as DatePickerSingleProps['onChange'])?.(next as Date | null);
  };

  const isOpenControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = (isOpenControlled ? openProp : internalOpen) && !disabled;

  const setOpen = (next: boolean, { restoreFocus = true } = {}) => {
    if (next === open) return;
    if (!isOpenControlled) setInternalOpen(next);
    onOpenChange?.(next);
    if (!next && restoreFocus && popupRef.current?.contains(document.activeElement)) {
      triggerRef.current?.focus();
    }
  };

  const floating = useFloating({
    open,
    portal,
    anchorRef: triggerRef,
    floatingRef: popupRef,
    placement,
    width: 'auto',
  });

  // Close when pressing outside the trigger and the popup.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || popupRef.current?.contains(target)) return;
      if (!isOpenControlled) setInternalOpen(false);
      onOpenChange?.(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, isOpenControlled, onOpenChange]);

  // ---------------------------------------------------------------------------
  // Display
  // ---------------------------------------------------------------------------
  const formatter = useMemo(
    () => new Intl.DateTimeFormat(locale, formatOptions),
    [locale, formatOptions],
  );
  const hasValue = isRange ? range.start !== null || range.end !== null : date !== null;
  let display: ReactNode = placeholder ?? (isRange ? 'Select dates' : 'Select date');
  if (hasValue && formatValue) {
    display = (formatValue as (v: Date | DateRange) => ReactNode)(isRange ? range : (date as Date));
  } else if (!isRange && date) {
    display = formatter.format(date);
  } else if (isRange && range.start) {
    if (range.end) {
      const { formatRange } = formatter as Intl.DateTimeFormat & {
        formatRange?: (a: Date, b: Date) => string;
      };
      display = formatRange
        ? formatRange.call(formatter, range.start, range.end)
        : `${formatter.format(range.start)} – ${formatter.format(range.end)}`;
    } else {
      display = `${formatter.format(range.start)} – …`;
    }
  }

  const invalid = Boolean(error);
  const errorMessage = invalid && error !== true ? error : null;
  const message = errorMessage ?? helperText;
  const labelledBy =
    label || ariaLabelledBy
      ? mergeIds(ariaLabelledBy, label ? labelId : undefined, valueId)
      : undefined;
  const showClear = clearable && hasValue && !disabled;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleCalendarChange = (next: Date | DateRange | null) => {
    commit(next);
    const complete = isRange ? (next as DateRange | null)?.end != null : next !== null;
    if (closeOnSelect && complete) setOpen(false);
  };

  const resolvePreset = (preset: DatePickerPreset<Date | DateRange>) =>
    typeof preset.value === 'function' ? preset.value() : preset.value;

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || disabled) return;
    if (event.key === 'ArrowDown' && !open) {
      event.preventDefault();
      setOpen(true);
    }
  };

  const handlePopupKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && !event.defaultPrevented) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }
  };

  const handlePopupBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    // `null` means focus went nowhere (e.g. a click on padding): outside clicks close instead.
    if (!next || !(next instanceof Node)) return;
    if (popupRef.current?.contains(next) || next === triggerRef.current) return;
    setOpen(false, { restoreFocus: false });
  };

  // Calendar props shared by both modes.
  const calendarProps = {
    min,
    max,
    isDateDisabled,
    locale,
    weekStartsOn,
    numberOfMonths: numberOfMonths ?? (isRange ? ('auto' as const) : 1),
    showOutsideDays,
    today,
    previousMonthLabel,
    nextMonthLabel,
    autoFocus: true,
  };

  const popup = floating.mounted ? (
    // The dialog only listens for Escape and focus leaving; its content is interactive.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={popupRef}
      role="dialog"
      aria-modal="false"
      aria-label={dialogLabel ?? (isRange ? 'Choose dates' : 'Choose date')}
      className={cx(
        'ul-datepicker__popup',
        presets && presets.length > 0 && 'ul-datepicker__popup--with-presets',
        popupClassName,
      )}
      onKeyDown={handlePopupKeyDown}
      onBlur={handlePopupBlur}
    >
      {presets && presets.length > 0 ? (
        <div className="ul-datepicker__presets" role="group" aria-label={presetsLabel}>
          {presets.map((preset) => {
            const presetValue = resolvePreset(preset);
            return (
              <button
                key={preset.label}
                type="button"
                className="ul-datepicker__preset"
                aria-pressed={sameValue(presetValue, value ?? null)}
                onClick={() => {
                  commit(resolvePreset(preset));
                  setOpen(false);
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="ul-datepicker__body">
        {isRange ? (
          <Calendar {...calendarProps} mode="range" value={range} onChange={handleCalendarChange} />
        ) : (
          <Calendar {...calendarProps} value={date} onChange={handleCalendarChange} />
        )}
        {footer ? <div className="ul-datepicker__footer">{footer}</div> : null}
      </div>
    </div>
  ) : null;

  const toISO = (d: Date | null) => (d ? toISODate(startOfDay(d)) : '');

  return (
    <div
      className={cx(
        'ul-field',
        `ul-field--${size}`,
        'ul-datepicker',
        invalid && 'ul-field--invalid',
        disabled && 'ul-field--disabled',
        open && 'ul-datepicker--open',
        showClear && 'ul-datepicker--clearable',
        className,
      )}
      style={style}
    >
      {label ? (
        <label
          id={labelId}
          htmlFor={id}
          className={cx('ul-field__label', hideLabel && 'ul-visually-hidden')}
        >
          {label}
          {required ? (
            <>
              <span className="ul-field__required" aria-hidden="true">
                *
              </span>{' '}
              <span className="ul-visually-hidden">({requiredLabel})</span>
            </>
          ) : null}
        </label>
      ) : null}
      <div className="ul-datepicker__control">
        <button
          {...rest}
          ref={(node) => {
            triggerRef.current = node;
            setRef(ref, node);
          }}
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-labelledby={labelledBy}
          aria-describedby={mergeIds(
            ariaDescribedBy,
            labelledBy ? undefined : valueId,
            message ? messageId : undefined,
          )}
          className={cx(
            'ul-datepicker__trigger',
            !hasValue && 'ul-datepicker__trigger--placeholder',
            triggerClassName,
          )}
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) setOpen(!open);
          }}
          onKeyDown={handleTriggerKeyDown}
        >
          <span id={valueId} className="ul-datepicker__value">
            {display}
          </span>
          <span className="ul-datepicker__icon" aria-hidden="true">
            <CalendarIcon />
          </span>
        </button>
        {showClear ? (
          <button
            type="button"
            className="ul-datepicker__clear"
            aria-label={clearLabel}
            onClick={() => {
              commit(isRange ? EMPTY_RANGE : null);
              triggerRef.current?.focus();
            }}
          >
            <CloseIcon />
          </button>
        ) : null}
      </div>
      {name && !isRange ? <input type="hidden" name={name} value={toISO(date)} /> : null}
      {isRange && startName ? (
        <input type="hidden" name={startName} value={toISO(range.start)} />
      ) : null}
      {isRange && endName ? <input type="hidden" name={endName} value={toISO(range.end)} /> : null}
      {message ? (
        <p
          id={messageId}
          className={cx('ul-field__message', errorMessage ? 'ul-field__message--error' : undefined)}
        >
          {message}
        </p>
      ) : null}
      {popup && floating.container ? createPortal(popup, floating.container) : popup}
    </div>
  );
}) as unknown as DatePickerComponent;

type DatePickerComponent = ((
  props: DatePickerProps & RefAttributes<HTMLButtonElement>,
) => ReactElement | null) & { displayName?: string };
