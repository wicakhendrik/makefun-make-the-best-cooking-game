// What the stall cooks: each ingredient's prep route (board, pot, wok), the dishes built from the
// finished parts, and the three nights with the menu, pace and star targets of each.

/**
 * Each ingredient's route from the crate to a finished part, step by step. An item's `stage` counts
 * the steps it has been through; it is finished when stage equals the route's length.
 */
export const INGREDIENTS = {
  noodles: { name: 'Noodles', route: ['pot'], done: 'Boiled noodles' },
  rice: { name: 'Rice', route: ['pot'], done: 'Steamed rice' },
  bun: { name: 'Bun dough', route: ['pot'], done: 'Steamed bun' },
  egg: { name: 'Egg', route: ['pot'], done: 'Soft egg' },
  shrimp: { name: 'Shrimp', route: ['wok'], done: 'Seared shrimp' },
  pork: { name: 'Pork belly', route: ['board', 'wok'], done: 'Glazed pork' },
  mushroom: { name: 'Mushroom', route: ['board', 'wok'], done: 'Wok mushroom' },
  greens: { name: 'Bok choy', route: ['board'], done: 'Cut bok choy' },
  chili: { name: 'Chili', route: ['board'], done: 'Chili rings' },
};

/** The step an item takes next ('board', 'pot' or 'wok'), or null once it is finished. */
export function nextStep(item) {
  return INGREDIENTS[item.id].route[item.stage] ?? null;
}

export function isFinished(item) {
  return !item.burnt && item.stage >= INGREDIENTS[item.id].route.length;
}

/** Every dish the stall sells: the finished parts it needs, and its price in coins. */
export const RECIPES = {
  harborNoodles: { name: 'Harbor Noodles', parts: ['noodles', 'shrimp'], price: 12 },
  porkBun: { name: 'Lantern Pork Bun', parts: ['bun', 'pork', 'greens'], price: 16 },
  forestRice: { name: 'Forest Rice', parts: ['rice', 'mushroom', 'egg'], price: 16 },
  firecracker: { name: 'Firecracker Noodles', parts: ['noodles', 'shrimp', 'chili'], price: 15 },
  gardenBun: { name: 'Garden Bun', parts: ['bun', 'mushroom', 'greens'], price: 15 },
  emberRice: { name: 'Ember Rice', parts: ['rice', 'pork', 'chili'], price: 17 },
  midnightRamen: { name: 'Midnight Ramen', parts: ['noodles', 'pork', 'egg', 'greens'], price: 22 },
};

/** The recipe whose parts are exactly `parts` (any order), among `menu`; null when none is. */
export function recipeForParts(parts, menu) {
  for (const key of menu) {
    const wanted = RECIPES[key].parts;
    if (wanted.length === parts.length && wanted.every((part) => parts.includes(part))) return key;
  }
  return null;
}

/**
 * The three nights. `gap` is the seconds between new tickets and `patience` how long a ticket
 * waits, each easing from its first value to its second over the night: the rush grows by pace
 * alone, never by extra chores. `stars` are the coin totals for one, two and three stars.
 */
export const SHIFTS = [
  {
    title: 'Opening Night',
    blurb: 'Two dishes, a quiet alley. Learn the stations.',
    menu: ['harborNoodles', 'porkBun'],
    length: 150,
    gap: [14, 9],
    patience: [70, 52],
    stars: [70, 140, 200],
  },
  {
    title: 'Festival Crowd',
    blurb: 'Four dishes and the lanterns are out.',
    menu: ['harborNoodles', 'porkBun', 'forestRice', 'firecracker'],
    length: 180,
    gap: [12, 7.5],
    patience: [68, 48],
    stars: [90, 180, 260],
  },
  {
    title: 'Lantern Rush',
    blurb: 'The whole menu. The whole city is hungry.',
    menu: ['harborNoodles', 'porkBun', 'forestRice', 'firecracker', 'gardenBun', 'emberRice', 'midnightRamen'],
    length: 180,
    gap: [11, 6.5],
    patience: [66, 44],
    stars: [100, 200, 280],
  },
];
