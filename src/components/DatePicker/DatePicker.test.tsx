import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UleahProvider } from '../../theme/UleahProvider.js';
import { Calendar } from './Calendar.js';
import { DatePicker } from './DatePicker.js';
import type { DateRange } from './DatePicker.types.js';
import {
  addMonths,
  getCalendarWeeks,
  getLocaleWeekStart,
  isSameDay,
  parseISODate,
  toISODate,
} from './dateUtils.js';

const TODAY = new Date(2026, 10, 13); // Friday, November 13, 2026
const day = (d: number, m = 10, y = 2026) => new Date(y, m, d);
const dayButton = (name: RegExp | string) => screen.getByRole('button', { name });

describe('date utils', () => {
  it('adds months clamping the day', () => {
    expect(toISODate(addMonths(new Date(2026, 0, 31), 1))).toBe('2026-02-28');
    expect(toISODate(addMonths(new Date(2024, 0, 31), 1))).toBe('2024-02-29');
  });

  it('builds 6 weeks starting on the given weekday', () => {
    const weeks = getCalendarWeeks(day(1), 1);
    expect(weeks).toHaveLength(6);
    expect(weeks[0]![0]!.getDay()).toBe(1);
    expect(toISODate(weeks[0]![0]!)).toBe('2026-10-26');
  });

  it('parses and formats ISO dates in local time', () => {
    expect(toISODate(parseISODate('2026-11-13')!)).toBe('2026-11-13');
    expect(parseISODate('2026-02-30')).toBeNull();
    expect(parseISODate('13/11/2026')).toBeNull();
  });

  it('knows the first day of the week for a locale', () => {
    expect(getLocaleWeekStart('es-ES')).toBe(1);
    expect(getLocaleWeekStart('xx-invalid-')).toBe(1);
  });
});

