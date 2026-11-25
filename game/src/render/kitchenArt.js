// The kitchen drawn in code: the tiled floor and counters (painted once into a layer), the live
// stations on top of them (pots on the boil, a sizzling wok, food waiting on boards), and the chef.
import { TILE, TIMING } from '../config.js';
import { INGREDIENTS, isFinished, nextStep } from '../recipes.js';
import { drawFood, drawPlate } from './foodArt.js';

const COLORS = {
  floorA: '#b7684a',
  floorB: '#a95d41',
  grout: '#8d4a33',
  counterTop: '#d39a62',
  counterGrain: '#bf8551',
  counterFront: '#2c5f63',
  counterTrim: '#1d4245',
  steel: '#c9ced3',
  steelDark: '#7d858c',
  wok: '#2b2b30',
};

function roundRect(ctx, x, y, w, h, r, fill, stroke, width = 2) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function circle(ctx, x, y, r, fill, stroke, width = 2) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function drawFloor(ctx, kitchen) {
  for (const cell of kitchen.cells) {
    const x = cell.col * TILE;
    const y = cell.row * TILE;
    ctx.fillStyle = COLORS.grout;
    ctx.fillRect(x, y, TILE, TILE);
    for (let i = 0; i < 4; i += 1) {
      const tx = x + (i % 2) * 40;
      const ty = y + Math.floor(i / 2) * 40;
      ctx.fillStyle = (Math.floor(tx / 40) + Math.floor(ty / 40)) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(tx + 1, ty + 1, 38, 38);
    }
  }
  drawMat(ctx, TILE + 6, TILE + 10, (kitchen.cols - 3) * TILE - 12, TILE - 22, '#6b2f2a', '#8e3d33');
  const pass = kitchen.stations.find((cell) => cell.type === 'pass' && cell.col === kitchen.cols - 1);
  if (pass) drawMat(ctx, (pass.col - 2) * TILE + 8, pass.row * TILE + 8, 2 * TILE - 16, TILE * 2 - 16, '#2c5f63', '#3c7a7e');
  // A floor drain by the scrap bin.
  ctx.fillStyle = '#5b3424';
  ctx.beginPath();
  ctx.arc((kitchen.cols - 2) * TILE + 30, 3.5 * TILE + 30, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3a2016';
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo((kitchen.cols - 2) * TILE + 22, 3.5 * TILE + 30 + i * 5);
    ctx.lineTo((kitchen.cols - 2) * TILE + 38, 3.5 * TILE + 30 + i * 5);
    ctx.stroke();
  }
}

/** A woven mat with a fringe, laid on the floor where the cooks stand longest. */
function drawMat(ctx, x, y, w, h, base, weave) {
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(x + 3, y + 4, w, h);
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = weave;
  ctx.lineWidth = 3;
  for (let i = 8; i < w; i += 12) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + 4);
    ctx.lineTo(x + i, y + h - 4);
    ctx.stroke();
  }
  ctx.strokeStyle = '#d6a45a';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);
}

function drawCounterBlock(ctx, x, y) {
  roundRect(ctx, x + 1, y + 1, TILE - 2, TILE - 2, 6, COLORS.counterFront, COLORS.counterTrim, 2);
  roundRect(ctx, x + 3, y + 3, TILE - 6, TILE - 16, 5, COLORS.counterTop, null);
  ctx.strokeStyle = COLORS.counterGrain;
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 3 + i * 15);
    ctx.bezierCurveTo(x + 30, y + i * 15, x + 50, y + 8 + i * 15, x + TILE - 6, y + 2 + i * 15);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x + 4, y + 4, TILE - 8, 3);
}

function drawBoard(ctx, x, y) {
  roundRect(ctx, x + 10, y + 8, 60, 50, 8, '#e9c9a0', '#9a6d3f', 2);
  ctx.strokeStyle = 'rgba(154,109,63,0.35)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 18 + i * 10);
    ctx.lineTo(x + 66, y + 16 + i * 10);
    ctx.stroke();
  }
  circle(ctx, x + 62, y + 15, 3, '#9a6d3f');
}

