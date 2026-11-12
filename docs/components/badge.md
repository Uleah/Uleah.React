# Badge

A compact, non-interactive label for status or metadata.

```tsx
import { Badge } from '@uleah/react';

<Badge variant="success" dot>
  Operational
</Badge>;
```

## Props

Extends native `<span>` attributes. The `ref` points to the `<span>`.

| Prop       | Type                                                                     | Default      | Description                           |
| ---------- | ------------------------------------------------------------------------ | ------------ | ------------------------------------- |
| `variant`  | `'neutral' \| 'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'neutral'`  | Semantic colour                       |
| `size`     | `'sm' \| 'md'`                                                           | `'md'`       | 20 / 24px height                      |
| `dot`      | `boolean`                                                                | `false`      | Decorative status dot (`aria-hidden`) |
| `children` | `ReactNode`                                                              | **required** | The text that carries the meaning     |

## Accessibility

- Colour is never the only signal, so `children` is required. Write text that makes sense on its
  own ("Payment failed", not just a red badge).
- The dot is decorative and hidden from assistive tech.
- For count badges, add context with visually hidden text, for example
  `<Badge>3<span className="ul-visually-hidden"> unread messages</span></Badge>`. Don't use
  `aria-label`: ARIA doesn't allow naming a plain `<span>`, and screen readers often ignore it.
- Text and background pairs meet 4.5:1 in both themes (tested).

## Responsive behaviour

Single line, `max-width: 100%`, truncated with an ellipsis when constrained.

## Customization

Variables: `--ul-badge-bg`, `--ul-badge-color`, `--ul-badge-dot-color`, `--ul-badge-radius`,
`--ul-badge-font-size`, `--ul-badge-padding-x`. See
[customization.md](../customization.md#badge).

## Known limitations

- Subtle (tinted) appearance only. No solid or outline appearance yet.
- Not interactive. A removable "tag" or chip will be a separate component.
