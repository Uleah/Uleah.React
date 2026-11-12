import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Button } from './Button.js';

const ArrowIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M4 10h12m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Save changes', onClick: fn() },
  argTypes: {
    startIcon: { control: false },
    endIcon: { control: false },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const row = { display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' } as const;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div style={row}>
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="danger">
        Danger
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={row}>
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
};

export const States: Story = {
  render: (args) => (
    <div style={row}>
      <Button {...args}>Default</Button>
      <Button {...args} disabled>
        Disabled
      </Button>
      <Button {...args} loading>
        Saving
      </Button>
      <Button {...args} variant="outline" loading>
        Loading
      </Button>
    </div>
  ),
};

export const WithIcons: Story = {
  args: { endIcon: <ArrowIcon />, children: 'Continue' },
};

export const FullWidth: Story = {
  args: { fullWidth: true },
  render: (args) => (
    <div style={{ maxWidth: 360 }}>
      <Button {...args} />
    </div>
  ),
};

export const LongLabelInNarrowContainer: Story = {
  name: 'Responsive: long label wraps',
  args: { children: 'A deliberately long button label that must wrap on small screens' },
  render: (args) => (
    <div style={{ maxWidth: 220, border: '1px dashed var(--ul-color-border)', padding: 8 }}>
      <Button {...args} />
    </div>
  ),
};

export const CustomizedWithCssVariables: Story = {
  name: 'Customization: CSS variables',
  render: (args) => (
    <div style={row}>
      <Button
        {...args}
        style={{
          ['--ul-button-radius' as string]: 'var(--ul-radius-full)',
          ['--ul-button-padding-x' as string]: 'var(--ul-spacing-6)',
        }}
      >
        Pill button
      </Button>
      <Button
        {...args}
        style={{
          ['--ul-button-bg' as string]: 'var(--ul-color-info)',
          ['--ul-button-bg-hover' as string]: 'var(--ul-color-info-text)',
          ['--ul-button-bg-active' as string]: 'var(--ul-color-info-text)',
        }}
      >
        Info tone
      </Button>
    </div>
  ),
};
