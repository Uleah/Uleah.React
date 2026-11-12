import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../Badge/index.js';
import { Button } from '../Button/index.js';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card.js';

const meta = {
  title: 'Components/Card',
  component: Card,
  subcomponents: { CardHeader, CardTitle, CardDescription, CardContent, CardFooter },
  args: { variant: 'outlined', padding: 'md' },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

function Example(props: ComponentProps<typeof Card>) {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Team plan</CardTitle>
        <CardDescription>For small teams that need shared workspaces.</CardDescription>
      </CardHeader>
      <CardContent>
        Unlimited projects, role-based access and priority support. Billed monthly, cancel at any
        time.
      </CardContent>
      <CardFooter>
        <Button variant="ghost">Compare</Button>
        <Button>Choose plan</Button>
      </CardFooter>
    </Card>
  );
}

export const Playground: Story = {
  render: (args) => (
    <div style={{ maxWidth: 420 }}>
      <Example {...args} />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gap: '1rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      }}
    >
      <Example variant="outlined" />
      <Example variant="elevated" />
      <Example variant="filled" />
    </div>
  ),
};

export const Padding: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem', maxWidth: 420 }}>
      {(['none', 'sm', 'md', 'lg'] as const).map((padding) => (
        <Card key={padding} padding={padding}>
          <CardContent>padding=&quot;{padding}&quot;</CardContent>
        </Card>
      ))}
    </div>
  ),
};

export const ResponsiveGrid: Story = {
  name: 'Responsive: fluid grid',
  render: () => (
    <ul
      style={{
        display: 'grid',
        gap: '1rem',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))',
        padding: 0,
        margin: 0,
      }}
    >
      {['Billing', 'Members', 'Integrations', 'Security', 'Audit log'].map((title, i) => (
        <Card as="li" key={title} variant={i === 0 ? 'elevated' : 'outlined'}>
          <CardHeader>
            <CardTitle as="h2">{title}</CardTitle>
            <CardDescription>Manage {title.toLowerCase()} settings.</CardDescription>
          </CardHeader>
          <CardFooter align="between">
            <Badge variant={i % 2 ? 'neutral' : 'success'} dot>
              {i % 2 ? 'Inactive' : 'Active'}
            </Badge>
            <Button size="sm" variant="outline">
              Open
            </Button>
          </CardFooter>
        </Card>
      ))}
    </ul>
  ),
};

export const Customized: Story = {
  name: 'Customization: CSS variables',
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <Example
        style={{
          ['--ul-card-radius' as string]: 'var(--ul-radius-xl)',
          ['--ul-card-bg' as string]: 'var(--ul-color-primary-subtle)',
          ['--ul-card-border-color' as string]: 'transparent',
        }}
      />
    </div>
  ),
};
