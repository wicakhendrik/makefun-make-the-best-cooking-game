// Every tuning number of Lantern Alley Kitchen in one place: the canvas, the kitchen grid and its
// layout, how fast the chef walks, and how long chopping, boiling, searing and burning take.

/** The canvas is drawn at this size and scaled to fit the window. */
export const VIEW = { width: 1280, height: 720 };

/** One kitchen tile, in canvas pixels. */
export const TILE = 80;

/** The order board fills the top of the screen; the kitchen sits below it, the hint bar under that. */
export const HUD_HEIGHT = 120;
export const FOOTER_HEIGHT = 40;

/** The simulation always advances in fixed steps, so a seed replays the same night. */
export const STEP = 1 / 60;

export const CHEF = {
  speed: 380,
  radius: 25,
  /** How far in front of the chef the facing check reaches, in tiles. */
  reach: 0.72,
};

export const TIMING = {
  chop: 1.1,
  pot: 5.5,
  wok: 4.5,
  /** A finished dish left in a pot or wok burns this many seconds after it is done. */
  burn: 10,
  /** The burn warning starts flashing this many seconds before the burn. */
  warn: 4,
  /** Seconds of "3, 2, 1, open!" before a night's clock starts. */
  countIn: 2.4,
  /** How long a served plate shows in the pass window. */
  passShow: 1.4,
};

/** At most this many finished parts fit on one plate. */
export const PLATE_MAX = 4;

/** At most this many tickets hang on the order board at once. */
export const BOARD_MAX = 5;

/**
 * The three stalls, one for each night, every one 11 tiles wide and 5 tall, one character a tile.
 * Each puts the crates, cookers and pass in different places, so each night is a different route
 * to learn, and each has a look of its own.
 *   .  floor          =  plain counter (put anything down here)
 *   K  chopping board O  stock pot (boils)        W  wok (sears)
 *   P  plate stack    S  serving pass             T  scrap bin
 *   n r b e s p g c m  ingredient crates: noodles, rice, bun dough, egg,
 *                      shrimp, pork, greens (bok choy), chili, mushroom
 * `chef` is where the chef starts, in tiles; `assembly` the island counters the demo chef builds
 * its plates on; `look` the floor and counter colours.
 */
export const KITCHENS = [
  {
    name: 'Harbor Stall',
    layout: [
      '=O=O=W=W=P=',
      'n.........S',
      'r..K===K..S',
      'b.........T',
      '=espgcm=KP=',
    ],
    chef: { col: 5.5, row: 3.5 },
    assembly: [
      { col: 4, row: 2 },
      { col: 5, row: 2 },
      { col: 6, row: 2 },
    ],
    look: { floorA: '#b7684a', floorB: '#a95d41', grout: '#8d4a33', inlay: '#2f6e70', front: '#2c5f63', trim: '#1d4245' },
  },
  {
    name: 'Bridge Market',
    layout: [
      '=OO=PSS=WW=',
      'n.........e',
      'r.K==.==K.s',
      'b.........p',
      '=g=c=m=TKP=',
    ],
    chef: { col: 5.5, row: 2.5 },
    assembly: [
      { col: 4, row: 2 },
      { col: 6, row: 2 },
      { col: 3, row: 2 },
    ],
    look: { floorA: '#7f8c91', floorB: '#738085', grout: '#566166', inlay: '#c8372d', front: '#8e2f2a', trim: '#5e1d1a' },
  },
  {
    name: 'Lantern Gate',
    layout: [
      '=W=O=O=W=P=',
      'S.........n',
      'S..K=T=K..r',
      '=.........b',
      '=espgcmK=P=',
    ],
    chef: { col: 5.5, row: 3.5 },
    assembly: [
      { col: 4, row: 2 },
      { col: 6, row: 2 },
      { col: 8, row: 4 },
    ],
    look: { floorA: '#c49656', floorB: '#b7894b', grout: '#8a6436', inlay: '#4a3266', front: '#4a3266', trim: '#2f1f45' },
  },
];

const ROWS = KITCHENS[0].layout.length;
const COLS = KITCHENS[0].layout[0].length;

/**
 * Where the kitchen is drawn: its tiles are TILE pixels in the game's own units, scaled up to
 * fill the space between the order board and the hint bar, centred across the screen. Every
 * stall has the same size, so one view fits them all.
 */
const KITCHEN_HEIGHT = 720 - HUD_HEIGHT - FOOTER_HEIGHT;
/** The stall's carved posts keep at least this much of each side of the screen. */
const POST_WIDTH = 40;
const KITCHEN_SCALE = Math.min(KITCHEN_HEIGHT / (ROWS * TILE), (1280 - 2 * POST_WIDTH) / (COLS * TILE));
export const KITCHEN_VIEW = {
  scale: KITCHEN_SCALE,
  x: Math.round((1280 - COLS * TILE * KITCHEN_SCALE) / 2),
  y: HUD_HEIGHT + Math.round((KITCHEN_HEIGHT - ROWS * TILE * KITCHEN_SCALE) / 2),
};

export const CRATE_LETTERS = {
  n: 'noodles',
  r: 'rice',
  b: 'bun',
  e: 'egg',
  s: 'shrimp',
  p: 'pork',
  g: 'greens',
  c: 'chili',
  m: 'mushroom',
};

export const STATION_LETTERS = {
  '=': 'counter',
  K: 'board',
  O: 'pot',
  W: 'wok',
  P: 'plates',
  S: 'pass',
  T: 'trash',
};
