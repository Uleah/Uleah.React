# Design tokens

Design tokens are the single source of truth for Uleah's visual language. They are also the
**cross-framework contract**: Uleah.Angular and Uleah.Blazor reproduce the same names, roles and
theme selectors, so all implementations look the same and can be themed the same way.

## Layers

| Layer               | Prefix                                            | Who uses it                                  | Stability                                                 |
| ------------------- | ------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------- |
| Primitive palette   | `--ul-palette-<hue>-<step>`                       | Themes only (and custom themes, if you like) | Public, but may grow                                      |
| Semantic tokens     | `--ul-color-*`, `--ul-shadow-*`                   | Components                                   | **Public API**                                            |
| Scales              | `--ul-spacing-*`, `--ul-radius-*`, `--ul-font-*`… | Components                                   | **Public API**                                            |
| Component variables | `--ul-button-*`, `--ul-input-*`…                  | Consumers, for overrides                     | **Public API** (see [customization.md](customization.md)) |
| Internal variables  | `--_ul-*`                                         | Uleah internals                              | **Private**: may change without notice                    |

Components only consume semantic tokens and scales, never palette values or literal colours. A
test (`tests/styles/tokens-contract.test.ts`) fails if a component rule contains a raw colour.

## Theme contract (for every implementation)

1. Tokens are CSS custom properties named `--ul-<token-name>`.
2. `:root` declares the palette, the scales and the **Light** semantic colours.
3. `[data-ul-theme="light"]` and `[data-ul-theme="system"]` declare the Light colours.
4. `[data-ul-theme="dark"]` declares the Dark colours.
5. `@media (prefers-color-scheme: dark) { [data-ul-theme="system"] { … } }` declares the Dark colours.
6. `.ul-theme` paints `color: var(--ul-color-text)` and `background-color: var(--ul-color-background)`.
7. Scale durations become `0ms` under `prefers-reduced-motion: reduce`.
8. Component classes use the `ul-` prefix in BEM form (`ul-button`, `ul-button--primary`, `ul-card__title`).

In TypeScript, the token names are exported as `themeTokenNames` (and grouped as
`colorTokenNames`, `shadowTokenNames` and `scaleTokenNames`), and there are helpers
`cssVar('color-primary')` → `var(--ul-color-primary)` and `cssVarName(...)`. A test checks that
this list matches the compiled stylesheet exactly.

## Semantic colour roles

| Role                                                                | Meaning                                                                                                       |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `background` / `background-subtle`                                  | Page canvas / a tinted area on the canvas                                                                     |
| `surface` / `surface-elevated` / `surface-sunken`                   | Cards and controls / raised layers / recessed (e.g. read-only fields)                                         |
| `surface-hover` / `surface-active`                                  | Interaction feedback on neutral surfaces                                                                      |
| `text` / `text-muted` / `text-subtle` / `text-inverse`              | Primary text / secondary text / placeholders / text on inverse backgrounds                                    |
| `border` / `border-strong`                                          | Decorative separators / control boundaries (≥ 3:1)                                                            |
| `primary` (+ `-hover`, `-active`, `-subtle`, `-text`), `on-primary` | Brand accent; `-subtle` tints, `-text` for accent-coloured text, `on-primary` for content placed on `primary` |
| `secondary` (+ `-hover`, `-active`), `on-secondary`                 | Neutral filled actions                                                                                        |
| `focus`                                                             | Focus ring colour                                                                                             |
| `success`, `warning`, `danger`, `info` (+ `-subtle`, `-text`)       | Status colours; `danger` also has `-hover`, `-active` and `on-danger`                                         |

## Themed tokens

Palette references are shown as `hue-step`.

