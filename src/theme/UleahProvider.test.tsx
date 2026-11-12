import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockColorScheme } from '../test/matchMedia.js';
import { createLocalStorageThemeStorage } from './storage.js';
import type { ThemeStorage } from './types.js';
import { UleahProvider } from './UleahProvider.js';
import { useTheme } from './useTheme.js';

function ThemeProbe() {
  const { theme, resolvedTheme, systemTheme, setTheme } = useTheme();
  return (
    <div>
      <output data-testid="theme">{theme}</output>
      <output data-testid="resolved">{resolvedTheme}</output>
      <output data-testid="system">{String(systemTheme)}</output>
      <button onClick={() => setTheme('dark')}>dark</button>
      <button onClick={() => setTheme('light')}>light</button>
      <button onClick={() => setTheme('system')}>system</button>
    </div>
  );
}

const scope = (container: HTMLElement) => container.firstElementChild as HTMLElement;

describe('UleahProvider', () => {
  let media: ReturnType<typeof mockColorScheme> | undefined;
  afterEach(() => media?.restore());

  it('renders a theme scope defaulting to system mode', () => {
    media = mockColorScheme('light');
    const { container } = render(
      <UleahProvider>
        <ThemeProbe />
      </UleahProvider>,
    );
    expect(scope(container)).toHaveClass('ul-theme');
    expect(scope(container)).toHaveAttribute('data-ul-theme', 'system');
    expect(screen.getByTestId('theme')).toHaveTextContent('system');
    expect(screen.getByTestId('resolved')).toHaveTextContent('light');
  });

  it('switches theme dynamically (uncontrolled)', async () => {
    media = mockColorScheme('light');
    const user = userEvent.setup();
    const onThemeChange = vi.fn();
    const { container } = render(
      <UleahProvider defaultTheme="light" onThemeChange={onThemeChange}>
        <ThemeProbe />
      </UleahProvider>,
    );
    expect(scope(container)).toHaveAttribute('data-ul-theme', 'light');

    await user.click(screen.getByRole('button', { name: 'dark' }));
    expect(scope(container)).toHaveAttribute('data-ul-theme', 'dark');
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    expect(onThemeChange).toHaveBeenCalledWith('dark');
  });

  it('respects controlled mode', async () => {
    media = mockColorScheme('light');
    const user = userEvent.setup();
    const onThemeChange = vi.fn();
    const { container, rerender } = render(
      <UleahProvider theme="light" onThemeChange={onThemeChange}>
        <ThemeProbe />
      </UleahProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'dark' }));
    expect(onThemeChange).toHaveBeenCalledWith('dark');
    // Not changed until the parent updates the prop.
    expect(scope(container)).toHaveAttribute('data-ul-theme', 'light');

    rerender(
      <UleahProvider theme="dark" onThemeChange={onThemeChange}>
        <ThemeProbe />
      </UleahProvider>,
    );
    expect(scope(container)).toHaveAttribute('data-ul-theme', 'dark');
  });

  it('resolves system mode from the OS and reacts to changes', () => {
    media = mockColorScheme('dark');
    render(
      <UleahProvider theme="system">
        <ThemeProbe />
      </UleahProvider>,
    );
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    expect(screen.getByTestId('system')).toHaveTextContent('dark');

    act(() => media!.set('light'));
    expect(screen.getByTestId('resolved')).toHaveTextContent('light');
  });

  it('works without matchMedia (falls back to light)', () => {
    render(
      <UleahProvider theme="system">
        <ThemeProbe />
      </UleahProvider>,
    );
    expect(screen.getByTestId('resolved')).toHaveTextContent('light');
    expect(screen.getByTestId('system')).toHaveTextContent('null');
  });

  it('supports nested scoped themes independently', async () => {
    media = mockColorScheme('light');
    const user = userEvent.setup();
    render(
      <UleahProvider defaultTheme="light" data-testid="outer">
        <UleahProvider defaultTheme="dark" data-testid="inner">
          <ThemeProbe />
        </UleahProvider>
      </UleahProvider>,
    );
    expect(screen.getByTestId('outer')).toHaveAttribute('data-ul-theme', 'light');
    expect(screen.getByTestId('inner')).toHaveAttribute('data-ul-theme', 'dark');

    await user.click(screen.getByRole('button', { name: 'light' }));
    expect(screen.getByTestId('inner')).toHaveAttribute('data-ul-theme', 'light');
    expect(screen.getByTestId('outer')).toHaveAttribute('data-ul-theme', 'light');
  });

  it('forwards native attributes, className and ref to the scope element', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<UleahProvider ref={ref} id="app" className="shell" defaultTheme="dark" />);
    expect(ref.current).toHaveAttribute('id', 'app');
    expect(ref.current).toHaveClass('ul-theme', 'shell');
  });

  it('throws a helpful error when useTheme is used outside a provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ThemeProbe />)).toThrow(/inside a <UleahProvider>/);
    spy.mockRestore();
  });

  describe('persistence', () => {
    it('does not touch localStorage unless a storage adapter is given', async () => {
      const user = userEvent.setup();
      const setItem = vi.spyOn(Storage.prototype, 'setItem');
      render(
        <UleahProvider>
          <ThemeProbe />
        </UleahProvider>,
      );
      await user.click(screen.getByRole('button', { name: 'dark' }));
      expect(setItem).not.toHaveBeenCalled();
      setItem.mockRestore();
    });

    it('restores and saves the preference with the localStorage adapter', async () => {
      const user = userEvent.setup();
      window.localStorage.setItem('my-theme', 'dark');
      const storage = createLocalStorageThemeStorage({ key: 'my-theme' });
      const { container } = render(
        <UleahProvider storage={storage}>
          <ThemeProbe />
        </UleahProvider>,
      );
      expect(scope(container)).toHaveAttribute('data-ul-theme', 'dark');

      await user.click(screen.getByRole('button', { name: 'light' }));
      expect(window.localStorage.getItem('my-theme')).toBe('light');
    });

    it('ignores invalid stored values', () => {
      window.localStorage.setItem('ul-theme', 'purple');
      const { container } = render(
        <UleahProvider defaultTheme="light" storage={createLocalStorageThemeStorage()} />,
      );
      expect(scope(container)).toHaveAttribute('data-ul-theme', 'light');
    });

    it('syncs changes from other tabs', () => {
      const storage = createLocalStorageThemeStorage();
      const { container } = render(<UleahProvider defaultTheme="light" storage={storage} />);
      act(() => {
        window.dispatchEvent(new StorageEvent('storage', { key: 'ul-theme', newValue: 'dark' }));
      });
      expect(scope(container)).toHaveAttribute('data-ul-theme', 'dark');
    });

    it('accepts a custom adapter (e.g. cookies or a backend)', async () => {
      const user = userEvent.setup();
      const adapter: ThemeStorage = { get: vi.fn(() => 'dark' as const), set: vi.fn() };
      const { container } = render(
        <UleahProvider storage={adapter}>
          <ThemeProbe />
        </UleahProvider>,
      );
      expect(scope(container)).toHaveAttribute('data-ul-theme', 'dark');
      await user.click(screen.getByRole('button', { name: 'system' }));
      expect(adapter.set).toHaveBeenCalledWith('system');
    });
  });

  describe('custom themes', () => {
    it('emits a scoped stylesheet with token overrides', () => {
      const { container } = render(
        <UleahProvider
          theme="system"
          nonce="abc"
          customTheme={{
            tokens: { radiusMd: '12px', fontFamilySans: 'Inter, sans-serif' },
            light: { colorPrimary: '#1f6f8b' },
            dark: { colorPrimary: '#6cb4cc' },
            cssVariables: { '--ul-button-radius': '999px' },
          }}
        />,
      );
      const el = scope(container);
      const scopeId = el.getAttribute('data-ul-scope');
      expect(scopeId).toBeTruthy();

      const style = el.querySelector('style');
      expect(style).toHaveAttribute('nonce', 'abc');
      const css = style!.textContent!;
      const sel = `.ul-theme[data-ul-scope="${scopeId}"]`;
      expect(css).toContain(
        `${sel}{--ul-radius-md:12px;--ul-font-family-sans:Inter, sans-serif;--ul-button-radius:999px}`,
      );
      expect(css).toContain(
        `${sel}[data-ul-theme="light"],${sel}[data-ul-theme="system"]{--ul-color-primary:#1f6f8b}`,
      );
      expect(css).toContain(`${sel}[data-ul-theme="dark"]{--ul-color-primary:#6cb4cc}`);
      expect(css).toContain(
        `@media (prefers-color-scheme:dark){${sel}[data-ul-theme="system"]{--ul-color-primary:#6cb4cc}}`,
      );
    });

    it('renders no style element without a custom theme', () => {
      const { container } = render(<UleahProvider />);
      expect(scope(container).querySelector('style')).toBeNull();
      expect(scope(container)).not.toHaveAttribute('data-ul-scope');
    });

    it('gives each nested scope its own selector', () => {
      render(
        <UleahProvider customTheme={{ light: { colorPrimary: 'red' } }} data-testid="a">
          <UleahProvider customTheme={{ light: { colorPrimary: 'blue' } }} data-testid="b" />
        </UleahProvider>,
      );
      const a = screen.getByTestId('a').getAttribute('data-ul-scope');
      const b = screen.getByTestId('b').getAttribute('data-ul-scope');
      expect(a).not.toBe(b);
    });
  });

  describe('server rendering', () => {
    it('renders without browser APIs and with a stable system mode', () => {
      const html = renderToString(
        <UleahProvider storage={createLocalStorageThemeStorage()}>
          <ThemeProbe />
        </UleahProvider>,
      );
      expect(html).toContain('data-ul-theme="system"');
      expect(html).toContain('<output data-testid="system">null</output>');
      expect(html).toContain('<output data-testid="resolved">light</output>');
    });

    it('hydrates without mismatch, then resolves the OS theme on the client', async () => {
      const tree = (
        <UleahProvider customTheme={{ dark: { colorPrimary: '#6cb4cc' } }}>
          <ThemeProbe />
        </UleahProvider>
      );
      const html = renderToString(tree);
      media = mockColorScheme('dark');
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
      const container = document.createElement('div');
      container.innerHTML = html;
      document.body.appendChild(container);

      const recoverable = vi.fn();
      let root: ReturnType<typeof hydrateRoot> | undefined;
      await act(async () => {
        root = hydrateRoot(container, tree, { onRecoverableError: recoverable });
      });

      expect(recoverable).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();
      expect(container.querySelector('[data-testid="resolved"]')).toHaveTextContent('dark');
      expect(container.querySelector('[data-testid="system"]')).toHaveTextContent('dark');

      act(() => root!.unmount());
      container.remove();
      errors.mockRestore();
    });
  });
});