function drawKnife(ctx, x, y, lift) {
  ctx.save();
  ctx.translate(x + 58, y + 52 - lift);
  ctx.rotate(-0.6 - lift * 0.02);
  roundRect(ctx, -3, 0, 6, 16, 2, '#3b2a20');
  ctx.fillStyle = '#dfe4e8';
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.lineTo(5, 0);
  ctx.lineTo(5, -26);
  ctx.quadraticCurveTo(-2, -30, -5, -22);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8b939a';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawBurner(ctx, x, y) {
  circle(ctx, x + 40, y + 34, 27, '#3b3b40', '#1d1d21', 2);
  ctx.strokeStyle = '#6b6b72';
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(x + 40 + Math.cos(a) * 10, y + 34 + Math.sin(a) * 10);
    ctx.lineTo(x + 40 + Math.cos(a) * 26, y + 34 + Math.sin(a) * 26);
    ctx.stroke();
  }
  roundRect(ctx, x + 32, y + 64, 16, 7, 3, '#e3c34d', '#7d6a22', 1);
}

function drawCrate(ctx, cell, x, y) {
  roundRect(ctx, x + 6, y + 6, 68, 56, 5, '#9a6a3c', '#5a3a1d', 2);
  ctx.fillStyle = '#b07d48';
  for (let i = 0; i < 3; i += 1) ctx.fillRect(x + 9, y + 10 + i * 17, 62, 12);
  const raw = { id: cell.ingredient, stage: 0, burnt: false };
  drawFood(ctx, raw, x + 28, y + 30, 30);
  drawFood(ctx, raw, x + 50, y + 34, 30);
  roundRect(ctx, x + 12, y + 56, 56, 14, 4, '#f5ead2', '#5a3a1d', 1);
  ctx.fillStyle = '#3a2418';
  ctx.font = 'bold 10px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(INGREDIENTS[cell.ingredient].name.toUpperCase(), x + 40, y + 63.5);
}

function drawPlateStack(ctx, x, y) {
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.ellipse(x + 40, y + 40 - i * 5, 28, 20, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fbfaf7';
    ctx.fill();
    ctx.strokeStyle = '#a59c8e';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(x + 40, y + 25, 19, 13, 0, 0, Math.PI * 2);
  ctx.strokeStyle = '#e2ddd3';
  ctx.stroke();
}

function drawPass(ctx, x, y) {
  roundRect(ctx, x + 4, y + 4, 72, 60, 6, '#e8e3d8', '#8b8478', 2);
  const glow = ctx.createRadialGradient(x + 40, y + 30, 4, x + 40, y + 30, 40);
  glow.addColorStop(0, 'rgba(255,190,90,0.75)');
  glow.addColorStop(1, 'rgba(255,190,90,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = '#c8372d';
  ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SERVE', x + 40, y + 58);
  circle(ctx, x + 64, y + 16, 7, '#e3b23c', '#7d5f12', 1.5);
  circle(ctx, x + 64, y + 10, 2, '#7d5f12');
}

function drawTrash(ctx, x, y) {
  roundRect(ctx, x + 18, y + 12, 44, 52, 6, '#55606a', '#2a3036', 2);
  roundRect(ctx, x + 14, y + 8, 52, 10, 4, '#6e7a85', '#2a3036', 2);
  ctx.strokeStyle = '#3c454d';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + 28 + i * 12, y + 24);
    ctx.lineTo(x + 28 + i * 12, y + 56);
    ctx.stroke();
  }
}

/** Paint the parts of the kitchen that never change into an offscreen layer. */
export function paintKitchenLayer(kitchen) {
  const layer = document.createElement('canvas');
  layer.width = kitchen.cols * TILE;
  layer.height = kitchen.rows * TILE;
  const ctx = layer.getContext('2d');
  drawFloor(ctx, kitchen);
  for (const cell of kitchen.stations) {
    const x = cell.col * TILE;
    const y = cell.row * TILE;
    drawCounterBlock(ctx, x, y);
    if (cell.type === 'board') drawBoard(ctx, x, y);
    else if (cell.type === 'pot' || cell.type === 'wok') drawBurner(ctx, x, y);
    else if (cell.type === 'crate') drawCrate(ctx, cell, x, y);
    else if (cell.type === 'plates') drawPlateStack(ctx, x, y);
    else if (cell.type === 'pass') drawPass(ctx, x, y);
    else if (cell.type === 'trash') drawTrash(ctx, x, y);
  }
  return layer;
}

