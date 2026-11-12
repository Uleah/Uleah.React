# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/). Until 1.0.0, minor versions may contain breaking
changes.

## [Unreleased]

## [0.1.0] - Unreleased

### Added

- Project foundation: Vite library build (ESM, preserved modules, `"use client"`), TypeScript
  declarations, Sass stylesheet build, Vitest, Storybook, ESLint, Prettier and GitHub Actions CI.
- Design tokens: a cool-toned primitive palette, semantic colour roles, and scales for typography,
  spacing, radii, borders, focus ring, control heights, z-index, motion and opacity.
- The Uleah Light and Uleah Dark themes, plus a CSS-resolved System mode.
- `UleahProvider` with controlled and uncontrolled modes, nested (scoped) themes, optional
  persistence (`createLocalStorageThemeStorage` or custom `ThemeStorage`) and typed custom themes
  (`defineTheme`).
- Hooks `useTheme` and `useSystemTheme`.
- Components: `Button`, `Input`, `Card` (`CardHeader`, `CardTitle`, `CardDescription`,
  `CardContent`, `CardFooter`), `Badge`.
- Public CSS entry points `@uleah/react/styles.css` and the opt-in `@uleah/react/base.css`.
- Tag-triggered npm publishing workflow using Trusted Publishing (OIDC), and release docs.
