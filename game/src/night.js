// One night of service: the kitchen, the chef and the order board stepped together at a fixed
// rate. It knows nothing of drawing or sound: what happened each step is left in `events`.
import { Chef } from './chef.js';
import { TIMING } from './config.js';
import { Kitchen } from './kitchen.js';
import { OrderBoard } from './orders.js';
import { createRandom } from './random.js';
import { SHIFTS } from './recipes.js';

export const PHASE_COUNT_IN = 'count-in';
export const PHASE_OPEN = 'open';
export const PHASE_CLOSED = 'closed';

export class Night {
  constructor(shiftIndex, seed) {
    this.shiftIndex = shiftIndex;
    this.shift = SHIFTS[shiftIndex];
    this.random = createRandom(seed);
    this.kitchen = new Kitchen();
    this.chef = new Chef();
    this.orders = new OrderBoard(this.shift, this.random);
    this.elapsed = 0;
    this.countIn = TIMING.countIn;
    this.phase = PHASE_COUNT_IN;
    this.events = [];
    /** The plate last served, shown sliding through the pass window for a moment. */
    this.passShow = null;
    this.knifeTime = 0;
  }

  get timeLeft() {
    return Math.max(0, this.shift.length - this.elapsed);
  }

  /** True during the last 40% of the night, when the board fills fastest. */
  get rush() {
    return this.phase === PHASE_OPEN && this.elapsed > this.shift.length * 0.6;
  }

  /**
   * Advance one step. `controls` is { axis: {x, y}, use: pressed this step, chop: held }.
   */
  step(dt, controls) {
    const chef = this.chef;
    if (this.phase === PHASE_CLOSED) return;
    if (this.phase === PHASE_COUNT_IN) {
      this.countIn -= dt;
      if (this.countIn <= 0) {
        this.phase = PHASE_OPEN;
        this.events.push({ type: 'open' });
      }
    } else {
      this.elapsed += dt;
    }

    chef.move(dt, controls.axis, this.kitchen);
    if (chef.errand !== null && chef.path.length === 0) this.arrive();
    if (controls.use) {
      const cell = chef.facingCell(this.kitchen);
      if (cell !== null) this.useStation(cell);
    }
    this.workKnife(dt, controls.chop);

    this.kitchen.cook(dt, this.events);
    if (this.phase === PHASE_OPEN) this.orders.update(dt, this.elapsed, this.events);
    if (this.passShow !== null) {
      this.passShow.time -= dt;
      if (this.passShow.time <= 0) this.passShow = null;
    }
    if (this.phase === PHASE_OPEN && this.elapsed >= this.shift.length) {
      this.phase = PHASE_CLOSED;
      chef.cancelErrand();
      chef.chopAt = null;
      this.events.push({ type: 'closed' });
    }
  }

  /** The chef reached the station a click sent it to: use it, or start chopping there. */
  arrive() {
    const chef = this.chef;
    const { target, action } = chef.errand;
    chef.errand = null;
    chef.face(target);
    if (action === 'chop' && this.kitchen.canChop(target)) {
      chef.chopAt = target;
      return;
    }
    this.useStation(target);
    // Put something on a board by mouse and the knife starts on it at once.
    if (target.type === 'board' && chef.held === null && this.kitchen.canChop(target)) chef.chopAt = target;
  }

  workKnife(dt, chopKey) {
    const chef = this.chef;
    chef.chopping = false;
    let board = null;
    if (chopKey) {
      const facing = chef.facingCell(this.kitchen);
      if (facing !== null && this.kitchen.canChop(facing)) board = facing;
      chef.chopAt = null;
    } else if (chef.chopAt !== null) {
      board = this.kitchen.canChop(chef.chopAt) ? chef.chopAt : null;
      if (board === null) chef.chopAt = null;
    }
    if (board === null) return;
    chef.chopping = true;
    this.knifeTime += dt;
    if (this.kitchen.chop(board, dt, this.events)) chef.chopAt = null;
  }

  useStation(cell) {
    const serve = (plate, passCell) => {
      if (this.phase !== PHASE_OPEN) return false;
      const earned = this.orders.serve(plate.parts, this.events);
      if (earned === null) return false;
      this.passShow = { parts: plate.parts.slice(), time: TIMING.passShow, earned, cell: passCell };
      return true;
    };
    this.chef.held = this.kitchen.use(cell, this.chef.held, this.events, serve);
  }

  /** A mouse click on `cell`: walk there and use it, or chop at it when its board has work. */
  clickStation(cell) {
    if (this.phase === PHASE_CLOSED || cell.type === 'floor') return false;
    const action = this.kitchen.canChop(cell) && this.chef.held === null ? 'chop' : 'use';
    return this.chef.sendTo(this.kitchen, cell, action);
  }

  drainEvents() {
    const events = this.events;
    this.events = [];
    return events;
  }
}
