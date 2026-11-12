# Theming

## Theme modes

| Mode       | Behaviour                                                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `'light'`  | Uleah Light: soft cool background, white surfaces, muted teal accent.                                                             |
| `'dark'`   | Uleah Dark: deep blue-grey background, lighter elevated surfaces, turquoise accent. Designed separately, not inverted from Light. |
| `'system'` | Light or Dark, following `prefers-color-scheme`. Updates live when the OS setting changes.                                        |

## How it works

A theme is a set of CSS custom properties applied to a **scope element**:

```html
<div class="ul-theme" data-ul-theme="dark">…</div>
```

`styles.css` defines:

```css
:root {
  /* palette, scales, Light colours (default) */
}
[data-ul-theme='light'],
[data-ul-theme='system'] {
  /* Light colours */
}
[data-ul-theme='dark'] {
  /* Dark colours */
}
@media (prefers-color-scheme: dark) {
  [data-ul-theme='system'] {
    /* Dark colours */
  }
}
.ul-theme {
  color: var(--ul-color-text);
  background-color: var(--ul-color-background);
}
```

Because **CSS resolves System mode**, the correct theme paints before any JavaScript runs.
`UleahProvider` only manages the attribute value.

Components work without any provider. They inherit Light from `:root`.

## `UleahProvider`

```tsx
import { UleahProvider } from '@uleah/react';

<UleahProvider defaultTheme="system">
  <App />
</UleahProvider>;
```

| Prop            | Type                             | Default    | Description                                                                                          |
| --------------- | -------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `theme`         | `'light' \| 'dark' \| 'system'`  | none       | Controlled preference. While set, the provider never changes the theme itself.                       |
| `defaultTheme`  | `ThemeMode`                      | `'system'` | Initial preference when uncontrolled.                                                                |
| `onThemeChange` | `(theme: ThemeMode) => void`     | none       | Called by `setTheme()`.                                                                              |
| `storage`       | `ThemeStorage`                   | none       | Persistence adapter (uncontrolled mode only).                                                        |
| `customTheme`   | `UleahTheme`                     | none       | Token overrides for this scope.                                                                      |
| `nonce`         | `string`                         | none       | CSP nonce for the `<style>` element generated from `customTheme`.                                    |
| ...rest         | `HTMLAttributes<HTMLDivElement>` | none       | Forwarded to the scope `<div>` (`className`, `style`, `id`…). The `ref` points to the scope `<div>`. |

### Reading and changing the theme

```tsx
import { useTheme } from '@uleah/react';

const { theme, resolvedTheme, systemTheme, setTheme } = useTheme();
```

| Field           | Description                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `theme`         | The current preference (`'light' \| 'dark' \| 'system'`).                                                                      |
| `resolvedTheme` | The theme in effect (`'light' \| 'dark'`). For `'system'`, this is `'light'` during SSR and hydration, then the real OS value. |
| `systemTheme`   | The OS preference, or `null` when it's unknown (SSR, or no `matchMedia`).                                                      |
| `setTheme`      | Changes the preference. In controlled mode it only calls `onThemeChange`.                                                      |

`useTheme()` throws if it's used outside a provider. It reads the **nearest** provider.

`useSystemTheme()` is also exported if you only need the OS preference.

### Controlled vs uncontrolled

```tsx
// Uncontrolled: the provider owns the state.
<UleahProvider defaultTheme="light">…</UleahProvider>;

// Controlled: you own the state (e.g. from a cookie, a user setting or a store).
const [mode, setMode] = useState<ThemeMode>('system');
<UleahProvider theme={mode} onThemeChange={setMode}>
  …
</UleahProvider>;
```

## Scoped theming

Providers nest. Each one creates an independent scope with its own state:

```tsx
<UleahProvider theme="light">
  <Page>
    <UleahProvider theme="dark">
      <Sidebar /> {/* always dark */}
    </UleahProvider>
  </Page>
</UleahProvider>
```

- `useTheme()` inside the inner scope controls the inner scope only.
- A nested scope **re-declares all colour tokens** for its mode. Colour overrides from an outer
  `customTheme` don't carry into an inner scope that sets its own `data-ul-theme`. Pass
  `customTheme` to the inner provider as well. Scale tokens (radius, fonts and so on) do inherit.

### Without React

The attribute contract also works in static HTML, server templates or other frameworks:

```html
<body class="ul-theme" data-ul-theme="system">
  …
</body>
```

