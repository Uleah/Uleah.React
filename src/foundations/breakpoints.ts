/**
 * Uleah breakpoints (min-width, in px). Mobile-first.
 *
 * Mirrors `src/styles/abstracts/_breakpoints.scss`. CSS custom properties
 * cannot be used in media queries, so breakpoints are exposed as constants
 * for use in JavaScript (e.g. `window.matchMedia`) and in your own styles.
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/** Build a `min-width` media query string for a breakpoint. */
export function mediaQueryUp(breakpoint: Breakpoint): string {
  return `(min-width: ${breakpoints[breakpoint]}px)`;
}
