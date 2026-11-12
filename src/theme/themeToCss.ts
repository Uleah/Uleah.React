import type { ThemeTokens } from '../foundations/tokens.js';
import { tokenKeyToName } from '../foundations/tokens.js';
import type { CssVariables, UleahTheme } from './types.js';

function sanitizeValue(value: string | number): string {
  // Custom property values must not be able to break out of the declaration
  // block. Strip characters that could close the rule or inject markup.
  return String(value).replace(/[{}<>;]/g, '');
}

function isValidCustomPropertyName(name: string): boolean {
  return /^--[a-zA-Z0-9_-]+$/.test(name);
}

function tokensToDeclarations(tokens: ThemeTokens | undefined): string[] {
  if (!tokens) return [];
  const declarations: string[] = [];
  for (const [key, value] of Object.entries(tokens)) {
    if (value === undefined || value === null || value === '') continue;
    declarations.push(`--ul-${tokenKeyToName(key)}:${sanitizeValue(value)}`);
  }
  return declarations;
}

function variablesToDeclarations(variables: CssVariables | undefined): string[] {
  if (!variables) return [];
  const declarations: string[] = [];
  for (const [name, value] of Object.entries(variables)) {
    if (value === undefined || value === null || value === '') continue;
    if (!isValidCustomPropertyName(name)) continue;
    declarations.push(`${name}:${sanitizeValue(value)}`);
  }
  return declarations;
}

function rule(selector: string, declarations: string[]): string {
  return declarations.length ? `${selector}{${declarations.join(';')}}` : '';
}

/**
 * Compile a custom theme into a stylesheet scoped to one theme scope element.
 *
 * The output uses the same `[data-ul-theme]` attribute contract as the
 * built-in themes, so mode-specific overrides keep working in `system` mode
 * purely in CSS (no JavaScript resolution, no SSR mismatch).
 *
 * @internal
 */
export function themeToCss(theme: UleahTheme, scopeId: string): string {
  const scope = `.ul-theme[data-ul-scope="${scopeId.replace(/["\\]/g, '')}"]`;
  const common = [
    ...tokensToDeclarations(theme.tokens),
    ...variablesToDeclarations(theme.cssVariables),
  ];
  const light = tokensToDeclarations(theme.light);
  const dark = tokensToDeclarations(theme.dark);

  const parts = [
    rule(scope, common),
    rule(`${scope}[data-ul-theme="light"],${scope}[data-ul-theme="system"]`, light),
    rule(`${scope}[data-ul-theme="dark"]`, dark),
  ];
  const systemDark = rule(`${scope}[data-ul-theme="system"]`, dark);
  if (systemDark) parts.push(`@media (prefers-color-scheme:dark){${systemDark}}`);

  return parts.filter(Boolean).join('');
}
