# Uleah.React

**Uleah** is a design system with a calm, cool-toned visual language: muted turquoise,
desaturated teal and blue-grey on soft, cool neutrals. **Uleah.React** is its native React
implementation, a small, typed, accessible component library built on design tokens and CSS
custom properties.

> **Status: 0.1.0, foundation release.** The architecture, token system, theming and four
> initial components (Button, Input, Card, Badge) are in place. The API may still change before
> 1.0 (pre-1.0 minor versions may contain breaking changes).

---

## Contents

- [The Uleah ecosystem](#the-uleah-ecosystem)
- [Design philosophy](#design-philosophy)
- [Supported technologies](#supported-technologies)
- [Installation](#installation)
- [Basic usage](#basic-usage)
- [Styles](#styles)
- [Themes](#themes)
- [Custom themes](#custom-themes)
- [Component customization](#component-customization)
- [Components](#components)
- [Accessibility](#accessibility)
- [Development](#development)
- [Limitations](#current-limitations)
- [Roadmap](#roadmap)

## The Uleah ecosystem

Uleah is planned as a family of native implementations sharing one visual language and one
**design-token contract**:

| Implementation | Status              |
| -------------- | ------------------- |
| Uleah.React    | This repository     |
| Uleah.Blazor   | Separate repository |
| Uleah.Angular  | Planned             |

The implementations share **concepts**: token names, semantic roles, theme modes and the
`data-ul-theme` attribute contract. They do not share runtime code, and each one uses idiomatic
APIs for its framework. See [docs/tokens.md](docs/tokens.md) for the contract that other
implementations reproduce.

## Design philosophy

- **Consistency:** every visual decision comes from a token, and components never hardcode
  theme colours.
- **Accessibility:** semantic HTML first, visible focus, tested contrast and reduced-motion
  support.
- **Predictable APIs:** native HTML props pass through. Variants and sizes use the same
  vocabulary across components.
- **Customization in layers:** official themes → custom themes → per-component CSS variables.
- **No global side effects:** styles are scoped to `.ul-*` classes and `[data-ul-theme]` scopes.
  There's no reset unless you opt in.
- **Small and dependency-free:** the only runtime requirement is React. There's no CSS-in-JS
  runtime and no UI framework underneath.

## Supported technologies

| Requirement   | Version                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------- |
| React         | `^18.2.0 \|\| ^19.0.0` (peer dependency)                                                           |
| TypeScript    | Types ship with the package; strict mode supported                                                 |
| Module format | ESM only (see [docs/installation.md](docs/installation.md#module-format))                          |
| Browsers      | Current evergreen browsers (uses `:focus-visible`, `:not()` selector lists, CSS custom properties) |
| SSR           | Supported. System mode resolves in CSS with no hydration mismatch                                  |

## Installation

```bash
pnpm add @uleah/react
# or: npm install @uleah/react
```

## Basic usage

```tsx
import '@uleah/react/styles.css';
import {
  UleahProvider,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from '@uleah/react';

export function App() {
  return (
    <UleahProvider theme="system">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <Input label="Display name" helperText="Shown on your public profile." />
        </CardContent>
      </Card>
      <Button variant="primary" size="md">
        Save changes
      </Button>
    </UleahProvider>
  );
}
```

## Styles

Uleah doesn't inject styles from JavaScript. Import the stylesheet once at your app's entry point:

```ts
import '@uleah/react/styles.css'; // required: tokens, themes, components
import '@uleah/react/base.css'; // optional: font + box-sizing inside theme scopes
```

`styles.css` contains no element selectors and no reset. `base.css` is opt-in and only affects
elements inside a `.ul-theme` scope.

## Themes

Uleah ships two independently designed themes, **Light** and **Dark**, plus **System**, which
follows the OS preference.

```tsx
<UleahProvider defaultTheme="system">...</UleahProvider> // uncontrolled
<UleahProvider theme={mode} onThemeChange={setMode}>...</UleahProvider> // controlled
```

```tsx
import { useTheme } from '@uleah/react';

function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <Button variant="ghost" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
      Theme: {theme}
    </Button>
  );
}
```

- **System mode is resolved in CSS** (`@media (prefers-color-scheme: dark)`). The first paint is
  correct without JavaScript, and server-rendered HTML hydrates without a mismatch.
- **Scoped theming:** providers can be nested, so one section of a page can stay dark while the
  rest is light.
- **Persistence is opt-in:** pass `storage={createLocalStorageThemeStorage()}`, or write your own
  adapter (cookie, user profile API). Uleah never touches storage otherwise.
- **No provider needed for static theming:** `<div class="ul-theme" data-ul-theme="dark">` works
  with plain HTML.

Full guide, including SSR: [docs/theming.md](docs/theming.md).

## Custom themes

Override any semantic token without touching Uleah's source. The overrides are fully typed:

```tsx
import { defineTheme, UleahProvider } from '@uleah/react';

const brand = defineTheme({
  tokens: { fontFamilySans: '"Inter", system-ui, sans-serif', radiusMd: '0.5rem' }, // all modes
  light: { colorPrimary: '#1f6f8b', colorPrimaryHover: '#195a71' }, // light only
  dark: { colorPrimary: '#6cb4cc', colorOnPrimary: '#0b1a20' }, // dark only
  cssVariables: { '--ul-button-radius': '999px' }, // component-level variables
});

<UleahProvider customTheme={brand}>...</UleahProvider>;
```

You can also override the same tokens in plain CSS:

```css
:root {
  --ul-color-primary: #1f6f8b;
}
```

See [docs/theming.md](docs/theming.md#custom-themes) and the token reference in
[docs/tokens.md](docs/tokens.md).

## Component customization

You can customize components at three levels, and every level is public API:

1. **Props:** `variant`, `size` and native HTML attributes.
2. **`className` / `style`:** passed to the component's root element.
3. **Component CSS variables:** for example `--ul-button-radius`, `--ul-card-padding` and
   `--ul-input-border-color`. Uleah never declares these, so a value set on the element or on
   any ancestor always wins, with no specificity battles.

```tsx
<Button style={{ '--ul-button-radius': '999px' } as React.CSSProperties}>Pill</Button>
```

```css
.checkout {
  --ul-button-height: 3.25rem;
}
```

The full list of public variables and stable class names is in
[docs/customization.md](docs/customization.md).

## Components

| Component    | What it is                                                                                      | Docs                                                           |
| ------------ | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `Button`     | Native button: 5 variants, 3 sizes, loading state                                               | [docs/components/button.md](docs/components/button.md)         |
| `Input`      | Labelled text field with helper and error text                                                  | [docs/components/input.md](docs/components/input.md)           |
| `Card`       | Composable surface (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`)  | [docs/components/card.md](docs/components/card.md)             |
| `Badge`      | Compact status label with an optional dot                                                       | [docs/components/badge.md](docs/components/badge.md)           |
| `Dropdown`   | Select-only combobox: single/multiple selection, arrow buttons, adaptive popup                  | [docs/components/dropdown.md](docs/components/dropdown.md)     |
| `DatePicker` | Date or date-range field with an adaptive calendar popup, presets and locales (also `Calendar`) | [docs/components/datepicker.md](docs/components/datepicker.md) |

## Accessibility

Uleah targets **WCAG 2.2 AA** where it applies. What is currently verified:

- Semantic, native elements (`<button>`, `<input>` + `<label>`) with no redundant ARIA.
- A visible `:focus-visible` ring built with `outline`, so it survives forced-colours mode.
- Automated **contrast tests** on the token values for both themes: 4.5:1 for text, 3:1 for
  control borders and focus rings.
- **axe-core** audits of every component in every theme (structural rules; jsdom can't measure
  rendered contrast).
- Every control height is at least 32px, above the WCAG 2.2 minimum target size of 24px.
- Motion collapses to 0ms under `prefers-reduced-motion`.

Passing automated tests doesn't mean full WCAG conformance. Manual screen-reader testing hasn't
been done yet. See [docs/accessibility.md](docs/accessibility.md) for details and known
limitations.

## Development

This repository uses **pnpm** (the version is pinned in `package.json`) and Node 20.19+ (22 is
recommended; see `.nvmrc`).

```bash
pnpm install          # install dependencies
pnpm dev              # playground at http://localhost:5173 (examples/playground)
pnpm storybook        # Storybook at http://localhost:6006
pnpm test             # unit, theme, accessibility and stylesheet tests
pnpm test:watch       # watch mode
pnpm test:coverage    # coverage report
pnpm typecheck        # TypeScript strict check
pnpm lint             # ESLint (typescript-eslint, react-hooks, jsx-a11y)
pnpm format           # Prettier (format:check in CI)
pnpm build            # build dist/ (ESM, .d.ts, styles.css, base.css)
pnpm verify:package   # check the built package (run after build)
pnpm build-storybook  # static Storybook in storybook-static/
```

CI (`.github/workflows/ci.yml`) runs format, lint, typecheck, tests, build, package
verification and the Storybook build on pushes to `main` and on pull requests. It also tests
against React 18. CI never publishes. Releases are published by
`.github/workflows/publish.yml` when a `v*` tag is pushed (see [docs/releasing.md](docs/releasing.md)).

More detail: [docs/development.md](docs/development.md) · Architecture:
[docs/architecture.md](docs/architecture.md)

## Current limitations

- Four components. There are no overlays (dialog, popover, tooltip), no form controls beyond a
  text input, and no layout primitives yet.
- ESM only. There's no CommonJS build ([why](docs/installation.md#module-format)).
- `UleahProvider` always renders a wrapper `<div>` (the theme scope).
- With `storage` and SSR, the stored preference is applied after hydration. Use a cookie with
  the controlled `theme` prop to avoid the switch ([details](docs/theming.md#ssr)).
- Breakpoints are constants, not CSS variables, because CSS can't use variables inside media
  queries.
- Right-to-left layouts haven't been tested. Components mostly use flexbox and gaps, so
  they're largely direction-agnostic, but this hasn't been verified.
- Manual assistive-technology testing hasn't been done.

## Roadmap

Near term:

1. Form family: Textarea, Select, Checkbox, Radio, Switch, and a shared Field.
2. Feedback: Alert, Spinner, Skeleton.
3. Overlays with focus management: Dialog, Popover, Tooltip.
4. Visual regression testing (Storybook + Playwright) and manual screen-reader passes.
5. A machine-readable token export (JSON) for Uleah.Angular and Uleah.Blazor.
6. Release tooling for changelogs and version bumps (for example changesets).

## License

[MIT](LICENSE)
