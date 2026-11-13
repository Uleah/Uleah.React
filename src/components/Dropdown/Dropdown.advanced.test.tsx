import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dropdown } from './Dropdown.js';
import { DropdownPopup } from './DropdownPopup.js';
import type { DropdownItem, DropdownOption } from './Dropdown.types.js';
import { useDropdown } from './useDropdown.js';

const countries: DropdownOption[] = [
  { value: 'es', label: 'España' },
  { value: 'mx', label: 'México' },
  { value: 'pe', label: 'Perú' },
  { value: 'pt', label: 'Portugal' },
  { value: 'us', label: 'United States', disabled: true },
];

const grouped: DropdownItem[] = [
  { value: 'none', label: 'No region' },
  { type: 'separator' },
  {
    label: 'Europe',
    options: [
      { value: 'es', label: 'Spain' },
      { value: 'pt', label: 'Portugal' },
    ],
  },
  {
    label: 'America',
    options: [
      { value: 'mx', label: 'Mexico' },
      { value: 'pe', label: 'Peru' },
    ],
  },
];

const combobox = () => screen.getAllByRole('combobox')[0]!;
const searchBox = () => screen.getByRole('combobox', { name: 'Search options' });
const optionNames = () => screen.queryAllByRole('option').map((o) => o.textContent);

describe('Dropdown search', () => {
  it('moves focus to the search box and filters ignoring case and accents', async () => {
    const user = userEvent.setup();
    render(<Dropdown label="Country" options={countries} searchable />);
    await user.click(combobox());
    expect(searchBox()).toHaveFocus();

    await user.keyboard('PE');
    expect(optionNames()).toEqual(['Perú']);
    await user.keyboard('{Backspace}{Backspace}mex');
    expect(optionNames()).toEqual(['México']);

    await user.keyboard('{Enter}');
    expect(combobox()).toHaveTextContent('México');
    expect(combobox()).toHaveFocus();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('starts searching when typing on the closed trigger', async () => {
    const user = userEvent.setup();
    render(<Dropdown label="Country" options={countries} searchable />);
    combobox().focus();
    await user.keyboard('p');
    expect(searchBox()).toHaveValue('p');
    expect(searchBox()).toHaveFocus();
    expect(optionNames()).toEqual(['España', 'Perú', 'Portugal']);
  });

  it('navigates results with the arrows and exposes the active option', async () => {
    const user = userEvent.setup();
    render(<Dropdown label="Country" options={countries} searchable />);
    await user.click(combobox());
    await user.keyboard('p{ArrowDown}');
    const active = document.getElementById(searchBox().getAttribute('aria-activedescendant')!);
    expect(active).toHaveTextContent('Perú');
  });

  it('shows the no-results message and clears the query with Escape', async () => {
    const user = userEvent.setup();
    render(<Dropdown label="Country" options={countries} searchable noResultsMessage="Nada" />);
    await user.click(combobox());
    await user.keyboard('zzz');
    expect(screen.getByRole('status')).toHaveTextContent('Nada');
    await user.keyboard('{Escape}');
    expect(searchBox()).toHaveValue('');
    expect(optionNames()).toHaveLength(5);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(combobox()).toHaveFocus();
  });

  it('supports a custom filter', async () => {
    const user = userEvent.setup();
    render(
      <Dropdown
        label="Country"
        options={countries}
        searchable
        filter={(option, query) => option.value === query}
      />,
    );
    await user.click(combobox());
    await user.keyboard('pt');
    expect(optionNames()).toEqual(['Portugal']);
  });

  it('supports server-side search: filter={false}, loading and remembered labels', async () => {
    const user = userEvent.setup();
    function Remote() {
      const [query, setQuery] = useState('');
      const [value, setValue] = useState<string | null>(null);
      const results = countries.filter((c) => c.value.startsWith(query));
      return (
        <Dropdown
          label="Country"
          options={query ? results : []}
          searchable
          filter={false}
          searchValue={query}
          onSearchChange={setQuery}
          loading={query === 'x'}
          loadingMessage="Loading countries"
          emptyMessage="Type to search"
          value={value}
          onChange={setValue}
        />
      );
    }
    render(<Remote />);
    await user.click(combobox());
    expect(screen.getByRole('status')).toHaveTextContent('Type to search');
    await user.keyboard('x');
    expect(screen.getByRole('status')).toHaveTextContent('Loading countries');
    await user.keyboard('{Backspace}m');
    expect(optionNames()).toEqual(['México']);
    await user.keyboard('{Enter}');
    // The options list is now empty (query reset), but the label is remembered.
    expect(combobox()).toHaveTextContent('México');
  });

  it('highlights the first result when server results arrive after typing', async () => {
    const user = userEvent.setup();
    function Delayed() {
      const [query, setQuery] = useState('');
      const [results, setResults] = useState<DropdownOption[]>([]);
      const [value, setValue] = useState<string | null>(null);
      return (
        <>
          <Dropdown
            label="Country"
            options={results}
            searchable
            filter={false}
            searchValue={query}
            onSearchChange={setQuery}
            value={value}
            onChange={setValue}
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setResults(countries.filter((c) => c.value.startsWith(query)))}
          >
            Deliver results
          </button>
        </>
      );
    }
    render(<Delayed />);
    await user.click(combobox());
    await user.keyboard('m');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Deliver results' }));
    expect(optionNames()).toEqual(['México']);
    expect(searchBox()).toHaveAttribute('aria-activedescendant');
    searchBox().focus();
    await user.keyboard('{Enter}');
    expect(combobox()).toHaveTextContent('México');
  });

  it('calls onLoadMore near the end of the list', async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    render(<Dropdown label="Country" options={countries} onLoadMore={onLoadMore} />);
    await user.click(combobox());
    fireEvent.scroll(screen.getByRole('listbox'));
    expect(onLoadMore).toHaveBeenCalled();
  });
});

