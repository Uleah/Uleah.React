import { forwardRef, type ReactElement, type ReactNode, type Ref, type RefAttributes } from 'react';
import { cx } from '../../utils/cx.js';
import { mergeIds } from '../../utils/mergeIds.js';
import type {
  DropdownMultipleProps,
  DropdownProps,
  DropdownSingleProps,
  DropdownSize,
} from './Dropdown.types.js';
import { DropdownPopup } from './DropdownPopup.js';
import {
  DropdownIcon,
  ICON_CHEVRON_DOWN,
  ICON_CHEVRON_LEFT,
  ICON_CHEVRON_RIGHT,
  ICON_CLOSE,
} from './icons.js';
import { useDropdown } from './useDropdown.js';

/** The union of both prop shapes, widened so it can be destructured in one place. */
type AnyDropdownProps = Omit<
  DropdownSingleProps,
  'multiple' | 'value' | 'defaultValue' | 'onChange'
> &
  Partial<
    Pick<
      DropdownMultipleProps,
      'maxDisplayedValues' | 'selectedSummary' | 'selectAll' | 'selectAllLabel' | 'deselectAllLabel'
    >
  > & {
    multiple?: boolean;
    value?: string | readonly string[] | null;
    defaultValue?: string | readonly string[] | null;
    onChange?: DropdownSingleProps['onChange'] | DropdownMultipleProps['onChange'];
  };

const ROW_HEIGHT: Record<DropdownSize, number> = { sm: 32, md: 36, lg: 44 };
const defaultSummary = (count: number) => `${count} selected`;

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

/**
 * A select-only combobox: a trigger that opens a list of options.
 *
 * Single and multiple selection, search (local or server-side), groups and separators,
 * virtualization for long lists, clear and select-all, previous/next buttons, and an adaptive
 * popup that flips above the trigger and is portalled so `overflow: hidden` never clips it.
 *
 * Built on `useDropdown`. Follows the WAI-ARIA combobox pattern: the highlighted option is
 * exposed with `aria-activedescendant`. The ref points to the trigger.
 */
