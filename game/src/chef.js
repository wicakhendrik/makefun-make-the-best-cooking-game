// The chef: walks the floor tiles (keys steer directly; a mouse click on a station walks a
// shortest path to it), faces a station to use it, carries one thing at a time and works the knife.
import { CHEF, TILE } from './config.js';

const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

export class Chef {
  constructor() {
    this.reset(6.5 * TILE, 3.5 * TILE);
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.facing = { x: 0, y: -1 };
    this.held = null;
    this.path = [];
    /** The station a click sent the chef to, and what to do there ('use' or 'chop'). */
    this.errand = null;
    /** The board the chef is chopping at, while the knife works. */
    this.chopAt = null;
    this.walkTime = 0;
    this.moving = false;
    this.bump = 0;
  }

  /** Whether the chef is free for a new errand: not walking one, not chopping. */
  get idle() {
    return this.errand === null && this.chopAt === null && this.path.length === 0;
  }

  /** The station the chef faces, or null when it faces open floor. */
  facingCell(kitchen) {
    const x = this.x + this.facing.x * TILE * CHEF.reach;
    const y = this.y + this.facing.y * TILE * CHEF.reach;
    const cell = kitchen.cellAtPixel(x, y);
    return cell !== null && cell.type !== 'floor' ? cell : null;
  }

  /** Walk to the floor tile next to `target` and then do `action` there ('use' or 'chop'). */
  sendTo(kitchen, target, action) {
    const route = findRoute(kitchen, Math.floor(this.x / TILE), Math.floor(this.y / TILE), target);
    if (route === null) return false;
    this.path = route.map((step) => ({ x: (step.col + 0.5) * TILE, y: (step.row + 0.5) * TILE }));
    this.errand = { target, action };
    this.chopAt = null;
    return true;
  }

  cancelErrand() {
    this.path = [];
    this.errand = null;
  }

  /** Move for one step: `axis` from the keys (it cancels an errand) or the errand's path. */
  move(dt, axis, kitchen) {
    let dx = axis.x;
    let dy = axis.y;
    if (dx !== 0 || dy !== 0) {
      this.cancelErrand();
      this.chopAt = null;
    } else if (this.path.length > 0) {
      const next = this.path[0];
      const ox = next.x - this.x;
      const oy = next.y - this.y;
      const distance = Math.hypot(ox, oy);
      if (distance < CHEF.speed * dt + 0.5) {
        this.x = next.x;
        this.y = next.y;
        this.path.shift();
        this.moving = this.path.length > 0;
        if (this.moving) this.walkTime += dt;
        return this.path.length === 0 && this.errand !== null;
      }
      dx = ox / distance;
      dy = oy / distance;
    }
    const length = Math.hypot(dx, dy);
    this.moving = length > 0;
    if (!this.moving) return false;
    dx /= length;
    dy /= length;
    this.facing = Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
    this.walkTime += dt;
    this.slide(kitchen, dx * CHEF.speed * dt, 0);
    this.slide(kitchen, 0, dy * CHEF.speed * dt);
    return false;
  }

  /** Move by (dx, dy), then push the chef's circle back out of any counter it overlaps. */
  slide(kitchen, dx, dy) {
    this.x += dx;
    this.y += dy;
    const col = Math.floor(this.x / TILE);
    const row = Math.floor(this.y / TILE);
    for (let r = row - 1; r <= row + 1; r += 1) {
      for (let c = col - 1; c <= col + 1; c += 1) {
        if (!kitchen.isSolid(c, r)) continue;
        const nearestX = Math.max(c * TILE, Math.min(this.x, (c + 1) * TILE));
        const nearestY = Math.max(r * TILE, Math.min(this.y, (r + 1) * TILE));
        const ox = this.x - nearestX;
        const oy = this.y - nearestY;
        const distance = Math.hypot(ox, oy);
        if (distance >= CHEF.radius) continue;
        if (distance === 0) {
          this.x -= dx;
          this.y -= dy;
          return;
        }
        this.x = nearestX + (ox / distance) * CHEF.radius;
        this.y = nearestY + (oy / distance) * CHEF.radius;
      }
    }
  }

  /** Turn to face `cell` (after arriving beside it). */
  face(cell) {
    const ox = (cell.col + 0.5) * TILE - this.x;
    const oy = (cell.row + 0.5) * TILE - this.y;
    this.facing = Math.abs(ox) > Math.abs(oy) ? { x: Math.sign(ox), y: 0 } : { x: 0, y: Math.sign(oy) };
  }
}

/**
 * A shortest walk over floor tiles from (col, row) to a floor tile beside `target`, as the list of
 * tiles to step through (empty when the chef already stands beside it); null when none exists.
 */
export function findRoute(kitchen, col, row, target) {
  const goals = new Set();
  for (const direction of DIRECTIONS) {
    const c = target.col + direction.x;
    const r = target.row + direction.y;
    if (!kitchen.isSolid(c, r)) goals.add(r * kitchen.cols + c);
  }
  if (goals.size === 0) return null;
  const start = row * kitchen.cols + col;
  const previous = new Map([[start, -1]]);
  const queue = [start];
  while (queue.length > 0) {
    const index = queue.shift();
    if (goals.has(index)) {
      const steps = [];
      for (let at = index; at !== -1; at = previous.get(at)) steps.unshift({ col: at % kitchen.cols, row: Math.floor(at / kitchen.cols) });
      return steps;
    }
    const c = index % kitchen.cols;
    const r = Math.floor(index / kitchen.cols);
    for (const direction of DIRECTIONS) {
      const nc = c + direction.x;
      const nr = r + direction.y;
      const next = nr * kitchen.cols + nc;
      if (kitchen.isSolid(nc, nr) || previous.has(next)) continue;
      previous.set(next, index);
      queue.push(next);
    }
  }
  return null;
}
