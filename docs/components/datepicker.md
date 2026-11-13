# DatePicker and Calendar

`DatePicker` is a date field: a trigger that shows the chosen date (or range) and opens a calendar
in a popup. `Calendar` is the calendar on its own, for inline use.

```tsx
import { Calendar, DatePicker } from '@uleah/react';

<DatePicker label="Due date" />;
<DatePicker mode="range" label="Stay" clearable />;
<Calendar mode="range" numberOfMonths="auto" aria-label="Booking calendar" />;
```

> **Status: first version (0.x).** The API may change. See [Limitations](#limitations).

## Values

Values are plain `Date` objects that represent **calendar days in local time** (the time is
ignored). No date library is required.

| Mode               | `value` type                                 | `onChange` receives                                          |
| ------------------ | -------------------------------------------- | ------------------------------------------------------------ |
| `single` (default) | `Date \| null`                               | the date, or `null` when cleared                             |
| `range`            | `{ start: Date \| null; end: Date \| null }` | every click: `{ start, end: null }`, then the complete range |

In range mode, choosing a day before the start completes the range backwards, and a third click
starts a new range. `toISODate(date)` and `parseISODate('YYYY-MM-DD')` convert to and from the
format forms and APIs use.

## DatePicker props

Other attributes go to the trigger `<button>`; the `ref` points to it.

| Prop                                                                                   | Type                                | Default                            | Description                                                              |
| -------------------------------------------------------------------------------------- | ----------------------------------- | ---------------------------------- | ------------------------------------------------------------------------ |
| `mode`                                                                                 | `'single' \| 'range'`               | `'single'`                         |                                                                          |
| `value` / `defaultValue` / `onChange`                                                  | see above                           |                                    | Controlled or uncontrolled                                               |
| `label`, `hideLabel`, `helperText`, `error`, `required`, `disabled`, `size`            |                                     |                                    | As in `Input`                                                            |
| `placeholder`                                                                          | `string`                            | `'Select date'` / `'Select dates'` |                                                                          |
| `min` / `max`                                                                          | `Date`                              | none                               | Selectable bounds (also limit navigation)                                |
| `isDateDisabled`                                                                       | `(date) => boolean`                 | none                               | Disable specific days (weekends, holidays, booked nights)                |
| `locale`                                                                               | `string`                            | browser                            | Month/day names and the default first day of the week                    |
| `weekStartsOn`                                                                         | `0`–`6`                             | from the locale                    | 0 = Sunday, 1 = Monday…                                                  |
| `numberOfMonths`                                                                       | `number \| 'auto'`                  | single `1`, range `'auto'`         | `'auto'`: 2 months on screens ≥ 48rem, 1 on narrow screens               |
| `presets`                                                                              | `{ label, value \| () => value }[]` | none                               | Shortcuts next to the calendar ("Last 7 days"…). Functions run on click  |
| `formatOptions`                                                                        | `Intl.DateTimeFormatOptions`        | `{ dateStyle: 'medium' }`          | How the trigger writes the value (ranges use `formatRange`)              |
| `formatValue`                                                                          | `(value) => ReactNode`              | none                               | Fully custom trigger text                                                |
| `clearable` / `clearLabel`                                                             | `boolean` / `string`                | `false` / `'Clear date'`           | Clear button                                                             |
| `closeOnSelect`                                                                        | `boolean`                           | `true`                             | Close after a date / a complete range                                    |
| `open` / `defaultOpen` / `onOpenChange`                                                |                                     |                                    | Controlled or uncontrolled popup                                         |
| `placement`                                                                            | `'auto' \| 'bottom' \| 'top'`       | `'auto'`                           | `auto` flips above when there is more room                               |
| `portal`                                                                               | `boolean`                           | `true`                             | Render the popup in the nearest theme scope (escapes `overflow: hidden`) |
| `name`                                                                                 | `string`                            | none                               | Single: hidden input with `YYYY-MM-DD`                                   |
| `startName` / `endName`                                                                | `string`                            | none                               | Range: hidden inputs with `YYYY-MM-DD`                                   |
| `dialogLabel`, `presetsLabel`, `requiredLabel`, `previousMonthLabel`, `nextMonthLabel` | `string`                            | English                            | Accessible texts                                                         |
| `footer`                                                                               | `ReactNode`                         | none                               | Extra content below the calendar                                         |
| `today`                                                                                | `Date`                              | now                                | Override "today" (time zones, tests)                                     |
| `className` / `style`                                                                  |                                     |                                    | Root wrapper (`.ul-field.ul-datepicker`)                                 |
| `triggerClassName` / `popupClassName`                                                  | `string`                            |                                    |                                                                          |

## Calendar props

`mode`, `value`, `defaultValue`, `onChange`, `min`, `max`, `isDateDisabled`, `locale`,
`weekStartsOn`, `numberOfMonths` and `today` work as above. In addition:

| Prop                                                                                                                                    | Type      | Default | Description                                       |
| --------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------- | ------------------------------------------------- |
| `month` / `defaultMonth` / `onMonthChange`                                                                                              | `Date`    |         | Controlled or initial first visible month         |
| `showOutsideDays`                                                                                                                       | `boolean` | `true`  | Show (not selectable) days of the adjacent months |
| `autoFocus`                                                                                                                             | `boolean` | `false` | Focus the calendar on mount                       |
| `previousMonthLabel`, `nextMonthLabel`, `previousYearLabel`, `nextYearLabel`, `previousYearsLabel`, `nextYearsLabel`, `chooseViewLabel` | `string`  | English | Accessible texts                                  |

Give an inline `Calendar` an accessible name with `aria-label` when it isn't otherwise labelled.

## Adaptive behaviour

- The popup opens below the trigger, flips above when there is more room there, stays inside the
  viewport horizontally, scrolls when the screen is short, and follows the trigger on scroll and
  resize. It is portalled into the nearest `UleahProvider`, so tables and scroll areas don't clip
  it and the theme still applies.
- Ranges show two months on wide screens and one on narrow screens (`numberOfMonths="auto"`).
- Presets sit in a column beside the calendar, and become a horizontal row above it on screens
  narrower than 40rem.

## Keyboard

The trigger opens with Enter, Space or ↓. Focus moves to the selected day (or today) and returns
to the trigger when the popup closes.

| Key                   | Action                                                        |
| --------------------- | ------------------------------------------------------------- |
| `←` / `→`             | Previous / next day                                           |
| `↑` / `↓`             | Same day of the previous / next week                          |
| `Home` / `End`        | First / last day of the week                                  |
| `PageUp` / `PageDown` | Previous / next month (`Shift`: year)                         |
| `Enter` / `Space`     | Select the day                                                |
| `Escape`              | Month/year view: back to days. Otherwise: close the popup     |
| `Tab`                 | Move between presets, navigation and the grid; leaving closes |

The caption ("November 2026") switches to a month view, then a year view, for distant dates such
as birthdays. Disabled days can be focused but not selected.

## Accessibility

- The popup is a non-modal `role="dialog"`. Each month is a `role="grid"` named by its caption;
  days are buttons named with the full date ("Friday, November 13, 2026"); selection is exposed
  with `aria-selected` on the cells and today with `aria-current="date"`.
- Month changes are announced through a polite live region.
- The trigger's accessible name combines the label and the current value.

## Customization

| Variable                       | Default                       |
| ------------------------------ | ----------------------------- |
| `--ul-calendar-cell-size`      | `2.25rem`                     |
| `--ul-calendar-selected-bg`    | `--ul-color-primary`          |
| `--ul-calendar-selected-color` | `--ul-color-on-primary`       |
| `--ul-calendar-range-bg`       | `--ul-color-primary-subtle`   |
| `--ul-calendar-today-color`    | `--ul-color-primary-text`     |
| `--ul-datepicker-popup-bg`     | `--ul-color-surface-elevated` |
| `--ul-datepicker-popup-radius` | `--ul-radius-lg`              |
| `--ul-datepicker-popup-shadow` | `--ul-shadow-lg`              |

The trigger reuses the Dropdown variables (`--ul-dropdown-height`, `--ul-dropdown-radius`…).

## Limitations

Planned for later versions:

- Typing the date into the field (localized parsing and masks).
- Time selection.
- Week numbers, and min/max length for ranges.
- Right-to-left arrow keys.
