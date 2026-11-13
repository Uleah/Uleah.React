import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../../utils/cx.js';
import { mergeIds } from '../../utils/mergeIds.js';
import type {
  DropdownMultipleProps,
  DropdownOption,
  DropdownProps,
  DropdownSingleProps,
} from './Dropdown.types.js';

/** `useLayoutEffect` on the client, `useEffect` on the server (avoids the SSR warning). */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const VIEWPORT_MARGIN = 8;
const POPUP_GAP = 4;
const MIN_LIST_HEIGHT = 48;
const TYPEAHEAD_TIMEOUT = 500;
const PAGE_STEP = 10;

/** The union of both prop shapes, widened so it can be destructured in one place. */
type AnyDropdownProps = Omit<
  DropdownSingleProps,
  'multiple' | 'value' | 'defaultValue' | 'onChange'
> & {
  multiple?: boolean;
  value?: string | readonly string[] | null;
  defaultValue?: string | readonly string[] | null;
  onChange?: DropdownSingleProps['onChange'] | DropdownMultipleProps['onChange'];
  maxDisplayedValues?: number;
  selectedSummary?: (count: number) => string;
};

const defaultSummary = (count: number) => `${count} selected`;

function toArray(value: string | readonly string[] | null | undefined): string[] {
  if (value === null || value === undefined) return [];
  return typeof value === 'string' ? [value] : [...value];
}

/** Index of the first enabled option from `start` in direction `step`, or -1. */
function findEnabled(options: readonly DropdownOption[], start: number, step: 1 | -1): number {
  for (let i = start; i >= 0 && i < options.length; i += step) {
    if (!options[i]?.disabled) return i;
  }
  return -1;
}

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

function isPrintableKey(event: KeyboardEvent): boolean {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
}

function Icon({ path }: { path: string }) {
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
      <path d={path} />
    </svg>
  );
}

const CHEVRON_DOWN = 'M4 6l4 4 4-4';
const CHEVRON_LEFT = 'M10 4L6 8l4 4';
const CHEVRON_RIGHT = 'M6 4l4 4-4 4';
const CHECK = 'M3.5 8.5l3 3 6-7';

/**
 * A select-only combobox: a trigger that opens a listbox of options.
 *
 * Supports single and multiple selection, controlled and uncontrolled value and open state,
 * optional previous/next buttons, long-option handling, and an adaptive popup that flips
 * above the trigger and is portalled so it is never clipped by `overflow: hidden` parents.
 *
 * Follows the WAI-ARIA "select-only combobox" pattern: focus stays on the trigger and the
 * highlighted option is exposed with `aria-activedescendant`. The ref points to the trigger.
 */
