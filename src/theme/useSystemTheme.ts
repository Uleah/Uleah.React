import { useSyncExternalStore } from 'react';
import type { ResolvedTheme } from './types.js';

const QUERY = '(prefers-color-scheme: dark)';

function getMediaQueryList(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  return window.matchMedia(QUERY);
}

function subscribe(callback: () => void): () => void {
  const mql = getMediaQueryList();
  if (!mql) return () => {};
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot(): ResolvedTheme | null {
  const mql = getMediaQueryList();
  if (!mql) return null;
  return mql.matches ? 'dark' : 'light';
}

function getServerSnapshot(): ResolvedTheme | null {
  return null;
}

/**
 * The operating system colour-scheme preference, kept up to date.
 * Returns `null` on the server and during hydration, so server and client
 * markup always match.
 */
export function useSystemTheme(): ResolvedTheme | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
