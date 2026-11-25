// The kitchen itself: the tile grid parsed from a stall's layout, what sits on each station, and the rules of
// every hand-off between the chef and a station (take, put down, plate up, chop, boil, sear, burn).
import { CRATE_LETTERS, PLATE_MAX, STATION_LETTERS, TILE, TIMING } from './config.js';
import { INGREDIENTS, isFinished, nextStep } from './recipes.js';

export function makeFood(id) {
  return { kind: 'food', id, stage: 0, progress: 0, doneFor: 0, burnt: false };
}

export function makePlate() {
  return { kind: 'plate', parts: [] };
}

/** Whether `food` may go onto `plate`: finished, unburnt, not already there, and room left. */
export function fitsOnPlate(plate, food) {
  return isFinished(food) && plate.parts.length < PLATE_MAX && !plate.parts.includes(food.id);
}

function isCooker(cell) {
  return cell.type === 'pot' || cell.type === 'wok';
}

export class Kitchen {
  /** `plan` is one of the stalls in KITCHENS: its layout, start, assembly counters and look. */
  constructor(plan) {
    this.plan = plan;
    const layout = plan.layout;
    this.rows = layout.length;
    this.cols = layout[0].length;
    this.cells = [];
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        const letter = layout[row][col];
        const cell = { col, row, type: 'floor', item: null, ingredient: null, chopping: 0 };
        if (CRATE_LETTERS[letter]) {
          cell.type = 'crate';
          cell.ingredient = CRATE_LETTERS[letter];
        } else if (STATION_LETTERS[letter]) {
          cell.type = STATION_LETTERS[letter];
        }
        this.cells.push(cell);
      }
    }
    this.stations = this.cells.filter((cell) => cell.type !== 'floor');
  }

  reset() {
    for (const cell of this.cells) {
      cell.item = null;
      cell.chopping = 0;
    }
  }

  cell(col, row) {
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return null;
    return this.cells[row * this.cols + col];
  }

  cellAtPixel(x, y) {
    return this.cell(Math.floor(x / TILE), Math.floor(y / TILE));
  }

  isSolid(col, row) {
    const cell = this.cell(col, row);
    return cell === null || cell.type !== 'floor';
  }

  ofType(type) {
    return this.stations.filter((cell) => cell.type === type);
  }

  crateOf(id) {
    return this.stations.find((cell) => cell.type === 'crate' && cell.ingredient === id) ?? null;
  }

  /** Advance every pot and wok by `dt`: cook what is in them, then let finished food burn. */
  cook(dt, events) {
    for (const cell of this.stations) {
      if (!isCooker(cell) || cell.item === null || cell.item.kind !== 'food') continue;
      const food = cell.item;
      if (food.burnt) continue;
      if (nextStep(food) === cell.type) {
        food.progress += dt;
        if (food.progress >= TIMING[cell.type]) {
          food.stage += 1;
          food.progress = 0;
          food.doneFor = 0;
          events.push({ type: 'cooked', cell });
        }
      } else if (isFinished(food)) {
        const before = food.doneFor;
        food.doneFor += dt;
        if (before < TIMING.burn - TIMING.warn && food.doneFor >= TIMING.burn - TIMING.warn) events.push({ type: 'warn', cell });
        if (food.doneFor >= TIMING.burn) {
          food.burnt = true;
          events.push({ type: 'burnt', cell });
        }
      }
    }
  }

  /** Whether the board at `cell` holds something the knife can work on. */
  canChop(cell) {
    return cell.type === 'board' && cell.item !== null && cell.item.kind === 'food' && !cell.item.burnt && nextStep(cell.item) === 'board';
  }

  /** One frame of knife work on `cell`; true when the cut finished this frame. */
  chop(cell, dt, events) {
    if (!this.canChop(cell)) return false;
    const food = cell.item;
    const before = Math.floor(food.progress / 0.22);
    food.progress += dt;
    if (Math.floor(food.progress / 0.22) !== before) events.push({ type: 'knife', cell });
    if (food.progress < TIMING.chop) return false;
    food.stage += 1;
    food.progress = 0;
    events.push({ type: 'chopped', cell });
    return true;
  }

  /**
   * The chef uses `cell` while holding `held` (null for empty hands). Returns what the chef holds
   * afterwards, and pushes what happened onto `events`; `serve` is asked about plates at the pass.
   */
  use(cell, held, events, serve) {
    switch (cell.type) {
      case 'crate':
        return this.useCrate(cell, held, events);
      case 'plates':
        if (held === null) {
          events.push({ type: 'pick', cell });
          return makePlate();
        }
        if (held.kind === 'plate' && held.parts.length === 0) {
          events.push({ type: 'place', cell });
          return null;
        }
        if (held.kind === 'food' && isFinished(held)) {
          const plate = makePlate();
          plate.parts.push(held.id);
          events.push({ type: 'plated', cell });
          return plate;
        }
        break;
      case 'trash':
        if (held !== null && held.kind === 'food') {
          events.push({ type: 'trash', cell });
          return null;
        }
        if (held !== null && held.kind === 'plate' && held.parts.length > 0) {
          held.parts = [];
          events.push({ type: 'trash', cell });
          return held;
        }
        break;
      case 'pass':
        if (held !== null && held.kind === 'plate' && held.parts.length > 0) {
          if (serve(held, cell)) return null;
          events.push({ type: 'refused', cell });
          return held;
        }
        break;
      case 'pot':
      case 'wok':
        return this.useCooker(cell, held, events);
      default:
        return this.useCounter(cell, held, events);
    }
    events.push({ type: 'nothing', cell });
    return held;
  }

  useCrate(cell, held, events) {
    if (held === null) {
      events.push({ type: 'pick', cell });
      return makeFood(cell.ingredient);
    }
    if (held.kind === 'food' && held.id === cell.ingredient && held.stage === 0 && !held.burnt) {
      events.push({ type: 'place', cell });
      return null;
    }
    events.push({ type: 'nothing', cell });
    return held;
  }

  useCooker(cell, held, events) {
    const inside = cell.item;
    if (inside === null) {
      if (held !== null && held.kind === 'food' && !held.burnt && nextStep(held) === cell.type) {
        cell.item = held;
        events.push({ type: 'drop-in', cell });
        return null;
      }
      events.push({ type: 'nothing', cell });
      return held;
    }
    if (held === null) {
      cell.item = null;
      events.push({ type: 'pick', cell });
      return inside;
    }
    if (held.kind === 'plate' && fitsOnPlate(held, inside)) {
      held.parts.push(inside.id);
      cell.item = null;
      events.push({ type: 'plated', cell });
      return held;
    }
    events.push({ type: 'nothing', cell });
    return held;
  }

  useCounter(cell, held, events) {
    const inside = cell.item;
    if (inside === null) {
      if (held === null) {
        events.push({ type: 'nothing', cell });
        return null;
      }
      cell.item = held;
      events.push({ type: 'place', cell });
      return null;
    }
    if (held === null) {
      cell.item = null;
      cell.chopping = 0;
      events.push({ type: 'pick', cell });
      return inside;
    }
    if (inside.kind === 'plate' && held.kind === 'food' && fitsOnPlate(inside, held)) {
      inside.parts.push(held.id);
      events.push({ type: 'plated', cell });
      return null;
    }
    if (inside.kind === 'food' && held.kind === 'plate' && fitsOnPlate(held, inside)) {
      held.parts.push(inside.id);
      cell.item = null;
      events.push({ type: 'plated', cell });
      return held;
    }
    events.push({ type: 'nothing', cell });
    return held;
  }
}

/** A short label for what a hand or a station holds, for the hint bar. */
export function describeItem(item) {
  if (item === null) return 'nothing';
  if (item.kind === 'plate') return item.parts.length === 0 ? 'an empty plate' : `a plate of ${item.parts.join(', ')}`;
  const info = INGREDIENTS[item.id];
  if (item.burnt) return `burnt ${info.name.toLowerCase()}`;
  if (isFinished(item)) return info.done.toLowerCase();
  if (item.stage > 0) return `cut ${info.name.toLowerCase()}`;
  return `raw ${info.name.toLowerCase()}`;
}
