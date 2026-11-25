// The demo chef behind the title screen and the screenshot scenes. It plays only by clicking
// stations, exactly as a mouse player does: it keeps two plates on the island for the two oldest
// tickets, starts what cooks longest first, chops while pots boil, and carries full plates out.
import { ASSEMBLY_CELLS } from './config.js';
import { INGREDIENTS, RECIPES, isFinished, nextStep, recipeForParts } from './recipes.js';
import { TIMING } from './config.js';

function distance(chef, cell) {
  return Math.abs(chef.x / 80 - (cell.col + 0.5)) + Math.abs(chef.y / 80 - (cell.row + 0.5));
}

function nearest(chef, cells) {
  let best = null;
  for (const cell of cells) if (best === null || distance(chef, cell) < distance(chef, best)) best = cell;
  return best;
}

export class AutoChef {
  constructor(night) {
    this.night = night;
    this.slots = ASSEMBLY_CELLS.map(({ col, row }) => ({ cell: night.kitchen.cell(col, row), ticketId: null }));
    this.wait = 0.4;
  }

  update(dt) {
    const night = this.night;
    if (night.phase !== 'open' || !night.chef.idle) return;
    this.wait -= dt;
    if (this.wait > 0) return;
    const target = this.decide();
    if (target === null) {
      this.wait = 0.2;
      return;
    }
    this.wait = night.clickStation(target) ? 0.1 : 0.3;
  }

  plateOn(slot) {
    const item = slot.cell.item;
    return item !== null && item.kind === 'plate' ? item : null;
  }

  ticketOf(slot) {
    return this.night.orders.tickets.find((ticket) => ticket.id === slot.ticketId) ?? null;
  }

  /** Keep each island plate matched to a ticket its parts still fit, oldest tickets first. */
  assign() {
    const tickets = this.night.orders.tickets;
    const fits = (ticket, plate) => plate === null || plate.parts.every((part) => RECIPES[ticket.recipe].parts.includes(part));
    for (const slot of this.slots) {
      const ticket = this.ticketOf(slot);
      if (ticket === null || !fits(ticket, this.plateOn(slot))) slot.ticketId = null;
    }
    for (const slot of this.slots) {
      if (slot.ticketId !== null) continue;
      const taken = new Set(this.slots.map((other) => other.ticketId));
      const plate = this.plateOn(slot);
      const ticket = tickets.find((candidate) => !taken.has(candidate.id) && fits(candidate, plate));
      if (ticket) slot.ticketId = ticket.id;
    }
  }

  /** The parts each assigned plate still lacks, as { id, slot } pairs. */
  missing() {
    const list = [];
    for (const slot of this.slots) {
      const ticket = this.ticketOf(slot);
      if (ticket === null) continue;
      const plate = this.plateOn(slot);
      for (const part of RECIPES[ticket.recipe].parts) if (plate === null || !plate.parts.includes(part)) list.push({ id: part, slot });
    }
    return list;
  }

  /** How many of each ingredient are already on their way: in hand, on a board or in a cooker. */
  inProgress() {
    const counts = new Map();
    const add = (food) => {
      if (food !== null && food.kind === 'food' && !food.burnt) counts.set(food.id, (counts.get(food.id) ?? 0) + 1);
    };
    add(this.night.chef.held);
    for (const cell of this.night.kitchen.stations) {
      if (this.slots.some((slot) => slot.cell === cell)) continue;
      add(cell.item);
    }
    return counts;
  }

  free(type) {
    return this.night.kitchen.ofType(type).filter((cell) => cell.item === null);
  }

  decide() {
    const night = this.night;
    const kitchen = night.kitchen;
    const chef = night.chef;
    const held = chef.held;
    this.assign();
    const missing = this.missing();
    const neededIds = new Set(missing.map((entry) => entry.id));
    const menu = night.shift.menu;

    if (held !== null && held.kind === 'plate') {
      const recipe = recipeForParts(held.parts, menu);
      if (recipe !== null && night.orders.tickets.some((ticket) => ticket.recipe === recipe)) return nearest(chef, kitchen.ofType('pass'));
      const wanted = night.orders.tickets.some((ticket) => held.parts.every((part) => RECIPES[ticket.recipe].parts.includes(part)));
      if (held.parts.length > 0 && !wanted) return nearest(chef, kitchen.ofType('trash'));
      const open = this.slots.find((slot) => slot.cell.item === null);
      if (open) return open.cell;
      return nearest(chef, kitchen.ofType(held.parts.length > 0 ? 'trash' : 'plates'));
    }
    if (held !== null) {
      if (held.burnt) return nearest(chef, kitchen.ofType('trash'));
      const step = nextStep(held);
      if (step !== null) return nearest(chef, this.free(step));
      const plated = missing.find((entry) => entry.id === held.id && this.plateOn(entry.slot) !== null);
      if (plated) return plated.slot.cell;
      if (neededIds.has(held.id)) return nearest(chef, kitchen.ofType('plates'));
      return nearest(chef, kitchen.ofType('trash'));
    }

    // Empty hands. A full plate goes out first; a plate no ticket wants any more is cleared.
    for (const slot of this.slots) {
      const plate = this.plateOn(slot);
      const ticket = this.ticketOf(slot);
      if (plate === null) continue;
      if (ticket !== null && plate.parts.length === RECIPES[ticket.recipe].parts.length) return slot.cell;
      if (ticket === null && plate.parts.length > 0) return slot.cell;
    }
    const cookers = [...kitchen.ofType('pot'), ...kitchen.ofType('wok')];
    const burnt = cookers.find((cell) => cell.item !== null && cell.item.burnt);
    if (burnt) return burnt;
    const ready = cookers.find((cell) => cell.item !== null && isFinished(cell.item) && (neededIds.has(cell.item.id) || cell.item.doneFor > TIMING.burn - TIMING.warn));
    if (ready) return ready;
    const boards = kitchen.ofType('board');
    const toChop = boards.find((cell) => kitchen.canChop(cell));
    if (toChop) return toChop;
    const toCook = boards.find((cell) => cell.item !== null && cell.item.kind === 'food' && nextStep(cell.item) !== null && this.free(nextStep(cell.item)).length > 0);
    if (toCook) return toCook;
    const cut = boards.find((cell) => cell.item !== null && cell.item.kind === 'food' && isFinished(cell.item));
    if (cut) return cut;
    const bare = this.slots.find((slot) => this.plateOn(slot) === null && slot.cell.item === null && this.ticketOf(slot) !== null);
    if (bare) return nearest(chef, kitchen.ofType('plates'));

    // Start the part that is short, slowest route first.
    const going = this.inProgress();
    const wanted = new Map();
    for (const entry of missing) wanted.set(entry.id, (wanted.get(entry.id) ?? 0) + 1);
    const order = [...wanted.keys()].sort((a, b) => routeTime(b) - routeTime(a));
    for (const id of order) {
      if ((wanted.get(id) ?? 0) <= (going.get(id) ?? 0)) continue;
      const first = INGREDIENTS[id].route[0];
      if (this.free(first).length === 0) continue;
      return kitchen.crateOf(id);
    }
    return null;
  }
}

function routeTime(id) {
  return INGREDIENTS[id].route.reduce((sum, step) => sum + TIMING[step], 0);
}
