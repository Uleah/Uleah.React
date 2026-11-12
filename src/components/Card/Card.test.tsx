import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card.js';

describe('Card', () => {
  it('renders composed parts with default classes', () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Plan</CardTitle>
          <CardDescription>Monthly</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Actions</CardFooter>
      </Card>,
    );
    const card = screen.getByTestId('card');
    expect(card.tagName).toBe('DIV');
    expect(card).toHaveClass('ul-card', 'ul-card--outlined', 'ul-card--padding-md');
    expect(screen.getByRole('heading', { level: 3, name: 'Plan' })).toHaveClass('ul-card__title');
    expect(screen.getByText('Monthly')).toHaveClass('ul-card__description');
    expect(screen.getByText('Body')).toHaveClass('ul-card__content');
    expect(screen.getByText('Actions')).toHaveClass('ul-card__footer', 'ul-card__footer--end');
  });

  it.each(['outlined', 'elevated', 'filled'] as const)('applies the %s variant', (variant) => {
    render(<Card data-testid="card" variant={variant} />);
    expect(screen.getByTestId('card')).toHaveClass(`ul-card--${variant}`);
  });

  it.each(['none', 'sm', 'md', 'lg'] as const)('applies %s padding', (padding) => {
    render(<Card data-testid="card" padding={padding} />);
    expect(screen.getByTestId('card')).toHaveClass(`ul-card--padding-${padding}`);
  });

  it('renders as a labelled region and supports custom heading levels', () => {
    render(
      <Card as="section" aria-labelledby="t">
        <CardTitle as="h2" id="t">
          Billing
        </CardTitle>
      </Card>,
    );
    expect(screen.getByRole('region', { name: 'Billing' }).tagName).toBe('SECTION');
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('forwards refs and className', () => {
    const ref = createRef<HTMLElement>();
    render(<Card ref={ref} as="article" className="x" data-testid="card" />);
    expect(ref.current).toBe(screen.getByTestId('card'));
    expect(ref.current?.tagName).toBe('ARTICLE');
    expect(ref.current).toHaveClass('ul-card', 'x');
  });

  it('aligns the footer', () => {
    render(<CardFooter align="between">x</CardFooter>);
    expect(screen.getByText('x')).toHaveClass('ul-card__footer--between');
  });
});
