import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar } from './Calendar.js';
import { DatePicker } from './DatePicker.js';
import type { DatePickerProps, DateRange } from './DatePicker.types.js';
import { addDays, startOfDay } from './dateUtils.js';

const meta = {
  title: 'Components/DatePicker',
  component: DatePicker,
  args: { label: 'Due date' },
  decorators: [(Story) => <div style={{ maxWidth: 360, minHeight: 460 }}>{Story()}</div>],
} satisfies Meta<DatePickerProps>;

export default meta;
type Story = StoryObj<DatePickerProps>;

const today = startOfDay(new Date());

export const Playground: Story = {};

export const Range: Story = {
  args: { mode: 'range', label: 'Stay', placeholder: 'Check-in – check-out', clearable: true },
};

export const RangeWithPresets: Story = {
  args: {
    mode: 'range',
    label: 'Report period',
    presets: [
      { label: 'Today', value: () => ({ start: today, end: today }) },
      { label: 'Last 7 days', value: () => ({ start: addDays(today, -6), end: today }) },
      { label: 'Last 30 days', value: () => ({ start: addDays(today, -29), end: today }) },
      {
        label: 'This month',
        value: () => ({
          start: new Date(today.getFullYear(), today.getMonth(), 1),
          end: new Date(today.getFullYear(), today.getMonth() + 1, 0),
        }),
      },
    ],
  },
};

/** Weekends and the past are disabled; at most 60 days ahead. */
export const Constraints: Story = {
  args: {
    label: 'Delivery day',
    min: today,
    max: addDays(today, 60),
    isDateDisabled: (d: Date) => d.getDay() === 0 || d.getDay() === 6,
    helperText: 'Weekdays only, within the next 60 days.',
  },
};

/** Month and day names, and the first day of the week, follow the locale. */
export const Locales: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <DatePicker label="Fecha (es-ES)" locale="es-ES" defaultValue={today} />
      <DatePicker label="Date (en-US)" locale="en-US" defaultValue={today} />
      <DatePicker
        label="Datum (de-DE)"
        locale="de-DE"
        defaultValue={today}
        formatOptions={{ dateStyle: 'full' }}
      />
    </div>
  ),
};

export const Birthday: Story = {
  args: {
    label: 'Date of birth',
    max: today,
    defaultValue: new Date(1990, 5, 15),
    helperText: 'Click the month caption to jump to a year.',
  },
};

export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <DatePicker label="Required" required />
      <DatePicker label="Invalid" error="Choose a date." />
      <DatePicker label="Disabled" disabled defaultValue={today} />
      <DatePicker label="Small" size="sm" />
      <DatePicker label="Large" size="lg" />
    </div>
  ),
};

export const Controlled: Story = {
  render: function ControlledStory() {
    const [range, setRange] = useState<DateRange>({ start: null, end: null });
    return (
      <div style={{ display: 'grid', gap: '1rem' }}>
        <DatePicker mode="range" label="Trip" value={range} onChange={setRange} clearable />
        <code>
          {range.start?.toDateString() ?? '—'} → {range.end?.toDateString() ?? '—'}
        </code>
      </div>
    );
  },
};

/** The calendar on its own, e.g. inside a sidebar or a booking page. */
export const InlineCalendar: Story = {
  render: () => <Calendar aria-label="Booking calendar" mode="range" numberOfMonths="auto" />,
};