| Token                          | Light                                                                            | Dark                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `--ul-color-background`        | `slate-50`                                                                       | `slate-950`                                                               |
| `--ul-color-background-subtle` | `slate-100`                                                                      | `slate-925`                                                               |
| `--ul-color-surface`           | `slate-0`                                                                        | `slate-900`                                                               |
| `--ul-color-surface-elevated`  | `slate-0`                                                                        | `slate-850`                                                               |
| `--ul-color-surface-sunken`    | `slate-25`                                                                       | `slate-925`                                                               |
| `--ul-color-surface-hover`     | `slate-100`                                                                      | `slate-800`                                                               |
| `--ul-color-surface-active`    | `slate-200`                                                                      | `slate-700`                                                               |
| `--ul-color-text`              | `slate-900`                                                                      | `slate-100`                                                               |
| `--ul-color-text-muted`        | `slate-600`                                                                      | `slate-350`                                                               |
| `--ul-color-text-subtle`       | `slate-500`                                                                      | `slate-450`                                                               |
| `--ul-color-text-inverse`      | `slate-0`                                                                        | `slate-950`                                                               |
| `--ul-color-border`            | `slate-200`                                                                      | `slate-800`                                                               |
| `--ul-color-border-strong`     | `slate-450`                                                                      | `slate-500`                                                               |
| `--ul-color-primary`           | `teal-600`                                                                       | `teal-350`                                                                |
| `--ul-color-primary-hover`     | `teal-700`                                                                       | `teal-300`                                                                |
| `--ul-color-primary-active`    | `teal-800`                                                                       | `teal-200`                                                                |
| `--ul-color-primary-subtle`    | `teal-50`                                                                        | `teal-900`                                                                |
| `--ul-color-primary-text`      | `teal-700`                                                                       | `teal-300`                                                                |
| `--ul-color-on-primary`        | `slate-0`                                                                        | `teal-950`                                                                |
| `--ul-color-secondary`         | `slate-100`                                                                      | `slate-800`                                                               |
| `--ul-color-secondary-hover`   | `slate-200`                                                                      | `slate-700`                                                               |
| `--ul-color-secondary-active`  | `slate-300`                                                                      | `slate-600`                                                               |
| `--ul-color-on-secondary`      | `slate-800`                                                                      | `slate-100`                                                               |
| `--ul-color-focus`             | `teal-500`                                                                       | `teal-300`                                                                |
| `--ul-color-success`           | `green-600`                                                                      | `green-400`                                                               |
| `--ul-color-success-subtle`    | `green-50`                                                                       | `green-900`                                                               |
| `--ul-color-success-text`      | `green-700`                                                                      | `green-300`                                                               |
| `--ul-color-warning`           | `amber-400`                                                                      | `amber-400`                                                               |
| `--ul-color-warning-subtle`    | `amber-50`                                                                       | `amber-900`                                                               |
| `--ul-color-warning-text`      | `amber-700`                                                                      | `amber-300`                                                               |
| `--ul-color-danger`            | `red-600`                                                                        | `red-500`                                                                 |
| `--ul-color-danger-hover`      | `red-700`                                                                        | `red-600`                                                                 |
| `--ul-color-danger-active`     | `red-800`                                                                        | `red-700`                                                                 |
| `--ul-color-danger-subtle`     | `red-50`                                                                         | `red-900`                                                                 |
| `--ul-color-danger-text`       | `red-700`                                                                        | `red-300`                                                                 |
| `--ul-color-on-danger`         | `slate-0`                                                                        | `slate-0`                                                                 |
| `--ul-color-info`              | `blue-600`                                                                       | `blue-400`                                                                |
| `--ul-color-info-subtle`       | `blue-50`                                                                        | `blue-900`                                                                |
| `--ul-color-info-text`         | `blue-700`                                                                       | `blue-300`                                                                |
| `--ul-shadow-xs`               | `0 1px 2px 0 rgba(26, 32, 39, 0.05)`                                             | `0 1px 2px 0 rgba(0, 0, 0, 0.3)`                                          |
| `--ul-shadow-sm`               | `0 1px 3px 0 rgba(26, 32, 39, 0.08), 0 1px 2px -1px rgba(26, 32, 39, 0.06)`      | `0 1px 3px 0 rgba(0, 0, 0, 0.35), 0 1px 2px -1px rgba(0, 0, 0, 0.3)`      |
| `--ul-shadow-md`               | `0 4px 8px -2px rgba(26, 32, 39, 0.08), 0 2px 4px -2px rgba(26, 32, 39, 0.05)`   | `0 4px 8px -2px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)`    |
| `--ul-shadow-lg`               | `0 12px 24px -6px rgba(26, 32, 39, 0.12), 0 4px 8px -4px rgba(26, 32, 39, 0.06)` | `0 12px 24px -6px rgba(0, 0, 0, 0.5), 0 4px 8px -4px rgba(0, 0, 0, 0.35)` |

