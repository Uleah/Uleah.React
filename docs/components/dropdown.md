# Dropdown

A select-only combobox: a trigger that opens a list of options. Supports single and multiple
selection, previous/next navigation buttons, long options and an adaptive popup that is never
clipped by its container.

```tsx
import { Dropdown } from '@uleah/react';

const options = [
  { value: 'es', label: 'Spain' },
  { value: 'mx', label: 'Mexico', description: 'North America' },
  { value: 'pe', label: 'Peru', disabled: true },
];

<Dropdown label="Country" options={options} defaultValue="es" />;
<Dropdown label="Countries" options={options} multiple defaultValue={['es', 'mx']} />;
```

> **Status: first version (0.x).** The API may change. See [Limitations](#limitations).

## Options

```ts
interface DropdownOption {
  value: string; // unique; what value/onChange use and forms submit
  label: string; // shown in the list and the trigger; used for type-ahead
  description?: ReactNode; // secondary line
  icon?: ReactNode; // decorative, aria-hidden
  disabled?: boolean; // visible but not selectable, skipped by the arrow keys
}
```

## Props

Other attributes (`aria-*`, `data-*`, event handlers) go to the trigger. The `ref` points to the
trigger (`role="combobox"`).

| Prop                              | Type                           | Default             | Description                                                                     |
| --------------------------------- | ------------------------------ | ------------------- | ------------------------------------------------------------------------------- |
| `options`                         | `DropdownOption[]`             | required            | Options in display order                                                        |
| `multiple`                        | `boolean`                      | `false`             | Multiple selection. Changes the types of `value`, `defaultValue` and `onChange` |
| `value` / `defaultValue`          | `string \| null` or `string[]` | none                | Controlled / initial selection                                                  |
| `onChange`                        | see below                      | none                | Single: `(value, option)`. Multiple: `(values, options)`                        |
| `open` / `defaultOpen`            | `boolean`                      | `false`             | Controlled / initial open state                                                 |
| `onOpenChange`                    | `(open) => void`               | none                | Called when the popup wants to open or close                                    |
| `label`, `hideLabel`              |                                | none, `false`       | As in `Input`. Without `label`, pass `aria-label` or `aria-labelledby`          |
| `helperText`, `error`, `required` |                                | none                | As in `Input`                                                                   |
| `placeholder`                     | `string`                       | `'Select…'`         | Shown when nothing is selected                                                  |
| `size`                            | `'sm' \| 'md' \| 'lg'`         | `'md'`              | Same heights as `Input`                                                         |
| `disabled`                        | `boolean`                      | `false`             |                                                                                 |
| `name`                            | `string`                       | none                | Renders one hidden `<input>` per selected value for native form submission      |
| `navigationButtons`               | `boolean`                      | `false`             | Previous/next arrow buttons beside the trigger (single selection only)          |
| `loop`                            | `boolean`                      | `false`             | The arrow buttons wrap around                                                   |
| `previousLabel` / `nextLabel`     | `string`                       | `'Previous option'` | Accessible names of the arrow buttons                                           |
| `placement`                       | `'auto' \| 'bottom' \| 'top'`  | `'auto'`            | `auto` opens below and flips above when there is more room there                |
| `popupWidth`                      | `'trigger' \| 'auto'`          | `'trigger'`         | `auto` grows with the content up to `--ul-dropdown-popup-max-width`             |
| `optionOverflow`                  | `'truncate' \| 'wrap'`         | `'truncate'`        | Long labels: ellipsis with a tooltip, or wrapped onto several lines             |
| `portal`                          | `boolean`                      | `true`              | Render the popup in the nearest `.ul-theme` scope (escapes `overflow: hidden`)  |
| `emptyMessage`                    | `ReactNode`                    | `'No options'`      | Shown when `options` is empty                                                   |
| `maxDisplayedValues`              | `number`                       | `3`                 | Multiple: above this, the trigger shows `selectedSummary` instead of the labels |
| `selectedSummary`                 | `(count) => string`            | `"N selected"`      | Multiple: summary text                                                          |
| `renderOption`                    | `(option, state) => ReactNode` | none                | Custom option content (`state`: `selected`, `active`, `disabled`)               |
| `renderValue`                     | `(selected) => ReactNode`      | none                | Custom trigger content                                                          |
| `className` / `style`             |                                | none                | Root wrapper (`.ul-field.ul-dropdown`)                                          |
| `triggerClassName`                | `string`                       | none                | The trigger                                                                     |
| `popupClassName`                  | `string`                       | none                | The popup                                                                       |

## Inside tables and other clipping containers

The popup uses `position: fixed` and, by default, is portalled into the nearest theme scope
(`<UleahProvider>`), so `overflow: hidden` or scrolling parents don't cut it off, and it follows
the trigger on scroll and resize. Without a visible label, name it from the table headers:

```tsx
<td>
  <Dropdown size="sm" options={statuses} aria-labelledby={`col-status row-${id}`} />
</td>
```

Use `portal={false}` to render the popup next to the trigger instead (e.g. inside a modal that
traps focus by DOM position).

## Keyboard

Focus stays on the trigger. The highlighted option is announced with `aria-activedescendant`.

| Key                     | Closed                      | Open                                                        |
| ----------------------- | --------------------------- | ----------------------------------------------------------- |
| `↓` / `Enter` / `Space` | Open on the selected option | `↓`: next option. `Enter`/`Space`: select (single closes)   |
| `↑`                     | Open                        | Previous option. `Alt+↑`: select and close                  |
| `Home` / `End`          | Open on the first / last    | First / last option                                         |
| `PageUp` / `PageDown`   |                             | Move 10 options                                             |
| Letters                 | Open on the first match     | Type-ahead: jump to the next option starting with the text  |
| `Escape`                |                             | Close without changing the selection                        |
| `Tab`                   | Move focus                  | Single: select the highlighted option, close and move focus |

Disabled options are skipped. Clicking outside closes the popup.

## Customization

| Variable                              | Default                       |
| ------------------------------------- | ----------------------------- |
| `--ul-dropdown-height`                | per size, as `Input`          |
| `--ul-dropdown-padding-x`             | per size, as `Input`          |
| `--ul-dropdown-font-size`             | per size, as `Input`          |
| `--ul-dropdown-radius`                | `--ul-radius-md`              |
| `--ul-dropdown-bg`                    | `--ul-color-surface`          |
| `--ul-dropdown-color`                 | `--ul-color-text`             |
| `--ul-dropdown-border-color`          | `--ul-color-border-strong`    |
| `--ul-dropdown-border-color-hover`    | `--ul-color-text-muted`       |
| `--ul-dropdown-max-height`            | `18rem` (list before scroll)  |
| `--ul-dropdown-popup-max-width`       | `32rem`                       |
| `--ul-dropdown-popup-bg`              | `--ul-color-surface-elevated` |
| `--ul-dropdown-popup-radius`          | `--ul-radius-md`              |
| `--ul-dropdown-popup-shadow`          | `--ul-shadow-lg`              |
| `--ul-dropdown-option-bg-active`      | `--ul-color-surface-hover`    |
| `--ul-dropdown-option-color-selected` | `--ul-color-primary-text`     |

The popup can be portalled out of `.ul-dropdown`: set popup variables on the theme scope or
through `popupClassName`.

## Limitations

Planned for later versions:

- Search / filtering inside the popup (editable combobox), and async option loading.
- Option groups and separators.
- Virtualization for very large lists (thousands of options).
- A "clear" button and select-all for multiple selection.
- A headless hook (`useDropdown`) for fully custom triggers, e.g. editable table cells.
- `position: fixed` is relative to the nearest ancestor with a `transform`, `filter` or
  `contain` if there is one; inside such an ancestor, use `portal` (the default) so the popup is
  attached to the theme scope instead.
