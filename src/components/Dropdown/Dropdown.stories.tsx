import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../Badge/index.js';
import { Dropdown } from './Dropdown.js';
import type { DropdownOption, DropdownProps, DropdownSingleProps } from './Dropdown.types.js';

const countries: DropdownOption[] = [
  { value: 'ar', label: 'Argentina' },
  { value: 'br', label: 'Brazil' },
  { value: 'cl', label: 'Chile' },
  { value: 'co', label: 'Colombia' },
  { value: 'es', label: 'Spain' },
  { value: 'mx', label: 'Mexico' },
  { value: 'pe', label: 'Peru', disabled: true },
  { value: 'pt', label: 'Portugal' },
  { value: 'uy', label: 'Uruguay' },
  { value: 'us', label: 'United States' },
];

const plans: DropdownOption[] = [
  { value: 'free', label: 'Free', description: 'Up to 3 projects, community support' },
  { value: 'team', label: 'Team', description: 'Unlimited projects, shared workspaces' },
  {
    value: 'enterprise',
    label: 'Enterprise with a very long plan name that does not fit in the trigger',
    description: 'SSO, audit logs, a dedicated success manager and custom contractual terms',
  },
];

const meta = {
  title: 'Components/Dropdown',
  component: Dropdown,
  args: { label: 'Country', options: countries, placeholder: 'Select a country' },
  decorators: [(Story) => <div style={{ maxWidth: 360, minHeight: 360 }}>{Story()}</div>],
} satisfies Meta<DropdownProps>;

export default meta;
type Story = StoryObj<DropdownProps>;

const stack = { display: 'grid', gap: '1.25rem' } as const;

export const Playground: Story = {};

export const Multiple: Story = {
  args: { multiple: true, label: 'Countries', defaultValue: ['es', 'mx'] },
};

export const NavigationButtons: Story = {
  args: { navigationButtons: true, defaultValue: 'co', helperText: 'Use the arrows to step.' },
};

export const LongOptions: Story = {
  render: (args: DropdownProps) => (
    <div style={stack}>
      <Dropdown
        {...(args as DropdownSingleProps)}
        label="Plan (truncate)"
        options={plans}
        defaultValue="enterprise"
      />
      <Dropdown
        {...(args as DropdownSingleProps)}
        label="Plan (wrap)"
        options={plans}
        optionOverflow="wrap"
      />
      <Dropdown
        {...(args as DropdownSingleProps)}
        label="Plan (auto width)"
        options={plans}
        popupWidth="auto"
      />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args: DropdownProps) => (
    <div style={stack}>
      <Dropdown {...(args as DropdownSingleProps)} size="sm" label="Small" />
      <Dropdown {...(args as DropdownSingleProps)} size="md" label="Medium" />
      <Dropdown {...(args as DropdownSingleProps)} size="lg" label="Large" />
    </div>
  ),
};

export const States: Story = {
  render: (args: DropdownProps) => (
    <div style={stack}>
      <Dropdown {...(args as DropdownSingleProps)} label="Required" required />
      <Dropdown {...(args as DropdownSingleProps)} label="Invalid" error="Choose a country." />
      <Dropdown {...(args as DropdownSingleProps)} label="Disabled" disabled defaultValue="es" />
      <Dropdown
        {...(args as DropdownSingleProps)}
        label="Empty"
        options={[]}
        emptyMessage="No countries available"
      />
    </div>
  ),
};

export const CustomRendering: Story = {
  args: {
    options: plans,
    label: 'Plan',
    renderOption: (option: DropdownOption, { selected }: { selected: boolean }) => (
      <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {option.label.split(' ')[0]}
        {selected ? <Badge size="sm">Current</Badge> : null}
      </span>
    ),
    renderValue: (selected: DropdownOption[]) => `Plan: ${selected[0]?.label.split(' ')[0]}`,
  },
};

export const Controlled: Story = {
  render: function ControlledDropdown(args: DropdownProps) {
    const [value, setValue] = useState<string[]>(['es']);
    return (
      <div style={stack}>
        <Dropdown
          options={args.options}
          label="Countries"
          multiple
          value={value}
          onChange={setValue}
        />
        <code>{JSON.stringify(value)}</code>
      </div>
    );
  },
};

/** Inside a clipping container (as in a table cell): the popup is portalled and not cut off. */
export const InsideClippingContainer: Story = {
  render: (args: DropdownProps) => (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'start' }} id="col-name">
            Name
          </th>
          <th style={{ textAlign: 'start' }} id="col-country">
            Country
          </th>
        </tr>
      </thead>
      <tbody>
        {['Ada', 'Grace'].map((person) => (
          <tr key={person}>
            <td id={`row-${person}`}>{person}</td>
            <td style={{ overflow: 'hidden', maxWidth: 200, padding: 4 }}>
              <Dropdown
                options={args.options}
                size="sm"
                aria-labelledby={`col-country row-${person}`}
                defaultValue="es"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