## Scales (theme-independent)

| Token                        | Value                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| `--ul-font-family-sans`      | `ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif` |
| `--ul-font-family-mono`      | `ui-monospace, SFMono-Regular, Menlo, Consolas, Liberation Mono, monospace`                    |
| `--ul-font-size-xs`          | `0.75rem`                                                                                      |
| `--ul-font-size-sm`          | `0.875rem`                                                                                     |
| `--ul-font-size-md`          | `1rem`                                                                                         |
| `--ul-font-size-lg`          | `1.125rem`                                                                                     |
| `--ul-font-size-xl`          | `1.25rem`                                                                                      |
| `--ul-font-size-2xl`         | `1.5rem`                                                                                       |
| `--ul-font-size-3xl`         | `1.875rem`                                                                                     |
| `--ul-font-weight-regular`   | `400`                                                                                          |
| `--ul-font-weight-medium`    | `500`                                                                                          |
| `--ul-font-weight-semibold`  | `600`                                                                                          |
| `--ul-font-weight-bold`      | `700`                                                                                          |
| `--ul-line-height-tight`     | `1.25`                                                                                         |
| `--ul-line-height-snug`      | `1.375`                                                                                        |
| `--ul-line-height-normal`    | `1.5`                                                                                          |
| `--ul-line-height-relaxed`   | `1.625`                                                                                        |
| `--ul-letter-spacing-tight`  | `-0.011em`                                                                                     |
| `--ul-letter-spacing-normal` | `0`                                                                                            |
| `--ul-letter-spacing-wide`   | `0.02em`                                                                                       |
| `--ul-spacing-0`             | `0`                                                                                            |
| `--ul-spacing-1`             | `0.25rem`                                                                                      |
| `--ul-spacing-2`             | `0.5rem`                                                                                       |
| `--ul-spacing-3`             | `0.75rem`                                                                                      |
| `--ul-spacing-4`             | `1rem`                                                                                         |
| `--ul-spacing-5`             | `1.25rem`                                                                                      |
| `--ul-spacing-6`             | `1.5rem`                                                                                       |
| `--ul-spacing-8`             | `2rem`                                                                                         |
| `--ul-spacing-10`            | `2.5rem`                                                                                       |
| `--ul-spacing-12`            | `3rem`                                                                                         |
| `--ul-spacing-16`            | `4rem`                                                                                         |
| `--ul-radius-none`           | `0`                                                                                            |
| `--ul-radius-sm`             | `0.25rem`                                                                                      |
| `--ul-radius-md`             | `0.375rem`                                                                                     |
| `--ul-radius-lg`             | `0.625rem`                                                                                     |
| `--ul-radius-xl`             | `0.875rem`                                                                                     |
| `--ul-radius-full`           | `9999px`                                                                                       |
| `--ul-border-width-thin`     | `1px`                                                                                          |
| `--ul-border-width-thick`    | `2px`                                                                                          |
| `--ul-focus-ring-width`      | `2px`                                                                                          |
| `--ul-focus-ring-offset`     | `2px`                                                                                          |
| `--ul-control-height-sm`     | `2rem`                                                                                         |
| `--ul-control-height-md`     | `2.5rem`                                                                                       |
| `--ul-control-height-lg`     | `3rem`                                                                                         |
| `--ul-z-index-base`          | `0`                                                                                            |
| `--ul-z-index-dropdown`      | `1000`                                                                                         |
| `--ul-z-index-sticky`        | `1100`                                                                                         |
| `--ul-z-index-overlay`       | `1200`                                                                                         |
| `--ul-z-index-modal`         | `1300`                                                                                         |
| `--ul-z-index-popover`       | `1400`                                                                                         |
| `--ul-z-index-toast`         | `1500`                                                                                         |
| `--ul-z-index-tooltip`       | `1600`                                                                                         |
| `--ul-duration-instant`      | `0ms`                                                                                          |
| `--ul-duration-fast`         | `120ms`                                                                                        |
| `--ul-duration-normal`       | `180ms`                                                                                        |
| `--ul-duration-slow`         | `280ms`                                                                                        |
| `--ul-easing-standard`       | `cubic-bezier(0.2, 0, 0, 1)`                                                                   |
| `--ul-easing-in`             | `cubic-bezier(0.4, 0, 1, 1)`                                                                   |
| `--ul-easing-out`            | `cubic-bezier(0, 0, 0.2, 1)`                                                                   |
| `--ul-opacity-disabled`      | `0.5`                                                                                          |

