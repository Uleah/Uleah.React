# Accessibility

Uleah targets **WCAG 2.2 Level AA** where it applies. This page describes what's implemented,
what's verified automatically, and what isn't verified yet. **Passing automated checks doesn't
make an interface WCAG-conformant.** Conformance depends on how you use the components.

## Principles

- **Native semantics first.** `Button` renders `<button>` and `Input` renders `<input>` with a
  real `<label>`. ARIA is only added where HTML has no equivalent (`aria-busy` for loading,
  `aria-invalid` for errors).
- **Visible focus.** All interactive components use `:focus-visible` with a 2px `outline` in
  `--ul-color-focus`. `outline` stays visible in Windows forced-colours mode.
- **Colour is never the only signal.** Badges require text. Errors show a text message, set
  `aria-invalid` and change the border.
- **Reduced motion.** Transition duration tokens become `0ms` under
  `prefers-reduced-motion: reduce`. The loading spinner keeps rotating, but slowly, because it
  conveys state.

## Colour contrast

`tests/accessibility/contrast.test.ts` compiles the stylesheet, resolves every token for **Light
and Dark**, and asserts:

| Pair                                                           | Minimum                        |
| -------------------------------------------------------------- | ------------------------------ |
| `text`, `text-muted`, `text-subtle` on background / surface    | 4.5:1                          |
| `on-primary` on `primary` / `-hover` / `-active`               | 4.5:1                          |
| `on-secondary` on `secondary` / `-hover`                       | 4.5:1                          |
| `on-danger` on `danger` / `-hover`                             | 4.5:1                          |
| `{status}-text` on `{status}-subtle` (badges, messages)        | 4.5:1                          |
| `primary-text`, `danger-text` on surface                       | 4.5:1                          |
| `border-strong` (input and outline-button boundary) on surface | 3:1 (1.4.11)                   |
| `focus` on background and surface                              | 3:1 (1.4.11 / 2.4.13 guidance) |

If you change colours in a custom theme, re-check these pairs.

Not covered: decorative `border` (card outlines and separators are intentionally subtle and
aren't required to identify a control), and disabled controls (exempt under 1.4.3; rendered at
`--ul-opacity-disabled`).

## Automated audits

`tests/accessibility/axe.test.tsx` runs **axe-core** on every component in every state, in Light,
Dark and System themes. jsdom can't compute rendered colours, so axe's `color-contrast` rule is
disabled there. Token contrast is covered by the test above. Storybook also includes the a11y
addon for in-browser checks.

## Per component

| Component | Keyboard                                                                      | Screen readers                                                                                                                                                                                                                                                                        |
| --------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button    | Native: Tab, Enter, Space. Loading buttons stay focusable but don't activate. | Loading: `aria-busy="true"`, `aria-disabled="true"`, plus visually hidden `loadingLabel` text (default "Loading"). Icons are `aria-hidden`.                                                                                                                                           |
| Input     | Native                                                                        | The label is associated with `for`/`id`. Helper or error text is linked with `aria-describedby` (merged with yours). Errors set `aria-invalid`. The required asterisk is `aria-hidden`; native `required` conveys the state. `hideLabel` keeps the label available to assistive tech. |
| Card      | Not interactive                                                               | Use `as="section"` or `as="article"` with `aria-labelledby` for landmark or region semantics, and pick a `CardTitle` heading level that fits your outline.                                                                                                                            |
| Badge     | Not interactive                                                               | Plain text. The dot is `aria-hidden`.                                                                                                                                                                                                                                                 |

## Touch targets

The control heights are 32px (`sm`), 40px (`md`) and 48px (`lg`), all above the WCAG 2.2
2.5.8 minimum of 24px. On touch-first layouts, prefer `md` or `lg`.

## Known limitations

- **Not yet tested manually** with screen readers (NVDA, JAWS, VoiceOver, TalkBack) or in
  forced-colours mode across browsers.
- A loading `Button` doesn't announce _changes_ of state by itself. If the result of the action
  matters, announce it with your own live region.
- `Input` error messages aren't announced when they appear. They're read when the field is
  focused, through `aria-describedby`. For form-level errors, add a summary or a live region.
- Badges truncate long text with an ellipsis on one line. Screen readers still read the full
  text, but sighted users don't see it. Keep badge text short, or add `title` to show the full
  value.
- Right-to-left layouts haven't been audited.
