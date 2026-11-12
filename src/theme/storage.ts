import { isThemeMode } from './isThemeMode.js';
import type { ThemeMode, ThemeStorage } from './types.js';

export interface LocalStorageThemeStorageOptions {
  /** Storage key. Defaults to `'ul-theme'`. */
  key?: string;
}

/**
 * A `ThemeStorage` backed by `window.localStorage`, with cross-tab sync.
 *
 * Safe to create during SSR: storage is only accessed when the provider calls
 * `get` / `set` on the client, and every access is guarded so private mode or
 * blocked storage degrades to "no persistence" instead of throwing.
 */
export function createLocalStorageThemeStorage(
  options: LocalStorageThemeStorageOptions = {},
): ThemeStorage {
  const key = options.key ?? 'ul-theme';

  return {
    get() {
      try {
        const value = window.localStorage.getItem(key);
        return isThemeMode(value) ? value : null;
      } catch {
        return null;
      }
    },
    set(theme: ThemeMode) {
      try {
        window.localStorage.setItem(key, theme);
      } catch {
        // Storage unavailable (private mode, quota, disabled): ignore.
      }
    },
    subscribe(callback) {
      if (typeof window === 'undefined') return () => {};
      const onStorage = (event: StorageEvent) => {
        if (event.key !== key) return;
        callback(isThemeMode(event.newValue) ? event.newValue : null);
      };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    },
  };
}
