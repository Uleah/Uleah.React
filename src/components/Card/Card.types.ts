import type { HTMLAttributes } from 'react';

export type CardVariant = 'outlined' | 'elevated' | 'filled';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardElement = 'div' | 'section' | 'article' | 'aside' | 'li';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Surface treatment. @default 'outlined' */
  variant?: CardVariant;
  /** Inner spacing shared by header, content and footer. @default 'md' */
  padding?: CardPadding;
  /**
   * Root element. Use `section`/`article` when the card is a meaningful region
   * (give it an accessible name, e.g. `aria-labelledby` pointing to its title).
   * @default 'div'
   */
  as?: CardElement;
}

export type CardHeaderProps = HTMLAttributes<HTMLDivElement>;

export type CardTitleElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /**
   * Heading level. Choose the level that fits your page outline.
   * @default 'h3'
   */
  as?: CardTitleElement;
}

export type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>;
export type CardContentProps = HTMLAttributes<HTMLDivElement>;

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Horizontal alignment of footer items. @default 'end' */
  align?: 'start' | 'center' | 'end' | 'between';
}
