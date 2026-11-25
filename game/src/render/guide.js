// The kitchen guide (G): callouts that name the parts of a service on screen, so a new cook sees
// at a glance where tickets wait, where the clock is, where raw food comes from, which plate is
// half built, which one is ready and where it goes. Each callout sits on open floor and points at
// what it names; callouts never overlap one another.
import { KITCHEN_VIEW, TILE } from '../config.js';
import { assemblyOf, isWanted } from './view.js';

const PILL_HEIGHT = 30;
const FONT = 'bold 17px "Trebuchet MS", sans-serif';

/** The centre of a kitchen cell, on the canvas. */
function cellPoint(cell) {
  return {
    x: KITCHEN_VIEW.x + (cell.col * TILE + TILE / 2) * KITCHEN_VIEW.scale,
    y: KITCHEN_VIEW.y + (cell.row * TILE + TILE / 2) * KITCHEN_VIEW.scale,
  };
}

/** The middle of a run of cells, so one callout can name a whole row of crates. */
function middleOf(cells) {
  return cells[Math.floor(cells.length / 2)];
}

/**
 * What the guide names in this frame: the board and the clock, then the route one dish takes,
 * numbered in service order (crate, stove, plate, ready, pass).
 */
function guideTargets(night) {
  const kitchen = night.kitchen;
  const targets = [];
  const board = night.orders.tickets.length;
  if (board > 0) targets.push({ label: 'ORDER BOARD', x: 12 + Math.min(board, 5) * 93, y: 108, hud: true });
  targets.push({ label: 'SHIFT TIMER', x: 1046, y: 108, hud: true });
  const crates = kitchen.ofType('crate').filter((cell) => cell.row === kitchen.rows - 1);
  const crate = crates.length > 0 ? middleOf(crates) : middleOf(kitchen.ofType('crate'));
  if (crate) targets.push({ step: 1, label: 'TAKE INGREDIENTS', ...cellPoint(crate) });
  const cooking = kitchen.stations.find((cell) => (cell.type === 'pot' || cell.type === 'wok') && cell.item !== null);
  if (cooking) targets.push({ step: 2, label: 'CHOP · BOIL · SEAR', ...cellPoint(cooking) });
  const building = kitchen.stations.find((cell) => assemblyOf(night, cell.item) !== null);
  if (building) targets.push({ step: 3, label: 'DISH MID-ASSEMBLY', ...cellPoint(building) });
  const ready = kitchen.stations.find((cell) => isWanted(night, cell.item));
  if (ready) targets.push({ step: 4, label: 'PLATE READY TO SERVE', ...cellPoint(ready) });
  else if (isWanted(night, night.chef.held)) {
    targets.push({
      step: 4,
      label: 'PLATE READY TO SERVE',
      x: KITCHEN_VIEW.x + night.chef.x * KITCHEN_VIEW.scale,
      y: KITCHEN_VIEW.y + night.chef.y * KITCHEN_VIEW.scale,
    });
  }
  const pass = kitchen.ofType('pass');
  if (pass.length > 0) targets.push({ step: 5, label: 'SERVE HERE', ...cellPoint(pass[0]) });
  return targets;
}

function overlaps(a, b) {
  return a.x < b.x + b.w + 10 && b.x < a.x + a.w + 10 && a.y < b.y + b.h + 6 && b.y < a.y + a.h + 6;
}

/**
 * Where a callout goes: the open floor rows of the stall (the rows between the counters), as close
 * to its target as it can sit without covering another callout.
 */
function placeCallout(ctx, target, kitchen, placed) {
  ctx.font = FONT;
  const w = ctx.measureText(target.label).width + (target.step ? 52 : 28);
  const scale = KITCHEN_VIEW.scale;
  const rowY = (row) => KITCHEN_VIEW.y + (row * TILE + TILE / 2) * scale - PILL_HEIGHT / 2;
  const rows = target.hud ? [1] : [1, 3, 2];
  const left = KITCHEN_VIEW.x + TILE * scale + 6;
  const right = KITCHEN_VIEW.x + (kitchen.cols - 1) * TILE * scale - 6;
  let best = null;
  for (const row of rows) {
    for (const shift of [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6, -7, 7]) {
      const x = Math.max(left, Math.min(right - w, target.x - w / 2 + shift * 60));
      const box = { x, y: rowY(row), w, h: PILL_HEIGHT };
      if (placed.some((other) => overlaps(box, other))) continue;
      const cost = Math.hypot(box.x + w / 2 - target.x, box.y + PILL_HEIGHT / 2 - target.y);
      if (best === null || cost < best.cost) best = { ...box, cost };
    }
  }
  return best;
}

function drawLeader(ctx, box, target) {
  const cy = box.y + box.h / 2;
  const toward = target.y < cy ? box.y : box.y + box.h;
  ctx.strokeStyle = '#fff3d6';
  ctx.lineWidth = 3;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.moveTo(Math.max(box.x + 14, Math.min(box.x + box.w - 14, target.x)), toward);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#fff3d6';
  ctx.strokeStyle = '#22183a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(target.x, target.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawPill(ctx, box, target) {
  const cy = box.y + box.h / 2;
  ctx.fillStyle = 'rgba(28,18,46,0.92)';
  ctx.strokeStyle = '#ffd36b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, 15);
  ctx.fill();
  ctx.stroke();
  let textX = box.x + box.w / 2;
  if (target.step) {
    // A numbered step of the dish's route, in the lantern red of the stall.
    ctx.fillStyle = '#e0452f';
    ctx.strokeStyle = '#ffd36b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(box.x + 16, cy, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff3d6';
    ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(target.step), box.x + 16, cy + 1);
    textX += 12;
  }
  ctx.fillStyle = '#ffe9b0';
  ctx.font = FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(target.label, textX, cy + 1);
}

/** Draw the guide's callouts over a night in play. */
export function drawKitchenGuide(ctx, night) {
  const targets = guideTargets(night);
  // What a callout must not cover: whatever another callout points at, and the chef.
  const scale = KITCHEN_VIEW.scale;
  const placed = targets.map((target) => ({ x: target.x - 34, y: target.y - 34, w: 68, h: 68 }));
  placed.push({
    x: KITCHEN_VIEW.x + night.chef.x * scale - 36,
    y: KITCHEN_VIEW.y + night.chef.y * scale - 90,
    w: 72,
    h: 110,
  });
  const callouts = [];
  for (const target of targets) {
    const box = placeCallout(ctx, target, night.kitchen, placed);
    if (box === null) continue;
    placed.push(box);
    callouts.push({ box, target });
  }
  // Every leader line first, then the pills on top, so no line crosses a label.
  ctx.save();
  for (const { box, target } of callouts) drawLeader(ctx, box, target);
  for (const { box, target } of callouts) drawPill(ctx, box, target);
  ctx.restore();
}