describe('Dropdown groups and separators', () => {
  it('renders named groups and skips headers when navigating', async () => {
    const user = userEvent.setup();
    render(<Dropdown label="Country" options={grouped} />);
    await user.click(combobox());
    const groups = screen.getAllByRole('group');
    expect(groups.map((g) => g.getAttribute('aria-label'))).toEqual(['Europe', 'America']);
    expect(optionNames()).toEqual(['No region', 'Spain', 'Portugal', 'Mexico', 'Peru']);

    await user.keyboard('{ArrowDown}{Enter}');
    expect(combobox()).toHaveTextContent('Spain');
  });

  it('hides groups without matches while searching', async () => {
    const user = userEvent.setup();
    render(<Dropdown label="Country" options={grouped} searchable />);
    await user.click(combobox());
    await user.keyboard('mex');
    expect(screen.getAllByRole('group').map((g) => g.getAttribute('aria-label'))).toEqual([
      'America',
    ]);
    expect(document.querySelector('.ul-dropdown__separator')).toBeNull();
  });

  it('steps across groups with the navigation buttons', async () => {
    const user = userEvent.setup();
    render(<Dropdown label="Country" options={grouped} defaultValue="pt" navigationButtons />);
    await user.click(screen.getByRole('button', { name: 'Next option' }));
    expect(combobox()).toHaveTextContent('Mexico');
  });
});

