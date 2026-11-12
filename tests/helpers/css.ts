import { resolve } from 'node:path';
import * as sass from 'sass';

export interface CssRule {
  selector: string;
  /** Enclosing at-rule preludes, e.g. ['@media (prefers-color-scheme: dark)']. */
  atRules: string[];
  declarations: Map<string, string>;
}

const root = resolve(import.meta.dirname, '../..');

export function compileStyles(entry = 'src/styles/index.scss'): string {
  return sass.compile(resolve(root, entry), { style: 'expanded' }).css;
}

/** Minimal CSS parser — enough for the compiled Uleah stylesheet (no strings with braces). */
export function parseCss(css: string): CssRule[] {
  const rules: CssRule[] = [];
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');

  function walk(source: string, atRules: string[]) {
    let i = 0;
    while (i < source.length) {
      const open = source.indexOf('{', i);
      if (open === -1) break;
      const prelude = source.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      while (j < source.length && depth > 0) {
        if (source[j] === '{') depth++;
        else if (source[j] === '}') depth--;
        j++;
      }
      const body = source.slice(open + 1, j - 1);
      if (prelude.startsWith('@')) {
        if (!prelude.startsWith('@keyframes')) walk(body, [...atRules, prelude]);
      } else {
        const declarations = new Map<string, string>();
        for (const decl of body.split(';')) {
          const idx = decl.indexOf(':');
          if (idx === -1) continue;
          declarations.set(decl.slice(0, idx).trim(), decl.slice(idx + 1).trim());
        }
        rules.push({ selector: prelude, atRules, declarations });
      }
      i = j;
    }
  }

  walk(clean, []);
  return rules;
}

/** Split a selector list on top-level commas (ignores commas inside `:not(a, b)`). */
export function splitSelectors(selector: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of selector) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      out.push(current.trim());
      current = '';
    } else current += ch;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

/** Collect custom properties declared by rules whose selector list includes `selector`. */
export function customPropertiesFor(rules: CssRule[], selector: string, atRule?: string) {
  const out = new Map<string, string>();
  for (const rule of rules) {
    const matchesAt = atRule ? rule.atRules.includes(atRule) : rule.atRules.length === 0;
    if (!matchesAt) continue;
    const selectors = splitSelectors(rule.selector);
    if (!selectors.includes(selector)) continue;
    for (const [k, v] of rule.declarations) if (k.startsWith('--')) out.set(k, v);
  }
  return out;
}

/** Resolve `var(--x)` references recursively against a variable map. */
export function resolveVar(value: string, vars: Map<string, string>, depth = 0): string {
  if (depth > 10) throw new Error(`Variable resolution too deep: ${value}`);
  return value.replace(/var\((--[a-z0-9-]+)\)/g, (_, name: string) => {
    const next = vars.get(name);
    if (next === undefined) throw new Error(`Undefined variable ${name}`);
    return resolveVar(next, vars, depth + 1);
  });
}
