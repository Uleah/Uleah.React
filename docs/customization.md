# Customization

Uleah offers three levels of customization. Everything on this page is **public API** and
follows semantic versioning.

| Level                  | Scope                                | Mechanism                                                                                                        |
| ---------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| 1. Official themes     | Whole app or a section               | `<UleahProvider theme="light \| dark \| system">`                                                                |
| 2. Custom themes       | Whole app or a section               | `customTheme={defineTheme({...})}` or overriding `--ul-*` tokens in CSS ([theming.md](theming.md#custom-themes)) |
| 3. Component overrides | One component, a group, or a section | Props, `className`, `style`, component CSS variables                                                             |

## Level 3: component overrides

### Component CSS variables

Each component reads optional **public variables**. Uleah **never declares them**. It only reads
them with a fallback:

```css
.ul-button {
  border-radius: var(--ul-button-radius, var(--ul-radius-md));
}
```

So a value you set always wins, whether it's set:

- on the component (`style` or `className`),
- on any ancestor (a section, a page, a `customTheme.cssVariables` entry), or
- on `:root`.

No `!important` and no specificity tricks are needed.

```tsx
// One button
<Button style={{ '--ul-button-radius': '999px' } as React.CSSProperties}>Pill</Button>

// Every button inside a toolbar
<div className="toolbar">…</div>
```

```css
.toolbar {
  --ul-button-height: var(--ul-control-height-sm);
  --ul-button-padding-x: var(--ul-spacing-2);
}
```

#### Button

| Variable                                      | Default                                       |
| --------------------------------------------- | --------------------------------------------- |
| `--ul-button-height`                          | per size: `--ul-control-height-sm/md/lg`      |
| `--ul-button-padding-x`                       | per size: `--ul-spacing-3` / `-4` / `-6`      |
| `--ul-button-gap`                             | per size: `--ul-spacing-1` / `-2` / `-2`      |
| `--ul-button-font-size`                       | per size: `--ul-font-size-sm` / `-sm` / `-md` |
| `--ul-button-font-weight`                     | `--ul-font-weight-medium`                     |
| `--ul-button-radius`                          | `--ul-radius-md`                              |
| `--ul-button-bg` / `-bg-hover` / `-bg-active` | per variant                                   |
| `--ul-button-color`                           | per variant                                   |
| `--ul-button-border-color`                    | per variant                                   |
| `--ul-button-shadow`                          | per variant                                   |

> Setting `--ul-button-bg` applies to every variant inside that scope. Set
> `--ul-button-bg-hover` and `--ul-button-bg-active` as well, or the hover and active states keep
> the variant's defaults.

#### Input

| Variable                          | Default                                       |
| --------------------------------- | --------------------------------------------- |
| `--ul-input-height`               | per size: `--ul-control-height-sm/md/lg`      |
| `--ul-input-padding-x`            | per size: `--ul-spacing-2` / `-3` / `-4`      |
| `--ul-input-font-size`            | per size: `--ul-font-size-sm` / `-sm` / `-md` |
| `--ul-input-radius`               | `--ul-radius-md`                              |
| `--ul-input-bg`                   | `--ul-color-surface`                          |
| `--ul-input-color`                | `--ul-color-text`                             |
| `--ul-input-border-color`         | `--ul-color-border-strong`                    |
| `--ul-input-border-color-hover`   | `--ul-color-text-muted`                       |
| `--ul-input-border-color-invalid` | `--ul-color-danger`                           |
| `--ul-field-gap`                  | `--ul-spacing-1` (label ↔ input ↔ message)    |
| `--ul-field-label-color`          | `--ul-color-text`                             |

Border priority: invalid or focus › hover › your `--ul-input-border-color`. An invalid field
always shows its error border.

#### Card

| Variable                 | Default                                           |
| ------------------------ | ------------------------------------------------- |
| `--ul-card-padding`      | per `padding` prop (responsive for `md` and `lg`) |
| `--ul-card-gap`          | per `padding` prop                                |
| `--ul-card-radius`       | `--ul-radius-lg`                                  |
| `--ul-card-bg`           | per variant                                       |
| `--ul-card-border-color` | per variant                                       |
| `--ul-card-shadow`       | per variant                                       |

#### Badge

| Variable               | Default            |
| ---------------------- | ------------------ |
| `--ul-badge-bg`        | per variant        |
| `--ul-badge-color`     | per variant        |
| `--ul-badge-dot-color` | per variant        |
| `--ul-badge-radius`    | `--ul-radius-full` |
| `--ul-badge-font-size` | per size           |
| `--ul-badge-padding-x` | per size           |

### `className` and `style`

Every component accepts `className` and `style`, which go to its **root element**:

| Component        | Root element                     | Notes                                                                           |
| ---------------- | -------------------------------- | ------------------------------------------------------------------------------- |
| `Button`         | `<button>`                       |                                                                                 |
| `Input`          | wrapper `<div class="ul-field">` | Use `inputClassName` for the `<input>`. Other native props go to the `<input>`. |
| `Card` and parts | the element itself               |                                                                                 |
| `Badge`          | `<span>`                         |                                                                                 |
| `UleahProvider`  | scope `<div class="ul-theme">`   |                                                                                 |

### Stable class names

These class names are public and safe to target from your CSS:

- `ul-theme`
- `ul-button`, `ul-button--{variant}`, `ul-button--{size}`, `ul-button--full-width`, `ul-button--loading`, `ul-button__label`, `ul-button__icon`, `ul-button__spinner`
- `ul-field`, `ul-field--{size}`, `ul-field--invalid`, `ul-field--disabled`, `ul-field--readonly`, `ul-field__label`, `ul-field__required`, `ul-field__message`, `ul-field__message--error`, `ul-input`
- `ul-card`, `ul-card--{variant}`, `ul-card--padding-{padding}`, `ul-card__header`, `ul-card__title`, `ul-card__description`, `ul-card__content`, `ul-card__footer`, `ul-card__footer--{align}`
- `ul-badge`, `ul-badge--{variant}`, `ul-badge--{size}`, `ul-badge__dot`
- `ul-visually-hidden`

Prefer CSS variables to overriding properties on these classes. Variables keep working when the
internal CSS changes.

### Not public API

- Variables prefixed `--_ul-` (internal plumbing).
- DOM structure beyond the classes listed above (wrapper order, extra spans).
- Uleah's own selector specificity.

## Specificity notes

Uleah selectors are mostly single classes (`.ul-button--primary`). Interaction states use
`:hover`, `:focus-visible` and `:disabled` on top of that. If you override a property such as
`background-color` directly, rather than through a variable, your selector may need to match
those states too. That's one more reason to use the variables.
