/**
 * The public design-token contract.
 *
 * Every name here is emitted by `@uleah/react/styles.css` as a CSS custom
 * property with the `--ul-` prefix (e.g. `color-primary` → `--ul-color-primary`)
 * and may be overridden by applications. A test verifies this list matches
 * the compiled stylesheet exactly.
 *
 * The same names are the cross-framework contract for Uleah.Angular and
 * Uleah.Blazor (see docs/tokens.md).
 */

/** Semantic colour tokens. These are redefined per theme (Light / Dark). */
export const colorTokenNames = [
  'color-background',
  'color-background-subtle',
  'color-surface',
  'color-surface-elevated',
  'color-surface-sunken',
  'color-surface-hover',
  'color-surface-active',
  'color-text',
  'color-text-muted',
  'color-text-subtle',
  'color-text-inverse',
  'color-border',
  'color-border-strong',
  'color-primary',
  'color-primary-hover',
  'color-primary-active',
  'color-primary-subtle',
  'color-primary-text',
  'color-on-primary',
  'color-secondary',
  'color-secondary-hover',
  'color-secondary-active',
  'color-on-secondary',
  'color-focus',
  'color-success',
  'color-success-subtle',
  'color-success-text',
  'color-warning',
  'color-warning-subtle',
  'color-warning-text',
  'color-danger',
  'color-danger-hover',
  'color-danger-active',
  'color-danger-subtle',
  'color-danger-text',
  'color-on-danger',
  'color-info',
  'color-info-subtle',
  'color-info-text',
] as const;

/** Elevation tokens. Also redefined per theme. */
export const shadowTokenNames = ['shadow-xs', 'shadow-sm', 'shadow-md', 'shadow-lg'] as const;

/** Theme-independent scales. */
export const scaleTokenNames = [
  'font-family-sans',
  'font-family-mono',
  'font-size-xs',
  'font-size-sm',
  'font-size-md',
  'font-size-lg',
  'font-size-xl',
  'font-size-2xl',
  'font-size-3xl',
  'font-weight-regular',
  'font-weight-medium',
  'font-weight-semibold',
  'font-weight-bold',
  'line-height-tight',
  'line-height-snug',
  'line-height-normal',
  'line-height-relaxed',
  'letter-spacing-tight',
  'letter-spacing-normal',
  'letter-spacing-wide',
  'spacing-0',
  'spacing-1',
  'spacing-2',
  'spacing-3',
  'spacing-4',
  'spacing-5',
  'spacing-6',
  'spacing-8',
  'spacing-10',
  'spacing-12',
  'spacing-16',
  'radius-none',
  'radius-sm',
  'radius-md',
  'radius-lg',
  'radius-xl',
  'radius-full',
  'border-width-thin',
  'border-width-thick',
  'focus-ring-width',
  'focus-ring-offset',
  'control-height-sm',
  'control-height-md',
  'control-height-lg',
  'z-index-base',
  'z-index-dropdown',
  'z-index-sticky',
  'z-index-overlay',
  'z-index-modal',
  'z-index-popover',
  'z-index-toast',
  'z-index-tooltip',
  'duration-instant',
  'duration-fast',
  'duration-normal',
  'duration-slow',
  'easing-standard',
  'easing-in',
  'easing-out',
  'opacity-disabled',
] as const;

/** All public token names (without the `--ul-` prefix). */
export const themeTokenNames = [
  ...colorTokenNames,
  ...shadowTokenNames,
  ...scaleTokenNames,
] as const;

/** A public token name in kebab-case, e.g. `'color-primary'`. */
export type ThemeTokenName = (typeof themeTokenNames)[number];

type KebabToCamel<S extends string> = S extends `${infer Head}-${infer Tail}`
  ? `${Head}${Capitalize<KebabToCamel<Tail>>}`
  : S;

/** A public token name in camelCase, e.g. `'colorPrimary'`. */
export type ThemeTokenKey = KebabToCamel<ThemeTokenName>;

/** A partial map of token overrides, keyed in camelCase. */
export type ThemeTokens = Partial<Record<ThemeTokenKey, string | number>>;

/** Convert a camelCase token key to its kebab-case name: `fontSize2xl` → `font-size-2xl`. */
export function tokenKeyToName(key: string): string {
  return key.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase();
}

/** CSS custom property name for a token: `cssVarName('color-primary')` → `--ul-color-primary`. */
export function cssVarName(token: ThemeTokenName): `--ul-${ThemeTokenName}` {
  return `--ul-${token}`;
}

/** `var()` reference for a token, for use in inline styles or CSS-in-JS. */
export function cssVar(token: ThemeTokenName): string {
  return `var(--ul-${token})`;
}