export const Dropdown = forwardRef<HTMLDivElement, AnyDropdownProps>(function Dropdown(
  {
    options,
    multiple: multipleProp,
    value: valueProp,
    defaultValue,
    onChange,
    maxDisplayedValues = 3,
    selectedSummary = defaultSummary,
    label,
    hideLabel = false,
    helperText,
    error,
    placeholder = 'Select…',
    size = 'md',
    disabled = false,
    required = false,
    name,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    navigationButtons = false,
    previousLabel = 'Previous option',
    nextLabel = 'Next option',
    loop = false,
    placement = 'auto',
    popupWidth = 'trigger',
    optionOverflow = 'truncate',
    portal = true,
    emptyMessage = 'No options',
    renderOption,
    renderValue,
    className,
    style,
    triggerClassName,
    popupClassName,
    id: idProp,
    onClick,
    onKeyDown,
    onBlur,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    ...rest
  },
  ref,
) {
  const multiple = multipleProp === true;
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const labelId = `${id}-label`;
  const listboxId = `${id}-listbox`;
  const optionId = (index: number) => `${id}-option-${index}`;

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const typeaheadRef = useRef<{ buffer: string; timer?: ReturnType<typeof setTimeout> }>({
    buffer: '',
  });

  const setTriggerRef = useCallback(
    (node: HTMLDivElement | null) => {
      triggerRef.current = node;
      setRef(ref, node);
    },
    [ref],
  );

  // ---------------------------------------------------------------------------
  // Value (controlled / uncontrolled)
  // ---------------------------------------------------------------------------
  const isValueControlled = valueProp !== undefined;
  const [internalValue, setInternalValue] = useState<string[]>(() => toArray(defaultValue));
  const selectedValues = useMemo(
    () => (isValueControlled ? toArray(valueProp) : internalValue),
    [isValueControlled, valueProp, internalValue],
  );
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const findOption = useCallback(
    (value: string) => options.find((option) => option.value === value),
    [options],
  );
  const selectedOptions = useMemo(
    () =>
      selectedValues
        .map(findOption)
        .filter((option): option is DropdownOption => option !== undefined),
    [selectedValues, findOption],
  );
  const firstSelectedIndex = useMemo(
    () => options.findIndex((option) => selectedSet.has(option.value)),
    [options, selectedSet],
  );

  // ---------------------------------------------------------------------------
  // Open state (controlled / uncontrolled) and the highlighted option
  // ---------------------------------------------------------------------------
  const isOpenControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = (isOpenControlled ? openProp : internalOpen) && !disabled;
  const [activeIndex, setActiveIndex] = useState(-1);

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isOpenControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isOpenControlled, onOpenChange],
  );

  // Sync the highlighted option with open/close during render (no effect, no extra paint):
  // opening keeps an index chosen by the opener or falls back to the selection; closing resets.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setActiveIndex(-1);
    else if (activeIndex < 0)
      setActiveIndex(firstSelectedIndex >= 0 ? firstSelectedIndex : findEnabled(options, 0, 1));
  }

  const openWith = (index: number) => {
    setActiveIndex(index);
    if (!open) setOpen(true);
  };

  // ---------------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------------
  const commit = (next: string[]) => {
    if (!isValueControlled) setInternalValue(next);
    const nextOptions = next
      .map(findOption)
      .filter((option): option is DropdownOption => option !== undefined);
    if (multiple) {
      (onChange as DropdownMultipleProps['onChange'])?.(next, nextOptions);
    } else {
      (onChange as DropdownSingleProps['onChange'])?.(next[0] ?? null, nextOptions[0]);
    }
  };

  const selectIndex = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    if (multiple) {
      commit(
        selectedSet.has(option.value)
          ? selectedValues.filter((value) => value !== option.value)
          : [...selectedValues, option.value],
      );
      return;
    }
    if (selectedValues[0] !== option.value || selectedValues.length !== 1) commit([option.value]);
    setOpen(false);
  };

  // ---------------------------------------------------------------------------
  // Type-ahead: typing jumps to the next option whose label starts with the text.
  // ---------------------------------------------------------------------------
  const typeahead = (char: string, from: number): number => {
    const state = typeaheadRef.current;
    clearTimeout(state.timer);
    state.buffer += char.toLowerCase();
    state.timer = setTimeout(() => {
      state.buffer = '';
    }, TYPEAHEAD_TIMEOUT);

    // Repeating one letter ("b", "b", "b") cycles through the options starting with it.
    const repeated = [...state.buffer].every((c) => c === state.buffer[0]);
    const query = repeated ? state.buffer.charAt(0) : state.buffer;
    const start = repeated ? from + 1 : Math.max(from, 0);
    for (let n = 0; n < options.length; n++) {
      const index = (start + n) % options.length;
      const option = options[index];
      if (option && !option.disabled && option.label.toLowerCase().startsWith(query)) return index;
    }
    return -1;
  };

  useEffect(() => () => clearTimeout(typeaheadRef.current.timer), []);

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------
  const lastIndex = options.length - 1;
  const initialIndex = (fromEnd = false) =>
    firstSelectedIndex >= 0
      ? firstSelectedIndex
      : fromEnd
        ? findEnabled(options, lastIndex, -1)
        : findEnabled(options, 0, 1);

  const moveActive = (step: 1 | -1) => {
    const start = activeIndex < 0 ? (step > 0 ? 0 : lastIndex) : activeIndex + step;
    const next = findEnabled(options, start, step);
    if (next >= 0) setActiveIndex(next);
  };

  const moveActiveTo = (target: number, step: 1 | -1) => {
    const clamped = Math.min(Math.max(target, 0), lastIndex);
    const next = findEnabled(options, clamped, step);
    const fallback = next >= 0 ? next : findEnabled(options, clamped, step === 1 ? -1 : 1);
    if (fallback >= 0) setActiveIndex(fallback);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || disabled) return;
    const { key } = event;
    const typing = typeaheadRef.current.buffer !== '';

    if (!open) {
      switch (key) {
        case 'ArrowDown':
        case 'Enter':
        case ' ':
          event.preventDefault();
          openWith(initialIndex());
          return;
        case 'ArrowUp':
          event.preventDefault();
          openWith(initialIndex(true));
          return;
        case 'Home':
          event.preventDefault();
          openWith(findEnabled(options, 0, 1));
          return;
        case 'End':
          event.preventDefault();
          openWith(findEnabled(options, lastIndex, -1));
          return;
      }
      if (isPrintableKey(event)) {
        event.preventDefault();
        const match = typeahead(key, firstSelectedIndex);
        openWith(match >= 0 ? match : initialIndex());
      }
      return;
    }

    switch (key) {
      case 'ArrowDown':
        event.preventDefault();
        if (event.altKey) return;
        moveActive(1);
        return;
      case 'ArrowUp':
        event.preventDefault();
        if (event.altKey) {
          if (!multiple && activeIndex >= 0) selectIndex(activeIndex);
          else setOpen(false);
          return;
        }
        moveActive(-1);
        return;
      case 'Home':
        event.preventDefault();
        moveActiveTo(0, 1);
        return;
      case 'End':
        event.preventDefault();
        moveActiveTo(lastIndex, -1);
        return;
      case 'PageDown':
        event.preventDefault();
        moveActiveTo(activeIndex + PAGE_STEP, 1);
        return;
      case 'PageUp':
        event.preventDefault();
        moveActiveTo(activeIndex - PAGE_STEP, -1);
        return;
      case 'Enter':
        event.preventDefault();
        if (activeIndex >= 0) selectIndex(activeIndex);
        else setOpen(false);
        return;
      case ' ':
        if (typing) break; // a space inside a type-ahead query ("new y…")
        event.preventDefault();
        if (activeIndex >= 0) selectIndex(activeIndex);
        return;
      case 'Escape':
        event.preventDefault();
        // Don't let a surrounding dialog close as well.
        event.stopPropagation();
        setOpen(false);
        return;
      case 'Tab':
        // Single selection commits the highlighted option, like a native <select>.
        if (!multiple && activeIndex >= 0) selectIndex(activeIndex);
        else setOpen(false);
        return;
    }

    if (isPrintableKey(event)) {
      event.preventDefault();
      const match = typeahead(key, activeIndex);
      if (match >= 0) setActiveIndex(match);
    }
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || disabled) return;
    if (open) setOpen(false);
    else openWith(initialIndex());
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    onBlur?.(event);
    const next = event.relatedTarget as Node | null;
    if (open && !(next && popupRef.current?.contains(next))) setOpen(false);
  };

  // Close when pressing anywhere outside the control and the popup.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || popupRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, setOpen]);

  // Keep the highlighted option visible while navigating long lists.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const element = listboxRef.current?.children[activeIndex] as HTMLElement | undefined;
    element?.scrollIntoView?.({ block: 'nearest' });
  }, [open, activeIndex]);

  // ---------------------------------------------------------------------------
  // Popup: portal container and adaptive positioning
  // ---------------------------------------------------------------------------
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (!open || !portal) return;
    // Attach to the nearest theme scope so tokens and custom themes still apply.
    setContainer(rootRef.current?.closest<HTMLElement>('.ul-theme') ?? document.body);
  }, [open, portal]);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const popup = popupRef.current;
    if (!trigger || !popup) return;

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (popupWidth === 'trigger') {
      popup.style.width = `${rect.width}px`;
      popup.style.minWidth = '';
    } else {
      popup.style.width = '';
      popup.style.minWidth = `${rect.width}px`;
    }

    // Measure the natural height, then decide the side and cap the list height.
    popup.style.removeProperty('--_ul-dropdown-available');
    const natural = popup.offsetHeight;
    const spaceBelow = viewportHeight - rect.bottom - POPUP_GAP - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - POPUP_GAP - VIEWPORT_MARGIN;
    const side =
      placement === 'top' || placement === 'bottom'
        ? placement
        : natural <= spaceBelow || spaceBelow >= spaceAbove
          ? 'bottom'
          : 'top';
    const available = Math.max(side === 'bottom' ? spaceBelow : spaceAbove, 0);
    if (natural > available) {
      const chrome = popup.offsetHeight - (listboxRef.current?.offsetHeight ?? 0);
      popup.style.setProperty(
        '--_ul-dropdown-available',
        `${Math.max(available - chrome, MIN_LIST_HEIGHT)}px`,
      );
    }

    const height = popup.offsetHeight;
    const width = popup.offsetWidth;
    const maxLeft = Math.max(viewportWidth - VIEWPORT_MARGIN - width, VIEWPORT_MARGIN);
    const left = Math.min(Math.max(rect.left, VIEWPORT_MARGIN), maxLeft);
    const top = side === 'bottom' ? rect.bottom + POPUP_GAP : rect.top - POPUP_GAP - height;

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
    popup.dataset.placement = side;
  }, [placement, popupWidth]);

  useIsomorphicLayoutEffect(() => {
    if (!open) return;
    updatePosition();

    let frame = 0;
    const schedule = (event?: Event) => {
      // Scrolling inside the list itself doesn't move the popup.
      if (event?.target === listboxRef.current) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updatePosition);
    };
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => schedule());
    if (triggerRef.current) observer?.observe(triggerRef.current);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      observer?.disconnect();
    };
  }, [open, container, updatePosition, options, selectedValues]);

  // ---------------------------------------------------------------------------
  // Navigation buttons (single selection)
  // ---------------------------------------------------------------------------
  const showNavigation = navigationButtons && !multiple;
  const resolveStep = (step: 1 | -1): number => {
    const current = firstSelectedIndex;
    const start = current < 0 ? (step > 0 ? 0 : lastIndex) : current + step;
    if (current < 0 && step < 0 && !loop) return -1;
    const next = findEnabled(options, start, step);
    if (next >= 0) return next;
    if (!loop) return -1;
    const wrapped = findEnabled(options, step > 0 ? 0 : lastIndex, step);
    return wrapped === current ? -1 : wrapped;
  };
  const previousIndex = showNavigation ? resolveStep(-1) : -1;
  const nextIndex = showNavigation ? resolveStep(1) : -1;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
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

  const popup = open ? (
    // Mouse-only handler on a container: it only keeps focus on the combobox.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={popupRef}
      className={cx(
        'ul-dropdown__popup',
        `ul-dropdown__popup--${size}`,
        optionOverflow === 'wrap' && 'ul-dropdown__popup--wrap',
        popupClassName,
      )}
      // Keep focus on the trigger when clicking options or the scrollbar.
      onMouseDown={(event) => event.preventDefault()}
    >
      {options.length === 0 ? <div className="ul-dropdown__empty">{emptyMessage}</div> : null}
      {options.length > 0 ? (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          aria-labelledby={labelledBy}
          aria-multiselectable={multiple || undefined}
          className="ul-dropdown__listbox"
        >
          {options.map((option, index) => {
            const selected = selectedSet.has(option.value);
            const active = index === activeIndex;
            const optionDisabled = Boolean(option.disabled);
            return (
              // Keyboard interaction lives on the combobox (aria-activedescendant);
              // options are only clicked with a pointer.
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events
              <li
                key={option.value}
                id={optionId(index)}
                role="option"
                aria-selected={selected}
                aria-disabled={optionDisabled || undefined}
                className={cx(
                  'ul-dropdown__option',
                  selected && 'ul-dropdown__option--selected',
                  active && 'ul-dropdown__option--active',
                  optionDisabled && 'ul-dropdown__option--disabled',
                )}
                onMouseMove={() => {
                  if (!optionDisabled && activeIndex !== index) setActiveIndex(index);
                }}
                onClick={() => selectIndex(index)}
              >
                <span
                  className={cx(
                    'ul-dropdown__indicator',
                    multiple && 'ul-dropdown__indicator--checkbox',
                  )}
                  aria-hidden="true"
                >
                  {selected ? <Icon path={CHECK} /> : null}
                </span>
                {renderOption ? (
                  renderOption(option, { selected, active, disabled: optionDisabled })
                ) : (
                  <>
                    {option.icon ? (
                      <span className="ul-dropdown__option-icon" aria-hidden="true">
                        {option.icon}
                      </span>
                    ) : null}
                    <span className="ul-dropdown__option-text">
                      <span
                        className="ul-dropdown__option-label"
                        title={optionOverflow === 'truncate' ? option.label : undefined}
                      >
                        {option.label}
                      </span>
                      {option.description ? (
                        <span className="ul-dropdown__option-description">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  ) : null;

  const navButton = (step: 1 | -1) => {
    const target = step > 0 ? nextIndex : previousIndex;
    return (
      <button
        type="button"
        className={cx(
          'ul-dropdown__nav',
          step > 0 ? 'ul-dropdown__nav--next' : 'ul-dropdown__nav--previous',
        )}
        aria-label={step > 0 ? nextLabel : previousLabel}
        aria-controls={id}
        disabled={disabled || target < 0}
        onClick={() => selectIndex(target)}
      >
        <Icon path={step > 0 ? CHEVRON_RIGHT : CHEVRON_LEFT} />
      </button>
    );
  };

  return (
    <>
      <div
        ref={rootRef}
        className={cx(
          'ul-field',
          `ul-field--${size}`,
          'ul-dropdown',
          invalid && 'ul-field--invalid',
          disabled && 'ul-field--disabled',
          open && 'ul-dropdown--open',
          showNavigation && 'ul-dropdown--with-navigation',
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
            onClick={() => triggerRef.current?.focus()}
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
          <div
            {...rest}
            ref={setTriggerRef}
            id={id}
            role="combobox"
            tabIndex={disabled ? -1 : 0}
            aria-label={ariaLabel}
            aria-labelledby={labelledBy}
            aria-describedby={mergeIds(ariaDescribedBy, messageId)}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open && options.length > 0 ? listboxId : undefined}
            aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
            aria-invalid={invalid || undefined}
            aria-required={required || undefined}
            aria-disabled={disabled || undefined}
            className={cx(
              'ul-dropdown__trigger',
              !hasValue && 'ul-dropdown__trigger--placeholder',
              triggerClassName,
            )}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
          >
            <span
              className="ul-dropdown__value"
              title={hasValue && !renderValue ? labels : undefined}
            >
              {display}
            </span>
            <span className="ul-dropdown__caret" aria-hidden="true">
              <Icon path={CHEVRON_DOWN} />
            </span>
          </div>
          {showNavigation ? navButton(1) : null}
        </div>
        {name
          ? selectedValues.map((value) => (
              <input key={value} type="hidden" name={name} value={value} />
            ))
          : null}
        {message ? (
          <p
            id={messageId}
            className={cx(
              'ul-field__message',
              errorMessage ? 'ul-field__message--error' : undefined,
            )}
          >
            {message}
          </p>
        ) : null}
        {portal ? null : popup}
      </div>
      {portal && container && popup ? createPortal(popup, container) : null}
    </>
  );
}) as unknown as DropdownComponent;

/** Public signature: `multiple` discriminates the `value` / `onChange` types. */
type DropdownComponent = ((
  props: DropdownProps & RefAttributes<HTMLDivElement>,
) => ReactElement | null) & {
  displayName?: string;
};