## Breakpoints

Mobile-first `min-width` values. CSS can't use custom properties in media queries, so these are
available as TypeScript constants (`breakpoints`, `mediaQueryUp('md')`) and as an internal SCSS
mixin:

| Name  | Min width |
| ----- | --------- |
| `sm`  | 640px     |
| `md`  | 768px     |
| `lg`  | 1024px    |
| `xl`  | 1280px    |
| `2xl` | 1536px    |

## Primitive palette

- **teal**: 50 `#eef7f6` · 100 `#d5ebe8` · 200 `#acd6d2` · 300 `#7dbcb6` · 350 `#5aaba4` · 400 `#549f99` · 500 `#3b847f` · 600 `#2e6b67` · 700 `#275754` · 800 `#224745` · 900 `#1e3b3a` · 950 `#0e2423`
- **slate**: 0 `#ffffff` · 25 `#f8fafb` · 50 `#f2f5f7` · 100 `#e7ecf0` · 200 `#d4dce3` · 300 `#b5c1cc` · 350 `#9aa7b4` · 400 `#8d9bab` · 450 `#7d8c9b` · 500 `#66758a` · 600 `#52606e` · 700 `#404c58` · 800 `#2c353f` · 850 `#232b33` · 900 `#1a2027` · 925 `#161c22` · 950 `#12171c`
- **green**: 50 `#edf7f1` · 100 `#d3ecdd` · 300 `#84c3a0` · 400 `#4fa173` · 600 `#2a6b47` · 700 `#23573b` · 900 `#173a28`
- **amber**: 50 `#fbf5e8` · 100 `#f5e6c3` · 300 `#e3b65d` · 400 `#d49b33` · 600 `#8c6216` · 700 `#6f4e14` · 900 `#3f2d0e`
- **red**: 50 `#fcf0f0` · 100 `#f7dada` · 300 `#e59a9a` · 400 `#d97070` · 500 `#b14648` · 600 `#a33d40` · 700 `#873335` · 800 `#6d292b` · 900 `#4c2021`
- **blue**: 50 `#eef4fb` · 100 `#d6e4f5` · 300 `#8fb3e0` · 400 `#6694cf` · 600 `#3b6196` · 700 `#324f79` · 900 `#1f3049`

## Using tokens in your own CSS

```css
.my-panel {
  padding: var(--ul-spacing-4);
  border: var(--ul-border-width-thin) solid var(--ul-color-border);
  border-radius: var(--ul-radius-lg);
  background: var(--ul-color-surface);
  box-shadow: var(--ul-shadow-sm);
}
```

Your own components then follow theme changes and custom themes automatically.
