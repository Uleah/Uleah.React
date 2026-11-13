import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../Badge/index.js';
import { Dropdown } from './Dropdown.js';
import { DropdownPopup } from './DropdownPopup.js';
import { useDropdown } from './useDropdown.js';
import type {
  DropdownOption,
  DropdownProps,
  DropdownSingleProps,
  DropdownItem,
} from './Dropdown.types.js';

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

const regions: DropdownItem[] = [
  { value: 'any', label: 'Any region' },
  { type: 'separator' },
  {
    label: 'Europe',
    options: [
      { value: 'es', label: 'Spain' },
      { value: 'pt', label: 'Portugal' },
      { value: 'fr', label: 'France' },
    ],
  },
  {
    label: 'Americas',
    options: [
      { value: 'mx', label: 'Mexico' },
      { value: 'co', label: 'Colombia' },
      { value: 'us', label: 'United States', disabled: true },
    ],
  },
];

/** Type to filter. Matching ignores case and accents ("peru" finds "Perú"). */
export const Searchable: Story = {
  args: { searchable: true, clearable: true },
};

export const GroupsAndSeparators: Story = {
  args: { label: 'Region', options: regions, searchable: true },
};

export const MultipleWithSelectAll: Story = {
  args: {
    multiple: true,
    selectAll: true,
    searchable: true,
    clearable: true,
    label: 'Countries',
    options: regions,
  },
};

const manyOptions: DropdownOption[] = Array.from({ length: 5000 }, (_, i) => ({
  value: `sku-${i}`,
  label: `Product SKU-${String(i).padStart(5, '0')}`,
}));

/** 5,000 options: only the visible rows are in the DOM. */
export const Virtualized: Story = {
  args: {
    label: 'Product',
    options: manyOptions,
    virtualized: true,
    searchable: true,
    defaultValue: 'sku-2500',
  },
};

const allCities = [
  'Barcelona',
  'Bogotá',
  'Buenos Aires',
  'Lima',
  'Lisboa',
  'Madrid',
  'Medellín',
  'Mexico City',
  'Montevideo',
  'Porto',
  'Quito',
  'Santiago',
  'São Paulo',
  'Sevilla',
  'Valencia',
].map((city) => ({ value: city.toLowerCase(), label: city }));

/** Server-side search (simulated 600 ms latency): `filter={false}` + `onSearchChange` + `loading`. */
export const AsyncSearch: Story = {
  render: function AsyncSearchStory() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<DropdownOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [value, setValue] = useState<string | null>(null);
    useEffect(() => {
      if (!query) return;
      const timer = setTimeout(() => {
        const q = query.toLowerCase();
        setResults(allCities.filter((c) => c.label.toLowerCase().includes(q)));
        setLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }, [query]);
    return (
      <Dropdown
        label="City"
        searchable
        filter={false}
        options={query ? results : []}
        searchValue={query}
        onSearchChange={(next) => {
          setQuery(next);
          setLoading(next !== '');
        }}
        loading={loading}
        emptyMessage="Type to search cities"
        value={value}
        onChange={setValue}
        clearable
      />
    );
  },
};

const statusOptions: DropdownOption[] = [
  { value: 'todo', label: 'To do' },
  { value: 'doing', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

function StatusCell({ initial, rowLabel }: { initial: string; rowLabel: string }) {
  const [status, setStatus] = useState(initial);
  const dropdown = useDropdown({
    items: statusOptions,
    value: status,
    onChange: ([next]) => {
      if (next) setStatus(next);
    },
  });
  return (
    <>
      <button
        type="button"
        {...dropdown.getTriggerProps({ 'aria-label': `Status of ${rowLabel}` })}
        style={{
          all: 'unset',
          cursor: 'pointer',
          padding: '2px 8px',
          borderRadius: 999,
          background: 'var(--ul-color-primary-subtle)',
          color: 'var(--ul-color-primary-text)',
          fontSize: 'var(--ul-font-size-sm)',
        }}
      >
        {dropdown.selectedOptions[0]?.label} ▾
      </button>
      <DropdownPopup dropdown={dropdown} aria-label="Status" size="sm" />
    </>
  );
}

/** `useDropdown` + `DropdownPopup`: any element can be the trigger, e.g. an editable table cell. */
export const CustomTriggerWithHook: Story = {
  render: () => (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'start' }}>Task</th>
          <th style={{ textAlign: 'start' }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {[
          { task: 'Design tokens', status: 'done' },
          { task: 'Dropdown', status: 'doing' },
          { task: 'Table', status: 'todo' },
        ].map(({ task, status }) => (
          <tr key={task}>
            <td style={{ padding: '6px 0' }}>{task}</td>
            <td style={{ overflow: 'hidden' }}>
              <StatusCell initial={status} rowLabel={task} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
