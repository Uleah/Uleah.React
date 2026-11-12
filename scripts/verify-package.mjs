#!/usr/bin/env node
/**
 * Verifies the built package (run after `pnpm build`):
 *  1. Every `exports` target exists.
 *  2. The ESM entry imports in Node and exposes the expected API.
 *  3. React is not bundled.
 *  4. styles.css contains tokens, all theme modes and component classes.
 *  5. The packed tarball contains only what consumers need.
 *  6. The type declarations resolve for consumers using `moduleResolution: nodenext`
 *     and `bundler`, and the CSS subpath exports resolve.
 */
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
let failures = 0;

function check(condition, message) {
  if (condition) console.log(`  ✓ ${message}`);
  else {
    failures++;
    console.error(`  ✗ ${message}`);
  }
}

console.log('exports');
for (const [subpath, target] of Object.entries(pkg.exports)) {
  const targets = typeof target === 'string' ? [target] : Object.values(target);
  for (const file of targets) check(existsSync(join(root, file)), `${subpath} → ${file}`);
}

console.log('runtime');
const api = await import(pathToFileURL(join(root, pkg.exports['.'].import)).href);
for (const name of [
  'Button',
  'Input',
  'Card',
  'Badge',
  'UleahProvider',
  'useTheme',
  'defineTheme',
]) {
  check(name in api, `exports ${name}`);
}

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
const jsFiles = walk(join(root, 'dist')).filter((f) => f.endsWith('.js'));
const bundledReact = jsFiles.some((f) =>
  /__CLIENT_INTERNALS|react\.production|ReactCurrentOwner/.test(readFileSync(f, 'utf8')),
);
check(!bundledReact, 'React is not bundled');
check(
  jsFiles.every((f) => readFileSync(f, 'utf8').startsWith('"use client";')),
  'every module starts with "use client"',
);

console.log('styles');
const css = readFileSync(join(root, 'dist/styles.css'), 'utf8');
for (const needle of [
  '--ul-color-primary:',
  '--ul-palette-teal-600:',
  '[data-ul-theme=dark]',
  '[data-ul-theme=system]',
  '.ul-button',
  '.ul-input',
  '.ul-card',
  '.ul-badge',
]) {
  check(css.includes(needle), `styles.css contains ${needle}`);
}

check(
  /@media\s*\(prefers-color-scheme:\s*dark\)/.test(css),
  'styles.css resolves system mode via prefers-color-scheme',
);
check(
  /@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(css),
  'styles.css honours prefers-reduced-motion',
);

console.log('tarball');
const [packed] = JSON.parse(
  execFileSync('npm', ['pack', '--dry-run', '--json'], { cwd: root, encoding: 'utf8' }),
);
const files = packed.files.map((f) => f.path);
check(files.includes('dist/styles.css') && files.includes('dist/base.css'), 'includes CSS');
check(files.includes('dist/index.d.ts'), 'includes type declarations');
check(
  !files.some((f) => /^(src|tests|examples|\.storybook)\//.test(f)),
  'excludes sources, tests and examples',
);
check(!files.some((f) => /\.(test|stories)\./.test(f)), 'excludes tests and stories');
console.log(`  (${files.length} files, ${(packed.size / 1024).toFixed(1)} kB packed)`);

console.log('consumer type-check');
const consumer = mkdtempSync(join(tmpdir(), 'uleah-consumer-'));
try {
  mkdirSync(join(consumer, 'node_modules/@uleah'), { recursive: true });
  mkdirSync(join(consumer, 'node_modules/@types'), { recursive: true });
  symlinkSync(root, join(consumer, 'node_modules/@uleah/react'), 'dir');
  for (const dep of ['react', 'react-dom'])
    symlinkSync(join(root, 'node_modules', dep), join(consumer, 'node_modules', dep), 'dir');
  for (const dep of ['react', 'react-dom'])
    symlinkSync(
      join(root, 'node_modules/@types', dep),
      join(consumer, 'node_modules/@types', dep),
      'dir',
    );
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ type: 'module' }));
  writeFileSync(
    join(consumer, 'app.tsx'),
    `import { Button, UleahProvider, defineTheme, type ButtonProps, type ThemeMode } from '@uleah/react';
const theme = defineTheme({ light: { colorPrimary: '#123456' } });
const mode: ThemeMode = 'system';
const props: ButtonProps = { variant: 'outline', size: 'lg' };
export const App = () => (
  <UleahProvider theme={mode} customTheme={theme}>
    <Button {...props}>Ok</Button>
  </UleahProvider>
);
// @ts-expect-error — invalid variants must not type-check.
export const Bad = () => <Button variant="tertiary" />;
`,
  );
  const tsc = join(root, 'node_modules/typescript/bin/tsc');
  for (const resolution of ['nodenext', 'bundler']) {
    const module = resolution === 'nodenext' ? 'nodenext' : 'esnext';
    try {
      execFileSync(
        process.execPath,
        [
          tsc,
          '--noEmit',
          '--strict',
          '--jsx',
          'react-jsx',
          '--module',
          module,
          '--moduleResolution',
          resolution,
          '--skipLibCheck',
          'false',
          'app.tsx',
        ],
        { cwd: consumer, stdio: 'pipe' },
      );
      check(true, `types resolve with moduleResolution=${resolution}`);
    } catch (error) {
      check(false, `types resolve with moduleResolution=${resolution}\n${error.stdout}`);
    }
  }
  const cssResolved = execFileSync(
    process.execPath,
    ['--input-type=module', '-e', "console.log(import.meta.resolve('@uleah/react/styles.css'))"],
    { cwd: consumer, encoding: 'utf8' },
  );
  check(cssResolved.trim().endsWith('dist/styles.css'), '@uleah/react/styles.css resolves');
} finally {
  rmSync(consumer, { recursive: true, force: true });
}

if (failures) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nPackage verification passed.');
