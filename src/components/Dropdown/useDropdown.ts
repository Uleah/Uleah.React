import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type RefCallback,
  type RefObject,
  type UIEvent,
} from 'react';
import type {
  DropdownFilter,
  DropdownGroup,
  DropdownItem,
  DropdownOption,
  DropdownPlacement,
  DropdownPopupWidth,
  DropdownRow,
  DropdownSeparator,
} from './Dropdown.types.js';
import { useFloating, useIsomorphicLayoutEffect } from '../../utils/floating.js';

const TYPEAHEAD_TIMEOUT = 500;
const PAGE_STEP = 10;
/** Height rendered by a virtualized list: comfortably more than any reasonable max-height. */
const VIRTUAL_WINDOW = 800;
/** Used to keep the active row visible when the list height can't be measured. */
const FALLBACK_VIEW_HEIGHT = 288;
const LOAD_MORE_THRESHOLD = 3;

export interface UseDropdownProps {
  /** Options, groups (`{ label, options }`) and separators (`{ type: 'separator' }`). */
  items: readonly DropdownItem[];
  multiple?: boolean;
  /** Controlled selection. A string (or `null`) for single selection, an array for multiple. */
  value?: string | readonly string[] | null;
  /** Initial selection (uncontrolled). */
  defaultValue?: string | readonly string[] | null;
  /** Always called with arrays, in both modes. */
  onChange?: (values: string[], options: DropdownOption[]) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** @default true for single, false for multiple */
  closeOnSelect?: boolean;
  disabled?: boolean;
  /** Enables Backspace / Delete on the trigger to clear the selection. */
  clearable?: boolean;
  /** Navigation steps (`step()`) wrap around. */
  loop?: boolean;

  searchable?: boolean;
  searchValue?: string;
  defaultSearchValue?: string;
  onSearchChange?: (query: string) => void;
  /** @default true (labels, ignoring case and accents) */
  filter?: boolean | DropdownFilter;
  loading?: boolean;
  onLoadMore?: () => void;

  virtualized?: boolean;
  /** Row height in pixels for virtualization. @default 36 */
  itemHeight?: number;
  /** Extra rows rendered above and below the visible window. @default 5 */
  overscan?: number;

  placement?: DropdownPlacement;
  /** @default 'auto' (custom triggers are often narrow); `<Dropdown>` uses 'trigger'. */
  popupWidth?: DropdownPopupWidth;
  /** Render the popup in the nearest `.ul-theme` (or `document.body`). @default true */
  portal?: boolean;
  /** Id of the trigger. Other ids are derived from it. */
  id?: string;
}

/** Remove accents and case so "Peru" matches "perú". */
export function normalizeSearchText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** The default search filter: the label contains the query, ignoring case and accents. */
export const defaultDropdownFilter: DropdownFilter = (option, query) =>
  normalizeSearchText(option.label).includes(normalizeSearchText(query));

function isSeparator(item: DropdownItem): item is DropdownSeparator {
  return 'type' in item && item.type === 'separator';
}

function isGroup(item: DropdownItem): item is DropdownGroup {
  return 'options' in item;
}

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