export const Dropdown = forwardRef<HTMLDivElement, AnyDropdownProps>(function Dropdown(
  {
    options,
    multiple: multipleProp,
    value,
    defaultValue,
    onChange,
    maxDisplayedValues = 3,
    selectedSummary = defaultSummary,
    selectAll = false,
    selectAllLabel,
    deselectAllLabel,
    label,
    hideLabel = false,
    helperText,
    error,
    placeholder = 'Select…',
    size = 'md',
    disabled = false,
    required = false,
    name,
    open,
    defaultOpen,
    onOpenChange,
    closeOnSelect,
    searchable = false,
    searchValue,
    defaultSearchValue,
    onSearchChange,
    filter,
    searchPlaceholder,
    searchLabel,
    loading = false,
    loadingMessage,
    onLoadMore,
    noResultsMessage,
    virtualized = false,
    itemHeight,
    clearable = false,
    clearLabel = 'Clear selection',
    navigationButtons = false,
    previousLabel = 'Previous option',
    nextLabel = 'Next option',
    loop = false,
    placement,
    popupWidth,
    optionOverflow = 'truncate',
    portal = true,
    emptyMessage,
    renderOption,
    renderValue,
    className,
    style,
    triggerClassName,
    popupClassName,
    id: idProp,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    ...rest
  },
  ref,
) {
  const multiple = multipleProp === true;
  const dropdown = useDropdown({
    items: options,
    multiple,
    value,
    defaultValue,
    onChange: (values, selected) => {
      if (multiple) (onChange as DropdownMultipleProps['onChange'])?.(values, selected);
      else (onChange as DropdownSingleProps['onChange'])?.(values[0] ?? null, selected[0]);
    },
    open,
    defaultOpen,
    onOpenChange,
    closeOnSelect,
    disabled,
    clearable,
    loop,
    searchable,
    searchValue,
    defaultSearchValue,
    onSearchChange,
    filter,
    loading,
    onLoadMore,
    virtualized,
    itemHeight: itemHeight ?? ROW_HEIGHT[size],
    placement,
    popupWidth: popupWidth ?? 'trigger',
    portal,
    id: idProp,
  });

  const { id, selectedOptions, selectedValues } = dropdown;
  const labelId = `${id}-label`;
  const invalid = Boolean(error);
  const errorMessage = invalid && error !== true ? error : null;
  const message = errorMessage ?? helperText;
  const messageId = message ? `${id}-message` : undefined;
  const labelledBy = mergeIds(ariaLabelledBy, label ? labelId : undefined);

  const hasValue = selectedOptions.length > 0;
  const labels = selectedOptions.map((option) => option.label).join(', ');
  let display: ReactNode;
  if (!hasValue) display = placeholder;
  else if (renderValue) display = renderValue(selectedOptions);
  else if (multiple && selectedOptions.length > maxDisplayedValues)
    display = selectedSummary(selectedOptions.length);
  else display = labels;

  const showNavigation = navigationButtons && !multiple;
  const showClear = clearable && hasValue && !disabled;

  const triggerProps = dropdown.getTriggerProps(rest);
  const setTriggerRef = (node: HTMLElement | null) => {
    triggerProps.ref(node);
    setRef(ref, node as HTMLDivElement | null);
  };

  const navButton = (direction: 1 | -1) => {
    const target = direction > 0 ? dropdown.nextOption : dropdown.previousOption;
    return (
      <button
        type="button"
        className={cx(
          'ul-dropdown__nav',
          direction > 0 ? 'ul-dropdown__nav--next' : 'ul-dropdown__nav--previous',
        )}
        aria-label={direction > 0 ? nextLabel : previousLabel}
        aria-controls={id}
        disabled={disabled || !target}
        onClick={() => dropdown.step(direction)}
      >
        <DropdownIcon path={direction > 0 ? ICON_CHEVRON_RIGHT : ICON_CHEVRON_LEFT} />
      </button>
    );
  };

  const popup = (
    <DropdownPopup
      dropdown={dropdown}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      size={size}
      optionOverflow={optionOverflow}
      className={popupClassName}
      renderOption={renderOption}
      emptyMessage={emptyMessage}
      noResultsMessage={noResultsMessage}
      loadingMessage={loadingMessage}
      searchPlaceholder={searchPlaceholder}
      searchLabel={searchLabel}
      selectAll={selectAll}
      selectAllLabel={selectAllLabel}
      deselectAllLabel={deselectAllLabel}
    />
  );

  return (
    <div
      className={cx(
        'ul-field',
        `ul-field--${size}`,
        'ul-dropdown',
        invalid && 'ul-field--invalid',
        disabled && 'ul-field--disabled',
        dropdown.open && 'ul-dropdown--open',
        showNavigation && 'ul-dropdown--with-navigation',
        showClear && 'ul-dropdown--clearable',
        className,
      )}
      style={style}
    >
      {label ? (
        // The combobox is a <div>, which a <label> can't focus natively: do it on click.
        // Keyboard users reach the combobox directly, so no key handler is needed.
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
        <label
          id={labelId}
          htmlFor={id}
          className={cx('ul-field__label', hideLabel && 'ul-visually-hidden')}
          onClick={() => dropdown.triggerRef.current?.focus()}
        >
          {label}
          {required ? (
            <span className="ul-field__required" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      <div className="ul-dropdown__control">
        {showNavigation ? navButton(-1) : null}
        <div className="ul-dropdown__trigger-wrap">
          <div
            {...triggerProps}
            ref={setTriggerRef}
            aria-label={ariaLabel}
            aria-labelledby={labelledBy}
            aria-describedby={mergeIds(ariaDescribedBy, messageId)}
            aria-invalid={invalid || undefined}
            aria-required={required || undefined}
            className={cx(
              'ul-dropdown__trigger',
              !hasValue && 'ul-dropdown__trigger--placeholder',
              triggerClassName,
            )}
          >
            <span
              className="ul-dropdown__value"
              title={hasValue && !renderValue ? labels : undefined}
            >
              {display}
            </span>
            <span className="ul-dropdown__caret" aria-hidden="true">
              <DropdownIcon path={ICON_CHEVRON_DOWN} />
            </span>
          </div>
          {showClear ? (
            <button
              type="button"
              className="ul-dropdown__clear"
              aria-label={clearLabel}
              onClick={() => {
                dropdown.clear();
                dropdown.triggerRef.current?.focus();
              }}
            >
              <DropdownIcon path={ICON_CLOSE} />
            </button>
          ) : null}
        </div>
        {showNavigation ? navButton(1) : null}
      </div>
      {name
        ? selectedValues.map((selected) => (
            <input key={selected} type="hidden" name={name} value={selected} />
          ))
        : null}
      {message ? (
        <p
          id={messageId}
          className={cx('ul-field__message', errorMessage ? 'ul-field__message--error' : undefined)}
        >
          {message}
        </p>
      ) : null}
      {popup}
    </div>
  );
}) as unknown as DropdownComponent;

/** Public signature: `multiple` discriminates the `value` / `onChange` types. */
type DropdownComponent = ((
  props: DropdownProps & RefAttributes<HTMLDivElement>,
) => ReactElement | null) & {
  displayName?: string;
};
