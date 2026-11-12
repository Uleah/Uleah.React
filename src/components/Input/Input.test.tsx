import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Input } from './Input.js';

describe('Input', () => {
  it('associates the label with the input', () => {
    render(<Input label="Email" />);
    const input = screen.getByLabelText('Email');
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveClass('ul-input');
  });

  it('uses a provided id', () => {
    render(<Input id="email" label="Email" />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'email');
  });

  it('keeps a visually hidden label as the accessible name', () => {
    render(<Input label="Search" hideLabel />);
    expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByText('Search')).toHaveClass('ul-visually-hidden');
  });

  it('links helper text via aria-describedby', () => {
    render(<Input label="Name" helperText="As shown on your ID" aria-describedby="extra" />);
    const input = screen.getByLabelText('Name');
    expect(input).toHaveAccessibleDescription('As shown on your ID');
    expect(input.getAttribute('aria-describedby')).toMatch(/^extra /);
  });

  it('shows an error message, marks invalid and replaces helper text', () => {
    render(<Input label="Email" helperText="Work email" error="Enter a valid email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter a valid email');
    expect(screen.queryByText('Work email')).not.toBeInTheDocument();
  });

  it('supports error={true} without a message', () => {
    render(<Input label="Code" helperText="6 digits" error />);
    const input = screen.getByLabelText('Code');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('6 digits');
  });

  it('handles required, disabled and readOnly natively', () => {
    render(
      <>
        <Input label="A" required />
        <Input label="B" disabled />
        <Input label="C" readOnly />
      </>,
    );
    expect(screen.getByLabelText(/^A/)).toBeRequired();
    expect(screen.getByLabelText('B')).toBeDisabled();
    expect(screen.getByLabelText('C')).toHaveAttribute('readonly');
    // The asterisk is decorative; `required` conveys the state.
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
  });

  it('works uncontrolled', async () => {
    const user = userEvent.setup();
    render(<Input label="Name" defaultValue="Ada" />);
    const input = screen.getByLabelText('Name');
    await user.type(input, ' L');
    expect(input).toHaveValue('Ada L');
  });

  it('works controlled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Controlled() {
      const [value, setValue] = useState('');
      return (
        <Input
          label="Name"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setValue(e.target.value.toUpperCase());
          }}
        />
      );
    }
    render(<Controlled />);
    await user.type(screen.getByLabelText('Name'), 'ab');
    expect(screen.getByLabelText('Name')).toHaveValue('AB');
    expect(onChange).toHaveBeenLastCalledWith('Ab');
  });

  it('does not change value when readOnly', async () => {
    const user = userEvent.setup();
    render(<Input label="Name" readOnly defaultValue="fixed" />);
    await user.type(screen.getByLabelText('Name'), 'x');
    expect(screen.getByLabelText('Name')).toHaveValue('fixed');
  });

  it('forwards ref, native attributes and class names', () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(
      <Input
        ref={ref}
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        className="root"
        inputClassName="control"
        size="lg"
      />,
    );
    const input = screen.getByLabelText('Email');
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'you@example.com');
    expect(input).toHaveAttribute('autocomplete', 'email');
    expect(input).toHaveClass('ul-input', 'control');
    expect(container.firstChild).toHaveClass('ul-field', 'ul-field--lg', 'root');
  });
});
