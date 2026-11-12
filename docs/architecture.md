# Architecture

This document records the main architectural decisions and the reasons for them.

## Single package, co-located components

One npm package, `@uleah/react`. Each component folder holds its implementation, types, styles,
tests and stories. Cross-cutting suites (accessibility, stylesheet audits, public API) live in
`tests/`. A monorepo would add tooling cost with no benefit at four components.

## Build

- **Vite library mode**, ESM only, with `preserveModules`, so there's one output file per source
  module and bundlers can drop unused components. React and `react/jsx-runtime` are external.
- Every output module gets a `"use client"` banner for React Server Component compatibility.
- `tsc -p tsconfig.build.json` (NodeNext) emits the declarations.
- The `sass` CLI compiles `src/styles/index.scss` → `dist/styles.css` and `src/styles/base.scss`
  → `dist/base.css`. CSS isn't imported from JS, so consumers control loading order and SSR
  extraction.
- **No CommonJS build**, to avoid the dual-package hazard: two copies of the React context would
  break `useTheme()`.

## Styling

- **SCSS** for authoring (maps, mixins), **CSS custom properties** for everything that changes at
  runtime.
- **Flat, low specificity**: mostly single-class selectors. No cascade layers. Unlayered resets in
  host applications (`button { font: inherit }`) would override layered library styles, so layers
  would make Uleah _less_ predictable.
- **Public component variables are read but never declared**: `var(--ul-button-radius,
var(--ul-radius-md))`. A consumer value set anywhere up the tree wins, with no specificity
  contests. Variants and sizes set private `--_ul-*` variables.
- **No global styles.** Only `:root` custom properties, `[data-ul-theme]` scopes and `.ul-*`
  classes. A test enforces this.

## Theming

- **The theme is an attribute on a scope element** (`data-ul-theme`). The CSS defines Light,
  Dark, and System through `prefers-color-scheme`.
- **System mode is resolved in CSS**, not JavaScript. The first paint is correct during SSR and
  hydration can't mismatch. JavaScript only reports `resolvedTheme` for application logic, through
  `useSyncExternalStore` with a `null` server snapshot.
- **The provider is a scope.** `UleahProvider` renders one `<div class="ul-theme">`. Nesting gives
  scoped themes. The cost is one wrapper element, which is documented.
- **Custom themes compile to a scoped `<style>`** keyed by `useId()`. Inline styles can't express
  per-mode overrides inside a media query, and resolving the mode in JS would bring back SSR
  mismatches. This works the same in React 18 and 19.
- **Persistence is an adapter interface**, read after mount. There's no hard dependency on
  `localStorage`, and the host app can implement cookies or server storage.

## Tokens

Three layers: the palette (`--ul-palette-*`), semantic roles (`--ul-color-*`, `--ul-shadow-*`)
and scales. SCSS maps are the source of truth for values. `src/foundations/tokens.ts` is the
typed list of public names, and a test checks it against the compiled CSS. The same names and
selectors form the contract for Uleah.Angular and Uleah.Blazor ([tokens.md](tokens.md)).

## Trade-offs and known debt

- The token values live in SCSS. A machine-readable export (JSON) for other implementations is a
  planned next step. It isn't needed until a second implementation consumes it.
- Breakpoints are duplicated in SCSS and TypeScript (kept in sync by a test).
- `Card` uses a small cast for its polymorphic `as` ref typing.
- No visual-regression tests yet. Visual checks are done through Storybook.
