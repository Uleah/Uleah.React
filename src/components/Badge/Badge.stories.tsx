import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge.js';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: 'Active', variant: 'success' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

const row = { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' } as const;
const variants = ['neutral', 'primary', 'success', 'warning', 'danger', 'info'] as const;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div style={row}>
      {variants.map((v) => (
        <Badge key={v} variant={v}>
          {v}
        </Badge>
      ))}
    </div>
  ),
};

export const WithStatusDot: Story = {
  render: () => (
    <div style={row}>
      <Badge variant="success" dot>
        Operational
      </Badge>
      <Badge variant="warning" dot>
        Degraded
      </Badge>
      <Badge variant="danger" dot>
        Outage
      </Badge>
      <Badge variant="info" dot>
        Maintenance
      </Badge>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={row}>
      <Badge size="sm" variant="primary">
        Small
      </Badge>
      <Badge size="md" variant="primary">
        Medium
      </Badge>
    </div>
  ),
};

export const Customized: Story = {
  name: 'Customization: CSS variables',
  args: {
    children: 'Beta',
    variant: 'primary',
    style: { ['--ul-badge-radius' as string]: 'var(--ul-radius-sm)' },
  },
};
