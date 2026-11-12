import { describe, expect, it } from 'vitest';
import { tokenKeyToName } from '../foundations/tokens.js';
import { themeToCss } from './themeToCss.js';

describe('tokenKeyToName', () => {
  it.each([
    ['colorPrimary', 'color-primary'],
    ['colorOnPrimary', 'color-on-primary'],
    ['fontSize2xl', 'font-size-2xl'],
    ['spacing10', 'spacing-10'],
    ['zIndexModal', 'z-index-modal'],
  ])('%s → %s', (key, name) => expect(tokenKeyToName(key)).toBe(name));
});

describe('themeToCss', () => {
  it('returns an empty string for an empty theme', () => {
    expect(themeToCss({}, 'x')).toBe('');
  });

  it('skips empty values and invalid custom property names', () => {
    const css = themeToCss(
      {
        tokens: { colorPrimary: '' },
        cssVariables: { '--ok': '1', ['--bad name' as '--x']: '2' },
      },
      'x',
    );
    expect(css).toBe('.ul-theme[data-ul-scope="x"]{--ok:1}');
  });

  it('cannot break out of the declaration block or the style element', () => {
    const css = themeToCss({ tokens: { colorPrimary: 'red;}</style><script>' } }, 'x');
    expect(css).not.toMatch(/[<>]/);
    expect(css).toBe('.ul-theme[data-ul-scope="x"]{--ul-color-primary:red/stylescript}');
  });
});
