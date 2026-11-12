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
import { execFileSync, execSync } from 'node:child_process';
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

/**
 * Run the npm CLI and return its stdout, on Windows, Linux and macOS.
 *
 * `execFileSync('npm', …)` fails on Windows: npm is a `npm.cmd` wrapper, and
 * Node refuses to spawn `.cmd` files without a shell (ENOENT / EINVAL since
 * the CVE-2024-27980 fix). Instead we run npm's JavaScript entry point with
 * the current Node binary, which needs no shell on any platform. If npm's CLI
 * cannot be located (unusual installs), fall back to a shell on Windows only;
 * the arguments are fixed literals, so no user input reaches the shell.
 */
function findNpmCli() {
  const nodeDir = dirname(process.execPath);
  const candidates = [
    // Set when the script is started through `npm run`.
    process.env.npm_execpath,
    // Windows installers, nvm-windows, Volta: <node dir>/node_modules/npm
    join(nodeDir, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    // Linux/macOS installers, nvm, Homebrew: <prefix>/lib/node_modules/npm
    join(nodeDir, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  ];
  return candidates.find((file) => file && /npm-cli\.js$/.test(file) && existsSync(file));
}

function runNpm(args, options) {
  const cli = findNpmCli();
  const spawnOptions = { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options };
  try {
    if (cli) return execFileSync(process.execPath, [cli, ...args], spawnOptions);
    if (process.platform === 'win32') {
      return execSync(`npm ${args.join(' ')}`, spawnOptions);
    }
    return execFileSync('npm', args, spawnOptions);
  } catch (error) {
    // Surface npm's own output instead of a bare "Command failed".
    const details = [error.stderr, error.stdout].filter(Boolean).join('\n').trim();
    throw new Error(
      `npm ${args.join(' ')} failed (${error.code ?? `exit code ${error.status}`})` +
        (details ? `:\n${details}` : ''),
      { cause: error },
    );
  }
}

/**
 * Link a directory. Windows directory symlinks need admin rights or
 * Developer Mode; junctions do not. The type is ignored on other platforms.
 */
function linkDir(target, path) {
  symlinkSync(target, path, process.platform === 'win32' ? 'junction' : 'dir');
}

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
const [packed] = JSON.parse(runNpm(['pack', '--dry-run', '--json'], { cwd: root }));
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
  linkDir(root, join(consumer, 'node_modules/@uleah/react'));
  for (const dep of ['react', 'react-dom'])
    linkDir(join(root, 'node_modules', dep), join(consumer, 'node_modules', dep));
  for (const dep of ['react', 'react-dom'])
    linkDir(join(root, 'node_modules/@types', dep), join(consumer, 'node_modules/@types', dep));
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
