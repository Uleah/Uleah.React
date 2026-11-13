import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UleahProvider } from '../../theme/UleahProvider.js';
import { Dropdown } from './Dropdown.js';
import type { DropdownOption } from './Dropdown.types.js';

const fruits: DropdownOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'blueberry', label: 'Blueberry', disabled: true },
  { value: 'cherry', label: 'Cherry', description: 'Seasonal' },
  { value: 'date', label: 'Date' },
];

const combobox = () => screen.getByRole('combobox');
const activeOption = () => {
  const id = combobox().getAttribute('aria-activedescendant');
  return id ? document.getElementById(id) : null;
};

describe('Dropdown', () => {
  it('renders a labelled, collapsed combobox showing the placeholder', () => {
    render(<Dropdown label="Fruit" options={fruits} placeholder="Pick one" />);
    const trigger = screen.getByRole('combobox', { name: 'Fruit' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveTextContent('Pick one');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens on click, selects an option and closes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Dropdown label="Fruit" options={fruits} onChange={onChange} />);

    await user.click(combobox());
    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox', { name: 'Fruit' })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(5);

    await user.click(screen.getByRole('option', { name: /Cherry/ }));
    expect(onChange).toHaveBeenCalledWith('cherry', fruits[3]);
    expect(combobox()).toHaveTextContent('Cherry');
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    expect(combobox()).toHaveFocus();
  });

  it('does not select disabled options', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Dropdown label="Fruit" options={fruits} onChange={onChange} />);
    await user.click(combobox());
    const disabled = screen.getByRole('option', { name: 'Blueberry' });
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await user.click(disabled);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('supports the keyboard: arrows skip disabled options, Enter selects, Escape closes', async () => {
    const user = userEvent.setup();
    render(<Dropdown label="Fruit" options={fruits} />);
    combobox().focus();

    await user.keyboard('{ArrowDown}');
    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
    expect(activeOption()).toHaveTextContent('Apple');

    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(activeOption()).toHaveTextContent('Cherry'); // Blueberry skipped

    await user.keyboard('{End}');
    expect(activeOption()).toHaveTextContent('Date');
    await user.keyboard('{Home}');
    expect(activeOption()).toHaveTextContent('Apple');

    await user.keyboard('{ArrowDown}{Enter}');
    expect(combobox()).toHaveTextContent('Banana');
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');

    await user.keyboard(' ');
    expect(activeOption()).toHaveTextContent('Banana'); // opens on the selected option
    await user.keyboard('{Escape}');
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    expect(combobox()).toHaveTextContent('Banana');
  });

  it('jumps to options by typing (type-ahead)', async () => {
    const user = userEvent.setup();
    render(<Dropdown label="Fruit" options={fruits} />);
    combobox().focus();
    await user.keyboard('c');
    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
    expect(activeOption()).toHaveTextContent('Cherry');
    await user.keyboard('{Enter}');
    expect(combobox()).toHaveTextContent('Cherry');
  });

  it('Tab commits the highlighted option in single mode', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Dropdown label="Fruit" options={fruits} />
        <button type="button">Next</button>
      </>,
    );
    combobox().focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    await user.tab();
    expect(combobox()).toHaveTextContent('Banana');
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes when pressing outside', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Dropdown label="Fruit" options={fruits} />
        <p>Outside</p>
      </>,
    );
    await user.click(combobox());
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.click(screen.getByText('Outside'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('works controlled', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<string | null>('date');
      return (
        <>
          <Dropdown label="Fruit" options={fruits} value={value} onChange={setValue} />
          <output>{value ?? 'none'}</output>
        </>
      );
    }
    render(<Controlled />);
    expect(combobox()).toHaveTextContent('Date');
    await user.click(combobox());
    await user.click(screen.getByRole('option', { name: 'Apple' }));
    expect(screen.getByRole('status')).toHaveTextContent('apple');
    expect(combobox()).toHaveTextContent('Apple');
  });

  it('supports a controlled open state', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Dropdown label="Fruit" options={fruits} open onOpenChange={onOpenChange} />);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'Apple' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('listbox')).toBeInTheDocument(); // parent decides
  });

  describe('multiple selection', () => {
    it('toggles options, stays open and reports every value', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Dropdown multiple label="Fruits" options={fruits} onChange={onChange} />);
      await user.click(combobox());
      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-multiselectable', 'true');

      await user.click(screen.getByRole('option', { name: 'Apple' }));
      await user.click(screen.getByRole('option', { name: /Cherry/ }));
      expect(onChange).toHaveBeenLastCalledWith(['apple', 'cherry'], [fruits[0], fruits[3]]);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(combobox()).toHaveTextContent('Apple, Cherry');

      await user.click(screen.getByRole('option', { name: 'Apple' }));
      expect(onChange).toHaveBeenLastCalledWith(['cherry'], [fruits[3]]);
      expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute(
        'aria-selected',
        'false',
      );
    });

    it('toggles with Space from the keyboard', async () => {
      const user = userEvent.setup();
      render(<Dropdown multiple label="Fruits" options={fruits} />);
      combobox().focus();
      await user.keyboard('{ArrowDown} {ArrowDown} ');
      expect(combobox()).toHaveTextContent('Apple, Banana');
      expect(combobox()).toHaveAttribute('aria-expanded', 'true');
    });

    it('summarises many selected values', () => {
      render(
        <Dropdown
          multiple
          label="Fruits"
          options={fruits}
          defaultValue={['apple', 'banana', 'cherry']}
          maxDisplayedValues={2}
          selectedSummary={(n) => `${n} fruits`}
        />,
      );
      expect(combobox()).toHaveTextContent('3 fruits');
    });
  });

  describe('navigation buttons', () => {
    it('steps through enabled options and disables at the ends', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <Dropdown
          label="Fruit"
          options={fruits}
          defaultValue="banana"
          navigationButtons
          onChange={onChange}
        />,
      );
      const previous = screen.getByRole('button', { name: 'Previous option' });
      const next = screen.getByRole('button', { name: 'Next option' });

      await user.click(next);
      expect(onChange).toHaveBeenLastCalledWith('cherry', fruits[3]); // skips Blueberry
      await user.click(next);
      expect(combobox()).toHaveTextContent('Date');
      expect(next).toBeDisabled();

      await user.click(previous);
      await user.click(previous);
      await user.click(previous);
      expect(combobox()).toHaveTextContent('Apple');
      expect(previous).toBeDisabled();
    });

    it('wraps around with loop', async () => {
      const user = userEvent.setup();
      render(
        <Dropdown label="Fruit" options={fruits} defaultValue="date" navigationButtons loop />,
      );
      await user.click(screen.getByRole('button', { name: 'Next option' }));
      expect(combobox()).toHaveTextContent('Apple');
      await user.click(screen.getByRole('button', { name: 'Previous option' }));
      expect(combobox()).toHaveTextContent('Date');
    });

    it('is not rendered in multiple mode', () => {
      render(<Dropdown multiple navigationButtons label="Fruits" options={fruits} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  it('links helper and error text and marks invalid', () => {
    render(
      <Dropdown label="Fruit" options={fruits} helperText="Pick one" error="Required" required />,
    );
    expect(combobox()).toHaveAccessibleDescription('Required');
    expect(combobox()).toHaveAttribute('aria-invalid', 'true');
    expect(combobox()).toHaveAttribute('aria-required', 'true');
  });

  it('cannot be opened when disabled', async () => {
    const user = userEvent.setup();
    render(<Dropdown label="Fruit" options={fruits} disabled />);
    expect(combobox()).toHaveAttribute('aria-disabled', 'true');
    expect(combobox()).toHaveAttribute('tabindex', '-1');
    await user.click(combobox());
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('submits values through hidden inputs', () => {
    const { container } = render(
      <form>
        <Dropdown multiple name="fruits" options={fruits} defaultValue={['apple', 'date']} />
      </form>,
    );
    const data = new FormData(container.querySelector('form')!);
    expect(data.getAll('fruits')).toEqual(['apple', 'date']);
  });

  it('portals the popup into the nearest theme scope', async () => {
    const user = userEvent.setup();
    render(
      <UleahProvider theme="dark" data-testid="scope">
        <div style={{ overflow: 'hidden' }} data-testid="clip">
          <Dropdown aria-label="Fruit" options={fruits} />
        </div>
      </UleahProvider>,
    );
    await user.click(combobox());
    const popup = screen.getByRole('listbox').parentElement!;
    expect(popup.parentElement).toBe(screen.getByTestId('scope'));
    expect(screen.getByTestId('clip')).not.toContainElement(popup);
  });

  it('can render inline without a portal', async () => {
    const user = userEvent.setup();
    const { container } = render(<Dropdown label="Fruit" options={fruits} portal={false} />);
    await user.click(combobox());
    expect(container.querySelector('.ul-dropdown')).toContainElement(screen.getByRole('listbox'));
  });

  it('supports custom rendering, long-option wrapping and an empty state', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Dropdown
        label="Fruit"
        options={fruits}
        defaultValue="apple"
        optionOverflow="wrap"
        renderValue={(selected) => `Chosen: ${selected[0]!.label}`}
        renderOption={(option, { selected }) => `${option.label}${selected ? ' ✓' : ''}`}
      />,
    );
    expect(combobox()).toHaveTextContent('Chosen: Apple');
    await user.click(combobox());
    expect(screen.getByRole('listbox').parentElement).toHaveClass('ul-dropdown__popup--wrap');
    expect(screen.getByRole('option', { name: 'Apple ✓' })).toBeInTheDocument();

    rerender(<Dropdown label="Fruit" options={[]} emptyMessage="Nothing here" defaultOpen />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('forwards the ref to the trigger and passes extra props through', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Dropdown ref={ref} label="Fruit" options={fruits} data-testid="trigger" />);
    expect(ref.current).toBe(combobox());
    expect(screen.getByTestId('trigger')).toBe(combobox());
  });
});