describe('Calendar', () => {
  it('renders a labelled month grid with weekday names and today', () => {
    render(<Calendar locale="en-US" weekStartsOn={0} today={TODAY} />);
    const grid = screen.getByRole('grid', { name: /November 2026/ });
    expect(within(grid).getAllByRole('columnheader')).toHaveLength(7);
    expect(within(grid).getAllByRole('columnheader')[0]).toHaveTextContent('Sunday');
    expect(dayButton('Friday, November 13, 2026')).toHaveAttribute('aria-current', 'date');
  });

  it('selects a day', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Calendar locale="en-US" today={TODAY} onChange={onChange} />);
    await user.click(dayButton(/November 20, 2026/));
    expect(isSameDay(onChange.mock.calls[0]![0], day(20))).toBe(true);
    expect(dayButton(/November 20, 2026/).closest('td')).toHaveAttribute('aria-selected', 'true');
  });

  it('moves focus with the keyboard and changes month when needed', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" weekStartsOn={1} today={TODAY} defaultValue={day(30)} />);
    const selected = dayButton(/November 30, 2026/);
    expect(selected).toHaveAttribute('tabindex', '0');
    selected.focus();

    await user.keyboard('{ArrowRight}');
    expect(dayButton(/December 1, 2026/)).toHaveFocus();
    expect(screen.getByRole('grid', { name: /December 2026/ })).toBeInTheDocument();

    await user.keyboard('{ArrowUp}');
    expect(dayButton(/November 24, 2026/)).toHaveFocus();
    await user.keyboard('{Home}');
    expect(dayButton(/Monday, November 23, 2026/)).toHaveFocus();
    await user.keyboard('{End}');
    expect(dayButton(/Sunday, November 29, 2026/)).toHaveFocus();
    await user.keyboard('{PageUp}');
    expect(dayButton(/October 29, 2026/)).toHaveFocus();
    await user.keyboard('{Shift>}{PageDown}{/Shift}');
    expect(dayButton(/October 29, 2027/)).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(dayButton(/October 29, 2027/).closest('td')).toHaveAttribute('aria-selected', 'true');
  });

  it('respects min, max and disabled days', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Calendar
        locale="en-US"
        today={TODAY}
        min={day(5)}
        max={day(25)}
        isDateDisabled={(d) => d.getDay() === 0 || d.getDay() === 6}
        onChange={onChange}
      />,
    );
    expect(dayButton(/November 4, 2026/)).toHaveAttribute('aria-disabled', 'true');
    expect(dayButton(/Saturday, November 14, 2026/)).toHaveAttribute('aria-disabled', 'true');
    await user.click(dayButton(/November 26, 2026/));
    await user.click(dayButton(/Saturday, November 14, 2026/));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();

    // Keyboard focus stays within min/max.
    dayButton(/November 5, 2026/).focus();
    await user.keyboard('{ArrowLeft}');
    expect(dayButton(/November 5, 2026/)).toHaveFocus();
  });

  it('navigates months with the buttons', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" today={TODAY} />);
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('grid', { name: /December 2026/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByRole('grid', { name: /October 2026/ })).toBeInTheDocument();
  });

  it('jumps through month and year views', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" today={TODAY} />);
    await user.click(screen.getByRole('button', { name: /November 2026, Choose month and year/ }));
    expect(screen.getByRole('grid', { name: /2026/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^2026/ }));
    await user.click(screen.getByRole('button', { name: '2020' }));
    await user.click(screen.getByRole('button', { name: 'Mar' }));
    expect(screen.getByRole('grid', { name: /March 2020/ })).toBeInTheDocument();
    expect(dayButton(/March 13, 2020/)).toHaveFocus();
  });

  it('leaves the month view with Escape', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" today={TODAY} />);
    await user.click(screen.getByRole('button', { name: /November 2026, Choose/ }));
    await user.keyboard('{Escape}');
    expect(screen.getByRole('grid', { name: /November 2026/ })).toBeInTheDocument();
  });

  it('uses the locale for names', () => {
    render(<Calendar locale="es-ES" today={TODAY} />);
    expect(screen.getByRole('grid', { name: /noviembre de 2026/ })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('lunes');
  });

  it('shows several months', () => {
    render(<Calendar locale="en-US" today={TODAY} numberOfMonths={2} />);
    expect(screen.getAllByRole('grid')).toHaveLength(2);
    expect(screen.getByRole('grid', { name: 'December 2026' })).toBeInTheDocument();
  });

  describe('range', () => {
    it('picks a start and an end and marks the days between', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Calendar mode="range" locale="en-US" today={TODAY} onChange={onChange} />);
      await user.click(dayButton(/November 10, 2026/));
      expect(onChange).toHaveBeenLastCalledWith({ start: day(10), end: null });
      await user.click(dayButton(/November 14, 2026/));
      expect(onChange).toHaveBeenLastCalledWith({ start: day(10), end: day(14) });
      for (const d of [10, 12, 14]) {
        expect(dayButton(new RegExp(`November ${d}, 2026`)).closest('td')).toHaveAttribute(
          'aria-selected',
          'true',
        );
      }
      expect(dayButton(/November 15, 2026/).closest('td')).toHaveAttribute(
        'aria-selected',
        'false',
      );

      // A third click starts a new range.
      await user.click(dayButton(/November 20, 2026/));
      expect(onChange).toHaveBeenLastCalledWith({ start: day(20), end: null });
    });

    it('completes backwards when the second day is earlier', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Calendar mode="range" locale="en-US" today={TODAY} onChange={onChange} />);
      await user.click(dayButton(/November 20, 2026/));
      await user.click(dayButton(/November 3, 2026/));
      expect(onChange).toHaveBeenLastCalledWith({ start: day(3), end: day(20) });
    });

    it('previews the range while hovering', async () => {
      const user = userEvent.setup();
      render(<Calendar mode="range" locale="en-US" today={TODAY} />);
      await user.click(dayButton(/November 10, 2026/));
      await user.hover(dayButton(/November 13, 2026/));
      expect(dayButton(/November 12, 2026/).closest('td')).toHaveClass(
        'ul-calendar__cell--preview',
      );
    });
  });
});

