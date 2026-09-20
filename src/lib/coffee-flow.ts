import { API_URL } from './api';

export type StepKind = 'choice' | 'process' | 'summary';
export type OptionCategory = 'bean' | 'milk' | 'syrup';

export interface CoffeeOption {
  id: string;
  name: string;
  /** Shown on the card — e.g. aroma/flavor notes for a bean, or a short blurb for milk/syrup. */
  description: string;
  imageUrl?: string | null;
}

export interface CoffeeStep {
  id: string;
  kind: StepKind;
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: string;
  /** Present on bean/milk/syrup steps — their options come from the admin-managed catalog. */
  optionsCategory?: OptionCategory;
  /** Static options (e.g. hot/iced), or the placeholder/fetched list for a dynamic step. */
  options?: CoffeeOption[];
  /** Custom "Next" button label for process/summary steps. */
  cta?: string;
}

// ---------------------------------------------------------------------------
// Bean/milk/syrup options are admin-managed (see /admin) and stored in the
// shared 18gCoffeeDB — fetchCoffeeBuilderOptions() below pulls the live
// catalog. The lists here are just a fallback shown if that fetch comes back
// empty (nothing added in admin yet) or fails, so the kiosk is never blank.
// ---------------------------------------------------------------------------
export const STEPS: CoffeeStep[] = [
  {
    id: 'bean',
    kind: 'choice',
    eyebrow: 'Step 1',
    title: 'Choose Your Bean',
    subtitle: 'Give each one a smell before you pick — the aroma tells you a lot about the cup.',
    icon: '/images/coffee-icons/bean.svg',
    optionsCategory: 'bean',
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
    title: 'Weigh & Grind',
    subtitle:
      "Every shot starts with exactly 18 grams of beans — weighed by hand, then ground fresh into a fine powder and packed into the puck.",
    icon: '/images/coffee-icons/grinder.svg',
    cta: 'Next: Pull the shot',
  },
  {
    id: 'espresso',
    kind: 'process',
    eyebrow: 'Step 3',
    title: 'Pulling the Shot',
    subtitle:
      'The packed puck locks into the espresso machine. Hot water is forced through it at high pressure, extracting a rich, concentrated shot — the perfect espresso.',
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
    optionsCategory: 'milk',
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
    optionsCategory: 'syrup',
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

type FetchedOptions = Record<OptionCategory, CoffeeOption[]>;

/**
 * Pulls the live bean/milk/syrup catalog from the API. Returns null on any
 * failure (network down, API not deployed yet, etc.) so callers can fall
 * back to the placeholder lists above rather than showing a blank screen.
 */
export async function fetchCoffeeBuilderOptions(): Promise<FetchedOptions | null> {
  try {
    const res = await fetch(`${API_URL}/coffee-builder-options`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      bean: Array.isArray(data.bean) ? data.bean.map(mapApiOption) : [],
      milk: Array.isArray(data.milk) ? data.milk.map(mapApiOption) : [],
      syrup: Array.isArray(data.syrup) ? data.syrup.map(mapApiOption) : [],
    };
  } catch {
    return null;
  }
}

interface ApiOptionRow {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
}

function mapApiOption(row: ApiOptionRow): CoffeeOption {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    imageUrl: row.image_url ?? null,
  };
}
