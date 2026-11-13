/**
 * Small, dependency-free date helpers. All dates are treated as calendar days in local time
 * (the time of day is ignored), which is what a date picker needs.
 */

/** Day of the week: 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Add months, clamping the day (Jan 31 + 1 month = Feb 28/29). */
export function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay));
}

export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  return (
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Negative if `a` is before `b`, 0 on the same day, positive after. */
export function compareDays(a: Date, b: Date): number {
  return startOfDay(a).getTime() - startOfDay(b).getTime();
}

/** Months between the starts of two months (b − a). */
export function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

export function isWithin(date: Date, start: Date, end: Date): boolean {
  return compareDays(date, start) >= 0 && compareDays(date, end) <= 0;
}

export function clampDate(date: Date, min?: Date | null, max?: Date | null): Date {
  if (min && compareDays(date, min) < 0) return startOfDay(min);
  if (max && compareDays(date, max) > 0) return startOfDay(max);
  return date;
}

export function startOfWeek(date: Date, weekStartsOn: Weekday): Date {
  const diff = (date.getDay() - weekStartsOn + 7) % 7;
  return addDays(date, -diff);
}

/** The 6 weeks (42 days) shown for a month, starting on `weekStartsOn`. */
export function getCalendarWeeks(month: Date, weekStartsOn: Weekday): Date[][] {
  const first = startOfWeek(startOfMonth(month), weekStartsOn);
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(first, week * 7 + day)),
  );
}

/** Local calendar date as `YYYY-MM-DD` (what `<input type="date">` and forms use). */
export function toISODate(date: Date): string {
  const y = String(date.getFullYear()).padStart(4, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse `YYYY-MM-DD` as a local date. Returns null for anything else or invalid days. */
export function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
    ? date
    : null;
}

/** First day of the week for a locale (Intl week info where supported, otherwise Monday). */
export function getLocaleWeekStart(locale?: string): Weekday {
  try {
    const intlLocale = new Intl.Locale(
      locale ?? new Intl.DateTimeFormat().resolvedOptions().locale,
    );
    const info =
      (intlLocale as { getWeekInfo?: () => { firstDay: number } }).getWeekInfo?.() ??
      (intlLocale as { weekInfo?: { firstDay: number } }).weekInfo;
    // Intl uses 1 = Monday … 7 = Sunday.
    if (info) return (info.firstDay % 7) as Weekday;
  } catch {
    // Unknown locale or no Intl.Locale: fall through.
  }
  return 1;
}
