import { useContext } from 'react';
import { ThemeContext } from './ThemeContext.js';
import type { ThemeContextValue } from './types.js';

/**
 * Read and change the theme of the nearest `<UleahProvider>`.
 *
 * @throws if called outside a `<UleahProvider>`.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme() must be used inside a <UleahProvider>.');
  }
  return context;
}
