// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { breakpoints } from '../../src/foundations/breakpoints.js';
import {
  colorTokenNames,
  scaleTokenNames,
  shadowTokenNames,
  themeTokenNames,
} from '../../src/foundations/tokens.js';
import { compileStyles, customPropertiesFor, parseCss } from '../helpers/css.js';

const rules = parseCss(compileStyles());
const rootNames = [...customPropertiesFor(rules, ':root').keys()]
  .filter((n) => !n.startsWith('--ul-palette-'))
  .map((n) => n.replace(/^--ul-/, ''));

describe('design token contract', () => {
  it('TypeScript token names match the stylesheet exactly', () => {
    expect([...themeTokenNames].sort()).toEqual([...rootNames].sort());
  });

  it('has no duplicate names', () => {
    expect(new Set(themeTokenNames).size).toBe(themeTokenNames.length);
  });

  it.each(['[data-ul-theme=light]', '[data-ul-theme=dark]'])(
    '%s defines every colour and shadow token',
    (selector) => {
      const names = [...customPropertiesFor(rules, selector).keys()].map((n) =>
        n.replace(/^--ul-/, ''),
      );
      expect(names.sort()).toEqual([...colorTokenNames, ...shadowTokenNames].sort());
    },
  );

  it('theme blocks never redefine scale tokens', () => {
    const themeVars = customPropertiesFor(rules, '[data-ul-theme=dark]');
    for (const name of scaleTokenNames) expect(themeVars.has(`--ul-${name}`)).toBe(false);
  });

  it('component styles never use raw colour literals', () => {
    for (const rule of rules) {
      if (!rule.selector.startsWith('.ul-')) continue;
      for (const [property, value] of rule.declarations) {
        expect(value, `${rule.selector} { ${property}: ${value} }`).not.toMatch(
          /#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i,
        );
      }
    }
  });

  it('TypeScript breakpoints match the SCSS breakpoints', () => {
    const scss = readFileSync(
      resolve(import.meta.dirname, '../../src/styles/abstracts/_breakpoints.scss'),
      'utf8',
    );
    const fromScss = Object.fromEntries(
      [...scss.matchAll(/'([a-z0-9]+)':\s*(\d+)px/g)].map((m) => [m[1], Number(m[2])]),
    );
    expect(fromScss).toEqual(breakpoints);
  });
});
