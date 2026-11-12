// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { compileStyles, parseCss, splitSelectors } from '../helpers/css.js';

/**
 * Guard against accidental global styles: every selector in the published
 * stylesheets must be scoped to Uleah (`.ul-*` classes, `[data-ul-theme]`
 * scopes or `:root` custom properties).
 */
function isScoped(selector: string): boolean {
  return selector === ':root' || /^\.ul-[a-z]/.test(selector) || /^\[data-ul-theme=/.test(selector);
}

describe.each([
  ['styles.css', 'src/styles/index.scss'],
  ['base.css', 'src/styles/base.scss'],
])('%s', (_, entry) => {
  const rules = parseCss(compileStyles(entry));

  it('has rules', () => expect(rules.length).toBeGreaterThan(0));

  it('scopes every selector', () => {
    const unscoped = rules
      .flatMap((rule) => splitSelectors(rule.selector))
      .filter((s) => !isScoped(s));
    expect(unscoped).toEqual([]);
  });

  it(':root only declares --ul- custom properties', () => {
    for (const rule of rules.filter((r) => r.selector === ':root')) {
      for (const property of rule.declarations.keys()) expect(property).toMatch(/^--ul-/);
    }
  });
});

it('styles.css does not set fonts or box-sizing on the theme scope (base.css is opt-in)', () => {
  const rules = parseCss(compileStyles());
  const scope = rules.filter((r) => r.selector === '.ul-theme');
  for (const rule of scope) {
    expect([...rule.declarations.keys()].sort()).toEqual(['background-color', 'color']);
  }
});
