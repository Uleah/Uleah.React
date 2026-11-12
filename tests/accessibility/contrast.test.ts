// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { compileStyles, customPropertiesFor, parseCss, resolveVar } from '../helpers/css.js';

/**
 * WCAG 2.2 contrast checks on the compiled theme tokens.
 *
 * Text pairs require 4.5:1 (1.4.3). Control boundaries and focus indicators
 * require 3:1 against adjacent colours (1.4.11). This validates the token
 * values only — not every possible combination a consumer may create.
 */

function luminance(hex: string): number {
  const n = hex.replace('#', '');
  const channels = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const rules = parseCss(compileStyles());
const rootVars = customPropertiesFor(rules, ':root');

const themes = {
  light: new Map([...rootVars, ...customPropertiesFor(rules, '[data-ul-theme=light]')]),
  dark: new Map([...rootVars, ...customPropertiesFor(rules, '[data-ul-theme=dark]')]),
};

const TEXT = 4.5;
const NON_TEXT = 3;

const pairs: [fg: string, bg: string, min: number][] = [
  ['text', 'background', TEXT],
  ['text', 'surface', TEXT],
  ['text', 'surface-elevated', TEXT],
  ['text-muted', 'background', TEXT],
  ['text-muted', 'surface', TEXT],
  ['text-subtle', 'surface', TEXT],
  ['on-primary', 'primary', TEXT],
  ['on-primary', 'primary-hover', TEXT],
  ['on-primary', 'primary-active', TEXT],
  ['on-secondary', 'secondary', TEXT],
  ['on-secondary', 'secondary-hover', TEXT],
  ['on-danger', 'danger', TEXT],
  ['on-danger', 'danger-hover', TEXT],
  ['text', 'surface-hover', TEXT],
  ['primary-text', 'primary-subtle', TEXT],
  ['primary-text', 'surface', TEXT],
  ['success-text', 'success-subtle', TEXT],
  ['warning-text', 'warning-subtle', TEXT],
  ['danger-text', 'danger-subtle', TEXT],
  ['danger-text', 'surface', TEXT],
  ['info-text', 'info-subtle', TEXT],
  ['border-strong', 'surface', NON_TEXT],
  ['focus', 'background', NON_TEXT],
  ['focus', 'surface', NON_TEXT],
];

describe.each(Object.entries(themes))('%s theme contrast', (_, vars) => {
  const color = (name: string) => resolveVar(`var(--ul-color-${name})`, vars);

  it.each(pairs)('%s on %s ≥ %d:1', (fg, bg, min) => {
    const ratio = contrast(color(fg), color(bg));
    expect(
      ratio,
      `${fg} (${color(fg)}) on ${bg} (${color(bg)}) = ${ratio.toFixed(2)}`,
    ).toBeGreaterThanOrEqual(min);
  });
});

it('system mode uses the dark tokens under prefers-color-scheme: dark', () => {
  const systemDark = customPropertiesFor(
    rules,
    '[data-ul-theme=system]',
    '@media (prefers-color-scheme: dark)',
  );
  expect(Object.fromEntries(systemDark)).toEqual(
    Object.fromEntries(customPropertiesFor(rules, '[data-ul-theme=dark]')),
  );
});
