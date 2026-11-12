import { forwardRef } from 'react';
import { cx } from '../../utils/cx.js';
import type {
  CardContentProps,
  CardDescriptionProps,
  CardFooterProps,
  CardHeaderProps,
  CardProps,
  CardTitleProps,
} from './Card.types.js';

/** A surface that groups related content. Compose with the `Card*` parts. */
export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  { variant = 'outlined', padding = 'md', as: Component = 'div', className, ...rest },
  ref,
) {
  return (
    <Component
      // The union of intrinsic elements makes TS unable to pick a single ref type.
      ref={ref as never}
      className={cx('ul-card', `ul-card--${variant}`, `ul-card--padding-${padding}`, className)}
      {...rest}
    />
  );
});

/** Top area of a card: title, description and optional actions. */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(function CardHeader(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx('ul-card__header', className)} {...rest} />;
});

/** Card heading. Renders an `<h3>` by default. */
export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(function CardTitle(
  { as: Component = 'h3', className, ...rest },
  ref,
) {
  return <Component ref={ref} className={cx('ul-card__title', className)} {...rest} />;
});

/** Secondary text under the title. */
export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  function CardDescription({ className, ...rest }, ref) {
    return <p ref={ref} className={cx('ul-card__description', className)} {...rest} />;
  },
);

/** Main body of the card. */
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(function CardContent(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx('ul-card__content', className)} {...rest} />;
});

/** Bottom area of the card, typically actions. Items wrap on narrow widths. */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(function CardFooter(
  { align = 'end', className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx('ul-card__footer', `ul-card__footer--${align}`, className)}
      {...rest}
    />
  );
});
