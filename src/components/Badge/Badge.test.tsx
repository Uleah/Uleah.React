import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge.js';
import type { BadgeVariant } from './Badge.types.js';

describe('Badge', () => {
  it('renders text with defaults', () => {
    render(<Badge>Draft</Badge>);
    expect(screen.getByText('Draft')).toHaveClass('ul-badge', 'ul-badge--neutral', 'ul-badge--md');
  });

  it.each<BadgeVariant>(['neutral', 'primary', 'success', 'warning', 'danger', 'info'])(
    'applies the %s variant',
    (variant) => {
      render(<Badge variant={variant}>x</Badge>);
      expect(screen.getByText('x')).toHaveClass(`ul-badge--${variant}`);
    },
  );

  it('applies sizes', () => {
    render(<Badge size="sm">x</Badge>);
    expect(screen.getByText('x')).toHaveClass('ul-badge--sm');
  });

  it('renders a decorative dot hidden from assistive tech', () => {
    render(
      <Badge dot variant="success">
        Online
      </Badge>,
    );
    const badge = screen.getByText('Online');
    const dot = badge.querySelector('.ul-badge__dot');
    expect(dot).toHaveAttribute('aria-hidden', 'true');
    expect(badge).toHaveTextContent(/^Online$/);
  });

  it('forwards ref and native attributes', () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Badge ref={ref} className="x" title="3 unread messages">
        3
      </Badge>,
    );
    expect(ref.current).toHaveClass('ul-badge', 'x');
    expect(ref.current).toHaveAttribute('title', '3 unread messages');
  });
});