describe('DatePicker', () => {
  it('opens a dialog, focuses the calendar and closes after picking', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker label="Due date" locale="en-US" today={TODAY} onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: /Due date/ });
    expect(trigger).toHaveTextContent('Select date');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');

    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeInTheDocument();
    expect(dayButton(/November 13, 2026/)).toHaveFocus();

    await user.keyboard('{ArrowRight}{Enter}');
    expect(isSameDay(onChange.mock.calls[0]![0], day(14))).toBe(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent('Nov 14, 2026');
    expect(trigger).toHaveAccessibleName('Due date Nov 14, 2026');
    expect(trigger).toHaveFocus();
  });

  it('closes with Escape and returns focus', async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Due date" locale="en-US" today={TODAY} />);
    await user.click(screen.getByRole('button', { name: /Due date/ }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Due date/ })).toHaveFocus();
  });

  it('closes when pressing outside', async () => {
    const user = userEvent.setup();
    render(
      <>
        <DatePicker label="Due date" locale="en-US" today={TODAY} />
        <p>Outside</p>
      </>,
    );
    await user.click(screen.getByRole('button', { name: /Due date/ }));
    await user.click(screen.getByText('Outside'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('picks a range, keeping the popup open until the end is chosen', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DatePicker
        mode="range"
        label="Stay"
        locale="en-US"
        today={TODAY}
        numberOfMonths={1}
        onChange={onChange}
        startName="from"
        endName="to"
      />,
    );
    await user.click(screen.getByRole('button', { name: /Stay/ }));
    expect(screen.getByRole('dialog', { name: 'Choose dates' })).toBeInTheDocument();
    await user.click(dayButton(/November 3, 2026/));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Stay/ })).toHaveTextContent('Nov 3, 2026 – …');
    await user.click(dayButton(/November 10, 2026/));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const text = screen.getByRole('button', { name: /Stay/ }).textContent ?? '';
    expect(text).toMatch(/Nov 3/);
    expect(text).toMatch(/10, 2026/);
    expect(document.querySelector<HTMLInputElement>('input[name="from"]')!.value).toBe(
      '2026-11-03',
    );
    expect(document.querySelector<HTMLInputElement>('input[name="to"]')!.value).toBe('2026-11-10');
  });

  it('applies presets', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DatePicker
        mode="range"
        label="Period"
        locale="en-US"
        today={TODAY}
        onChange={onChange}
        presets={[
          { label: 'This week', value: { start: day(9), end: day(15) } },
          { label: 'Last 7 days', value: () => ({ start: day(7), end: day(13) }) },
        ]}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Period/ }));
    const presets = screen.getByRole('group', { name: 'Presets' });
    await user.click(within(presets).getByRole('button', { name: 'Last 7 days' }));
    expect(onChange).toHaveBeenLastCalledWith({ start: day(7), end: day(13) });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Period/ }));
    expect(screen.getByRole('button', { name: 'Last 7 days' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('works controlled and submits ISO dates', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<Date | null>(day(1, 0, 2027));
      return (
        <form>
          <DatePicker
            label="Start"
            locale="en-US"
            today={TODAY}
            value={value}
            onChange={setValue}
            name="start"
            clearable
          />
          <output>{value ? toISODate(value) : 'none'}</output>
        </form>
      );
    }
    render(<Controlled />);
    expect(screen.getByRole('button', { name: /Start/ })).toHaveTextContent('Jan 1, 2027');
    expect(document.querySelector<HTMLInputElement>('input[name="start"]')!.value).toBe(
      '2027-01-01',
    );
    await user.click(screen.getByRole('button', { name: 'Clear date' }));
    expect(screen.getByRole('status')).toHaveTextContent('none');
    expect(screen.getByRole('button', { name: /Start/ })).toHaveFocus();
  });

  it('renders the popup inside the nearest theme scope', async () => {
    const user = userEvent.setup();
    render(
      <UleahProvider theme="dark" data-testid="scope">
        <div style={{ overflow: 'hidden' }}>
          <DatePicker aria-label="Date" locale="en-US" today={TODAY} />
        </div>
      </UleahProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Date' }));
    expect(screen.getByRole('dialog').parentElement).toBe(screen.getByTestId('scope'));
  });

  it('supports helper text, errors, required and disabled', () => {
    render(
      <>
        <DatePicker label="A" helperText="Pick a weekday" error="Required" required />
        <DatePicker label="B" disabled />
      </>,
    );
    const a = screen.getByRole('button', { name: /A \(required\)/ });
    expect(a).toHaveAccessibleDescription('Required');
    expect(screen.getByRole('button', { name: /B/ })).toBeDisabled();
  });

  it('accepts a custom formatter', () => {
    render(
      <DatePicker
        mode="range"
        label="Stay"
        defaultValue={{ start: day(3), end: day(10) } satisfies DateRange}
        formatValue={(r) => `${r.start?.getDate()}→${r.end?.getDate()}`}
      />,
    );
    expect(screen.getByRole('button', { name: /Stay/ })).toHaveTextContent('3→10');
  });
});
