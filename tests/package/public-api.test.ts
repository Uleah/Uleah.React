import { describe, expect, it } from 'vitest';
import * as api from '../../src/index.js';

describe('public API', () => {
  it('exposes exactly the documented runtime exports', () => {
    expect(Object.keys(api).sort()).toEqual(
      [
        'Badge',
        'Button',
        'Calendar',
        'Card',
        'CardContent',
        'CardDescription',
        'CardFooter',
        'CardHeader',
        'CardTitle',
        'DatePicker',
        'Dropdown',
        'DropdownPopup',
        'Input',
        'UleahProvider',
        'breakpoints',
        'colorTokenNames',
        'createLocalStorageThemeStorage',
        'cssVar',
        'cssVarName',
        'defineTheme',
        'defaultDropdownFilter',
        'mediaQueryUp',
        'parseISODate',
        'scaleTokenNames',
        'shadowTokenNames',
        'themeTokenNames',
        'toISODate',
        'useSystemTheme',
        'useTheme',
        'useDropdown',
      ].sort(),
    );
  });

  it('cssVar helpers produce --ul- names', () => {
    expect(api.cssVarName('color-primary')).toBe('--ul-color-primary');
    expect(api.cssVar('radius-md')).toBe('var(--ul-radius-md)');
    expect(api.mediaQueryUp('md')).toBe('(min-width: 768px)');
  });
});
