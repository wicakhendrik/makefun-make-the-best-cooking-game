// The order board across the top (tickets with their dish, parts, prep route and patience), the
// shift clock and the till, and the hint bar along the bottom.
import { FOOTER_HEIGHT, HUD_HEIGHT, VIEW } from '../config.js';
import { INGREDIENTS, RECIPES } from '../recipes.js';
import { describeItem } from '../kitchen.js';
import { drawPart, drawPlate } from './foodArt.js';

const TICKET = { width: 178, height: 102, gap: 9, left: 12, top: 10 };
const LANTERN_COLORS = ['#ff6b4a', '#ffc94a', '#ff8fb1', '#7ad3ff', '#9df08f'];

function text(ctx, value, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

/** A tiny picture of a prep step: a knife for the board, a pot, or a wok. */
export function drawStepGlyph(ctx, step, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 1.5;
  if (step === 'board') {
    ctx.rotate(-0.7);
    ctx.fillStyle = '#5a6670';
    ctx.fillRect(-1.5, 1, 3, 5);
    ctx.fillStyle = '#c9ced3';
    ctx.fillRect(-2.5, -7, 5, 8);
  } else if (step === 'pot') {
    ctx.fillStyle = '#7d858c';
    ctx.fillRect(-6, -3, 12, 8);
    ctx.fillRect(-8, -3, 16, 2);
    ctx.fillStyle = '#7fb3c9';
    ctx.fillRect(-5, -2, 10, 2);
  } else {
    ctx.fillStyle = '#2b2b30';
    ctx.beginPath();
    ctx.arc(0, -1, 6, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#6b4a30';
    ctx.fillRect(5, -2, 6, 2);
  }
  ctx.restore();
}

function drawNightSky(ctx, time, rush) {
  const sky = ctx.createLinearGradient(0, 0, 0, HUD_HEIGHT);
  sky.addColorStop(0, rush ? '#3a1530' : '#17122b');
  sky.addColorStop(1, rush ? '#4f1d33' : '#2a1f45');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW.width, HUD_HEIGHT);
  ctx.strokeStyle = 'rgba(30,20,16,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  for (let x = 0; x <= VIEW.width; x += 80) ctx.quadraticCurveTo(x + 40, 16, x + 80, 4);
  ctx.stroke();
  for (let i = 0; i < 16; i += 1) {
    const x = 40 + i * 80;
    const color = LANTERN_COLORS[i % LANTERN_COLORS.length];
    const glow = 0.25 + 0.12 * Math.sin(time * 2 + i);
    const halo = ctx.createRadialGradient(x, 14, 1, x, 14, 22);
    halo.addColorStop(0, color);
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = glow;
    ctx.fillStyle = halo;
    ctx.fillRect(x - 22, -8, 44, 44);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, 14, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function patienceColor(share) {
  if (share > 0.5) return '#4fbf58';
  if (share > 0.25) return '#f0b13a';
  return '#e0412e';
}

function drawTicket(ctx, ticket, x, y, time) {
  const recipe = RECIPES[ticket.recipe];
  const share = ticket.left / ticket.patience;
  const slide = Math.max(0, 1 - ticket.age / 0.35);
  let ox = slide * 220;
  if (ticket.shake > 0 || share < 0.2) ox += Math.sin(time * 40) * (ticket.shake > 0 ? 4 : 1.5);
  ctx.save();
  ctx.translate(x + ox, y);
  ctx.rotate(((ticket.id % 3) - 1) * 0.012);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.roundRect(3, 4, TICKET.width, TICKET.height, 6);
  ctx.fill();
  if (ticket.vip) {
    // A lantern guest's ticket: gold paper with a soft glow, so it stands out on a full board.
    ctx.shadowColor = 'rgba(255,200,80,0.9)';
    ctx.shadowBlur = 12 + Math.sin(time * 5) * 4;
  }
  ctx.fillStyle = ticket.vip ? (share < 0.2 ? '#ffd9a8' : '#ffe9a6') : share < 0.2 ? '#ffe3d6' : '#fbf3df';
  ctx.beginPath();
  ctx.roundRect(0, 0, TICKET.width, TICKET.height, 6);
  ctx.fill();
  ctx.shadowBlur = 0;
  if (ticket.vip) {
    ctx.strokeStyle = '#c8901e';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
  ctx.fillStyle = ticket.vip ? '#c8901e' : '#c8372d';
  ctx.fillRect(0, 0, TICKET.width, 6);
  ctx.fillStyle = '#e3b23c';
  ctx.beginPath();
  ctx.arc(TICKET.width / 2, 3, 5, 0, Math.PI * 2);
  ctx.fill();

  text(ctx, recipe.name, 8, 18, 13, '#3a2418');
  text(ctx, `${recipe.price * (ticket.vip ? 2 : 1)}¢`, TICKET.width - 8, 18, 12, ticket.vip ? '#a0560e' : '#8a5a2b', 'right');
  drawPlate(ctx, recipe.parts, 34, 54, 50);
  if (ticket.vip) {
    // The guest's badge: pays double, waits less.
    ctx.fillStyle = '#c8372d';
    ctx.strokeStyle = '#ffe9a6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(4, 70, 52, 18, 9);
    ctx.fill();
    ctx.stroke();
    text(ctx, 'VIP ×2', 30, 79, 11, '#ffe9a6', 'center');
  }

  recipe.parts.forEach((id, index) => {
    const px = 76 + (index % 2) * 50;
    const py = 40 + Math.floor(index / 2) * 30;
    ctx.fillStyle = 'rgba(58,36,24,0.08)';
    ctx.beginPath();
    ctx.roundRect(px - 14, py - 13, 46, 26, 5);
    ctx.fill();
    drawPart(ctx, id, px, py, 22);
    const route = INGREDIENTS[id].route;
    route.forEach((step, k) => drawStepGlyph(ctx, step, px + 18 + k * 11, py + (route.length > 1 ? (k === 0 ? -5 : 6) : 0)));
  });

  ctx.fillStyle = 'rgba(58,36,24,0.18)';
  ctx.fillRect(8, TICKET.height - 12, TICKET.width - 16, 6);
  ctx.fillStyle = patienceColor(share);
  ctx.fillRect(8, TICKET.height - 12, (TICKET.width - 16) * Math.max(0, share), 6);
  ctx.restore();
}

function drawClock(ctx, night, time) {
  const x = 1046;
  const y = 62;
  const left = night.timeLeft;
  const share = left / night.shift.length;
  const final = left <= 15 && night.phase === 'open';
  const pulse = final ? 1 + Math.sin(time * 12) * 0.05 : 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#120d1f';
  ctx.beginPath();
  ctx.arc(0, 0, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(0, 0, 40, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = final ? '#ff5a3c' : night.rush ? '#ff9a3c' : '#ffd36b';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, 40, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * share);
  ctx.stroke();
  const minutes = Math.floor(Math.ceil(left) / 60);
  const seconds = String(Math.ceil(left) % 60).padStart(2, '0');
  text(ctx, `${minutes}:${seconds}`, 0, 2, 26, final ? '#ff8a6a' : '#fff3d6', 'center');
  text(ctx, night.rush ? 'RUSH' : 'SERVICE', 0, 24, 10, night.rush ? '#ff9a3c' : '#bfb3d9', 'center');
  ctx.restore();
}

function drawStar(ctx, x, y, r, filled, onPaper = false) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? r : r * 0.45;
    ctx.lineTo(x + Math.cos(a) * radius, y + Math.sin(a) * radius);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? '#ffd36b' : onPaper ? 'rgba(120,90,60,0.12)' : 'rgba(255,255,255,0.12)';
  ctx.fill();
  ctx.strokeStyle = filled ? '#a8741a' : onPaper ? 'rgba(120,90,60,0.45)' : 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export { drawStar };

function drawTill(ctx, night) {
  const orders = night.orders;
  const x = 1108;
  ctx.fillStyle = 'rgba(18,13,31,0.85)';
  ctx.beginPath();
  ctx.roundRect(x, 14, 160, 94, 10);
  ctx.fill();
  ctx.fillStyle = '#ffd36b';
  ctx.beginPath();
  ctx.arc(x + 22, 38, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a8741a';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, '¢', x + 22, 39, 14, '#a8741a', 'center');
  text(ctx, String(orders.coins), x + 42, 39, 26, '#fff3d6');
  for (let i = 0; i < 3; i += 1) drawStar(ctx, x + 28 + i * 30, 70, 11, orders.coins >= night.shift.stars[i]);
  const next = night.shift.stars.find((needed) => orders.coins < needed);
  text(ctx, next === undefined ? 'Three stars!' : `next star ${next}¢`, x + 80, 94, 11, '#bfb3d9', 'center', 'normal');
}

/** The whole top band: sky and lanterns, the tickets, the clock and the till. */
export function drawOrderBoard(ctx, night, time) {
  drawNightSky(ctx, time, night.rush);
  night.orders.tickets.forEach((ticket, index) => {
    drawTicket(ctx, ticket, TICKET.left + index * (TICKET.width + TICKET.gap), TICKET.top, time);
  });
  if (night.orders.tickets.length === 0 && night.phase === 'open') {
    text(ctx, 'Waiting for the next customer…', 24, 64, 16, 'rgba(255,243,214,0.6)', 'left', 'normal');
  }
  drawClock(ctx, night, time);
  drawTill(ctx, night);
}

const STEP_TIPS = {
  board: 'cut it on a board (hold F, or click the board)',
  pot: 'boil it in a pot',
  wok: 'sear it in a wok',
};

/** A one-line tip for whatever the chef holds: where it goes next. */
function tipFor(held, night) {
  if (held === null) return 'WASD / arrows walk  ·  Space or E use  ·  hold F chop  ·  or click any station  ·  Esc pause  ·  M sound';
  if (held.kind === 'plate') {
    if (held.parts.length === 0) return 'An empty plate: set it on a counter and add finished parts, or carry it to a pot or wok to plate straight from it.';
    const wanted = night.orders.tickets.some((ticket) => {
      const parts = RECIPES[ticket.recipe].parts;
      return parts.length === held.parts.length && parts.every((part) => held.parts.includes(part));
    });
    return wanted ? 'That plate matches a ticket: take it to a SERVE window!' : 'Keep adding parts until the plate matches a ticket, or scrap it in the bin.';
  }
  if (held.burnt) return 'Burnt! Scrap it in the bin and start again.';
  const step = INGREDIENTS[held.id].route[held.stage];
  if (step === undefined) return `${INGREDIENTS[held.id].done} is ready: put it on a plate.`;
  const then = INGREDIENTS[held.id].route[held.stage + 1];
  return `${INGREDIENTS[held.id].name}: ${STEP_TIPS[step]}${then ? `, then ${STEP_TIPS[then].split(' (')[0]}` : ''}.`;
}

/** The bottom bar: a tip for what the chef holds (or the controls), and the current streak. */
export function drawFooter(ctx, night) {
  const y = VIEW.height - FOOTER_HEIGHT;
  ctx.fillStyle = '#21182c';
  ctx.fillRect(0, y, VIEW.width, FOOTER_HEIGHT);
  ctx.fillStyle = '#c8372d';
  ctx.fillRect(0, y, VIEW.width, 2);
  const held = night.chef.held;
  text(ctx, tipFor(held, night), 14, y + 21, 13, held === null ? '#bfb3d9' : '#ffe9b0', 'left', held === null ? 'normal' : 'bold');
  text(ctx, `Holding ${describeItem(held)}`, VIEW.width - 130, y + 21, 13, held === null ? '#8c82a6' : '#fff3d6', 'right', 'normal');
  const streak = night.orders.streak;
  text(ctx, streak > 1 ? `Streak ${streak}` : `Served ${night.orders.served}`, VIEW.width - 14, y + 21, 14, streak > 1 ? '#9df08f' : '#fff3d6', 'right');
}