## Persistence

Uleah **never** reads or writes storage unless you pass a `storage` adapter.

```tsx
import { createLocalStorageThemeStorage, UleahProvider } from '@uleah/react';

// Create it once at module scope so its identity stays stable.
const storage = createLocalStorageThemeStorage({ key: 'my-app-theme' }); // default key: 'ul-theme'

<UleahProvider storage={storage}>…</UleahProvider>;
```

- The adapter is read **after mount**, never during render, so SSR output doesn't depend on it.
- Invalid stored values are ignored. If storage is unavailable (private mode, quota), it fails
  silently.
- The localStorage adapter syncs between tabs through the `storage` event.

Custom adapters implement `ThemeStorage`:

```ts
interface ThemeStorage {
  get(): ThemeMode | null; // client only
  set(theme: ThemeMode): void;
  subscribe?(callback: (theme: ThemeMode | null) => void): () => void;
}
```

`storage` is ignored in controlled mode. When you control `theme`, you persist it yourself.

## SSR

- The provider calls no browser APIs during render. `matchMedia` is read through
  `useSyncExternalStore` with a server snapshot of `null`.
- The server renders `data-ul-theme` with the preference (for example `"system"`), and CSS picks
  Light or Dark. **There's no flash and no hydration mismatch for System mode.**
- `resolvedTheme` is `'light'` on the server and during hydration when the preference is
  `'system'`. Don't render different markup based on it during the first render.
- **Stored preferences and SSR:** with `storage`, the server can't know the stored value, so the
  first paint uses `defaultTheme` and then switches after hydration. To avoid that, store the
  preference in a **cookie**, read it on the server and pass it as the controlled `theme` prop:

```tsx
// e.g. Next.js App Router (server component)
const theme = (await cookies()).get('theme')?.value ?? 'system';
return <ThemeShell initialTheme={theme}>{children}</ThemeShell>; // client component using `theme`
```

## Custom themes

A custom theme layers overrides on top of the official themes:

```ts
import { defineTheme } from '@uleah/react';

export const brand = defineTheme({
  tokens: {                         // every mode
    fontFamilySans: '"Inter", system-ui, sans-serif',
    radiusMd: '0.5rem',
    radiusLg: '0.875rem',
  },
  light: {                          // only when Light is in effect (incl. System→Light)
    colorPrimary: '#1f6f8b',
    colorPrimaryHover: '#195a71',
    colorPrimaryActive: '#134657',
    colorFocus: '#1f6f8b',
  },
  dark: {                           // only when Dark is in effect (incl. System→Dark)
    colorPrimary: '#6cb4cc',
    colorPrimaryHover: '#8cc5d8',
    colorPrimaryActive: '#acd6e4',
    colorOnPrimary: '#0b1a20',
    colorFocus: '#6cb4cc',
  },
  cssVariables: {                   // raw custom properties, e.g. component variables
    '--ul-button-radius': '999px',
  },
});

<UleahProvider customTheme={brand}>…</UleahProvider>;
```

- Keys are the camelCase form of the token names in [tokens.md](tokens.md), for example
  `colorPrimary` → `--ul-color-primary` and `fontSize2xl` → `--ul-font-size-2xl`. TypeScript
  rejects unknown keys.
- The provider generates a small `<style>` element scoped to its own scope element. Mode-specific
  overrides use the same `[data-ul-theme]` and media-query contract, so they also work in System
  mode during SSR.
- Values are inserted as CSS text. `{ } ; < >` are stripped so a value can't break out of its
  declaration. Don't pass untrusted user input as theme values.
- Declare themes at module scope (or memoize them). A new object on every render regenerates the
  stylesheet.
- **Your responsibility:** when you change colours, check the contrast pairs listed in
  [accessibility.md](accessibility.md#colour-contrast).

### Plain CSS alternative

Every token is a CSS custom property, so a stylesheet works too:

```css
:root,
[data-ul-theme='light'],
[data-ul-theme='system'] {
  --ul-color-primary: #1f6f8b;
}
[data-ul-theme='dark'] {
  --ul-color-primary: #6cb4cc;
}
@media (prefers-color-scheme: dark) {
  [data-ul-theme='system'] {
    --ul-color-primary: #6cb4cc;
  }
}
```

Load it **after** `@uleah/react/styles.css`. The selectors have the same specificity, so the
later one wins.
