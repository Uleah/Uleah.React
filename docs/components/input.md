# Input

A labelled single-line text field built on the native `<input>`.

```tsx
import { Input } from '@uleah/react';

<Input label="Email" type="email" helperText="We never share it." required />;
```

## Props

Extends native `<input>` attributes, except `size`, which is replaced by the visual size below.
Native props (`value`, `onChange`, `name`, `type`, `placeholder`, `autoComplete`…) go to the
`<input>`. The `ref` points to the `<input>`.

| Prop                  | Type                   | Default        | Description                                                                            |
| --------------------- | ---------------------- | -------------- | -------------------------------------------------------------------------------------- |
| `label`               | `ReactNode`            | none           | Visible label (`<label for>`). If you omit it, pass `aria-label` or `aria-labelledby`. |
| `hideLabel`           | `boolean`              | `false`        | Hides the label visually but keeps it as the accessible name                           |
| `helperText`          | `ReactNode`            | none           | Text below the field, linked with `aria-describedby`                                   |
| `error`               | `ReactNode`            | none           | A message (shown instead of `helperText`) or `true`. Sets `aria-invalid`.              |
| `size`                | `'sm' \| 'md' \| 'lg'` | `'md'`         | 32 / 40 / 48px minimum height                                                          |
| `className` / `style` |                        | none           | Applied to the **root wrapper** (`.ul-field`)                                          |
| `inputClassName`      | `string`               | none           | Applied to the `<input>`                                                               |
| `id`                  | `string`               | auto (`useId`) | Used for label association                                                             |

## Controlled and uncontrolled

It behaves exactly like a plain `<input>`:

```tsx
<Input label="Name" defaultValue="Ada" />                          // uncontrolled
<Input label="Name" value={name} onChange={(e) => setName(e.target.value)} /> // controlled
```

## States

| State     | How        | Visual                                                            |
| --------- | ---------- | ----------------------------------------------------------------- |
| Required  | `required` | Native `required` plus a decorative `*` after the label           |
| Disabled  | `disabled` | Not focusable, reduced opacity                                    |
| Read-only | `readOnly` | Focusable and selectable, sunken background                       |
| Invalid   | `error`    | Danger border and focus ring, message in `--ul-color-danger-text` |
| Focus     |            | Focus-coloured border and outline                                 |

## Accessibility

- The label is associated through `for`/`id`. The helper or error message is linked through
  `aria-describedby` and merged with any `aria-describedby` you pass.
- `aria-invalid="true"` is set when `error` is truthy.
- The required asterisk is `aria-hidden`. Screen readers announce "required" from the native
  attribute.
- Error messages aren't live-announced when they appear (see
  [accessibility.md](../accessibility.md#known-limitations)).

## Responsive behaviour

Fills its container (`width: 100%`) and can shrink in flex and grid layouts. Labels and messages
wrap.

## Customization

Variables: `--ul-input-height`, `-padding-x`, `-font-size`, `-radius`, `-bg`, `-color`,
`-border-color`, `-border-color-hover`, `-border-color-invalid`, `--ul-field-gap`,
`--ul-field-label-color`. See [customization.md](../customization.md#input).

## Known limitations

- Single-line text types only (`text`, `email`, `password`, `search`, `url`, `tel`, `number`…).
  Checkbox, radio, range, file and colour types aren't styled for, so use dedicated components
  when they exist.
- No prefix or suffix adornments, character counter or clear button yet.
- Textarea and Select are separate future components.
