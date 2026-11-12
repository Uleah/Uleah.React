import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button.js';
import type { ButtonSize, ButtonVariant } from './Button.types.js';

describe('Button', () => {
  it('renders a native button with defaults', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('ul-button', 'ul-button--primary', 'ul-button--md');
  });

  it.each<ButtonVariant>(['primary', 'secondary', 'outline', 'ghost', 'danger'])(
    'applies the %s variant class',
    (variant) => {
      render(<Button variant={variant}>Go</Button>);
      expect(screen.getByRole('button')).toHaveClass(`ul-button--${variant}`);
    },
  );

  it.each<ButtonSize>(['sm', 'md', 'lg'])('applies the %s size class', (size) => {
    render(<Button size={size}>Go</Button>);
    expect(screen.getByRole('button')).toHaveClass(`ul-button--${size}`);
  });

  it('merges className and forwards native attributes and ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Button ref={ref} className="custom" type="submit" name="intent" data-testid="b">
        Go
      </Button>,
    );
    const button = screen.getByTestId('b');
    expect(button).toHaveClass('ul-button', 'custom');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('name', 'intent');
    expect(ref.current).toBe(button);
  });

  it('calls onClick when activated by mouse and keyboard', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    const button = screen.getByRole('button');

    await user.click(button);
    button.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('is natively disabled and does not fire onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  describe('loading', () => {
    it('announces busy state, stays focusable and blocks activation', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Button loading onClick={onClick}>
          Save
        </Button>,
      );
      const button = screen.getByRole('button', { name: /save/i });
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).not.toBeDisabled();
      expect(button).toHaveAccessibleName('Save Loading');

      await user.tab();
      expect(button).toHaveFocus();
      await user.click(button);
      await user.keyboard('{Enter}');
      expect(onClick).not.toHaveBeenCalled();
    });

    it('does not submit the surrounding form', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <Button type="submit" loading>
            Submit
          </Button>
        </form>,
      );
      await user.click(screen.getByRole('button'));
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('supports a custom loading label', () => {
      render(
        <Button loading loadingLabel="Saving">
          Save
        </Button>,
      );
      expect(screen.getByRole('button')).toHaveAccessibleName('Save Saving');
    });
  });

  it('applies full width and hides icons from assistive tech', () => {
    render(
      <Button fullWidth startIcon={<svg data-testid="start" />} endIcon={<svg data-testid="end" />}>
        Next
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Next' });
    expect(button).toHaveClass('ul-button--full-width');
    expect(screen.getByTestId('start').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('end').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('supports component-level CSS variables through style', () => {
    render(<Button style={{ ['--ul-button-radius' as string]: '999px' }}>Pill</Button>);
    expect(screen.getByRole('button').style.getPropertyValue('--ul-button-radius')).toBe('999px');
  });
});
