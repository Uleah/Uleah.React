# Dropdown

A select-only combobox: a trigger that opens a list of options. Supports single and multiple
selection, search (local or server-side), groups and separators, virtualization for long lists,
clear and select-all, previous/next navigation buttons, long options and an adaptive popup that
is never clipped by its container. The logic is also available headless as `useDropdown`.

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

### Groups and separators

`options` also accepts groups and separators. Groups are announced by screen readers
(`role="group"`), and groups without search matches are hidden.

```tsx
<Dropdown
  label="Region"
  options={[
    { value: 'any', label: 'Any region' },
    { type: 'separator' },
    { label: 'Europe', options: [{ value: 'es', label: 'Spain' }] },
    { label: 'Americas', options: [{ value: 'mx', label: 'Mexico' }] },
  ]}
/>
```

## Props

Other attributes (`aria-*`, `data-*`, event handlers) go to the trigger. The `ref` points to the
trigger (`role="combobox"`).

| Prop                                  | Type                                    | Default                           | Description                                                                               |
| ------------------------------------- | --------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------- |
| `options`                             | `DropdownOption[]`                      | required                          | Options in display order                                                                  |
| `multiple`                            | `boolean`                               | `false`                           | Multiple selection. Changes the types of `value`, `defaultValue` and `onChange`           |
| `value` / `defaultValue`              | `string \| null` or `string[]`          | none                              | Controlled / initial selection                                                            |
| `onChange`                            | see below                               | none                              | Single: `(value, option)`. Multiple: `(values, options)`                                  |
| `open` / `defaultOpen`                | `boolean`                               | `false`                           | Controlled / initial open state                                                           |
| `onOpenChange`                        | `(open) => void`                        | none                              | Called when the popup wants to open or close                                              |
| `label`, `hideLabel`                  |                                         | none, `false`                     | As in `Input`. Without `label`, pass `aria-label` or `aria-labelledby`                    |
| `helperText`, `error`, `required`     |                                         | none                              | As in `Input`                                                                             |
| `placeholder`                         | `string`                                | `'Select…'`                       | Shown when nothing is selected                                                            |
| `size`                                | `'sm' \| 'md' \| 'lg'`                  | `'md'`                            | Same heights as `Input`                                                                   |
| `disabled`                            | `boolean`                               | `false`                           |                                                                                           |
| `name`                                | `string`                                | none                              | Renders one hidden `<input>` per selected value for native form submission                |
| `closeOnSelect`                       | `boolean`                               | single: `true`                    | Close after choosing. Multiple defaults to `false`                                        |
| `searchable`                          | `boolean`                               | `false`                           | Search box at the top of the popup                                                        |
| `searchValue` / `defaultSearchValue`  | `string`                                | none                              | Controlled / initial search text                                                          |
| `onSearchChange`                      | `(query) => void`                       | none                              | Every search change (use it to fetch options)                                             |
| `filter`                              | `boolean \| (option, query) => boolean` | `true`                            | Local matching (labels, ignoring case and accents), custom, or `false` for server results |
| `searchPlaceholder` / `searchLabel`   | `string`                                | `'Search…'` / `'Search options'`  | Search box placeholder and accessible name                                                |
| `loading` / `loadingMessage`          | `boolean` / `ReactNode`                 | `false` / `'Loading…'`            | Loading state, announced in a `role="status"` region                                      |
| `onLoadMore`                          | `() => void`                            | none                              | Called when the list is scrolled near its end (infinite loading)                          |
| `noResultsMessage`                    | `ReactNode`                             | `'No results'`                    | Shown when the search matches nothing                                                     |
| `virtualized`                         | `boolean`                               | `false`                           | Render only the visible rows (thousands of options)                                       |
| `itemHeight`                          | `number`                                | 32 / 36 / 44                      | Row height in px when virtualized (raise it if options have descriptions)                 |
| `clearable` / `clearLabel`            | `boolean` / `string`                    | `false` / `'Clear selection'`     | Clear button; Backspace/Delete on the trigger also clears                                 |
| `selectAll`                           | `boolean`                               | `false`                           | Multiple: "Select all" / "Deselect all" for the enabled options matching the search       |
| `selectAllLabel` / `deselectAllLabel` | `string`                                | `'Select all'` / `'Deselect all'` |                                                                                           |
| `navigationButtons`                   | `boolean`                               | `false`                           | Previous/next arrow buttons beside the trigger (single selection only)                    |
| `loop`                                | `boolean`                               | `false`                           | The arrow buttons wrap around                                                             |
| `previousLabel` / `nextLabel`         | `string`                                | `'Previous option'`               | Accessible names of the arrow buttons                                                     |
| `placement`                           | `'auto' \| 'bottom' \| 'top'`           | `'auto'`                          | `auto` opens below and flips above when there is more room there                          |
| `popupWidth`                          | `'trigger' \| 'auto'`                   | `'trigger'`                       | `auto` grows with the content up to `--ul-dropdown-popup-max-width`                       |
| `optionOverflow`                      | `'truncate' \| 'wrap'`                  | `'truncate'`                      | Long labels: ellipsis with a tooltip, or wrapped onto several lines                       |
| `portal`                              | `boolean`                               | `true`                            | Render the popup in the nearest `.ul-theme` scope (escapes `overflow: hidden`)            |
| `emptyMessage`                        | `ReactNode`                             | `'No options'`                    | Shown when `options` is empty                                                             |
| `maxDisplayedValues`                  | `number`                                | `3`                               | Multiple: above this, the trigger shows `selectedSummary` instead of the labels           |
| `selectedSummary`                     | `(count) => string`                     | `"N selected"`                    | Multiple: summary text                                                                    |
| `renderOption`                        | `(option, state) => ReactNode`          | none                              | Custom option content (`state`: `selected`, `active`, `disabled`)                         |
| `renderValue`                         | `(selected) => ReactNode`               | none                              | Custom trigger content                                                                    |
| `className` / `style`                 |                                         | none                              | Root wrapper (`.ul-field.ul-dropdown`)                                                    |
| `triggerClassName`                    | `string`                                | none                              | The trigger                                                                               |
| `popupClassName`                      | `string`                                | none                              | The popup                                                                                 |

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

