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
  Calendar,
  DatePicker,
  Dropdown,
  Input,
  UleahProvider,
} from '../../src/index.js';
import { axeViolations } from '../../src/test/axe.js';

/**
 * Automated checks catch only a subset of accessibility issues (structure,
 * names, ARIA validity). They do not replace manual keyboard and screen
 * reader testing. Colour contrast is checked in contrast.test.ts.
 */
const fruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana', description: 'Yellow' },
  { value: 'cherry', label: 'Cherry', disabled: true },
];

const groupedFruits = [
  { value: 'any', label: 'Any' },
  { type: 'separator' as const },
  { label: 'Berries', options: [{ value: 'straw', label: 'Strawberry' }] },
  { label: 'Pomes', options: fruits },
];

const manyFruits = Array.from({ length: 200 }, (_, i) => ({
  value: `f-${i}`,
  label: `Fruit ${i}`,
}));

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

      <Dropdown label="Fruit" options={fruits} defaultValue="banana" />
      <Dropdown label="Fruits" multiple options={fruits} defaultValue={['apple']} />
      <Dropdown label="Step" options={fruits} navigationButtons helperText="Use the arrows" />
      <Dropdown label="Invalid" options={fruits} error="Required" required />
      <Dropdown label="Off" options={fruits} disabled />
      <Dropdown aria-label="Open list" options={fruits} defaultOpen portal={false} />
      <Dropdown
        label="Searchable"
        options={groupedFruits}
        searchable
        multiple
        selectAll
        clearable
        defaultValue={['apple']}
        defaultOpen
        portal={false}
      />
      <DatePicker label="Due date" today={new Date(2026, 10, 13)} helperText="Weekdays only" />
      <DatePicker label="Required date" required error="Pick a date" />
      <DatePicker label="Disabled date" disabled />
      <DatePicker
        mode="range"
        label="Stay"
        defaultValue={{ start: new Date(2026, 10, 3), end: new Date(2026, 10, 10) }}
        presets={[
          {
            label: 'Next week',
            value: { start: new Date(2026, 10, 16), end: new Date(2026, 10, 22) },
          },
        ]}
        defaultOpen
        portal={false}
        clearable
      />
      <Calendar
        aria-label="Inline calendar"
        today={new Date(2026, 10, 13)}
        min={new Date(2026, 10, 5)}
      />
      <Calendar
        mode="range"
        numberOfMonths={2}
        defaultValue={{ start: new Date(2026, 10, 28), end: new Date(2026, 11, 4) }}
      />
      <Dropdown
        label="Virtual"
        options={manyFruits}
        virtualized
        defaultOpen
        portal={false}
        defaultValue="f-10"
      />

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
