import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../../utils/cx.js';
import type {
  DropdownOption,
  DropdownOptionOverflow,
  DropdownOptionState,
  DropdownRow,
  DropdownSize,
} from './Dropdown.types.js';
import { DropdownIcon, ICON_CHECK } from './icons.js';
import type { UseDropdownReturn } from './useDropdown.js';

export interface DropdownPopupProps {
  /** The value returned by `useDropdown`. */
  dropdown: UseDropdownReturn;
  /** Accessible name of the list. Pass this or `aria-labelledby`. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** @default 'md' */
  size?: DropdownSize;
  /** @default 'truncate' (always truncated when virtualized) */
  optionOverflow?: DropdownOptionOverflow;
  className?: string;
  renderOption?: (option: DropdownOption, state: DropdownOptionState) => ReactNode;
  /** @default 'No options' */
  emptyMessage?: ReactNode;
  /** @default 'No results' */
  noResultsMessage?: ReactNode;
  /** @default 'Loading…' */
  loadingMessage?: ReactNode;
  /** @default 'Search…' */
  searchPlaceholder?: string;
  /** @default 'Search options' */
  searchLabel?: string;
  /** Show "Select all" / "Deselect all" (multiple selection only). */
  selectAll?: boolean;
  /** @default 'Select all' */
  selectAllLabel?: string;
  /** @default 'Deselect all' */
  deselectAllLabel?: string;
}

type OptionRow = Extract<DropdownRow, { type: 'option' }>;

/**
 * The popup of a dropdown: optional search box, select-all toolbar and the list of options,
 * groups and separators. Rendered by `<Dropdown>`; use it with `useDropdown` to pair the
 * standard list with a custom trigger.
 */
export function DropdownPopup({
  dropdown,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  size = 'md',
  optionOverflow = 'truncate',
  className,
  renderOption,
  emptyMessage = 'No options',
  noResultsMessage = 'No results',
  loadingMessage = 'Loading…',
  searchPlaceholder = 'Search…',
  searchLabel = 'Search options',
  selectAll = false,
  selectAllLabel = 'Select all',
  deselectAllLabel = 'Deselect all',
}: DropdownPopupProps) {
  if (!dropdown.popupMounted) return null;

  const { rows, visibleRows, virtual, multiple, searchable, loading, query } = dropdown;
  const wrap = optionOverflow === 'wrap' && !virtual.enabled;
  const hasOptions = dropdown.allOptions.length > 0;
  const showToolbar = selectAll && multiple && dropdown.visibleOptions.length > 0;

  let status: ReactNode = null;
  if (loading) status = loadingMessage;
  else if (!hasOptions && query === '') status = emptyMessage;
  else if (rows.length === 0) status = noResultsMessage;

  const renderOptionRow = (row: OptionRow) => {
    const state = dropdown.getOptionState(row);
    const { option } = row;
    return (
      // Keyboard interaction lives on the combobox (aria-activedescendant);
      // options are only clicked with a pointer.
      <div
        key={row.key}
        {...dropdown.getOptionProps(row)}
        className={cx(
          'ul-dropdown__option',
          state.selected && 'ul-dropdown__option--selected',
          state.active && 'ul-dropdown__option--active',
          state.disabled && 'ul-dropdown__option--disabled',
        )}
      >
        <span
          className={cx('ul-dropdown__indicator', multiple && 'ul-dropdown__indicator--checkbox')}
          aria-hidden="true"
        >
          {state.selected ? <DropdownIcon path={ICON_CHECK} /> : null}
        </span>
        {renderOption ? (
          renderOption(option, state)
        ) : (
          <>
            {option.icon ? (
              <span className="ul-dropdown__option-icon" aria-hidden="true">
                {option.icon}
              </span>
            ) : null}
            <span className="ul-dropdown__option-text">
              <span className="ul-dropdown__option-label" title={wrap ? undefined : option.label}>
                {option.label}
              </span>
              {option.description ? (
                <span className="ul-dropdown__option-description">{option.description}</span>
              ) : null}
            </span>
          </>
        )}
      </div>
    );
  };

  // Consecutive rows of the same group are wrapped in role="group" (named with aria-label, so
  // it still works when a virtualized window cuts the group header off).
  type Segment = { key: string; label?: string; rows: DropdownRow[] };
  const segments: Segment[] = [];
  for (const row of visibleRows) {
    const current = segments[segments.length - 1];
    if (row.groupKey && current?.label !== undefined && current.key === row.groupKey) {
      current.rows.push(row);
    } else {
      segments.push({ key: row.groupKey ?? row.key, label: row.groupLabel, rows: [row] });
    }
  }

  const renderRow = (row: DropdownRow): ReactNode => {
    if (row.type === 'option') return renderOptionRow(row);
    if (row.type === 'group')
      return (
        <div key={row.key} className="ul-dropdown__group-label" aria-hidden="true">
          {row.groupLabel}
        </div>
      );
    return <div key={row.key} role="presentation" className="ul-dropdown__separator" />;
  };

  const content = segments.map((segment) =>
    segment.label === undefined ? (
      segment.rows.map(renderRow)
    ) : (
      <div key={segment.key} role="group" aria-label={segment.label} className="ul-dropdown__group">
        {segment.rows.map(renderRow)}
      </div>
    ),
  );

  const popup = (
    <div
      {...dropdown.getPopupProps()}
      className={cx(
        'ul-dropdown__popup',
        `ul-dropdown__popup--${size}`,
        wrap && 'ul-dropdown__popup--wrap',
        className,
      )}
    >
      {searchable ? (
        <div className="ul-dropdown__search">
          <input
            {...dropdown.getSearchInputProps({ placeholder: searchPlaceholder })}
            aria-label={searchLabel}
            className="ul-dropdown__search-input"
          />
        </div>
      ) : null}
      {showToolbar ? (
        <div className="ul-dropdown__toolbar">
          {/* Mouse shortcut; keyboard users press Ctrl/⌘+A on the trigger. */}
          <button
            type="button"
            tabIndex={-1}
            className="ul-dropdown__toolbar-button"
            onClick={dropdown.toggleAll}
          >
            {dropdown.allSelected ? deselectAllLabel : selectAllLabel}
          </button>
          <span className="ul-dropdown__toolbar-count">
            {dropdown.selectedValues.length}/{dropdown.allOptions.length}
          </span>
        </div>
      ) : null}
      {rows.length > 0 ? (
        <div
          {...dropdown.getListboxProps()}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className={cx('ul-dropdown__listbox', virtual.enabled && 'ul-dropdown__listbox--virtual')}
        >
          {virtual.enabled && virtual.paddingTop > 0 ? (
            <div role="presentation" style={{ height: virtual.paddingTop }} />
          ) : null}
          {content}
          {virtual.enabled && virtual.paddingBottom > 0 ? (
            <div role="presentation" style={{ height: virtual.paddingBottom }} />
          ) : null}
        </div>
      ) : null}
      {status !== null ? (
        <div className="ul-dropdown__status" role="status">
          {status}
        </div>
      ) : null}
    </div>
  );

  return dropdown.portalContainer ? createPortal(popup, dropdown.portalContainer) : popup;
}
