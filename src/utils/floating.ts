import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from 'react';

/** `useLayoutEffect` on the client, `useEffect` on the server (avoids the SSR warning). */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Where a floating element opens. `'auto'` prefers below and flips when there is more room above. */
export type FloatingPlacement = 'auto' | 'bottom' | 'top';

/** `'anchor'`: as wide as the anchor. `'auto'`: at least as wide, grows with the content. */
export type FloatingWidth = 'anchor' | 'auto';

const VIEWPORT_MARGIN = 8;
const GAP = 4;
const MIN_SCROLL_HEIGHT = 48;

export interface UseFloatingOptions {
  /** Whether the floating element should be shown. */
  open: boolean;
  /** Portal the floating element into the anchor's theme scope. */
  portal: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  floatingRef: RefObject<HTMLElement | null>;
  /**
   * Element that scrolls when space is short (e.g. a listbox). It receives the remaining height
   * through `--_ul-floating-available`. Without it, the floating element itself is capped.
   */
  scrollRef?: RefObject<HTMLElement | null>;
  placement?: FloatingPlacement;
  width?: FloatingWidth;
  /** Any value that changes when the content size may change (re-positions). */
  contentKey?: unknown;
}

/**
 * Shared positioning for popups (Dropdown, DatePicker…): `position: fixed` next to an anchor,
 * flips above when there is more room there, caps its height to the available space, stays
 * inside the viewport horizontally and follows the anchor on scroll and resize.
 *
 * Returns the portal container (the nearest `.ul-theme`, so tokens and custom themes apply,
 * or `document.body`) and whether the floating element can be rendered yet.
 *
 * @internal
 */
export function useFloating({
  open,
  portal,
  anchorRef,
  floatingRef,
  scrollRef,
  placement = 'auto',
  width = 'anchor',
  contentKey,
}: UseFloatingOptions) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (!open || !portal) return;
    setContainer(anchorRef.current?.closest<HTMLElement>('.ul-theme') ?? document.body);
  }, [open, portal, anchorRef]);

  const mounted = open && (!portal || container !== null);

  const update = useCallback(() => {
    const anchor = anchorRef.current;
    const floating = floatingRef.current;
    if (!anchor || !floating) return;

    const rect = anchor.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (width === 'anchor') {
      floating.style.width = `${rect.width}px`;
      floating.style.minWidth = '';
    } else {
      floating.style.width = '';
      floating.style.minWidth = `${rect.width}px`;
    }

    // Measure the natural height, then decide the side and cap the height.
    floating.style.removeProperty('--_ul-floating-available');
    const natural = floating.offsetHeight;
    const spaceBelow = viewportHeight - rect.bottom - GAP - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - GAP - VIEWPORT_MARGIN;
    const side =
      placement === 'top' || placement === 'bottom'
        ? placement
        : natural <= spaceBelow || spaceBelow >= spaceAbove
          ? 'bottom'
          : 'top';
    const available = Math.max(side === 'bottom' ? spaceBelow : spaceAbove, 0);
    if (natural > available) {
      const scroller = scrollRef?.current;
      const chrome = scroller ? floating.offsetHeight - scroller.offsetHeight : 0;
      floating.style.setProperty(
        '--_ul-floating-available',
        `${Math.max(available - chrome, MIN_SCROLL_HEIGHT)}px`,
      );
    }

    const height = floating.offsetHeight;
    const floatingWidth = floating.offsetWidth;
    const maxLeft = Math.max(viewportWidth - VIEWPORT_MARGIN - floatingWidth, VIEWPORT_MARGIN);
    const left = Math.min(Math.max(rect.left, VIEWPORT_MARGIN), maxLeft);
    const top = side === 'bottom' ? rect.bottom + GAP : rect.top - GAP - height;

    floating.style.left = `${left}px`;
    floating.style.top = `${top}px`;
    floating.dataset.placement = side;
  }, [anchorRef, floatingRef, scrollRef, placement, width]);

  useIsomorphicLayoutEffect(() => {
    if (!mounted) return;
    update();

    let frame = 0;
    const schedule = (event?: Event) => {
      // Scrolling inside the floating element itself doesn't move it.
      if (event && floatingRef.current?.contains(event.target as Node)) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => schedule());
    if (anchorRef.current) observer?.observe(anchorRef.current);
    if (floatingRef.current) observer?.observe(floatingRef.current);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      observer?.disconnect();
    };
  }, [mounted, update, contentKey, anchorRef, floatingRef]);

  return { container: portal ? container : null, mounted, update };
}
