import type { UleahTheme } from './types.js';

/**
 * Type-safe helper for declaring a custom theme. Returns the theme unchanged;
 * it exists for autocompletion and to keep theme objects referentially stable
 * when declared at module scope.
 *
 * @example
 * const brand = defineTheme({
 *   tokens: { fontFamilySans: '"Inter", sans-serif', radiusMd: '8px' },
 *   light: { colorPrimary: '#1f6f8b' },
 *   dark: { colorPrimary: '#6cb4cc' },
 * });
 */
export function defineTheme<const T extends UleahTheme>(theme: T): T {
  return theme;
}
