import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type Ref,
  type RefAttributes,
} from 'react';
import { cx } from '../../utils/cx.js';
import { useMediaQuery } from '../../utils/useMediaQuery.js';
import type {
  CalendarProps,
  CalendarRangeProps,
  CalendarSingleProps,
  CalendarView,
  DateRange,
} from './DatePicker.types.js';
import {
  addDays,
  addMonths,
  clampDate,
  compareDays,
  getCalendarWeeks,
  getLocaleWeekStart,
  isSameDay,
  isSameMonth,
  isWithin,
  monthsBetween,
  startOfDay,
  startOfMonth,
  startOfWeek,
  toISODate,
  type Weekday,
} from './dateUtils.js';

type AnyCalendarProps = Omit<
  CalendarSingleProps,
  'mode' | 'value' | 'defaultValue' | 'onChange'
> & {
  mode?: 'single' | 'range';
  value?: Date | DateRange | null;
  defaultValue?: Date | DateRange | null;
  onChange?: CalendarSingleProps['onChange'] | CalendarRangeProps['onChange'];
};

const EMPTY_RANGE: DateRange = { start: null, end: null };
const GRID_COLUMNS = 3;
const YEARS_PER_PAGE = 12;
/** A known Sunday, used to build weekday names. */
const REFERENCE_SUNDAY = new Date(2024, 0, 7);

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={direction === 'left' ? 'M10 4L6 8l4 4' : 'M6 4l4 4-4 4'} />
    </svg>
  );
}

/**
 * A month calendar for picking a day or a range of days. Use it inline, or through
 * `<DatePicker>`, which wraps it in a field and a popup.
 *
 * Keyboard (WAI-ARIA date grid): arrows move by day/week, Home/End to the week start/end,
 * PageUp/PageDown by month (with Shift: by year), Enter/Space select. The caption switches to
 * month and year views for distant dates.
 */
