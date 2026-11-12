import { vi } from 'vitest';

/**
 * Install a controllable `window.matchMedia` mock for
 * `(prefers-color-scheme: dark)`. jsdom does not implement matchMedia.
 */
export function mockColorScheme(initial: 'light' | 'dark') {
  let dark = initial === 'dark';
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const matchMedia = vi.fn((query: string) => ({
    get matches() {
      return query.includes('dark') ? dark : !dark;
    },
    media: query,
    onchange: null,
    addEventListener: (_: string, cb: (event: MediaQueryListEvent) => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: (event: MediaQueryListEvent) => void) =>
      listeners.delete(cb),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  }));

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: matchMedia,
  });

  return {
    set(next: 'light' | 'dark') {
      dark = next === 'dark';
      listeners.forEach((cb) => cb({ matches: dark } as MediaQueryListEvent));
    },
    restore() {
      // @ts-expect-error — remove the mock entirely (jsdom has no matchMedia).
      delete window.matchMedia;
    },
  };
}