## Search and server-side options

Local search filters the options you pass. For server-side search, set `filter={false}`, fetch
in `onSearchChange` and pass the results as `options`. Labels of selected options are
remembered, so the trigger keeps showing them when they leave the result list.

```tsx
const [query, setQuery] = useState('');
const { data = [], isLoading } = useCities(query); // your data fetching

<Dropdown
  label="City"
  searchable
  filter={false}
  options={data}
  searchValue={query}
  onSearchChange={setQuery}
  loading={isLoading}
  onLoadMore={fetchNextPage}
  emptyMessage="Type to search"
/>;
```

## Long lists (virtualization)

With `virtualized`, only the rows in view (plus a few extra) are in the DOM, so thousands of
options stay fast. Every row has the same height (`itemHeight`), so labels are truncated.
Options still expose their real position to assistive tech (`aria-setsize`, `aria-posinset`).

```tsx
<Dropdown label="Product" options={products} virtualized searchable />
```

## Custom triggers: `useDropdown` + `DropdownPopup`

`useDropdown` contains all the behaviour (selection, keyboard, search, groups, virtualization,
positioning). Spread `getTriggerProps()` on any element and render `DropdownPopup` for the
standard list. This is the building block for editable table cells.

```tsx
import { DropdownPopup, useDropdown } from '@uleah/react';

function StatusCell({ value, onChange }) {
  const dropdown = useDropdown({
    items: statuses,
    value,
    onChange: ([next]) => onChange(next), // the hook always works with arrays
  });
  return (
    <>
      <button type="button" {...dropdown.getTriggerProps({ 'aria-label': 'Status' })}>
        {dropdown.selectedOptions[0]?.label}
      </button>
      <DropdownPopup dropdown={dropdown} aria-label="Status" size="sm" />
    </>
  );
}
```

The hook also returns state (`open`, `selectedOptions`, `visibleOptions`, `rows`, `query`…),
actions (`setOpen`, `select`, `clear`, `toggleAll`, `step`…) and lower-level getters
(`getSearchInputProps`, `getPopupProps`, `getListboxProps`, `getOptionProps`) to build a fully
custom popup. Its `popupWidth` defaults to `'auto'`, because custom triggers are often narrow.

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

With `searchable`, focus moves to the search box (itself a combobox that controls the list);
letters type into it, and `Home`/`End` move the caret. `Tab` closes the popup and returns focus
to the trigger. Typing on the closed trigger opens it and starts the search.

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

- In searchable mode, "Select all" is mouse-only; keyboard users press `Ctrl/⌘+A` on the trigger
  (the search box keeps `Ctrl/⌘+A` for selecting its text).
- Virtualized rows have a fixed height.
- `position: fixed` is relative to the nearest ancestor with a `transform`, `filter` or
  `contain` if there is one; inside such an ancestor, use `portal` (the default) so the popup is
  attached to the theme scope instead.
