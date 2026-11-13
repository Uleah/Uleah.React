import { useCallback, useSyncExternalStore } from 'react';

/**
 * Whether a media query matches, kept up to date. Returns `false` on the server and during
 * hydration, so server and client markup match.
 *
 * @internal
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener('change', callback);
      return () => mql.removeEventListener('change', callback);
    },
    [query],
  );
  const getSnapshot = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false;
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
