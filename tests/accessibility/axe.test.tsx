import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  UleahProvider,
} from '../../src/index.js';
import { axeViolations } from '../../src/test/axe.js';

/**
 * Automated checks catch only a subset of accessibility issues (structure,
 * names, ARIA validity). They do not replace manual keyboard and screen
 * reader testing. Colour contrast is checked in contrast.test.ts.
 */
function Showcase() {
  return (
    <main>
      <h1>Showcase</h1>
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Delete</Button>
      <Button disabled>Disabled</Button>
      <Button loading>Saving</Button>
      <Button startIcon={<svg />}>With icon</Button>

      <Input label="Name" />
      <Input label="Email" type="email" helperText="We never share it." required />
      <Input label="Code" error="Invalid code" />
      <Input label="Search" hideLabel placeholder="Search…" />
      <Input label="Locked" disabled defaultValue="x" />
      <Input label="Read only" readOnly defaultValue="x" />
      <Input aria-label="Unlabelled visually" />

      <Card as="section" aria-labelledby="card-title">
        <CardHeader>
          <CardTitle as="h2" id="card-title">
            Card
          </CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge>Neutral</Badge>
          <Badge variant="success" dot>
            Active
          </Badge>
        </CardContent>
        <CardFooter>
          <Button>Action</Button>
        </CardFooter>
      </Card>
    </main>
  );
}

describe('axe-core audit', () => {
  it.each(['light', 'dark', 'system'] as const)('has no violations in %s theme', async (theme) => {
    const { container } = render(
      <UleahProvider theme={theme}>
        <Showcase />
      </UleahProvider>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