function drawFlame(ctx, x, y, time, strength) {
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * Math.PI * 2;
    const flicker = 5 + Math.sin(time * 18 + i * 1.7) * 2.5 * strength;
    const fx = x + Math.cos(a) * 24;
    const fy = y + Math.sin(a) * 24;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(80,150,255,0.85)' : 'rgba(255,170,60,0.85)';
    ctx.beginPath();
    ctx.ellipse(fx, fy, 3.5, flicker, a + Math.PI / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A ring that fills as `share` goes from 0 to 1, in `color`, around (x, y). */
export function drawProgressRing(ctx, x, y, r, share, color) {
  circle(ctx, x, y, r + 3, 'rgba(20,14,10,0.75)');
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, share));
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function drawPot(ctx, cell, x, y, time) {
  const food = cell.item;
  const active = food !== null && !food.burnt;
  if (active) drawFlame(ctx, x + 40, y + 34, time, 1);
  circle(ctx, x + 40, y + 32, 25, COLORS.steel, COLORS.steelDark, 2);
  roundRect(ctx, x + 6, y + 27, 9, 10, 3, COLORS.steelDark);
  roundRect(ctx, x + 65, y + 27, 9, 10, 3, COLORS.steelDark);
  circle(ctx, x + 40, y + 32, 20, food !== null && food.burnt ? '#4a3d36' : '#7fb3c9');
  if (active) {
    for (let i = 0; i < 5; i += 1) {
      const t = (time * 1.6 + i * 0.37) % 1;
      circle(ctx, x + 30 + ((i * 13) % 22), y + 26 + ((i * 7) % 14), 1.5 + t * 3, `rgba(255,255,255,${0.7 * (1 - t)})`);
    }
  }
  if (food !== null) drawFood(ctx, food, x + 40, y + 32, 30, time);
}

function drawWok(ctx, cell, x, y, time) {
  const food = cell.item;
  const active = food !== null && !food.burnt;
  if (active) drawFlame(ctx, x + 40, y + 34, time, 1.5);
  roundRect(ctx, x + 60, y + 28, 20, 8, 4, '#3b2a20');
  circle(ctx, x + 38, y + 32, 26, COLORS.wok, '#111114', 2);
  const inner = ctx.createRadialGradient(x + 32, y + 26, 2, x + 38, y + 32, 24);
  inner.addColorStop(0, '#5b5b66');
  inner.addColorStop(1, COLORS.wok);
  circle(ctx, x + 38, y + 32, 22, inner);
  if (food !== null) {
    const toss = active ? Math.sin(time * 9) * 2 : 0;
    drawFood(ctx, food, x + 38, y + 32 + toss, 32, time);
  }
}

/** Where a station shows what sits on it, and how big. */
function itemSpot(cell) {
  return { x: cell.col * TILE + 40, y: cell.row * TILE + 32 };
}

function drawHeldThing(ctx, thing, x, y, size, time) {
  if (thing.kind === 'plate') drawPlate(ctx, thing.parts, x, y, size);
  else drawFood(ctx, thing, x, y, size * 0.85, time);
}

function drawBurnWarning(ctx, x, y, time, share) {
  const pulse = 0.5 + 0.5 * Math.sin(time * (10 + share * 14));
  circle(ctx, x, y - 30, 11, `rgba(224,48,30,${0.6 + pulse * 0.4})`, '#fff3e0', 2);
  ctx.fillStyle = '#fff3e0';
  ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', x, y - 29);
}

/**
 * Draw what is on every station this frame: food, plates, flames, progress and warnings. The
 * knife on `choppingAt` (the board the chef works, or null) rises and falls with each cut.
 */
export function drawStations(ctx, kitchen, time, choppingAt = null) {
  for (const cell of kitchen.stations) {
    const x = cell.col * TILE;
    const y = cell.row * TILE;
    if (cell.type === 'pot') drawPot(ctx, cell, x, y, time);
    else if (cell.type === 'wok') drawWok(ctx, cell, x, y, time);
    else if (cell.item !== null) {
      const spot = itemSpot(cell);
      drawHeldThing(ctx, cell.item, spot.x, spot.y, 50, time);
    }
    if (cell.type === 'board') drawKnife(ctx, x - (cell === choppingAt ? 14 : 0), y, cell === choppingAt ? Math.abs(Math.sin(time * 26)) * 12 : 0);
  }
  for (const cell of kitchen.stations) {
    const food = cell.item;
    if (food === null || food.kind !== 'food' || food.burnt) continue;
    const x = cell.col * TILE + 40;
    const y = cell.row * TILE + 32;
    const step = nextStep(food);
    if ((cell.type === 'pot' || cell.type === 'wok') && step === cell.type) {
      drawProgressRing(ctx, x + 26, y - 22, 8, food.progress / TIMING[cell.type], '#7be07b');
    } else if (cell.type === 'board' && step === 'board' && food.progress > 0) {
      drawProgressRing(ctx, x + 26, y - 22, 8, food.progress / TIMING.chop, '#f3d27a');
    } else if ((cell.type === 'pot' || cell.type === 'wok') && isFinished(food)) {
      if (food.doneFor >= TIMING.burn - TIMING.warn) drawBurnWarning(ctx, x, y, time, food.doneFor / TIMING.burn);
      else {
        circle(ctx, x + 26, y - 22, 9, '#3fae4a', '#eaffea', 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x + 21, y - 22);
        ctx.lineTo(x + 25, y - 18);
        ctx.lineTo(x + 31, y - 26);
        ctx.stroke();
      }
    }
  }
}

/** A glowing outline around the station the chef faces (and a fainter one where the mouse is). */
export function drawHighlight(ctx, cell, strong, time) {
  const alpha = strong ? 0.75 + Math.sin(time * 6) * 0.2 : 0.35;
  roundRect(ctx, cell.col * TILE + 2, cell.row * TILE + 2, TILE - 4, TILE - 4, 8, null, `rgba(255,232,150,${alpha})`, strong ? 4 : 3);
}

/** The chef, seen from above and a little in front, with whatever it carries. */
export function drawChef(ctx, chef, time) {
  const bob = chef.moving ? Math.abs(Math.sin(chef.walkTime * 12)) * 3 : 0;
  const fx = chef.facing.x;
  const fy = chef.facing.y;
  ctx.save();
  // Drawn a little larger than its footprint, scaled about its feet.
  ctx.translate(chef.x, chef.y + 18);
  ctx.scale(1.15, 1.15);
  ctx.translate(-chef.x, -chef.y - 18);
  const x = chef.x;
  const y = chef.y - bob;
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(chef.x, chef.y + 18, 24, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  const carryX = x + fx * 24;
  const carryY = y + fy * 16 - 4;
  if (chef.held !== null && fy < 0) drawHeldThing(ctx, chef.held, carryX, carryY - 10, 44, time);

  // Body: a white jacket under a persimmon apron.
  ctx.fillStyle = '#f7f3ea';
  ctx.strokeStyle = '#4a3a30';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y + 6, 20, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (fy >= 0) {
    ctx.fillStyle = '#e0573a';
    ctx.beginPath();
    ctx.ellipse(x + fx * 4, y + 10, 13, 13, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillRect(x + fx * 4 - 9, y - 1, 18, 11);
  }

  // Arms reach toward what the chef carries or chops.
  const chop = chef.chopping ? Math.abs(Math.sin(time * 26)) * 7 : 0;
  const armX = x + fx * 18;
  const armY = y + 4 + fy * 12 - chop;
  circle(ctx, armX - fy * 12, armY, 6, '#f0c39a', '#4a3a30', 1.5);
  circle(ctx, armX + fy * 12 + (fy === 0 ? 0 : 0), armY + (fy === 0 ? 8 : 0), 6, '#f0c39a', '#4a3a30', 1.5);

  // Head, with a tall pleated toque and a lantern-red band.
  circle(ctx, x, y - 16, 14, '#f0c39a', '#4a3a30', 2);
  if (fy < 0) circle(ctx, x, y - 14, 12, '#3b2a22');
  else {
    ctx.fillStyle = '#3b2a22';
    ctx.beginPath();
    ctx.arc(x, y - 18, 13, Math.PI * 1.05, Math.PI * 1.95);
    ctx.fill();
    const eyeShift = fx * 5;
    circle(ctx, x - 5 + eyeShift, y - 14, 2, '#2a1a14');
    circle(ctx, x + 5 + eyeShift, y - 14, 2, '#2a1a14');
    ctx.strokeStyle = '#a44a3a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + eyeShift, y - 9, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
  roundRect(ctx, x - 13, y - 33, 26, 7, 3, '#c8372d', '#4a3a30', 1.5);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#4a3a30';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 33);
  ctx.bezierCurveTo(x - 22, y - 46, x - 8, y - 58, x, y - 50);
  ctx.bezierCurveTo(x + 8, y - 58, x + 22, y - 46, x + 12, y - 33);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (chef.held !== null && fy >= 0) drawHeldThing(ctx, chef.held, carryX, carryY + 6, 44, time);
  ctx.restore();
}
