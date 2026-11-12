import type { ThemeTokens } from '../foundations/tokens.js';

/** The theme preference: an explicit mode, or follow the operating system. */
export type ThemeMode = 'light' | 'dark' | 'system';

/** The theme actually applied once `system` has been resolved. */
export type ResolvedTheme = 'light' | 'dark';

/** Raw CSS custom properties, e.g. component-level variables like `--ul-button-radius`. */
export type CssVariables = Partial<Record<`--${string}`, string | number>>;

/**
 * A custom Uleah theme: overrides layered on top of the official Light and
 * Dark themes. Every field is optional — override only what you need.
 */
export interface UleahTheme {
  /** Token overrides applied in every mode (typography, radii, brand colour...). */
  tokens?: ThemeTokens;
  /** Token overrides applied only when the resolved theme is Light. */
  light?: ThemeTokens;
  /** Token overrides applied only when the resolved theme is Dark. */
  dark?: ThemeTokens;
  /**
   * Raw CSS custom properties applied in every mode. Use for component-level
   * variables (e.g. `'--ul-button-radius': '999px'`).
   */
  cssVariables?: CssVariables;
}

/**
 * Persistence adapter for the theme preference. Uleah never touches storage
 * unless you pass one of these to `<UleahProvider storage={...}>`.
 */
export interface ThemeStorage {
  /** Return the stored preference, or `null` if none / invalid. Called on the client only. */
  get(): ThemeMode | null;
  /** Persist a new preference. */
  set(theme: ThemeMode): void;
  /**
   * Optional: subscribe to external changes (e.g. other tabs). Return an
   * unsubscribe function.
   */
  subscribe?(callback: (theme: ThemeMode | null) => void): () => void;
}

/** Value returned by `useTheme()`. */
export interface ThemeContextValue {
  /** The current preference: `'light'`, `'dark'` or `'system'`. */
  theme: ThemeMode;
  /**
   * The theme actually in effect. For `'system'` this follows the OS
   * preference. During server rendering and hydration it is `'light'` for
   * `'system'` (the OS preference is unknown on the server), then updates
   * on the client. Styling never depends on this value — CSS resolves the
   * system theme itself — so there is no visual flash.
   */
  resolvedTheme: ResolvedTheme;
  /** The OS colour-scheme preference, or `null` before it can be detected (SSR). */
  systemTheme: ResolvedTheme | null;
  /** Change the preference. In controlled mode this only calls `onThemeChange`. */
  setTheme: (theme: ThemeMode) => void;
}
