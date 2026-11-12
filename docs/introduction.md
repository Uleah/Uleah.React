# Introduction

Uleah is a design system. Uleah.React is its native React implementation.

## What you get

- **Design tokens** exposed as CSS custom properties (`--ul-*`): a primitive cool-toned palette,
  semantic colour roles, and scales for typography, spacing, radii, borders, shadows, z-index,
  control heights and motion.
- **Two official themes**, Light and Dark, each designed on its own terms, plus **System** mode,
  which follows the OS.
- **`UleahProvider`**, which gives you controlled or uncontrolled theme state, nested (scoped)
  themes, optional persistence and typed custom themes.
- **Four initial components**: Button, Input, Card and Badge.

## Mental model

```
Primitive palette        --ul-palette-teal-600         (raw values, don't use in components)
        │
        ▼
Semantic tokens          --ul-color-primary            (per theme: Light / Dark)
        │
        ▼
Component variables      --ul-button-bg                (public, optional, never declared by Uleah)
        │
        ▼
Component styles         .ul-button { background: var(--ul-button-bg, <variant default>) }
```

Components read **semantic tokens** only. A theme is just a set of semantic token values applied
to a scope element (`[data-ul-theme]`). Customization means overriding tokens or component
variables at whichever scope you need.

## Next

- [Installation](installation.md)
- [Theming](theming.md)
- [Design tokens](tokens.md)
- [Customization](customization.md)
- [Accessibility](accessibility.md)
- [Responsive design](responsive.md)
- Components: [Button](components/button.md) · [Input](components/input.md) ·
  [Card](components/card.md) · [Badge](components/badge.md)
