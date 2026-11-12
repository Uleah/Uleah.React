import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cx } from '../utils/cx.js';
import { ThemeContext } from './ThemeContext.js';
import { themeToCss } from './themeToCss.js';
import type { ThemeContextValue, ThemeMode, ThemeStorage, UleahTheme } from './types.js';
import { useSystemTheme } from './useSystemTheme.js';

export interface UleahProviderProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Controlled theme preference. When set, the provider never changes the
   * theme on its own; `setTheme()` calls `onThemeChange` and you update this prop.
   */
  theme?: ThemeMode;
  /**
   * Initial preference in uncontrolled mode. Defaults to `'system'`.
   * Ignored when `theme` is provided.
   */
  defaultTheme?: ThemeMode;
  /** Called whenever `setTheme()` is invoked with a new preference. */
  onThemeChange?: (theme: ThemeMode) => void;
  /**
   * Optional persistence adapter (e.g. `createLocalStorageThemeStorage()`).
   * Read once after mount — never during render — so SSR output is stable.
   * Only used in uncontrolled mode; in controlled mode, persist yourself.
   */
  storage?: ThemeStorage;
  /** Custom theme: token and CSS-variable overrides for this scope. */
  customTheme?: UleahTheme;
  /** CSP nonce for the `<style>` element generated for `customTheme`. */
  nonce?: string;
  children?: ReactNode;
}

/**
 * Provides a Uleah theme to its subtree.
 *
 * Renders a single `<div class="ul-theme" data-ul-theme="…">` scope element.
 * All theme tokens are CSS custom properties resolved on that element, so
 * providers can be nested to theme individual sections of a page.
 */
export const UleahProvider = forwardRef<HTMLDivElement, UleahProviderProps>(function UleahProvider(
  {
    theme: controlledTheme,
    defaultTheme = 'system',
    onThemeChange,
    storage,
    customTheme,
    nonce,
    className,
    children,
    ...rest
  },
  ref,
) {
  const isControlled = controlledTheme !== undefined;
  const [uncontrolledTheme, setUncontrolledTheme] = useState<ThemeMode>(defaultTheme);
  const theme = isControlled ? controlledTheme : uncontrolledTheme;

  // Hydrate from storage after mount (never during render → SSR-safe).
  useEffect(() => {
    if (isControlled || !storage) return;
    const stored = storage.get();
    if (stored) setUncontrolledTheme(stored);
    return storage.subscribe?.((next) => setUncontrolledTheme(next ?? defaultTheme));
    // `defaultTheme` is an initial value; re-subscribing on change is unnecessary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isControlled, storage]);

  const setTheme = useCallback(
    (next: ThemeMode) => {
      if (!isControlled) {
        setUncontrolledTheme(next);
        storage?.set(next);
      }
      onThemeChange?.(next);
    },
    [isControlled, storage, onThemeChange],
  );

  const systemTheme = useSystemTheme();
  const resolvedTheme = theme === 'system' ? (systemTheme ?? 'light') : theme;

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, systemTheme, setTheme }),
    [theme, resolvedTheme, systemTheme, setTheme],
  );

  const scopeId = useId();
  const css = useMemo(
    () => (customTheme ? themeToCss(customTheme, scopeId) : ''),
    [customTheme, scopeId],
  );

  return (
    <ThemeContext.Provider value={value}>
      <div
        ref={ref}
        {...rest}
        className={cx('ul-theme', className)}
        data-ul-theme={theme}
        data-ul-scope={css ? scopeId : undefined}
      >
        {css ? <style nonce={nonce} dangerouslySetInnerHTML={{ __html: css }} /> : null}
        {children}
      </div>
    </ThemeContext.Provider>
  );
});
