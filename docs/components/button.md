# Button

A native `<button>` with Uleah variants, sizes and a loading state.

```tsx
import { Button } from '@uleah/react';

<Button variant="primary" size="md" onClick={save}>
  Save changes
</Button>;
```

## Props

Extends all native `<button>` attributes (`ButtonHTMLAttributes<HTMLButtonElement>`). The `ref`
points to the `<button>`.

| Prop                    | Type                                                           | Default        | Description                                                                    |
| ----------------------- | -------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `variant`               | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'`    | Visual style                                                                   |
| `size`                  | `'sm' \| 'md' \| 'lg'`                                         | `'md'`         | 32 / 40 / 48px minimum height                                                  |
| `loading`               | `boolean`                                                      | `false`        | Shows a spinner and blocks activation                                          |
| `loadingLabel`          | `string`                                                       | `'Loading'`    | Visually hidden text announced while loading                                   |
| `fullWidth`             | `boolean`                                                      | `false`        | Fills the container width                                                      |
| `startIcon` / `endIcon` | `ReactNode`                                                    | none           | Decorative content around the label (`aria-hidden`)                            |
| `type`                  | `'button' \| 'submit' \| 'reset'`                              | **`'button'`** | Differs from the HTML default (`submit`) to prevent accidental form submission |

## Variants

- **primary**: the main action. Filled with `--ul-color-primary`.
- **secondary**: a neutral filled action.
- **outline**: a bordered surface for secondary actions next to a primary one.
- **ghost**: no background until hover. For toolbars and low-emphasis actions.
- **danger**: destructive actions.

## States

| State          | Behaviour                                                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hover / active | Background shifts to the `-hover` / `-active` tokens                                                                                                       |
| Focus          | `:focus-visible` ring (keyboard only)                                                                                                                      |
| Disabled       | Native `disabled`: not focusable, not clickable, shown at reduced opacity                                                                                  |
| Loading        | Focusable. `aria-busy` + `aria-disabled`. Clicks and form submission are blocked. A spinner replaces `startIcon`. The label stays, so the width is stable. |

## Accessibility

- Native button semantics and keyboard support (Enter and Space).
- Icon-only buttons need an accessible name: `<Button aria-label="Close" startIcon={<X />} />`.
  (There's no dedicated icon-button sizing yet.)
- In the loading state, the accessible name becomes "_label_ _loadingLabel_", for example
  "Save Loading".

## Responsive behaviour

Inline by default. Long labels wrap within `max-width: 100%`. Use `fullWidth` for stacked mobile
layouts.

## Customization

Variables: `--ul-button-height`, `-padding-x`, `-gap`, `-font-size`, `-font-weight`, `-radius`,
`-bg`, `-bg-hover`, `-bg-active`, `-color`, `-border-color`, `-shadow`. See
[customization.md](../customization.md#button).

```tsx
<Button
  style={
    {
      '--ul-button-bg': 'var(--ul-color-info)',
      '--ul-button-bg-hover': 'var(--ul-color-info-text)',
      '--ul-button-bg-active': 'var(--ul-color-info-text)',
    } as React.CSSProperties
  }
>
  Custom tone
</Button>
```

## Known limitations

- It always renders a `<button>`. There's no link (`<a>`) rendering yet, so for navigation, style
  your own link with tokens for now.
- No icon-only size variant, and no button group.
- The loading state doesn't announce completion. Use a live region if that matters.
