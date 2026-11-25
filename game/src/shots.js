// The screenshot scenes behind ?shot=rush|surge|menu|opening|results. Each plays a real night from its
// seed with the demo chef (which plays by clicking stations, as a mouse player does), finds the
// busiest moment of the window it looks at, and replays the same seed to exactly that step.
import { AutoChef } from './autochef.js';
import { STEP } from './config.js';
import { Night } from './night.js';
import { RECIPES, recipeForParts } from './recipes.js';

const SCENES = {
  rush: { shift: 2, from: 112, to: 172 },
  opening: { shift: 0, from: 28, to: 70 },
  // The second the lantern rush begins on Festival Crowd (60% of its 180 s, after the 2.4 s
  // count-in), banner and all.
  surge: { shift: 1, from: 111.3, to: 112.1 },
  menu: { shift: 1, from: 30, to: 30 },
  results: { shift: 1, from: Infinity, to: Infinity },
};

/** How much of a complete service a frame shows: plates mid-assembly, a full plate, busy stations. */
function busyness(night, autochef) {
  let score = 0;
  const kitchen = night.kitchen;
  let ready = false;
  for (const slot of autochef.slots) {
    const plate = autochef.plateOn(slot);
    if (plate === null || plate.parts.length === 0) continue;
    const ticket = autochef.ticketOf(slot);
    if (ticket !== null && plate.parts.length === RECIPES[ticket.recipe].parts.length) ready = true;
    else score += plate.parts.length >= 2 ? 3 : 2;
  }
  const held = night.chef.held;
  if (held !== null && held.kind === 'food' && held.burnt) score -= 6;
  if (held !== null && held.kind === 'plate' && recipeForParts(held.parts, night.shift.menu) !== null) ready = true;
  // A plate ready to serve is part of every scene; a frame without one never wins.
  score += ready ? 10 : -30;
  if (night.passShow !== null) score += 1;
  let cooking = 0;
  for (const cell of kitchen.stations) {
    if ((cell.type === 'pot' || cell.type === 'wok') && cell.item !== null && !cell.item.burnt) cooking += 1;
    if (cell.item !== null && cell.item.kind === 'food' && cell.item.burnt) score -= 4;
    if (cell.type === 'board' && cell.item !== null) score += 2;
  }
  score += Math.min(cooking, 4) * 3;
  if (night.chef.chopping) score += 2;
  score += Math.min(night.orders.tickets.length, 5) * 0.6;
  const big = night.orders.tickets.filter((ticket) => RECIPES[ticket.recipe].parts.length >= 3).length;
  score += Math.min(big, 2) * 0.3;
  if (night.orders.tickets.some((ticket) => ticket.vip)) score += 2;
  return score;
}

function playNight(shift, seed, until, onStep) {
  const night = new Night(shift, seed);
  const autochef = new AutoChef(night);
  const controls = { axis: { x: 0, y: 0 }, use: false, chop: false };
  let steps = 0;
  while (night.phase !== 'closed' && steps < until) {
    night.step(STEP, controls);
    night.drainEvents();
    autochef.update(STEP);
    steps += 1;
    if (onStep) onStep(night, autochef, steps);
  }
  return { night, autochef, steps };
}

/**
 * Play the named scene and return { night, screen } for the caller to draw: `screen` is 'play',
 * 'title' or 'results'. `effects`, when given, sees the last two seconds of events, so the frame
 * carries the steam and sparks a player would see.
 */
export function stageShot(name, seed, effects) {
  const scene = SCENES[name] ?? SCENES.rush;
  let target = Infinity;
  if (Number.isFinite(scene.from)) {
    let best = -Infinity;
    const first = Math.round(scene.from / STEP);
    const last = Math.round(scene.to / STEP);
    playNight(scene.shift, seed, last + 1, (night, autochef, steps) => {
      if (steps < first || steps % 3 !== 0) return;
      const score = busyness(night, autochef);
      if (score > best) {
        best = score;
        target = steps;
      }
    });
    if (!Number.isFinite(target)) target = first;
  }
  const lead = Math.round(2 / STEP);
  const night = new Night(scene.shift, seed);
  const autochef = new AutoChef(night);
  const controls = { axis: { x: 0, y: 0 }, use: false, chop: false };
  let steps = 0;
  while (night.phase !== 'closed' && steps < target) {
    night.step(STEP, controls);
    const events = night.drainEvents();
    autochef.update(STEP);
    steps += 1;
    if (effects && target - steps < lead) {
      for (const event of events) effects.handle(event);
      effects.ambient(STEP, night.kitchen);
      effects.update(STEP);
    }
  }
  const screen = name === 'menu' ? 'title' : name === 'results' ? 'results' : 'play';
  return { night, screen };
}
