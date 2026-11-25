// The order board: tickets arrive faster and wait less as the night goes on, each serve pays its
// price plus a tip for speed and a bonus for an unbroken streak, and a ticket left too long walks.
// In the rush some tickets come from lantern guests (VIP): they pay double but wait less.
import { BOARD_MAX } from './config.js';

/** From this share of the night on, a ticket may be a lantern guest's (VIP). */
const VIP_FROM = 0.5;
/** The chance that a ticket in that stretch is a VIP's, how long they wait, and what they pay. */
const VIP = { chance: 0.3, patience: 0.7, pays: 2 };
import { pick } from './random.js';
import { RECIPES, recipeForParts } from './recipes.js';

function ease(range, t) {
  return range[0] + (range[1] - range[0]) * Math.min(1, Math.max(0, t));
}

export class OrderBoard {
  constructor(shift, random) {
    this.shift = shift;
    this.random = random;
    this.tickets = [];
    this.nextId = 1;
    this.untilNext = 1.5;
    this.coins = 0;
    this.served = 0;
    this.missed = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.tips = 0;
    this.servedLog = [];
  }

  /** The share of the night gone, 0 to 1: it sets the pace of tickets and their patience. */
  pace(elapsed) {
    return elapsed / this.shift.length;
  }

  update(dt, elapsed, events) {
    const pace = this.pace(elapsed);
    this.untilNext -= dt;
    if (this.untilNext <= 0) {
      if (this.tickets.length < BOARD_MAX) this.addTicket(pace, events);
      this.untilNext = ease(this.shift.gap, pace) * (0.85 + this.random() * 0.3);
      if (this.tickets.length === 0) this.untilNext = 0.5;
    }
    if (this.tickets.length === 0 && this.untilNext > 3) this.untilNext = 3;
    for (const ticket of this.tickets) {
      ticket.age += dt;
      ticket.left -= dt;
      ticket.shake = Math.max(0, ticket.shake - dt);
    }
    const walked = this.tickets.filter((ticket) => ticket.left <= 0);
    for (const ticket of walked) {
      this.missed += 1;
      this.streak = 0;
      this.coins = Math.max(0, this.coins - 4);
      events.push({ type: 'missed', ticket });
    }
    if (walked.length > 0) this.tickets = this.tickets.filter((ticket) => ticket.left > 0);
  }

  addTicket(pace, events) {
    // Never three of one dish on the board at once: a varied board is what makes the route a puzzle.
    const counts = new Map();
    for (const ticket of this.tickets) counts.set(ticket.recipe, (counts.get(ticket.recipe) ?? 0) + 1);
    let options = this.shift.menu.filter((key) => (counts.get(key) ?? 0) < 2);
    // Early in the night the bigger dishes come less often.
    if (pace < 0.25) {
      const small = options.filter((key) => RECIPES[key].parts.length <= 3);
      if (small.length > 0) options = small;
    }
    const recipe = pick(this.random, options.length > 0 ? options : this.shift.menu);
    const vip = pace >= VIP_FROM && !this.tickets.some((other) => other.vip) && this.random() < VIP.chance;
    const patience = (ease(this.shift.patience, pace) + RECIPES[recipe].parts.length * 4) * (vip ? VIP.patience : 1);
    const ticket = { id: this.nextId, recipe, patience, left: patience, age: 0, shake: 0, vip };
    this.nextId += 1;
    this.tickets.push(ticket);
    events.push({ type: 'ticket', ticket });
  }

  /**
   * Serve a plate: it fills the ticket for its dish that is closest to walking out. Returns the
   * coins it earned, or null when no ticket on the board wants that plate.
   */
  serve(parts, events) {
    const recipe = recipeForParts(parts, this.shift.menu);
    const matching = this.tickets.filter((ticket) => ticket.recipe === recipe);
    if (recipe === null || matching.length === 0) {
      for (const ticket of this.tickets) ticket.shake = 0.4;
      return null;
    }
    // A VIP's ticket is filled first; otherwise the one closest to walking out.
    const ticket = matching.reduce((best, candidate) => {
      if (candidate.vip !== best.vip) return candidate.vip ? candidate : best;
      return candidate.left < best.left ? candidate : best;
    });
    const tip = Math.round((ticket.left / ticket.patience) * 8);
    this.streak += 1;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    const bonus = Math.min(this.streak - 1, 5);
    const earned = (RECIPES[recipe].price + tip) * (ticket.vip ? VIP.pays : 1) + bonus;
    this.coins += earned;
    this.tips += tip;
    this.served += 1;
    this.servedLog.push(recipe);
    this.tickets = this.tickets.filter((candidate) => candidate !== ticket);
    events.push({ type: 'served', ticket, earned, tip, bonus, vip: ticket.vip });
    return earned;
  }

  /** Stars earned so far, 0 to 3. */
  stars() {
    return this.shift.stars.filter((needed) => this.coins >= needed).length;
  }
}
