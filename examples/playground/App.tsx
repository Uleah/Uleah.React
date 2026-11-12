import { useState } from 'react';
// In a real app: import { ... } from '@uleah/react';
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
  UleahProvider,
  createLocalStorageThemeStorage,
  defineTheme,
  useTheme,
} from '../../src/index.js';

// Create storage and themes at module scope so their identity is stable.
const storage = createLocalStorageThemeStorage({ key: 'uleah-playground-theme' });

const roundedTheme = defineTheme({
  tokens: { radiusMd: '0.75rem', radiusLg: '1.25rem' },
  cssVariables: { '--ul-button-radius': '999px' },
});

function ThemeControls() {
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
          {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </Button>
      ))}
      <Badge variant="info">Resolved: {resolvedTheme}</Badge>
    </div>
  );
}

export function App() {
  const [rounded, setRounded] = useState(false);
  const [email, setEmail] = useState('');
  const emailError = email && !email.includes('@') ? 'Enter a valid email address.' : undefined;

  return (
    <UleahProvider
      storage={storage}
      customTheme={rounded ? roundedTheme : undefined}
      style={{ minHeight: '100vh', padding: 'var(--ul-spacing-6)' }}
    >
      <main
        style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gap: 'var(--ul-spacing-6)' }}
      >
        <header style={{ display: 'grid', gap: 'var(--ul-spacing-3)' }}>
          <h1 style={{ margin: 0, fontSize: 'var(--ul-font-size-2xl)' }}>Uleah.React playground</h1>
          <ThemeControls />
          <div>
            <Button
              size="sm"
              variant="ghost"
              aria-pressed={rounded}
              onClick={() => setRounded(!rounded)}
            >
              {rounded ? 'Use default theme' : 'Try a custom rounded theme'}
            </Button>
          </div>
        </header>

        <div
          style={{
            display: 'grid',
            gap: 'var(--ul-spacing-4)',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          }}
        >
          <Card as="section" aria-labelledby="signup-title" variant="elevated">
            <CardHeader>
              <CardTitle as="h2" id="signup-title">
                Create account
              </CardTitle>
              <CardDescription>Controlled input with live validation.</CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'grid', gap: 'var(--ul-spacing-4)' }}>
              <Input
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                helperText="We'll send a confirmation link."
                error={emailError}
                autoComplete="email"
              />
              <Input
                label="Workspace"
                defaultValue="atlas"
                readOnly
                helperText="Assigned by your admin."
              />
            </CardContent>
            <CardFooter>
              <Button variant="ghost">Cancel</Button>
              <Button type="submit">Create</Button>
            </CardFooter>
          </Card>

          <Card as="section" aria-labelledby="status-title">
            <CardHeader>
              <CardTitle as="h2" id="status-title">
                System status
              </CardTitle>
              <CardDescription>Badges always carry text, not only colour.</CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ul-spacing-2)' }}>
              <Badge variant="success" dot>
                Operational
              </Badge>
              <Badge variant="warning" dot>
                Degraded
              </Badge>
              <Badge variant="danger" dot>
                Outage
              </Badge>
              <Badge variant="primary">New</Badge>
              <Badge size="sm">v0.1.0</Badge>
            </CardContent>
            <CardFooter align="between">
              <Button variant="danger" size="sm">
                Delete
              </Button>
              <Button variant="secondary" size="sm" loading>
                Refreshing
              </Button>
            </CardFooter>
          </Card>
        </div>

        <UleahProvider
          theme="dark"
          style={{ padding: 'var(--ul-spacing-6)', borderRadius: 'var(--ul-radius-lg)' }}
        >
          <p style={{ marginTop: 0 }}>A nested provider: this section is always dark.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ul-spacing-2)' }}>
            <Button>Primary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </UleahProvider>
      </main>
    </UleahProvider>
  );
}
