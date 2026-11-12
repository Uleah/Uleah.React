# Installation

## Requirements

- `react` and `react-dom` `^18.2.0 || ^19.0.0` (peer dependencies; they're never bundled).
- A bundler or runtime that understands ESM and CSS imports (Vite, Next.js, webpack 5, Parcel,
  Rsbuild, and so on).

## Install

```bash
pnpm add @uleah/react
# or: npm install @uleah/react / yarn add @uleah/react
```

## Import the styles (required)

Components don't import CSS themselves. Add this once at your application's entry point:

```ts
import '@uleah/react/styles.css';
```

| File                      | Contents                                                                                  | Required |
| ------------------------- | ----------------------------------------------------------------------------------------- | -------- |
| `@uleah/react/styles.css` | Tokens, Light/Dark/System themes, all component styles                                    | Yes      |
| `@uleah/react/base.css`   | `font-family`, `font-size`, `line-height`, `box-sizing` for everything inside `.ul-theme` | No       |

Neither file contains element selectors outside a Uleah scope, and neither file contains a
reset. Tests in `tests/styles/` enforce this.

## Wrap your app

```tsx
import { UleahProvider } from '@uleah/react';

root.render(
  <UleahProvider defaultTheme="system">
    <App />
  </UleahProvider>,
);
```

The provider renders a `<div class="ul-theme" data-ul-theme="…">`. It accepts `className`,
`style`, `id` and other div attributes, for example `style={{ minHeight: '100vh' }}`.

## Next.js (App Router) / React Server Components

Every module in the build starts with `"use client"`, so you can import components directly from
Server Components. Import the CSS in `app/layout.tsx`.

## Module format

The package ships **ESM only**, with one file per source module (tree-shakeable), plus `.d.ts`
declarations. The declarations work with `moduleResolution` set to `bundler`, `node16` or
`nodenext`.

There is deliberately no CommonJS build. A dual ESM/CJS package can load two copies of the theme
context in the same app (the "dual package hazard"), which breaks `useTheme()`. Every modern
bundler, Next.js and Vitest consume ESM. Jest needs ESM support or a `transformIgnorePatterns`
entry for `@uleah/react`. If a real consumer needs CJS, we'll revisit this.
