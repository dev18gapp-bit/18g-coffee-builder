export type StepKind = 'choice' | 'process' | 'summary';

export interface CoffeeOption {
  id: string;
  name: string;
  /** Shown on the card — e.g. aroma/flavor notes for a bean, or a short blurb for milk/syrup. */
  description: string;
}

export interface CoffeeStep {
  id: string;
  kind: StepKind;
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: string;
  /** Present when kind === 'choice'. */
  options?: CoffeeOption[];
  /** Custom "Next" button label for process/summary steps. */
  cta?: string;
}

// ---------------------------------------------------------------------------
// PLACEHOLDER CONTENT — the actual bean/milk/syrup lineup, copy, and photos
// will come from the shop owner. Everything here just proves out the flow.
// Swap `icon` paths for real photography per item once available; for now
// every option within a step shares one representative icon.
// ---------------------------------------------------------------------------
export const STEPS: CoffeeStep[] = [
  {
    id: 'bean',
    kind: 'choice',
    eyebrow: 'Step 1',
    title: 'Choose Your Bean',
    subtitle: 'Give each one a smell before you pick — the aroma tells you a lot about the cup.',
    icon: '/images/coffee-icons/bean.svg',
    options: [
      { id: 'yirgacheffe', name: 'Ethiopian Yirgacheffe', description: 'Bright and floral, with notes of jasmine and citrus.' },
      { id: 'colombian', name: 'Colombian Supremo', description: 'Balanced and smooth, with caramel and toasted nut notes.' },
      { id: 'sumatra', name: 'Sumatra Mandheling', description: 'Bold and earthy, with dark chocolate and herbal notes.' },
    ],
  },
  {
    id: 'grind',
    kind: 'process',
    eyebrow: 'Step 2',
    title: 'Grinding to Order',
    subtitle: 'Your beans are ground fresh, right before brewing, to lock in aroma and flavor.',
    icon: '/images/coffee-icons/grinder.svg',
    cta: 'Next: Pull the shot',
  },
  {
    id: 'espresso',
    kind: 'process',
    eyebrow: 'Step 3',
    title: 'Pulling the Shot',
    subtitle: 'Hot water is pressed through the grounds at high pressure, extracting a rich, concentrated espresso.',
    icon: '/images/coffee-icons/espresso.svg',
    cta: 'Next: Choose your milk',
  },
  {
    id: 'milk',
    kind: 'choice',
    eyebrow: 'Step 4',
    title: 'Choose Your Milk',
    subtitle: 'Pick what goes with your espresso.',
    icon: '/images/coffee-icons/milk.svg',
    options: [
      { id: 'whole', name: 'Whole Milk', description: 'Creamy and classic.' },
      { id: 'oat', name: 'Oat Milk', description: 'Naturally sweet, dairy-free.' },
      { id: 'almond', name: 'Almond Milk', description: 'Light and nutty, dairy-free.' },
      { id: 'none', name: 'No Milk', description: 'Just espresso.' },
    ],
  },
  {
    id: 'syrup',
    kind: 'choice',
    eyebrow: 'Step 5',
    title: 'Choose Your Syrup',
    subtitle: 'Add a little something extra — or skip it.',
    icon: '/images/coffee-icons/syrup.svg',
    options: [
      { id: 'vanilla', name: 'Vanilla', description: 'Warm and classic.' },
      { id: 'caramel', name: 'Caramel', description: 'Rich and buttery.' },
      { id: 'hazelnut', name: 'Hazelnut', description: 'Toasty and nutty.' },
      { id: 'none', name: 'No Syrup', description: 'Keep it simple.' },
    ],
  },
  {
    id: 'temperature',
    kind: 'choice',
    eyebrow: 'Step 6',
    title: 'Hot or Iced?',
    subtitle: 'How would you like it served?',
    icon: '/images/coffee-icons/hot.svg',
    options: [
      { id: 'hot', name: 'Hot', description: 'Served warm, right away.' },
      { id: 'iced', name: 'Iced', description: 'Served cold, over ice.' },
    ],
  },
  {
    id: 'cup',
    kind: 'summary',
    eyebrow: 'Step 7',
    title: 'Your Cup',
    subtitle: "Here's what you made.",
    icon: '/images/coffee-icons/cup.svg',
    cta: 'Start Over',
  },
];

export type Selections = Record<string, string>; // stepId -> optionId

export function findOption(step: CoffeeStep, optionId: string | undefined): CoffeeOption | undefined {
  return step.options?.find((o) => o.id === optionId);
}
