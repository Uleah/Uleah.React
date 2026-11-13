import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import type { FloatingPlacement } from '../../utils/floating.js';
import type { Weekday } from './dateUtils.js';

export type { Weekday };

/** A date range. While the user is choosing, `end` is null. */
export interface DateRange {
  start: Date | null;
  end: Date | null;
}

/** What the calendar shows: days of a month, the months of a year, or a page of years. */
export type CalendarView = 'days' | 'months' | 'years';

export type DatePickerSize = 'sm' | 'md' | 'lg';

export type DatePickerPlacement = FloatingPlacement;

interface CalendarBaseProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue' | 'children'
> {
  /** Earliest selectable day. */
  min?: Date;
  /** Latest selectable day. */
  max?: Date;
  /** Return true to disable a day (e.g. weekends, holidays, booked nights). */
  isDateDisabled?: (date: Date) => boolean;
  /** BCP 47 locale for month and day names, e.g. `'es-ES'`. Defaults to the browser's. */
  locale?: string;
  /** First day of the week (0 = Sunday … 6 = Saturday). Defaults to the locale's. */
  weekStartsOn?: Weekday;
  /**
   * Months shown side by side. `'auto'` shows 2 on wide screens (≥ 48rem) and 1 on narrow ones.
   * @default 1
   */
  numberOfMonths?: number | 'auto';
  /** Controlled first visible month. */
  month?: Date;
  /** Initial first visible month. Defaults to the selected date, or today. */
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;
  /** Show the days of the previous and next months (not selectable). @default true */
  showOutsideDays?: boolean;
  /** Override "today" (time zones, tests). */
  today?: Date;
  /** Move focus to the calendar when it mounts. @default false */
  autoFocus?: boolean;
  /** @default 'Previous month' */
  previousMonthLabel?: string;
  /** @default 'Next month' */
  nextMonthLabel?: string;
  /** @default 'Previous year' */
  previousYearLabel?: string;
  /** @default 'Next year' */
  nextYearLabel?: string;
  /** @default 'Previous years' */
  previousYearsLabel?: string;
  /** @default 'Next years' */
  nextYearsLabel?: string;
  /** Accessible hint of the caption button. @default 'Choose month and year' */
  chooseViewLabel?: string;
}

export interface CalendarSingleProps extends CalendarBaseProps {
  /** `'single'` picks one day; `'range'` picks a start and an end. @default 'single' */
  mode?: 'single';
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (date: Date | null) => void;
}

export interface CalendarRangeProps extends CalendarBaseProps {
  mode: 'range';
  value?: DateRange;
  defaultValue?: DateRange;
  /**
   * Called on every click: first with `{ start, end: null }`, then with the complete range.
   * Picking a day before the start completes the range backwards.
   */
  onChange?: (range: DateRange) => void;
}

export type CalendarProps = CalendarSingleProps | CalendarRangeProps;

/** A shortcut shown next to the calendar ("Today", "Last 7 days"…). */
export interface DatePickerPreset<V> {
  label: string;
  /** The value, or a function computing it when clicked (for dates relative to now). */
  value: V | (() => V);
}

interface DatePickerBaseProps extends Omit<
  HTMLAttributes<HTMLButtonElement>,
  'onChange' | 'defaultValue' | 'children' | 'placeholder' | 'className' | 'style'
> {
  label?: ReactNode;
  /** Visually hide the label while keeping it as the accessible name. @default false */
  hideLabel?: boolean;
  helperText?: ReactNode;
  /** Marks the field invalid. Pass a message to display it, or `true` for no message. */
  error?: ReactNode;
  /** @default 'Select date' / 'Select dates' */
  placeholder?: string;
  /** @default 'md' */
  size?: DatePickerSize;
  disabled?: boolean;
  required?: boolean;

  min?: Date;
  max?: Date;
  isDateDisabled?: (date: Date) => boolean;
  locale?: string;
  weekStartsOn?: Weekday;
  /** @default 1 for single, 'auto' (2 on wide screens, 1 on narrow) for range */
  numberOfMonths?: number | 'auto';
  showOutsideDays?: boolean;
  today?: Date;

  /** How the value is written in the trigger. @default { dateStyle: 'medium' } */
  formatOptions?: Intl.DateTimeFormatOptions;

  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Close when a date (single) or a complete range is chosen. @default true */
  closeOnSelect?: boolean;
  /** @default 'auto' */
  placement?: DatePickerPlacement;
  /** Portal the popup into the nearest theme scope. @default true */
  portal?: boolean;

  /** Show a button that clears the value. */
  clearable?: boolean;
  /** @default 'Clear date' */
  clearLabel?: string;
  /** Screen-reader text added to the label when `required`. @default 'required' */
  requiredLabel?: string;
  /** Accessible name of the popup. @default 'Choose date' / 'Choose dates' */
  dialogLabel?: string;
  /** Accessible name of the presets list. @default 'Presets' */
  presetsLabel?: string;
  /** Extra content at the bottom of the popup. */
  footer?: ReactNode;

  /** Labels forwarded to the calendar. */
  previousMonthLabel?: string;
  nextMonthLabel?: string;

  className?: string;
  style?: CSSProperties;
  triggerClassName?: string;
  popupClassName?: string;
}

export interface DatePickerSingleProps extends DatePickerBaseProps {
  mode?: 'single';
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (date: Date | null) => void;
  /** Shortcuts shown next to the calendar. */
  presets?: readonly DatePickerPreset<Date>[];
  /** Custom trigger text. */
  formatValue?: (date: Date) => ReactNode;
  /** Form field name. Submits `YYYY-MM-DD`. */
  name?: string;
}

export interface DatePickerRangeProps extends DatePickerBaseProps {
  mode: 'range';
  value?: DateRange;
  defaultValue?: DateRange;
  onChange?: (range: DateRange) => void;
  presets?: readonly DatePickerPreset<DateRange>[];
  formatValue?: (range: DateRange) => ReactNode;
  /** Form field name for the start date (`YYYY-MM-DD`). */
  startName?: string;
  /** Form field name for the end date (`YYYY-MM-DD`). */
  endName?: string;
}

export type DatePickerProps = DatePickerSingleProps | DatePickerRangeProps;
