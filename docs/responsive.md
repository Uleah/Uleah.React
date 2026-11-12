# Responsive design

Uleah components are **fluid by default**. None has a fixed width, and they adapt to the
container they're placed in. Page-level layout (grids, columns, breakpoints) belongs to your
application.

## Breakpoints

| Name  | Min width |
| ----- | --------- |
| `sm`  | 640px     |
| `md`  | 768px     |
| `lg`  | 1024px    |
| `xl`  | 1280px    |
| `2xl` | 1536px    |

```ts
import { breakpoints, mediaQueryUp } from '@uleah/react';

window.matchMedia(mediaQueryUp('md')).matches; // (min-width: 768px)
```

CSS custom properties can't be used inside `@media` queries, so breakpoints aren't exposed as
`--ul-*` variables.

## Component behaviour

| Component | Behaviour                                                                                                                                                                               |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button    | Inline by default. Long labels **wrap** instead of overflowing (`max-width: 100%`). `fullWidth` fills the container.                                                                    |
| Input     | Always fills its container (`width: 100%`, `min-width: 0` so it can shrink inside flex and grid). Labels and messages wrap.                                                             |
| Card      | Fills its container. `padding="md"` and `padding="lg"` increase from the `sm` breakpoint upwards. Long words wrap (`overflow-wrap: anywhere`). Footer actions wrap onto multiple lines. |
| Badge     | Inline, single line, truncated with an ellipsis if constrained.                                                                                                                         |

## Your responsibility

- Arrange cards in grids. `repeat(auto-fill, minmax(min(100%, 240px), 1fr))` works well (see the
  Storybook story "Card › Responsive: fluid grid").
- Choose control sizes that suit touch devices.
- Give flex children `min-width: 0` when they contain inputs, if your layout needs them to shrink.
