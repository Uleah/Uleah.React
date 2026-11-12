# Card

A surface that groups related content, composed from small parts.

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
} from '@uleah/react';

<Card as="section" aria-labelledby="plan-title" variant="elevated">
  <CardHeader>
    <CardTitle as="h2" id="plan-title">
      Team plan
    </CardTitle>
    <CardDescription>For small teams.</CardDescription>
  </CardHeader>
  <CardContent>…</CardContent>
  <CardFooter>
    <Button variant="ghost">Compare</Button>
    <Button>Choose</Button>
  </CardFooter>
</Card>;
```

## Parts

| Component         | Element         | Props                                                                |
| ----------------- | --------------- | -------------------------------------------------------------------- |
| `Card`            | `div` (or `as`) | `variant`, `padding`, `as`, plus native attributes                   |
| `CardHeader`      | `div`           | native                                                               |
| `CardTitle`       | `h3` (or `as`)  | `as: 'h1'…'h6' \| 'p'`                                               |
| `CardDescription` | `p`             | native                                                               |
| `CardContent`     | `div`           | native                                                               |
| `CardFooter`      | `div`           | `align: 'start' \| 'center' \| 'end' \| 'between'` (default `'end'`) |

Every part forwards its `ref` and merges `className`. All parts are optional. Use only the ones
you need.

## Card props

| Prop      | Type                                                 | Default      |
| --------- | ---------------------------------------------------- | ------------ |
| `variant` | `'outlined' \| 'elevated' \| 'filled'`               | `'outlined'` |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'`                     | `'md'`       |
| `as`      | `'div' \| 'section' \| 'article' \| 'aside' \| 'li'` | `'div'`      |

- **outlined**: a surface with a subtle border.
- **elevated**: a raised surface with `--ul-shadow-md`.
- **filled**: a tinted background with no border, for grouping inside other surfaces.

## Accessibility

- Cards aren't interactive. A plain `div` card has no semantics.
- For a meaningful region, use `as="section"` (or `article`) and `aria-labelledby` pointing at the
  `CardTitle` `id`.
- Choose a `CardTitle` level that fits your page outline. The default `h3` is only a default.
- For lists of cards, use `as="li"` inside a `<ul>`. List markers are removed.

## Responsive behaviour

The card fills its container. `md` and `lg` padding grow from the `sm` breakpoint (640px). Footer
actions wrap. Long words break instead of overflowing. Grid layout is up to the application (see
[responsive.md](../responsive.md)).

## Customization

Variables: `--ul-card-padding`, `--ul-card-gap`, `--ul-card-radius`, `--ul-card-bg`,
`--ul-card-border-color`, `--ul-card-shadow`. See
[customization.md](../customization.md#card).

## Known limitations

- There's no clickable or link card pattern yet. Wrapping a whole card in a link or button needs
  careful accessibility design, which is planned.
- No media or image slot.