export const Calendar = forwardRef<HTMLDivElement, AnyCalendarProps>(function Calendar(
  {
    mode = 'single',
    value: valueProp,
    defaultValue,
    onChange,
    min,
    max,
    isDateDisabled,
    locale,
    weekStartsOn: weekStartsOnProp,
    numberOfMonths = 1,
    month: monthProp,
    defaultMonth,
    onMonthChange,
    showOutsideDays = true,
    today: todayProp,
    autoFocus = false,
    previousMonthLabel = 'Previous month',
    nextMonthLabel = 'Next month',
    previousYearLabel = 'Previous year',
    nextYearLabel = 'Next year',
    previousYearsLabel = 'Previous years',
    nextYearsLabel = 'Next years',
    chooseViewLabel = 'Choose month and year',
    className,
    ...rest
  },
  ref,
) {
  const isRange = mode === 'range';
  const id = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const shouldFocusRef = useRef(autoFocus);

  const [now] = useState(() => startOfDay(new Date()));
  const today = todayProp ? startOfDay(todayProp) : now;

  // ---------------------------------------------------------------------------
  // Value (controlled / uncontrolled)
  // ---------------------------------------------------------------------------
  const isValueControlled = valueProp !== undefined;
  const [internalValue, setInternalValue] = useState<Date | DateRange | null>(
    () => defaultValue ?? (isRange ? EMPTY_RANGE : null),
  );
  const value = isValueControlled ? valueProp : internalValue;
  const selectedDate = !isRange && value instanceof Date ? value : null;
  const range: DateRange = isRange && value && !(value instanceof Date) ? value : EMPTY_RANGE;

  const commit = (next: Date | DateRange | null) => {
    if (!isValueControlled) setInternalValue(next);
    if (isRange) (onChange as CalendarRangeProps['onChange'])?.(next as DateRange);
    else (onChange as CalendarSingleProps['onChange'])?.(next as Date | null);
  };

  // ---------------------------------------------------------------------------
  // Visible months, focus and view
  // ---------------------------------------------------------------------------
  const wide = useMediaQuery('(min-width: 48rem)');
  const count = numberOfMonths === 'auto' ? (wide ? 2 : 1) : Math.max(1, numberOfMonths);

  const [focusedDate, setFocusedDate] = useState(() =>
    clampDate(startOfDay((isRange ? (range.start ?? range.end) : selectedDate) ?? today), min, max),
  );
  const [internalMonth, setInternalMonth] = useState(() =>
    startOfMonth(defaultMonth ?? focusedDate),
  );
  const month = monthProp ? startOfMonth(monthProp) : internalMonth;
  const [view, setView] = useState<CalendarView>('days');
  const [hovered, setHovered] = useState<Date | null>(null);

  const setMonth = (next: Date) => {
    const first = startOfMonth(next);
    if (!monthProp) setInternalMonth(first);
    onMonthChange?.(first);
  };

  const weekStartsOn: Weekday = useMemo(
    () => weekStartsOnProp ?? getLocaleWeekStart(locale),
    [weekStartsOnProp, locale],
  );

  const formats = useMemo(
    () => ({
      monthYear: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
      monthShort: new Intl.DateTimeFormat(locale, { month: 'short' }),
      monthLong: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
      weekdayShort: new Intl.DateTimeFormat(locale, { weekday: 'short' }),
      weekdayLong: new Intl.DateTimeFormat(locale, { weekday: 'long' }),
      day: new Intl.DateTimeFormat(locale, { day: 'numeric' }),
      full: new Intl.DateTimeFormat(locale, { dateStyle: 'full' }),
    }),
    [locale],
  );

  const isDisabled = (date: Date) =>
    (min !== undefined && compareDays(date, min) < 0) ||
    (max !== undefined && compareDays(date, max) > 0) ||
    Boolean(isDateDisabled?.(date));

  const visibleMonths = Array.from({ length: count }, (_, i) => addMonths(month, i));
  const isVisible = (date: Date) => {
    const offset = monthsBetween(month, date);
    return offset >= 0 && offset < count;
  };
  const tabbableDate = isVisible(focusedDate) ? focusedDate : month;

  // Move DOM focus after keyboard navigation or a view change.
  useEffect(() => {
    if (!shouldFocusRef.current) return;
    shouldFocusRef.current = false;
    rootRef.current
      ?.querySelector<HTMLElement>('[data-ul-tabbable="true"]')
      ?.focus({ preventScroll: true });
  });

  const focusDate = (next: Date) => {
    const target = clampDate(startOfDay(next), min, max);
    setFocusedDate(target);
    const offset = monthsBetween(month, target);
    if (offset < 0) setMonth(target);
    else if (offset >= count) setMonth(addMonths(startOfMonth(target), -(count - 1)));
    shouldFocusRef.current = true;
  };

  // ---------------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------------
  const selectDate = (date: Date) => {
    if (isDisabled(date)) return;
    setFocusedDate(date);
    if (!isRange) {
      commit(date);
      return;
    }
    const { start, end } = range;
    if (!start || end) commit({ start: date, end: null });
    else if (compareDays(date, start) < 0) commit({ start: date, end: start });
    else commit({ start, end: date });
    setHovered(null);
  };

  // While a range is half chosen, preview it up to the hovered (or focused) day.
  const pending = isRange && range.start !== null && range.end === null;
  const previewEnd = pending ? (hovered ?? focusedDate) : null;
  const shown: { start: Date | null; end: Date | null } =
    pending && range.start && previewEnd
      ? compareDays(previewEnd, range.start) < 0
        ? { start: previewEnd, end: range.start }
        : { start: range.start, end: previewEnd }
      : range;

  // ---------------------------------------------------------------------------
  // Keyboard
  // ---------------------------------------------------------------------------
  const onDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>, date: Date) => {
    let next: Date | null = null;
    switch (event.key) {
      case 'ArrowLeft':
        next = addDays(date, -1);
        break;
      case 'ArrowRight':
        next = addDays(date, 1);
        break;
      case 'ArrowUp':
        next = addDays(date, -7);
        break;
      case 'ArrowDown':
        next = addDays(date, 7);
        break;
      case 'Home':
        next = startOfWeek(date, weekStartsOn);
        break;
      case 'End':
        next = addDays(startOfWeek(date, weekStartsOn), 6);
        break;
      case 'PageUp':
        next = addMonths(date, event.shiftKey ? -12 : -1);
        break;
      case 'PageDown':
        next = addMonths(date, event.shiftKey ? 12 : 1);
        break;
    }
    if (next) {
      event.preventDefault();
      focusDate(next);
    }
  };

  const onGridItemKeyDown = (event: KeyboardEvent<HTMLButtonElement>, unit: 'month' | 'year') => {
    const months = unit === 'month' ? 1 : 12;
    const steps: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -GRID_COLUMNS,
      ArrowDown: GRID_COLUMNS,
      PageUp: unit === 'month' ? -12 : -YEARS_PER_PAGE,
      PageDown: unit === 'month' ? 12 : YEARS_PER_PAGE,
    };
    const step = steps[event.key];
    if (step === undefined) return;
    event.preventDefault();
    setFocusedDate((current) => clampDate(addMonths(current, step * months), min, max));
    shouldFocusRef.current = true;
  };

  const onRootKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && view !== 'days') {
      // Back to the days first; a surrounding popup closes on the next Escape.
      event.preventDefault();
      event.stopPropagation();
      setView('days');
      shouldFocusRef.current = true;
    }
  };

  const switchView = (next: CalendarView) => {
    setView(next);
    shouldFocusRef.current = true;
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const navButton = (
    label: string,
    direction: 'left' | 'right',
    onClick: () => void,
    disabled = false,
  ) => (
    <button
      type="button"
      className={cx(
        'ul-calendar__nav',
        `ul-calendar__nav--${direction === 'left' ? 'previous' : 'next'}`,
      )}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Chevron direction={direction} />
    </button>
  );

  const canGoBefore = (date: Date) => !min || compareDays(date, min) >= 0;
  const canGoAfter = (date: Date) => !max || compareDays(date, max) <= 0;

  const weekdays = Array.from({ length: 7 }, (_, i) =>
    addDays(REFERENCE_SUNDAY, (weekStartsOn + i) % 7),
  );

  const renderMonthGrid = (displayed: Date, index: number) => {
    const captionId = `${id}-caption-${index}`;
    const weeks = getCalendarWeeks(displayed, weekStartsOn);
    const isFirst = index === 0;
    const isLast = index === count - 1;
    const previousMonthEnd = addDays(startOfMonth(displayed), -1);
    const nextMonthStart = addMonths(startOfMonth(displayed), 1);

    return (
      <div key={toISODate(displayed)} className="ul-calendar__month">
        <div className="ul-calendar__header">
          {isFirst ? (
            navButton(
              previousMonthLabel,
              'left',
              () => setMonth(addMonths(month, -1)),
              !canGoBefore(previousMonthEnd),
            )
          ) : (
            <span className="ul-calendar__nav-spacer" />
          )}
          {isFirst ? (
            <button
              type="button"
              id={captionId}
              className="ul-calendar__caption ul-calendar__caption--button"
              onClick={() => switchView('months')}
            >
              {formats.monthYear.format(displayed)}
              <span className="ul-visually-hidden">, {chooseViewLabel}</span>
            </button>
          ) : (
            <div id={captionId} className="ul-calendar__caption">
              {formats.monthYear.format(displayed)}
            </div>
          )}
          {isLast ? (
            navButton(
              nextMonthLabel,
              'right',
              () => setMonth(addMonths(month, 1)),
              !canGoAfter(nextMonthStart),
            )
          ) : (
            <span className="ul-calendar__nav-spacer" />
          )}
        </div>
        <table role="grid" aria-labelledby={captionId} className="ul-calendar__grid">
          <thead>
            <tr>
              {weekdays.map((weekday) => (
                <th key={weekday.getDay()} scope="col" className="ul-calendar__weekday">
                  <span aria-hidden="true">
                    {formats.weekdayShort.format(weekday).replace(/\.$/, '').slice(0, 2)}
                  </span>
                  <span className="ul-visually-hidden">{formats.weekdayLong.format(weekday)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={toISODate(week[0] ?? displayed)}>
                {week.map((date) => {
                  const iso = toISODate(date);
                  if (!isSameMonth(date, displayed)) {
                    return (
                      <td key={iso} className="ul-calendar__cell ul-calendar__cell--outside">
                        {showOutsideDays ? (
                          <span className="ul-calendar__outside-day" aria-hidden="true">
                            {formats.day.format(date)}
                          </span>
                        ) : null}
                      </td>
                    );
                  }
                  const disabled = isDisabled(date);
                  const isStart = isRange && isSameDay(date, shown.start);
                  const isEnd = isRange && isSameDay(date, shown.end);
                  const inRange =
                    isRange && shown.start && shown.end
                      ? isWithin(date, shown.start, shown.end)
                      : false;
                  const selected = isRange
                    ? (range.start !== null && isSameDay(date, range.start)) ||
                      (range.end !== null && isSameDay(date, range.end)) ||
                      (range.start !== null &&
                        range.end !== null &&
                        isWithin(date, range.start, range.end))
                    : isSameDay(date, selectedDate);
                  const tabbable = isSameDay(date, tabbableDate);
                  return (
                    <td
                      key={iso}
                      aria-selected={selected}
                      className={cx(
                        'ul-calendar__cell',
                        inRange && 'ul-calendar__cell--in-range',
                        isStart && 'ul-calendar__cell--range-start',
                        isEnd && 'ul-calendar__cell--range-end',
                        pending && inRange && 'ul-calendar__cell--preview',
                      )}
                    >
                      <button
                        type="button"
                        tabIndex={tabbable ? 0 : -1}
                        data-ul-tabbable={tabbable ? 'true' : undefined}
                        data-ul-date={iso}
                        aria-label={formats.full.format(date)}
                        aria-current={isSameDay(date, today) ? 'date' : undefined}
                        aria-disabled={disabled || undefined}
                        className={cx(
                          'ul-calendar__day',
                          (isRange ? isStart || isEnd : selected) && 'ul-calendar__day--selected',
                          isSameDay(date, today) && 'ul-calendar__day--today',
                          disabled && 'ul-calendar__day--disabled',
                        )}
                        onClick={() => selectDate(date)}
                        onFocus={() => setFocusedDate(date)}
                        onKeyDown={(event) => onDayKeyDown(event, date)}
                        onMouseEnter={pending ? () => setHovered(date) : undefined}
                      >
                        {formats.day.format(date)}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const pickMonth = (date: Date) => {
    const day = Math.min(
      focusedDate.getDate(),
      new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(),
    );
    setFocusedDate(clampDate(new Date(date.getFullYear(), date.getMonth(), day), min, max));
    setMonth(date);
    switchView('days');
  };

  const pickYear = (date: Date) => {
    setFocusedDate((current) =>
      clampDate(
        new Date(date.getFullYear(), current.getMonth(), Math.min(current.getDate(), 28)),
        min,
        max,
      ),
    );
    switchView('months');
  };

  const renderItemGrid = (
    items: {
      key: string;
      label: string;
      date: Date;
      disabled: boolean;
      selected: boolean;
      current: boolean;
      tabbable: boolean;
    }[],
    unit: 'month' | 'year',
    captionId: string,
  ) => {
    const rows = Array.from({ length: Math.ceil(items.length / GRID_COLUMNS) }, (_, r) =>
      items.slice(r * GRID_COLUMNS, r * GRID_COLUMNS + GRID_COLUMNS),
    );
    return (
      <table
        role="grid"
        aria-labelledby={captionId}
        className={cx('ul-calendar__grid', 'ul-calendar__grid--items')}
      >
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]?.key}>
              {row.map((item) => (
                <td key={item.key} aria-selected={item.selected} className="ul-calendar__cell">
                  <button
                    type="button"
                    tabIndex={item.tabbable ? 0 : -1}
                    data-ul-tabbable={item.tabbable ? 'true' : undefined}
                    aria-disabled={item.disabled || undefined}
                    aria-current={item.current ? 'date' : undefined}
                    className={cx(
                      'ul-calendar__item',
                      item.selected && 'ul-calendar__item--selected',
                      item.current && 'ul-calendar__item--current',
                      item.disabled && 'ul-calendar__item--disabled',
                    )}
                    onClick={() => {
                      if (item.disabled) return;
                      if (unit === 'month') pickMonth(item.date);
                      else pickYear(item.date);
                    }}
                    onFocus={() =>
                      setFocusedDate((current) =>
                        unit === 'month'
                          ? new Date(
                              item.date.getFullYear(),
                              item.date.getMonth(),
                              Math.min(current.getDate(), 28),
                            )
                          : new Date(
                              item.date.getFullYear(),
                              current.getMonth(),
                              Math.min(current.getDate(), 28),
                            ),
                      )
                    }
                    onKeyDown={(event) => onGridItemKeyDown(event, unit)}
                  >
                    {item.label}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const selectedAnchor = isRange ? range.start : selectedDate;
  const minMonth = min ? startOfMonth(min) : null;
  const maxMonth = max ? startOfMonth(max) : null;

  let body;
  let liveText: string;
  if (view === 'days') {
    body = <div className="ul-calendar__months">{visibleMonths.map(renderMonthGrid)}</div>;
    liveText = visibleMonths.map((m) => formats.monthYear.format(m)).join(' – ');
  } else if (view === 'months') {
    const year = focusedDate.getFullYear();
    const captionId = `${id}-caption-months`;
    const items = Array.from({ length: 12 }, (_, m) => {
      const date = new Date(year, m, 1);
      return {
        key: `m${m}`,
        label: formats.monthShort.format(date),
        date,
        disabled:
          (minMonth !== null && compareDays(date, minMonth) < 0) ||
          (maxMonth !== null && compareDays(date, maxMonth) > 0),
        selected: selectedAnchor !== null && isSameMonth(date, selectedAnchor),
        current: isSameMonth(date, today),
        tabbable: m === focusedDate.getMonth(),
      };
    });
    body = (
      <div className="ul-calendar__month">
        <div className="ul-calendar__header">
          {navButton(
            previousYearLabel,
            'left',
            () => {
              setFocusedDate((d) => clampDate(addMonths(d, -12), min, max));
            },
            minMonth !== null && year <= minMonth.getFullYear(),
          )}
          <button
            type="button"
            id={captionId}
            className="ul-calendar__caption ul-calendar__caption--button"
            onClick={() => switchView('years')}
          >
            {year}
            <span className="ul-visually-hidden">, {chooseViewLabel}</span>
          </button>
          {navButton(
            nextYearLabel,
            'right',
            () => {
              setFocusedDate((d) => clampDate(addMonths(d, 12), min, max));
            },
            maxMonth !== null && year >= maxMonth.getFullYear(),
          )}
        </div>
        {renderItemGrid(items, 'month', captionId)}
      </div>
    );
    liveText = String(year);
  } else {
    const year = focusedDate.getFullYear();
    const first = Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;
    const captionId = `${id}-caption-years`;
    const items = Array.from({ length: YEARS_PER_PAGE }, (_, i) => {
      const y = first + i;
      return {
        key: `y${y}`,
        label: String(y),
        date: new Date(y, 0, 1),
        disabled:
          (min !== undefined && y < min.getFullYear()) ||
          (max !== undefined && y > max.getFullYear()),
        selected: selectedAnchor !== null && selectedAnchor.getFullYear() === y,
        current: today.getFullYear() === y,
        tabbable: y === year,
      };
    });
    const caption = `${first} – ${first + YEARS_PER_PAGE - 1}`;
    body = (
      <div className="ul-calendar__month">
        <div className="ul-calendar__header">
          {navButton(
            previousYearsLabel,
            'left',
            () => {
              setFocusedDate((d) => clampDate(addMonths(d, -12 * YEARS_PER_PAGE), min, max));
            },
            min !== undefined && first <= min.getFullYear(),
          )}
          <button
            type="button"
            id={captionId}
            className="ul-calendar__caption ul-calendar__caption--button"
            onClick={() => switchView('days')}
          >
            {caption}
          </button>
          {navButton(
            nextYearsLabel,
            'right',
            () => {
              setFocusedDate((d) => clampDate(addMonths(d, 12 * YEARS_PER_PAGE), min, max));
            },
            max !== undefined && first + YEARS_PER_PAGE - 1 >= max.getFullYear(),
          )}
        </div>
        {renderItemGrid(items, 'year', captionId)}
      </div>
    );
    liveText = caption;
  }

  return (
    // Keyboard handling for Escape (leave month/year views); the grids are the interactive parts.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      {...rest}
      ref={(node) => {
        rootRef.current = node;
        setRef(ref, node);
      }}
      className={cx('ul-calendar', `ul-calendar--${view}`, className)}
      onKeyDown={(event) => {
        rest.onKeyDown?.(event);
        onRootKeyDown(event);
      }}
      onMouseLeave={(event) => {
        rest.onMouseLeave?.(event);
        if (hovered) setHovered(null);
      }}
    >
      <div className="ul-visually-hidden" aria-live="polite">
        {liveText}
      </div>
      {body}
    </div>
  );
}) as unknown as CalendarComponent;

type CalendarComponent = ((
  props: CalendarProps & RefAttributes<HTMLDivElement>,
) => ReactElement | null) & {
  displayName?: string;
};
