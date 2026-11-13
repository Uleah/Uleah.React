import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

export type DropdownSize = 'sm' | 'md' | 'lg';

/** Where the popup opens. `'auto'` prefers below and flips above when there is more room there. */
export type DropdownPlacement = 'auto' | 'bottom' | 'top';

/**
 * Popup width. `'trigger'` matches the trigger exactly. `'auto'` is at least as wide as the
 * trigger and grows with its content (up to `--ul-dropdown-popup-max-width`).
 */
export type DropdownPopupWidth = 'trigger' | 'auto';

/** How long option labels are handled: cut with an ellipsis (full text in a tooltip) or wrapped. */
export type DropdownOptionOverflow = 'truncate' | 'wrap';

export interface DropdownOption {
  /** Unique value. This is what `value` / `onChange` work with and what forms submit. */
  value: string;
  /** Text shown in the list and the trigger. Also used for type-ahead. */
  label: string;
  /** Secondary text below the label. */
  description?: ReactNode;
  /** Decorative element before the label. Hidden from assistive tech. */
  icon?: ReactNode;
  /** The option is shown but cannot be selected or reached with the arrow keys. */
  disabled?: boolean;
}

/** State passed to `renderOption`. */
export interface DropdownOptionState {
  selected: boolean;
  active: boolean;
  disabled: boolean;
}

interface DropdownBaseProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue' | 'children' | 'placeholder' | 'className' | 'style'
> {
  /** The options, in display order. */
  options: readonly DropdownOption[];
  /**
   * Visible label. If omitted, pass `aria-label` or `aria-labelledby` (e.g. inside a table cell
   * where the column header labels the control).
   */
  label?: ReactNode;
  /** Visually hide the label while keeping it as the accessible name. @default false */
  hideLabel?: boolean;
  /** Supporting text below the control, linked via `aria-describedby`. */
  helperText?: ReactNode;
  /** Marks the control invalid. Pass a message to display it, or `true` for no message. */
  error?: ReactNode;
  /** Text shown when nothing is selected. @default 'Select…' */
  placeholder?: string;
  /** @default 'md' */
  size?: DropdownSize;
  disabled?: boolean;
  /** Shows the required marker and sets `aria-required`. */
  required?: boolean;
  /** Form field name. One hidden `<input>` per selected value is rendered for form submission. */
  name?: string;

  /** Controlled open state. */
  open?: boolean;
  /** Initial open state (uncontrolled). @default false */
  defaultOpen?: boolean;
  /** Called when the popup wants to open or close. */
  onOpenChange?: (open: boolean) => void;

  /**
   * Show previous / next arrow buttons on both sides of the trigger that step through the
   * options without opening the list. Single selection only (ignored with `multiple`).
   * @default false
   */
  navigationButtons?: boolean;
  /** Accessible name of the previous-option button. @default 'Previous option' */
  previousLabel?: string;
  /** Accessible name of the next-option button. @default 'Next option' */
  nextLabel?: string;
  /** Navigation buttons wrap from the last option to the first and vice versa. @default false */
  loop?: boolean;

  /** @default 'auto' */
  placement?: DropdownPlacement;
  /** @default 'trigger' */
  popupWidth?: DropdownPopupWidth;
  /** @default 'truncate' */
  optionOverflow?: DropdownOptionOverflow;
  /**
   * Render the popup in a portal attached to the nearest theme scope (`.ul-theme`), or
   * `document.body`. Keeps the list visible inside containers with `overflow: hidden`
   * (tables, cards, scroll areas). @default true
   */
  portal?: boolean;
  /** Shown in the popup when `options` is empty. @default 'No options' */
  emptyMessage?: ReactNode;

  /** Custom option content. The selection indicator is still rendered by Uleah. */
  renderOption?: (option: DropdownOption, state: DropdownOptionState) => ReactNode;
  /** Custom trigger content for the current selection (not called when nothing is selected). */
  renderValue?: (selected: DropdownOption[]) => ReactNode;

  /** Class name for the root wrapper element (`.ul-field.ul-dropdown`). */
  className?: string;
  /** Inline styles for the root wrapper element. */
  style?: CSSProperties;
  /** Class name forwarded to the trigger (`.ul-dropdown__trigger`). */
  triggerClassName?: string;
  /** Class name forwarded to the popup (`.ul-dropdown__popup`). */
  popupClassName?: string;
}

export interface DropdownSingleProps extends DropdownBaseProps {
  /** Allow selecting several options. @default false */
  multiple?: false;
  /** Controlled value. `null` means nothing selected. */
  value?: string | null;
  /** Initial value (uncontrolled). */
  defaultValue?: string | null;
  /** Called with the new value and its option (`null` / `undefined` when cleared). */
  onChange?: (value: string | null, option: DropdownOption | undefined) => void;
}

export interface DropdownMultipleProps extends DropdownBaseProps {
  multiple: true;
  /** Controlled values, in selection order. */
  value?: readonly string[];
  /** Initial values (uncontrolled). */
  defaultValue?: readonly string[];
  /** Called with every selected value, in selection order. */
  onChange?: (value: string[], options: DropdownOption[]) => void;
  /**
   * When more values than this are selected, the trigger shows a summary
   * (`selectedSummary`) instead of the list of labels. @default 3
   */
  maxDisplayedValues?: number;
  /** Summary text for many selected values. @default (count) => `${count} selected` */
  selectedSummary?: (count: number) => string;
}

export type DropdownProps = DropdownSingleProps | DropdownMultipleProps;
