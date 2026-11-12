import axe from 'axe-core';

/**
 * Run axe-core against a container and return the violations.
 * Colour contrast cannot be computed in jsdom (no layout/paint), so that rule
 * is disabled here; token contrast is verified separately in
 * tests/accessibility/contrast.test.ts.
 */
export async function axeViolations(container: Element) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  return results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length} node(s))`);
}
