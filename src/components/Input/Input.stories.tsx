import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input.js';

const meta = {
  title: 'Components/Input',
  component: Input,
  args: { label: 'Email address', placeholder: 'you@example.com' },
  decorators: [(Story) => <div style={{ maxWidth: 420 }}>{Story()}</div>],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

const stack = { display: 'grid', gap: '1.25rem' } as const;

export const Playground: Story = {};

export const WithHelperText: Story = {
  args: { helperText: 'We will only use this to send receipts.' },
};

export const Error: Story = {
  args: { defaultValue: 'not-an-email', error: 'Enter a valid email address.' },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={stack}>
      <Input {...args} size="sm" label="Small" />
      <Input {...args} size="md" label="Medium" />
      <Input {...args} size="lg" label="Large" />
    </div>
  ),
};

export const States: Story = {
  render: (args) => (
    <div style={stack}>
      <Input {...args} label="Required" required />
      <Input {...args} label="Disabled" disabled defaultValue="Can't edit" />
      <Input {...args} label="Read-only" readOnly defaultValue="ACC-20931" />
      <Input {...args} label="Invalid" error="This field is required." />
      <Input {...args} label="Search" hideLabel placeholder="Search…" type="search" />
    </div>
  ),
};

export const Controlled: Story = {
  render: function ControlledInput(args) {
    const [value, setValue] = useState('');
    return (
      <Input
        {...args}
        label="Username"
        placeholder="lowercase only"
        value={value}
        onChange={(e) => setValue(e.target.value.toLowerCase())}
        helperText={`${value.length}/20 characters`}
        maxLength={20}
      />
    );
  },
};

export const Customized: Story = {
  name: 'Customization: CSS variables',
  args: {
    style: {
      ['--ul-input-radius' as string]: 'var(--ul-radius-full)',
      ['--ul-input-padding-x' as string]: 'var(--ul-spacing-5)',
    },
  },
};
