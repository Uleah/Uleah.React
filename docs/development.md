# Development

## Setup

```bash
corepack enable        # makes the pinned pnpm version available
pnpm install
```

Requires Node ≥ 20.19 (22 is recommended; see `.nvmrc`). The repository uses **pnpm** only.
Commit `pnpm-lock.yaml` whenever dependencies change.

## Scripts

| Script                         | What it does                                                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm dev`                     | Playground (`examples/playground`) at http://localhost:5173, consuming `src/` directly                                                                       |
| `pnpm storybook`               | Storybook at http://localhost:6006                                                                                                                           |
| `pnpm build-storybook`         | Static Storybook in `storybook-static/`                                                                                                                      |
| `pnpm test`                    | All Vitest suites once                                                                                                                                       |
| `pnpm test:watch`              | Vitest in watch mode                                                                                                                                         |
| `pnpm test:coverage`           | Coverage report (V8) in `coverage/`                                                                                                                          |
| `pnpm typecheck`               | `tsc --noEmit` over source, tests, stories and config                                                                                                        |
| `pnpm lint`                    | ESLint (typescript-eslint strict, react-hooks, jsx-a11y, storybook)                                                                                          |
| `pnpm format` / `format:check` | Prettier                                                                                                                                                     |
| `pnpm build`                   | Clean, then `vite build` (ESM) + `tsc` (declarations) + `sass` (CSS) into `dist/`                                                                            |
| `pnpm verify:package`          | Checks the built package: exports, runtime import, no bundled React, CSS content, tarball contents, and consumer type-checking with `nodenext` and `bundler` |

## Project layout

```
src/
  components/<Name>/      Name.tsx, Name.types.ts, _Name.scss, Name.test.tsx, Name.stories.tsx, index.ts
  foundations/            token-name contract and breakpoints (TypeScript)
  theme/                  UleahProvider, useTheme, storage, custom-theme compiler
  styles/
    tokens/               primitive palette, scales
    themes/               Light, Dark, and the emitter that writes custom properties
    abstracts/            internal SCSS mixins (focus ring, transitions, breakpoints)
    base/                 internal utilities (.ul-visually-hidden)
    index.scss            → dist/styles.css
    base.scss             → dist/base.css (opt-in)
  utils/                  internal helpers (not exported)
  test/                   test setup and helpers
tests/
  accessibility/          axe audit, token contrast
  styles/                 global-selector audit, token contract
  package/                public API surface
examples/playground/      Vite sandbox app
docs/                     documentation
scripts/verify-package.mjs
```

## Adding a component

1. Create `src/components/<Name>/` with the files listed above.
2. Use only semantic tokens and scales. Expose public `--ul-<name>-*` variables with fallbacks,
   and never declare them in Uleah CSS. Keep internal variables under `--_ul-<name>-*`.
3. Forward `ref`, spread native props, merge `className`.
4. `@use` the stylesheet from `src/styles/index.scss`, and export the component from
   `src/components/index.ts`.
5. Add tests (behaviour + accessibility), stories (variants, sizes, states, customization) and
   `docs/components/<name>.md`.
6. Update the expected export list in `tests/package/public-api.test.ts` and the class list in
   `docs/customization.md`.

## Conventions

- Components: PascalCase. Hooks: `useX`. Types: PascalCase. Utilities: camelCase.
- CSS classes: `ul-` + BEM (`ul-card__title`, `ul-button--primary`). Custom properties: `--ul-`.
- Relative imports in `src/` use explicit `.js` extensions so the emitted declarations resolve
  under `nodenext`.

## Releasing

Releases are published to npm from GitHub Actions (`.github/workflows/publish.yml`) when a `v*`
tag is pushed, using npm Trusted Publishing (OIDC, no tokens). The step-by-step process,
including the one-time manual first publish, is in [releasing.md](releasing.md).
