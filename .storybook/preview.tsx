import type { Decorator, Preview } from '@storybook/react-vite';
import { UleahProvider, type ThemeMode } from '../src/index.js';
import '../src/styles/index.scss';
import '../src/styles/base.scss';

/** Wrap every story in a UleahProvider driven by the toolbar theme switcher. */
const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme ?? 'light') as ThemeMode | 'side-by-side';

  if (theme === 'side-by-side') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {(['light', 'dark'] as const).map((mode) => (
          <UleahProvider key={mode} theme={mode} style={{ padding: '1.5rem' }}>
            <Story />
          </UleahProvider>
        ))}
      </div>
    );
  }

  return (
    <UleahProvider theme={theme} style={{ padding: '1.5rem', minHeight: '100vh' }}>
      <Story />
    </UleahProvider>
  );
};

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: 'Uleah theme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        dynamicTitle: true,
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
          { value: 'system', title: 'System' },
          { value: 'side-by-side', title: 'Light + Dark' },
        ],
      },
    },
  },
  initialGlobals: { theme: 'light' },
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
    a11y: { test: 'error' },
  },
  tags: ['autodocs'],
};

export default preview;
