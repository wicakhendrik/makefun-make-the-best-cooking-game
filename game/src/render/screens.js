// The screens around a night: the title with its three night cards, the count-in, the rush banner,
// the pause veil and the end-of-night results with stars, takings and the dishes served.
import { KITCHENS, VIEW } from '../config.js';
import { RECIPES, SHIFTS } from '../recipes.js';
import { drawPlate } from './foodArt.js';
import { drawStar } from './hud.js';

function text(ctx, value, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function outlined(ctx, value, x, y, size, color, outline = '#1b1020') {
  ctx.font = `bold ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(4, size / 7);
  ctx.strokeStyle = outline;
  ctx.strokeText(value, x, y);
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function veil(ctx, alpha) {
  ctx.fillStyle = `rgba(16,10,26,${alpha})`;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.roundRect(x + 6, y + 8, w, h, 16);
  ctx.fill();
  ctx.fillStyle = '#fbf3df';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = '#c8372d';
  ctx.lineWidth = 4;
  ctx.stroke();
}

function drawLantern(ctx, x, y, r, color, time) {
  const halo = ctx.createRadialGradient(x, y, 2, x, y, r * 2.4);
  halo.addColorStop(0, color);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.35 + 0.1 * Math.sin(time * 2);
  ctx.fillStyle = halo;
  ctx.fillRect(x - r * 2.4, y - r * 2.4, r * 4.8, r * 4.8);
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.9, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(80,20,10,0.6)';
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.9 * Math.abs(i * 0.55 + (i === 0 ? 0.2 : 0)), r, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(x - r * 0.4, y - r - 5, r * 0.8, 6);
  ctx.fillRect(x - r * 0.4, y + r - 1, r * 0.8, 6);
}

const CARD = { width: 336, height: 318, top: 226, gap: 26 };

/** Where each night's card sits on the title screen, for drawing and for mouse clicks. */
export function titleCards() {
  const total = SHIFTS.length * CARD.width + (SHIFTS.length - 1) * CARD.gap;
  const left = (VIEW.width - total) / 2;
  return SHIFTS.map((shift, index) => ({ index, x: left + index * (CARD.width + CARD.gap), y: CARD.top, w: CARD.width, h: CARD.height }));
}

/** The title: logo, the three nights with their menus and best stars, and how to play. */
export function drawTitle(ctx, time, best, hover) {
  veil(ctx, 0.62);
  drawLantern(ctx, 236, 88, 30, '#ff6b4a', time);
  drawLantern(ctx, 1044, 88, 30, '#ffc94a', time + 1);
  outlined(ctx, 'Lantern Alley Kitchen', VIEW.width / 2, 86, 64, '#ffd36b');
  text(ctx, 'A night-market cooking game · chop, boil, sear, plate and serve before the lanterns go out', VIEW.width / 2, 142, 18, '#f3e7ff', 'center', 'normal');
  text(ctx, 'Choose a night', VIEW.width / 2, 200, 20, '#ffb36b');
  for (const card of titleCards()) {
    const shift = SHIFTS[card.index];
    const lifted = hover === card.index ? -6 : 0;
    panel(ctx, card.x, card.y + lifted, card.w, card.h);
    const cx = card.x + card.w / 2;
    const top = card.y + lifted;
    text(ctx, `Night ${card.index + 1} · ${KITCHENS[shift.kitchen].name}`, cx, top + 28, 15, '#c8372d');
    text(ctx, shift.title, cx, top + 56, 26, '#3a2418');
    text(ctx, shift.blurb, cx, top + 86, 14, '#6b4a33', 'center', 'normal');
    // The night's menu as plates: up to five a row, smaller when the menu is long.
    const dishes = shift.menu;
    const across = dishes.length > 4 ? 5 : 4;
    const step = dishes.length > 4 ? 60 : 70;
    const size = dishes.length > 4 ? 48 : 52;
    dishes.forEach((key, i) => {
      const row = Math.floor(i / across);
      const inRow = Math.min(across, dishes.length - row * across);
      const dx = cx + ((i % across) - (inRow - 1) / 2) * step;
      const dy = top + 136 + row * 60;
      drawPlate(ctx, RECIPES[key].parts, dx, dy, size);
    });
    text(ctx, `${dishes.length} dishes · ${Math.round((shift.length / 60) * 10) / 10} min · stars at ${shift.stars.join(' / ')}¢`, cx, top + 250, 13, '#6b4a33', 'center', 'normal');
    for (let s = 0; s < 3; s += 1) drawStar(ctx, cx - 34 + s * 34, top + 282, 13, (best[card.index] ?? 0) > s, true);
    text(ctx, `Press ${card.index + 1}`, card.x + card.w - 16, top + 300, 12, '#a08a74', 'right', 'normal');
  }
  const y = 600;
  ctx.fillStyle = 'rgba(18,13,31,0.85)';
  ctx.beginPath();
  ctx.roundRect(140, y - 26, 1000, 92, 12);
  ctx.fill();
  text(ctx, 'How to cook', VIEW.width / 2, y - 6, 16, '#ffd36b');
  text(ctx, 'Take raw food from a crate · cut it on a board · boil noodles, rice, buns and eggs in a pot · sear pork, mushroom and shrimp in a wok', VIEW.width / 2, y + 18, 14, '#f3e7ff', 'center', 'normal');
  text(ctx, 'Plate the parts and serve at the pass. Gold VIP tickets pay double. WASD walk, Space use, hold F chop, or click the stations. G shows the guide.', VIEW.width / 2, y + 40, 14, '#f3e7ff', 'center', 'normal');
}

/** "3, 2, 1, open!" over the kitchen while the night starts. */
export function drawCountIn(ctx, night) {
  const left = night.countIn;
  const word = left > 1.6 ? 'Ready' : left > 0.8 ? 'Set' : 'Open!';
  const share = (left * 1.25) % 1;
  veil(ctx, 0.25);
  outlined(ctx, `Night ${night.shiftIndex + 1}: ${night.shift.title}`, VIEW.width / 2, 300, 34, '#fff3d6');
  outlined(ctx, word, VIEW.width / 2, 380, 72 + share * 20, '#ffd36b');
}

/**
 * A banner across the kitchen's back aisle as the rush begins, swinging in on a string of
 * lanterns, so the change of pace reads at a glance without hiding the island.
 */
export function drawRushBanner(ctx, share) {
  const alpha = Math.min(1, share * 3, (1 - share) * 3);
  const y = 250;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(90,20,16,0.5)';
  ctx.fillRect(0, y + 6, VIEW.width, 76);
  ctx.fillStyle = 'rgba(200,55,45,0.94)';
  ctx.fillRect(0, y, VIEW.width, 76);
  ctx.fillStyle = '#e3b23c';
  ctx.fillRect(0, y + 4, VIEW.width, 3);
  ctx.fillRect(0, y + 69, VIEW.width, 3);
  outlined(ctx, 'LANTERN RUSH!', VIEW.width / 2, y + 30, 34, '#ffd36b', '#5a1410');
  outlined(ctx, 'Orders come faster and wait less: keep the woks hot', VIEW.width / 2, y + 58, 17, '#fff3d6', '#5a1410');
  drawLantern(ctx, 250, y + 38, 22, '#ffc94a', share * 6);
  drawLantern(ctx, 1030, y + 38, 22, '#ffc94a', share * 6 + 1);
  ctx.globalAlpha = 1;
}

export function drawPause(ctx) {
  veil(ctx, 0.6);
  outlined(ctx, 'Paused', VIEW.width / 2, 320, 64, '#ffd36b');
  text(ctx, 'Esc or P to keep cooking  ·  Q to close the stall and return to the menu', VIEW.width / 2, 390, 18, '#f3e7ff', 'center', 'normal');
}

/** The end of a night: stars, the takings line by line, and every dish that went out. */
export function drawResults(ctx, night, time, since) {
  const orders = night.orders;
  veil(ctx, 0.55);
  const x = 290;
  const y = 120;
  const w = 700;
  const h = 500;
  panel(ctx, x, y, w, h);
  text(ctx, `Night ${night.shiftIndex + 1} · ${night.shift.title}`, VIEW.width / 2, y + 34, 18, '#c8372d');
  text(ctx, 'The stall is closed!', VIEW.width / 2, y + 70, 36, '#3a2418');
  const stars = orders.stars();
  for (let i = 0; i < 3; i += 1) {
    const pop = Math.min(1, Math.max(0, (since - 0.3 - i * 0.35) * 4));
    const scale = i < stars ? 0.6 + pop * 0.4 + (pop < 1 ? Math.sin(pop * Math.PI) * 0.3 : 0) : 1;
    drawStar(ctx, VIEW.width / 2 - 90 + i * 90, y + 140, 34 * scale, i < stars && pop > 0, true);
  }
  const lines = [
    ['Dishes served', String(orders.served)],
    ['Tickets that walked out', String(orders.missed)],
    ['Tips for speed', `${orders.tips}¢`],
    ['Best streak', String(orders.bestStreak)],
    ['Takings', `${orders.coins}¢`],
  ];
  lines.forEach(([label, value], index) => {
    const ly = y + 204 + index * 30;
    text(ctx, label, x + 160, ly, 18, '#6b4a33', 'left', 'normal');
    text(ctx, value, x + w - 160, ly, index === lines.length - 1 ? 24 : 18, index === lines.length - 1 ? '#c8372d' : '#3a2418', 'right');
  });
  const served = orders.servedLog.slice(-14);
  served.forEach((key, index) => {
    drawPlate(ctx, RECIPES[key].parts, VIEW.width / 2 - (served.length - 1) * 23 + index * 46, y + 386, 40);
  });
  if (served.length === 0) text(ctx, 'No dishes went out tonight.', VIEW.width / 2, y + 386, 16, '#a08a74', 'center', 'normal');
  const next = night.shiftIndex + 1 < 3 ? '  ·  N next night' : '';
  const blink = 0.6 + 0.4 * Math.sin(time * 4);
  ctx.globalAlpha = blink;
  text(ctx, `Enter cook again${next}  ·  Esc menu`, VIEW.width / 2, y + h - 34, 17, '#3a2418');
  ctx.globalAlpha = 1;
}