describe('Dropdown virtualization', () => {
  const many: DropdownOption[] = Array.from({ length: 1000 }, (_, i) => ({
    value: `item-${i}`,
    label: `Item ${i}`,
  }));

  it('renders only a window of options and reports the real size', async () => {
    const user = userEvent.setup();
    render(<Dropdown label="Item" options={many} virtualized itemHeight={36} />);
    await user.click(combobox());
    const rendered = screen.getAllByRole('option');
    expect(rendered.length).toBeLessThan(50);
    expect(rendered[0]).toHaveAttribute('aria-setsize', '1000');
    expect(rendered[0]).toHaveAttribute('aria-posinset', '1');
  });

  it('renders the rows that are scrolled into view', async () => {
    const user = userEvent.setup();
    render(<Dropdown label="Item" options={many} virtualized itemHeight={36} />);
    await user.click(combobox());
    const listbox = screen.getByRole('listbox');
    Object.defineProperty(listbox, 'scrollTop', { configurable: true, value: 36 * 500 });
    fireEvent.scroll(listbox);
    expect(screen.getByRole('option', { name: 'Item 500' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Item 0' })).not.toBeInTheDocument();
  });

  it('keeps the active option rendered while navigating with the keyboard', async () => {
    const user = userEvent.setup();
    render(<Dropdown label="Item" options={many} virtualized itemHeight={36} />);
    combobox().focus();
    await user.keyboard('{ArrowDown}{End}');
    const activeId = combobox().getAttribute('aria-activedescendant')!;
    expect(document.getElementById(activeId)).toHaveTextContent('Item 999');
  });

  it('opens on the selected option', async () => {
    const user = userEvent.setup();
    render(<Dropdown label="Item" options={many} virtualized defaultValue="item-700" />);
    await user.click(combobox());
    const activeId = combobox().getAttribute('aria-activedescendant')!;
    expect(document.getElementById(activeId)).toHaveTextContent('Item 700');
  });
});

describe('Dropdown clear and select all', () => {
  it('clears with the button and with Backspace', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Dropdown
        label="Country"
        options={countries}
        defaultValue="es"
        clearable
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(onChange).toHaveBeenLastCalledWith(null, undefined);
    expect(combobox()).toHaveTextContent('Select…');
    expect(combobox()).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();

    await user.keyboard('{ArrowDown}{Enter}');
    expect(combobox()).toHaveTextContent('España');
    await user.keyboard('{Backspace}');
    expect(combobox()).toHaveTextContent('Select…');
  });

  it('selects and deselects every enabled option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Dropdown multiple selectAll label="Countries" options={countries} onChange={onChange} />,
    );
    await user.click(combobox());
    await user.click(screen.getByRole('button', { name: 'Select all' }));
    expect(onChange).toHaveBeenLastCalledWith(['es', 'mx', 'pe', 'pt'], countries.slice(0, 4));
    await user.click(screen.getByRole('button', { name: 'Deselect all' }));
    expect(onChange).toHaveBeenLastCalledWith([], []);
  });

  it('select all only applies to the search results', async () => {
    const user = userEvent.setup();
    render(
      <Dropdown multiple selectAll searchable label="Countries" options={countries} name="c" />,
    );
    await user.click(combobox());
    await user.keyboard('po');
    await user.click(screen.getByRole('button', { name: 'Select all' }));
    expect(screen.getByRole('option', { name: 'Portugal' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(document.querySelectorAll('input[type="hidden"]')).toHaveLength(1);
  });

  it('toggles all with Ctrl+A on the trigger', async () => {
    const user = userEvent.setup();
    render(<Dropdown multiple label="Countries" options={countries} />);
    combobox().focus();
    await user.keyboard('{ArrowDown}{Control>}a{/Control}');
    expect(combobox()).toHaveTextContent('4 selected');
  });
});

describe('useDropdown with a custom trigger', () => {
  function StatusCell() {
    const [status, setStatus] = useState('open');
    const options: DropdownOption[] = [
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
    ];
    const dropdown = useDropdown({
      items: options,
      value: status,
      onChange: ([next]) => next && setStatus(next),
    });
    return (
      <table>
        <tbody>
          <tr>
            <td>
              <button type="button" {...dropdown.getTriggerProps({ 'aria-label': 'Status' })}>
                {dropdown.selectedOptions[0]?.label}
              </button>
              <DropdownPopup dropdown={dropdown} aria-label="Status" size="sm" />
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  it('wires a native button as the combobox and reuses the standard popup', async () => {
    const user = userEvent.setup();
    render(<StatusCell />);
    const trigger = screen.getByRole('combobox', { name: 'Status' });
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger).toHaveTextContent('Open');

    await user.click(trigger);
    expect(screen.getByRole('listbox', { name: 'Status' })).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'Closed' }));
    expect(trigger).toHaveTextContent('Closed');

    // Keyboard on a native button: Enter opens once (no extra click toggle).
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowUp}{Enter}');
    expect(trigger).toHaveTextContent('Open');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('exposes actions for custom UIs', () => {
    let api: ReturnType<typeof useDropdown> | undefined;
    function Probe() {
      api = useDropdown({ items: countries, multiple: true });
      return null;
    }
    render(<Probe />);
    act(() => api!.toggleAll());
    expect(api!.selectedValues).toEqual(['es', 'mx', 'pe', 'pt']);
    act(() => api!.clear());
    expect(api!.selectedValues).toEqual([]);
  });
});
