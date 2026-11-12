import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
} from '../components/index.js';
import { defineTheme } from './defineTheme.js';
import { UleahProvider } from './UleahProvider.js';
import { useTheme } from './useTheme.js';

const meta = {
  title: 'Foundations/Theming',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Sample({ title }: { title: string }) {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Theme tokens drive every colour below.</CardDescription>
      </CardHeader>
      <CardContent style={{ display: 'grid', gap: '1rem' }}>
        <Input label="Project name" placeholder="Atlas" helperText="Visible to your team." />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success" dot>
            Healthy
          </Badge>
          <Badge variant="warning">Pending</Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="ghost">Cancel</Button>
        <Button>Create</Button>
      </CardFooter>
    </Card>
  );
}

function ThemeSwitcher() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
      {(['light', 'dark', 'system'] as const).map((mode) => (
        <Button
          key={mode}
          size="sm"
          variant={theme === mode ? 'primary' : 'outline'}
          aria-pressed={theme === mode}
          onClick={() => setTheme(mode)}
        >
          {mode}
        </Button>
      ))}
      <Badge>resolved: {resolvedTheme}</Badge>
    </div>
  );
}

export const DynamicSwitching: Story = {
  render: () => (
    <UleahProvider defaultTheme="light" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
      <ThemeSwitcher />
      <div style={{ maxWidth: 420 }}>
        <Sample title="Switch me" />
      </div>
    </UleahProvider>
  ),
};

export const ScopedThemes: Story = {
  name: 'Scoped themes (nested providers)',
  render: () => (
    <UleahProvider theme="light" style={{ padding: '1.5rem' }}>
      <div
        style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        <Sample title="Light page" />
        <UleahProvider
          theme="dark"
          style={{ padding: '1rem', borderRadius: 'var(--ul-radius-lg)' }}
        >
          <Sample title="Dark section" />
        </UleahProvider>
      </div>
    </UleahProvider>
  ),
};

const brand = defineTheme({
  tokens: {
    radiusMd: '0.75rem',
    radiusLg: '1.25rem',
    fontFamilySans: 'Georgia, "Times New Roman", serif',
  },
  light: {
    colorPrimary: '#3b6196',
    colorPrimaryHover: '#324f79',
    colorPrimaryActive: '#1f3049',
    colorPrimarySubtle: '#eef4fb',
    colorPrimaryText: '#324f79',
    colorFocus: '#3b6196',
  },
  dark: {
    colorPrimary: '#8fb3e0',
    colorPrimaryHover: '#a9c5e8',
    colorPrimaryActive: '#c3d7f0',
    colorPrimarySubtle: '#1f3049',
    colorPrimaryText: '#a9c5e8',
    colorOnPrimary: '#11161c',
    colorFocus: '#8fb3e0',
  },
});

export const CustomTheme: Story = {
  name: 'Custom theme (defineTheme)',
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
      <UleahProvider theme="light" customTheme={brand} style={{ padding: '1.5rem' }}>
        <Sample title="Custom brand — light" />
      </UleahProvider>
      <UleahProvider theme="dark" customTheme={brand} style={{ padding: '1.5rem' }}>
        <Sample title="Custom brand — dark" />
      </UleahProvider>
    </div>
  ),
};