function isPrintableKey(event: KeyboardEvent): boolean {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

type Source = 'trigger' | 'search';

/**
 * Headless dropdown logic: selection, open state, keyboard, type-ahead, search, groups,
 * virtualization and popup positioning. `<Dropdown>` is built on it; use it directly to build
 * custom triggers (e.g. an editable table cell) and pair it with `<DropdownPopup>` for the list.
 *
 * @example
 * const dropdown = useDropdown({ items: statuses, value, onChange: ([v]) => setValue(v) });
 * return (
 *   <>
 *     <button {...dropdown.getTriggerProps({ 'aria-label': 'Status' })}>{label}</button>
 *     <DropdownPopup dropdown={dropdown} aria-label="Status" />
 *   </>
 * );
 */
export function useDropdown({
  items,
  multiple = false,
  value: valueProp,
  defaultValue,
  onChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  closeOnSelect = !multiple,
  disabled = false,
  clearable = false,
  loop = false,
  searchable = false,
  searchValue,
  defaultSearchValue = '',
  onSearchChange,
  filter = true,
  loading = false,
  onLoadMore,
  virtualized = false,
  itemHeight = 36,
  overscan = 5,
  placement = 'auto',
  popupWidth = 'auto',
  portal = true,
  id: idProp,
}: UseDropdownProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const listboxId = `${id}-listbox`;
  const optionId = useCallback((index: number) => `${id}-option-${index}`, [id]);

  const triggerRef = useRef<HTMLElement | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typeaheadRef = useRef<{ buffer: string; timer?: ReturnType<typeof setTimeout> }>({
    buffer: '',
  });

  const setTriggerRef: RefCallback<HTMLElement> = useCallback((node: HTMLElement | null) => {
    triggerRef.current = node;
  }, []);

  // ---------------------------------------------------------------------------
  // Items: every option (for lookups and stepping) and the rows left after searching
  // ---------------------------------------------------------------------------
  const allOptions = useMemo(
    () =>
      items.flatMap((item) =>
        isSeparator(item) ? [] : isGroup(item) ? [...item.options] : [item],
      ),
    [items],
  );
  const byValue = useMemo(
    () => new Map(allOptions.map((option) => [option.value, option])),
    [allOptions],
  );

  const isSearchControlled = searchValue !== undefined;
  const [internalQuery, setInternalQuery] = useState(defaultSearchValue);
  const query = isSearchControlled ? searchValue : internalQuery;

  const { rows, visibleOptions } = useMemo(() => {
    const trimmed = query.trim();
    const filtering = searchable && trimmed !== '' && filter !== false;
    const test = typeof filter === 'function' ? filter : defaultDropdownFilter;
    const matches = (option: DropdownOption) => !filtering || test(option, trimmed);

    const result: DropdownRow[] = [];
    const visible: DropdownOption[] = [];
    const pushOption = (option: DropdownOption, groupKey?: string, groupLabel?: string) => {
      result.push({
        type: 'option',
        key: `o:${option.value}`,
        option,
        index: visible.length,
        groupKey,
        groupLabel,
      });
      visible.push(option);
    };

    items.forEach((item, i) => {
      if (isSeparator(item)) {
        // No leading or doubled separators.
        if (result.length > 0 && result[result.length - 1]?.type !== 'separator')
          result.push({ type: 'separator', key: `s:${i}` });
        return;
      }
      if (isGroup(item)) {
        const options = item.options.filter(matches);
        if (options.length === 0) return;
        const groupKey = `g:${i}`;
        result.push({ type: 'group', key: groupKey, groupKey, groupLabel: item.label });
        for (const option of options) pushOption(option, groupKey, item.label);
        return;
      }
      if (matches(item)) pushOption(item);
    });
    while (result[result.length - 1]?.type === 'separator') result.pop();

    return { rows: result, visibleOptions: visible };
  }, [items, query, searchable, filter]);

  // ---------------------------------------------------------------------------
  // Selection (controlled / uncontrolled)
  // ---------------------------------------------------------------------------
  const isValueControlled = valueProp !== undefined;
  const [internalValue, setInternalValue] = useState<string[]>(() => toArray(defaultValue));
  const selectedValues = useMemo(
    () => (isValueControlled ? toArray(valueProp) : internalValue),
    [isValueControlled, valueProp, internalValue],
  );
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

  // Options chosen earlier may disappear from `items` (server-side search). Remember them so
  // the trigger can still show their labels.
  const [known, setKnown] = useState<ReadonlyMap<string, DropdownOption>>(() => new Map());
  const lookup = useCallback(
    (value: string) => byValue.get(value) ?? known.get(value),
    [byValue, known],
  );
  const selectedOptions = useMemo(
    () => selectedValues.map(lookup).filter(isDefined),
    [selectedValues, lookup],
  );

  const commit = (next: string[]) => {
    const nextOptions = next.map(lookup).filter(isDefined);
    setKnown((previous) => {
      const merged = new Map(previous);
      for (const option of nextOptions) merged.set(option.value, option);
      return merged;
    });
    if (!isValueControlled) setInternalValue(next);
    onChange?.(next, nextOptions);
  };

  // ---------------------------------------------------------------------------
  // Open state, highlighted option and virtual scroll position
  // ---------------------------------------------------------------------------
  const isOpenControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = (isOpenControlled ? openProp : internalOpen) && !disabled;
  const [activeIndex, setActiveIndex] = useState(-1);
  const [scrollTop, setScrollTop] = useState(0);

  const firstSelectedIndex = visibleOptions.findIndex((option) => selectedSet.has(option.value));
  const firstEnabledIndex = findEnabled(visibleOptions, 0, 1);
  const lastIndex = visibleOptions.length - 1;

  const rowIndexOf = (index: number) =>
    rows.findIndex((row) => row.type === 'option' && row.index === index);

  // Sync state with open/close and with the filtered list during render (no effect, no
  // extra paint). See https://react.dev/learn/you-might-not-need-an-effect
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) {
      setActiveIndex(-1);
      setScrollTop(0);
    } else {
      const initial =
        activeIndex >= 0
          ? activeIndex
          : firstSelectedIndex >= 0
            ? firstSelectedIndex
            : firstEnabledIndex;
      setActiveIndex(initial);
      if (virtualized) setScrollTop(Math.max(0, (rowIndexOf(initial) - 2) * itemHeight));
    }
  }
  const [previousQuery, setPreviousQuery] = useState(query);
  if (query !== previousQuery) {
    setPreviousQuery(query);
    setActiveIndex(open ? firstEnabledIndex : -1);
    setScrollTop(0);
  } else if (activeIndex > lastIndex || (open && activeIndex < 0 && firstEnabledIndex >= 0)) {
    // The options changed (e.g. server results arrived after typing): keep a valid highlight
    // so Enter selects the first result.
    setActiveIndex(open ? firstEnabledIndex : -1);
  }

  const setOpenState = (next: boolean, { restoreFocus = true } = {}) => {
    if (next === open) return;
    if (!isOpenControlled) setInternalOpen(next);
    onOpenChange?.(next);
    if (next) return;
    if (query !== '') setQuery('');
    // If focus is inside the popup (search box), give it back to the trigger.
    if (restoreFocus && popupRef.current?.contains(document.activeElement)) {
      triggerRef.current?.focus();
    }
  };

  function setQuery(next: string) {
    if (!isSearchControlled) setInternalQuery(next);
    onSearchChange?.(next);
  }

  /** Highlight an option and, in a virtualized list, scroll it into the rendered window. */
  const activate = (index: number) => {
    setActiveIndex(index);
    if (!virtualized || index < 0) return;
    const rowIndex = rowIndexOf(index);
    if (rowIndex < 0) return;
    const listbox = listboxRef.current;
    const view = listbox?.clientHeight || FALLBACK_VIEW_HEIGHT;
    const top = rowIndex * itemHeight;
    const bottom = top + itemHeight;
    let next = scrollTop;
    if (top < next) next = top;
    else if (bottom > next + view) next = bottom - view;
    else return;
    if (listbox) listbox.scrollTop = next;
    setScrollTop(next);
  };

  const openWith = (index: number) => {
    setActiveIndex(index);
    if (virtualized) setScrollTop(Math.max(0, (rowIndexOf(index) - 2) * itemHeight));
    setOpenState(true);
  };

  const selectIndex = (index: number) => {
    const option = visibleOptions[index];
    if (!option || option.disabled) return;
    if (multiple) {
      commit(
        selectedSet.has(option.value)
          ? selectedValues.filter((value) => value !== option.value)
          : [...selectedValues, option.value],
      );
    } else if (selectedValues[0] !== option.value || selectedValues.length !== 1) {
      commit([option.value]);
    }
    if (closeOnSelect) setOpenState(false);
  };

  /** Select a value directly (single: replace, multiple: toggle). */
  const select = (value: string) => {
    const option = lookup(value);
    if (!option || option.disabled) return;
    if (multiple) {
      commit(
        selectedSet.has(value)
          ? selectedValues.filter((v) => v !== value)
          : [...selectedValues, value],
      );
    } else if (selectedValues[0] !== value) {
      commit([value]);
    }
  };

  const clear = () => {
    if (selectedValues.length > 0) commit([]);
  };

  // Select all applies to the enabled options matching the current search.
  const selectableVisible = visibleOptions.filter((option) => !option.disabled);
  const allSelected =
    selectableVisible.length > 0 && selectableVisible.every((o) => selectedSet.has(o.value));
  const toggleAll = () => {
    if (!multiple) return;
    const visibleValues = new Set(selectableVisible.map((option) => option.value));
    commit(
      allSelected
        ? selectedValues.filter((value) => !visibleValues.has(value))
        : [
            ...selectedValues,
            ...selectableVisible.filter((o) => !selectedSet.has(o.value)).map((o) => o.value),
          ],
    );
  };

  // Previous / next option across every option (ignores the search), for arrow buttons.
  const resolveStep = (step: 1 | -1): DropdownOption | undefined => {
    const current = allOptions.findIndex((option) => option.value === selectedValues[0]);
    const last = allOptions.length - 1;
    if (current < 0 && step < 0 && !loop) return undefined;
    const start = current < 0 ? (step > 0 ? 0 : last) : current + step;
    let next = findEnabled(allOptions, start, step);
    if (next < 0 && loop) {
      next = findEnabled(allOptions, step > 0 ? 0 : last, step);
      if (next === current) next = -1;
    }
    return next >= 0 ? allOptions[next] : undefined;
  };
  const previousOption = multiple ? undefined : resolveStep(-1);
  const nextOption = multiple ? undefined : resolveStep(1);
  const step = (direction: 1 | -1) => {
    const target = direction > 0 ? nextOption : previousOption;
    if (target) select(target.value);
  };

  // ---------------------------------------------------------------------------
  // Type-ahead (trigger without search): typing jumps to a matching option.
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
    const search = repeated ? state.buffer.charAt(0) : state.buffer;
    const start = repeated ? from + 1 : Math.max(from, 0);
    for (let n = 0; n < visibleOptions.length; n++) {
      const index = (start + n) % visibleOptions.length;
      const option = visibleOptions[index];
      if (option && !option.disabled && normalizeSearchText(option.label).startsWith(search))
        return index;
    }
    return -1;
  };

  useEffect(() => () => clearTimeout(typeaheadRef.current.timer), []);

  // ---------------------------------------------------------------------------
  // Keyboard
  // ---------------------------------------------------------------------------
  const initialIndex = (fromEnd = false) =>
    firstSelectedIndex >= 0
      ? firstSelectedIndex
      : fromEnd
        ? findEnabled(visibleOptions, lastIndex, -1)
        : firstEnabledIndex;

  const move = (stepBy: 1 | -1) => {
    const start = activeIndex < 0 ? (stepBy > 0 ? 0 : lastIndex) : activeIndex + stepBy;
    const next = findEnabled(visibleOptions, start, stepBy);
    if (next >= 0) activate(next);
  };

  const moveTo = (target: number, direction: 1 | -1) => {
    const clamped = Math.min(Math.max(target, 0), lastIndex);
    const next = findEnabled(visibleOptions, clamped, direction);
    const fallback =
      next >= 0 ? next : findEnabled(visibleOptions, clamped, direction === 1 ? -1 : 1);
    if (fallback >= 0) activate(fallback);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>, source: Source) => {
    if (event.defaultPrevented || disabled) return;
    const { key } = event;
    const inSearch = source === 'search';
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
          openWith(firstEnabledIndex);
          return;
        case 'End':
          event.preventDefault();
          openWith(findEnabled(visibleOptions, lastIndex, -1));
          return;
        case 'Backspace':
        case 'Delete':
          if (clearable && selectedValues.length > 0) {
            event.preventDefault();
            clear();
          }
          return;
      }
      if (isPrintableKey(event)) {
        event.preventDefault();
        if (searchable) {
          // Start searching with the typed character.
          openWith(initialIndex());
          setQuery(key);
          return;
        }
        const match = typeahead(key, firstSelectedIndex);
        openWith(match >= 0 ? match : initialIndex());
      }
      return;
    }

    if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === 'a' && multiple && !inSearch) {
      event.preventDefault();
      toggleAll();
      return;
    }

    switch (key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!event.altKey) move(1);
        return;
      case 'ArrowUp':
        event.preventDefault();
        if (event.altKey) {
          if (!multiple && activeIndex >= 0) selectIndex(activeIndex);
          setOpenState(false);
          return;
        }
        move(-1);
        return;
      case 'Home':
        if (inSearch) return; // move the caret in the search box
        event.preventDefault();
        moveTo(0, 1);
        return;
      case 'End':
        if (inSearch) return;
        event.preventDefault();
        moveTo(lastIndex, -1);
        return;
      case 'PageDown':
        event.preventDefault();
        moveTo(activeIndex + PAGE_STEP, 1);
        return;
      case 'PageUp':
        event.preventDefault();
        moveTo(activeIndex - PAGE_STEP, -1);
        return;
      case 'Enter':
        event.preventDefault();
        if (activeIndex >= 0) selectIndex(activeIndex);
        else setOpenState(false);
        return;
      case ' ':
        if (inSearch || typing) break; // a space typed in a query
        event.preventDefault();
        if (activeIndex >= 0) selectIndex(activeIndex);
        return;
      case 'Escape':
        event.preventDefault();
        // Don't let a surrounding dialog close as well.
        event.stopPropagation();
        if (inSearch && query !== '') setQuery('');
        else setOpenState(false);
        return;
      case 'Tab':
        // Single selection commits the highlighted option, like a native <select>.
        if (!multiple && activeIndex >= 0) selectIndex(activeIndex);
        if (inSearch) event.preventDefault(); // focus returns to the trigger
        setOpenState(false);
        return;
    }

    if (!inSearch && isPrintableKey(event)) {
      event.preventDefault();
      if (searchable) {
        setQuery(query + key);
        searchRef.current?.focus();
        return;
      }
      const match = typeahead(key, activeIndex);
      if (match >= 0) activate(match);
    }
  };

  // ---------------------------------------------------------------------------
  // Pointer and focus
  // ---------------------------------------------------------------------------
  const handleTriggerClick = (event: MouseEvent<HTMLElement>) => {
    if (disabled) return;
    // A native <button> also fires click for Enter/Space, already handled on keydown.
    if (event.detail === 0 && event.currentTarget.tagName === 'BUTTON') return;
    if (open) setOpenState(false);
    else openWith(initialIndex());
  };

  const isInsidePopup = (node: EventTarget | null) =>
    node instanceof Node && Boolean(popupRef.current?.contains(node));

  const handleTriggerBlur = (event: FocusEvent<HTMLElement>) => {
    if (open && !isInsidePopup(event.relatedTarget)) setOpenState(false, { restoreFocus: false });
  };

  const handleSearchBlur = (event: FocusEvent<HTMLInputElement>) => {
    const next = event.relatedTarget;
    if (next === triggerRef.current || isInsidePopup(next)) return;
    if (open) setOpenState(false, { restoreFocus: false });
  };

  // Close when pressing anywhere outside the trigger and the popup.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || popupRef.current?.contains(target)) return;
      if (!isOpenControlled) setInternalOpen(false);
      onOpenChange?.(false);
      if (!isSearchControlled) setInternalQuery('');
      if (query !== '') onSearchChange?.('');
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, isOpenControlled, isSearchControlled, onOpenChange, onSearchChange, query]);

  // ---------------------------------------------------------------------------
  // Popup: portal container, positioning, focus and scrolling
  // ---------------------------------------------------------------------------
  const floating = useFloating({
    open,
    portal,
    anchorRef: triggerRef,
    floatingRef: popupRef,
    scrollRef: listboxRef,
    placement,
    width: popupWidth === 'trigger' ? 'anchor' : 'auto',
    contentKey: `${rows.length}:${selectedValues.join('\u0000')}:${loading}`,
  });
  const container = floating.container;
  const popupMounted = floating.mounted;

  // Move focus into the search box when the popup opens.
  useEffect(() => {
    if (popupMounted && searchable) searchRef.current?.focus();
  }, [popupMounted, searchable]);

  // Keep the DOM scroll position of a virtualized list in sync with the rendered window.
  useIsomorphicLayoutEffect(() => {
    if (popupMounted && virtualized && listboxRef.current) {
      if (listboxRef.current.scrollTop !== scrollTop) listboxRef.current.scrollTop = scrollTop;
    }
  }, [popupMounted, virtualized, scrollTop]);

  // Keep the highlighted option visible in non-virtualized lists.
  useEffect(() => {
    if (!popupMounted || virtualized || activeIndex < 0) return;
    document.getElementById(optionId(activeIndex))?.scrollIntoView?.({ block: 'nearest' });
  }, [popupMounted, virtualized, activeIndex, optionId]);

  const handleListScroll = (event: UIEvent<HTMLElement>) => {
    const list = event.currentTarget;
    if (virtualized) setScrollTop(list.scrollTop);
    if (
      onLoadMore &&
      !loading &&
      list.scrollHeight - list.scrollTop - list.clientHeight < itemHeight * LOAD_MORE_THRESHOLD
    ) {
      onLoadMore();
    }
  };

  // ---------------------------------------------------------------------------
  // Virtual window
  // ---------------------------------------------------------------------------
  const start = virtualized ? Math.max(0, Math.floor(scrollTop / itemHeight) - overscan) : 0;
  const end = virtualized
    ? Math.min(rows.length, Math.ceil((scrollTop + VIRTUAL_WINDOW) / itemHeight) + overscan)
    : rows.length;
  const visibleRows = virtualized ? rows.slice(start, end) : rows;

  // ---------------------------------------------------------------------------
  // Prop getters
  // ---------------------------------------------------------------------------
  const getTriggerProps = (
    props: HTMLAttributes<HTMLElement> = {},
  ): HTMLAttributes<HTMLElement> & { ref: RefCallback<HTMLElement> } => ({
    ...props,
    ref: setTriggerRef,
    id,
    role: 'combobox',
    tabIndex: disabled ? -1 : 0,
    'aria-haspopup': 'listbox',
    'aria-expanded': open,
    'aria-controls': popupMounted && rows.length > 0 ? listboxId : undefined,
    'aria-activedescendant':
      popupMounted && !searchable && activeIndex >= 0 ? optionId(activeIndex) : undefined,
    'aria-disabled': disabled || undefined,
    onClick: (event) => {
      props.onClick?.(event);
      if (!event.defaultPrevented) handleTriggerClick(event);
    },
    onKeyDown: (event) => {
      props.onKeyDown?.(event);
      handleKeyDown(event, 'trigger');
    },
    onBlur: (event) => {
      props.onBlur?.(event);
      handleTriggerBlur(event);
    },
  });

  const getSearchInputProps = (
    props: InputHTMLAttributes<HTMLInputElement> = {},
  ): InputHTMLAttributes<HTMLInputElement> & { ref: RefObject<HTMLInputElement | null> } => ({
    type: 'text',
    autoComplete: 'off',
    spellCheck: false,
    ...props,
    ref: searchRef,
    role: 'combobox',
    'aria-autocomplete': 'list',
    'aria-expanded': true,
    'aria-controls': rows.length > 0 ? listboxId : undefined,
    'aria-activedescendant': activeIndex >= 0 ? optionId(activeIndex) : undefined,
    value: query,
    onChange: (event) => {
      props.onChange?.(event);
      setQuery(event.target.value);
    },
    onKeyDown: (event) => {
      props.onKeyDown?.(event);
      handleKeyDown(event, 'search');
    },
    onBlur: (event) => {
      props.onBlur?.(event);
      handleSearchBlur(event);
    },
  });

  const getPopupProps = () => ({
    ref: popupRef,
    // Keep focus where it is (trigger or search box) when clicking options or the scrollbar.
    onMouseDown: (event: MouseEvent<HTMLElement>) => {
      if (event.target !== searchRef.current) event.preventDefault();
    },
  });

  const getListboxProps = () => ({
    ref: listboxRef,
    id: listboxId,
    role: 'listbox' as const,
    'aria-multiselectable': multiple || undefined,
    onScroll: handleListScroll,
    style: virtualized
      ? ({ '--_ul-dropdown-row-height': `${itemHeight}px` } as CSSProperties)
      : undefined,
  });

  const getOptionState = (row: Extract<DropdownRow, { type: 'option' }>) => ({
    selected: selectedSet.has(row.option.value),
    active: row.index === activeIndex,
    disabled: Boolean(row.option.disabled),
  });

  const getOptionProps = (row: Extract<DropdownRow, { type: 'option' }>) => {
    const state = getOptionState(row);
    return {
      id: optionId(row.index),
      role: 'option' as const,
      'aria-selected': state.selected,
      'aria-disabled': state.disabled || undefined,
      // Not every option is in the DOM: tell assistive tech the real size and position.
      'aria-setsize': virtualized ? visibleOptions.length : undefined,
      'aria-posinset': virtualized ? row.index + 1 : undefined,
      onMouseMove: () => {
        if (!state.disabled && activeIndex !== row.index) setActiveIndex(row.index);
      },
      onClick: () => selectIndex(row.index),
    };
  };

  return {
    id,
    listboxId,
    optionId,
    open,
    setOpen: (next: boolean) => setOpenState(next),
    disabled,
    multiple,
    searchable,
    loading,
    query,
    setQuery,

    /** Every option, ignoring the search. */
    allOptions,
    /** Options left after the search, in order. `activeIndex` points into this list. */
    visibleOptions,
    /** All rows (options, group headers, separators) after the search. */
    rows,
    /** The rows to render: all of them, or the virtual window. */
    visibleRows,
    virtual: {
      enabled: virtualized,
      itemHeight,
      paddingTop: start * itemHeight,
      paddingBottom: (rows.length - end) * itemHeight,
    },

    selectedValues,
    selectedOptions,
    isSelected: (value: string) => selectedSet.has(value),
    activeIndex,
    setActiveIndex: activate,
    select,
    selectIndex,
    clear,
    toggleAll,
    allSelected,
    previousOption,
    nextOption,
    step,

    portal,
    /** Where the popup should be portalled (null until known, or when `portal` is false). */
    portalContainer: container,
    /** True when the popup should be in the DOM. */
    popupMounted,
    triggerRef: triggerRef as RefObject<HTMLElement | null>,

    getTriggerProps,
    getSearchInputProps,
    getPopupProps,
    getListboxProps,
    getOptionProps,
    getOptionState,
  };
}

export type UseDropdownReturn = ReturnType<typeof useDropdown>;
