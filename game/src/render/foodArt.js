// Food drawn in code: every ingredient raw, cut and cooked, burnt food, and plated dishes (a bowl of
// broth for noodles, a rice bowl, a bamboo steamer for buns, a plain plate otherwise).
import { INGREDIENTS } from '../recipes.js';

function ellipse(ctx, x, y, rx, ry, fill, stroke, width = 2) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
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

function shine(ctx, x, y, rx, ry, alpha = 0.55) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ellipse(ctx, x, y, rx, ry, '#ffffff');
  ctx.restore();
}

const OUTLINE = '#3a2418';

function drawNoodles(ctx, stage, s) {
  if (stage === 0) {
    ctx.save();
    ctx.rotate(-0.35);
    ctx.fillStyle = '#f2dc9a';
    ctx.strokeStyle = '#b58b3c';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-s * 0.95, -s * 0.38, s * 1.9, s * 0.76, s * 0.2);
    ctx.fill();
    ctx.stroke();
    for (let i = -3; i <= 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.9, i * s * 0.1);
      ctx.lineTo(s * 0.9, i * s * 0.1);
      ctx.stroke();
    }
    ctx.fillStyle = '#c8372d';
    ctx.fillRect(-s * 0.14, -s * 0.44, s * 0.28, s * 0.88);
    ctx.restore();
    return;
  }
  ctx.lineCap = 'round';
  for (let layer = 0; layer < 2; layer += 1) {
    ctx.strokeStyle = layer === 0 ? '#b8862f' : '#f6d77c';
    ctx.lineWidth = layer === 0 ? s * 0.2 : s * 0.12;
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      const y0 = -s * 0.5 + i * s * 0.25;
      ctx.moveTo(-s * 0.8, y0);
      for (let k = 1; k <= 8; k += 1) ctx.lineTo(-s * 0.8 + k * s * 0.2, y0 + Math.sin(k * 1.6 + i) * s * 0.12);
      ctx.stroke();
    }
  }
}

function drawRice(ctx, stage, s) {
  if (stage === 0) {
    ctx.fillStyle = '#c9a46a';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.7, s * 0.8);
    ctx.quadraticCurveTo(-s * 0.95, -s * 0.1, -s * 0.35, -s * 0.55);
    ctx.lineTo(s * 0.35, -s * 0.55);
    ctx.quadraticCurveTo(s * 0.95, -s * 0.1, s * 0.7, s * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7e5a2f';
    ctx.fillRect(-s * 0.4, -s * 0.62, s * 0.8, s * 0.16);
    ctx.fillStyle = '#fbf6e8';
    for (let i = 0; i < 6; i += 1) ellipse(ctx, -s * 0.3 + (i % 3) * s * 0.3, -s * 0.78 - Math.floor(i / 3) * s * 0.1, s * 0.09, s * 0.05, '#fbf6e8');
    ctx.fillStyle = '#7e5a2f';
    ctx.font = `bold ${Math.round(s * 0.5)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('米', 0, s * 0.42);
    return;
  }
  ellipse(ctx, 0, s * 0.05, s * 0.85, s * 0.62, '#fbf7ee', '#d9d0bd');
  ctx.fillStyle = '#e8e0cd';
  for (let i = 0; i < 14; i += 1) {
    const a = i * 2.39;
    const r = (i / 14) * s * 0.6;
    ellipse(ctx, Math.cos(a) * r, s * 0.05 + Math.sin(a) * r * 0.7, s * 0.09, s * 0.05, '#e6dcc6');
  }
  shine(ctx, -s * 0.25, -s * 0.2, s * 0.25, s * 0.12, 0.6);
}

function drawBun(ctx, stage, s) {
  if (stage === 0) {
    ellipse(ctx, 0, s * 0.1, s * 0.8, s * 0.68, '#efd9b3', '#b89466');
    ctx.fillStyle = '#e2c697';
    ellipse(ctx, s * 0.2, s * 0.25, s * 0.2, s * 0.12, '#e2c697');
    ellipse(ctx, -s * 0.3, -s * 0.05, s * 0.14, s * 0.09, '#e2c697');
    return;
  }
  ellipse(ctx, 0, s * 0.08, s * 0.86, s * 0.74, '#fffaf0', '#cdbfa7');
  ctx.strokeStyle = '#d8cbb3';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 7; i += 1) {
    const a = (i / 7) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * s * 0.12, Math.sin(a) * s * 0.1);
    ctx.quadraticCurveTo(Math.cos(a + 0.5) * s * 0.4, Math.sin(a + 0.5) * s * 0.35, Math.cos(a + 0.2) * s * 0.62, Math.sin(a + 0.2) * s * 0.55);
    ctx.stroke();
  }
  ellipse(ctx, 0, 0, s * 0.11, s * 0.09, '#e8577a');
  shine(ctx, -s * 0.35, -s * 0.25, s * 0.2, s * 0.1, 0.7);
}

function drawEgg(ctx, stage, s) {
  if (stage === 0) {
    ctx.save();
    ctx.rotate(0.3);
    ellipse(ctx, 0, 0, s * 0.55, s * 0.72, '#f6ead6', '#bfa784');
    shine(ctx, -s * 0.18, -s * 0.3, s * 0.12, s * 0.2, 0.7);
    ctx.restore();
    return;
  }
  ellipse(ctx, 0, 0, s * 0.72, s * 0.58, '#fffdf7', '#d4c7ae');
  const gradient = ctx.createRadialGradient(-s * 0.08, -s * 0.08, s * 0.03, 0, 0, s * 0.4);
  gradient.addColorStop(0, '#ffcf5a');
  gradient.addColorStop(1, '#ef8a1f');
  ellipse(ctx, 0, s * 0.02, s * 0.38, s * 0.32, gradient);
  shine(ctx, -s * 0.12, -s * 0.1, s * 0.1, s * 0.06, 0.8);
}

function drawShrimp(ctx, stage, s) {
  const body = stage === 0 ? '#d7a9a4' : '#ff7f45';
  const edge = stage === 0 ? '#8f6762' : '#b8431c';
  ctx.lineCap = 'round';
  ctx.strokeStyle = edge;
  ctx.lineWidth = s * 0.58;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.45, Math.PI * 0.85, Math.PI * 2.25);
  ctx.stroke();
  ctx.strokeStyle = body;
  ctx.lineWidth = s * 0.44;
  ctx.stroke();
  ctx.strokeStyle = stage === 0 ? '#efcfca' : '#ffd2b4';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i += 1) {
    const a = Math.PI * 0.95 + i * 0.27 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * s * 0.26, Math.sin(a) * s * 0.26);
    ctx.lineTo(Math.cos(a) * s * 0.64, Math.sin(a) * s * 0.64);
    ctx.stroke();
  }
  const tail = Math.PI * 2.25;
  const tx = Math.cos(tail) * s * 0.45;
  const ty = Math.sin(tail) * s * 0.45;
  ctx.fillStyle = edge;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx + s * 0.42, ty - s * 0.12);
  ctx.lineTo(tx + s * 0.3, ty + s * 0.3);
  ctx.closePath();
  ctx.fill();
  ellipse(ctx, Math.cos(Math.PI * 0.85) * s * 0.45, Math.sin(Math.PI * 0.85) * s * 0.45, s * 0.07, s * 0.07, '#2a1a14');
}

function drawPork(ctx, stage, s) {
  if (stage === 0) {
    ctx.fillStyle = '#e8908c';
    ctx.strokeStyle = '#a4504d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-s * 0.85, -s * 0.5, s * 1.7, s * 1.0, s * 0.22);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fbe7dc';
    for (let i = 0; i < 2; i += 1) ctx.fillRect(-s * 0.78, -s * 0.22 + i * s * 0.34, s * 1.56, s * 0.12);
    return;
  }
  if (stage === 1) {
    for (let i = 0; i < 3; i += 1) {
      const x = -s * 0.55 + i * s * 0.55;
      const y = (i % 2) * s * 0.2 - s * 0.1;
      ctx.fillStyle = '#e8908c';
      ctx.strokeStyle = '#a4504d';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(x - s * 0.24, y - s * 0.24, s * 0.48, s * 0.48, s * 0.08);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fbe7dc';
      ctx.fillRect(x - s * 0.22, y - s * 0.04, s * 0.44, s * 0.08);
    }
    return;
  }
  for (let i = 0; i < 3; i += 1) {
    ctx.save();
    ctx.translate(-s * 0.35 + i * s * 0.35, -s * 0.05 + (i % 2) * s * 0.12);
    ctx.rotate(-0.4 + i * 0.25);
    ctx.fillStyle = '#9b3a1f';
    ctx.strokeStyle = '#5a1f0f';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-s * 0.2, -s * 0.5, s * 0.4, s * 1.0, s * 0.12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e9b48a';
    ctx.fillRect(-s * 0.18, -s * 0.1, s * 0.36, s * 0.08);
    shine(ctx, -s * 0.06, -s * 0.3, s * 0.05, s * 0.14, 0.45);
    ctx.restore();
  }
  ctx.fillStyle = '#fff4d6';
  for (let i = 0; i < 6; i += 1) ellipse(ctx, -s * 0.5 + i * s * 0.2, -s * 0.45 + (i % 3) * s * 0.35, s * 0.05, s * 0.03, '#fff4d6');
}

function drawMushroom(ctx, stage, s) {
  if (stage === 0) {
    ctx.fillStyle = '#efe3cd';
    ctx.strokeStyle = '#9d8664';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-s * 0.2, -s * 0.05, s * 0.4, s * 0.75, s * 0.12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#8a5a3b';
    ctx.strokeStyle = '#4f311e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.08, s * 0.82, s * 0.5, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ellipse(ctx, -s * 0.3, -s * 0.32, s * 0.1, s * 0.06, '#b07b55');
    ellipse(ctx, s * 0.25, -s * 0.38, s * 0.08, s * 0.05, '#b07b55');
    return;
  }
  const flesh = stage === 1 ? '#efe0c4' : '#7a4d2e';
  const cap = stage === 1 ? '#8a5a3b' : '#3d2516';
  for (let i = 0; i < 3; i += 1) {
    ctx.save();
    ctx.translate(-s * 0.45 + i * s * 0.45, (i % 2) * s * 0.15 - s * 0.05);
    ctx.rotate(-0.2 + i * 0.2);
    ctx.fillStyle = flesh;
    ctx.strokeStyle = cap;
    ctx.lineWidth = s * 0.1;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.05, s * 0.3, s * 0.22, 0, Math.PI, 0);
    ctx.lineTo(s * 0.08, s * 0.35);
    ctx.lineTo(-s * 0.08, s * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (stage > 1) shine(ctx, -s * 0.08, -s * 0.14, s * 0.08, s * 0.04, 0.5);
    ctx.restore();
  }
}

function drawGreens(ctx, stage, s) {
  if (stage === 0) {
    for (let i = -2; i <= 2; i += 1) {
      ctx.save();
      ctx.rotate(i * 0.28);
      ctx.fillStyle = '#3f9a44';
      ctx.strokeStyle = '#21602a';
      ctx.lineWidth = 1.6;
      ellipse(ctx, 0, -s * 0.38, s * 0.3, s * 0.48, '#3f9a44', '#21602a', 1.6);
      ctx.fillStyle = '#eef5df';
      ctx.beginPath();
      ctx.roundRect(-s * 0.07, -s * 0.3, s * 0.14, s * 1.0, s * 0.06);
      ctx.fill();
      ctx.restore();
    }
    return;
  }
  const pieces = [
    [-0.45, -0.2, 0.3],
    [0.15, -0.35, -0.4],
    [0.45, 0.15, 0.9],
    [-0.15, 0.25, -1.1],
    [-0.55, 0.3, 0.5],
  ];
  for (const [px, py, rot] of pieces) {
    ctx.save();
    ctx.translate(px * s, py * s);
    ctx.rotate(rot);
    ellipse(ctx, 0, 0, s * 0.32, s * 0.2, '#4caf50', '#21602a', 1.4);
    ctx.fillStyle = '#eef5df';
    ctx.fillRect(-s * 0.3, -s * 0.03, s * 0.6, s * 0.06);
    ctx.restore();
  }
}

function drawChili(ctx, stage, s) {
  if (stage === 0) {
    ctx.save();
    ctx.rotate(0.5);
    ctx.fillStyle = '#e0301e';
    ctx.strokeStyle = '#7d140b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.7, -s * 0.15);
    ctx.quadraticCurveTo(0, -s * 0.45, s * 0.75, s * 0.25);
    ctx.quadraticCurveTo(0, s * 0.2, -s * 0.7, s * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3d8b37';
    ctx.fillRect(-s * 0.95, -s * 0.1, s * 0.3, s * 0.2);
    shine(ctx, -s * 0.15, -s * 0.15, s * 0.25, s * 0.05, 0.5);
    ctx.restore();
    return;
  }
  const rings = [
    [-0.45, -0.25],
    [0.1, -0.35],
    [0.45, 0.1],
    [-0.1, 0.25],
    [-0.55, 0.3],
  ];
  for (const [px, py] of rings) {
    ellipse(ctx, px * s, py * s, s * 0.22, s * 0.2, '#e0301e', '#7d140b', 1.4);
    ellipse(ctx, px * s, py * s, s * 0.1, s * 0.09, '#ffd9a8');
    ellipse(ctx, px * s + 1, py * s, s * 0.025, s * 0.025, '#f3b13a');
  }
}

function drawBurnt(ctx, s, time) {
  ellipse(ctx, 0, s * 0.1, s * 0.75, s * 0.55, '#2a2220', '#0d0a09');
  ellipse(ctx, -s * 0.2, 0, s * 0.18, s * 0.1, '#4a3a33');
  ctx.save();
  ctx.globalAlpha = 0.45;
  for (let i = 0; i < 3; i += 1) {
    const rise = ((time * 0.8 + i / 3) % 1) * s * 1.2;
    ellipse(ctx, Math.sin(time * 2 + i) * s * 0.2, -s * 0.4 - rise, s * 0.22, s * 0.16, '#6d6a68');
  }
  ctx.restore();
}

const DRAWERS = {
  noodles: drawNoodles,
  rice: drawRice,
  bun: drawBun,
  egg: drawEgg,
  shrimp: drawShrimp,
  pork: drawPork,
  mushroom: drawMushroom,
  greens: drawGreens,
  chili: drawChili,
};

/** Draw a food item centred at (x, y), about `size` pixels across. */
export function drawFood(ctx, food, x, y, size, time = 0) {
  ctx.save();
  ctx.translate(x, y);
  const s = size / 2;
  if (food.burnt) drawBurnt(ctx, s, time);
  else DRAWERS[food.id](ctx, food.stage, s);
  ctx.restore();
}

/** Draw the finished form of ingredient `id`. */
export function drawPart(ctx, id, x, y, size) {
  drawFood(ctx, { id, stage: INGREDIENTS[id].route.length, burnt: false }, x, y, size);
}

const BASES = ['noodles', 'rice', 'bun'];

/** Draw a plate holding `parts` (finished ingredient ids), centred at (x, y), `size` across. */
export function drawPlate(ctx, parts, x, y, size) {
  const r = size / 2;
  const base = BASES.find((id) => parts.includes(id)) ?? null;
  const toppings = parts.filter((id) => id !== base);
  ctx.save();
  ctx.translate(x, y);
  ellipse(ctx, 2, r * 0.12, r * 1.02, r * 0.95, 'rgba(0,0,0,0.25)');
  if (base === 'noodles' || base === 'rice') {
    ellipse(ctx, 0, 0, r, r * 0.92, '#f4efe6', '#8a7a66', 2);
    ctx.save();
    ctx.setLineDash([r * 0.12, r * 0.1]);
    ellipse(ctx, 0, 0, r * 0.88, r * 0.8, null, '#3a6db5', r * 0.08);
    ctx.restore();
    if (base === 'noodles') {
      const broth = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r * 0.75);
      broth.addColorStop(0, '#f2c167');
      broth.addColorStop(1, '#c97a2c');
      ellipse(ctx, 0, 0, r * 0.74, r * 0.66, broth);
      ctx.save();
      ctx.scale(0.62, 0.5);
      drawNoodles(ctx, 1, r * 0.95);
      ctx.restore();
    } else {
      ellipse(ctx, 0, 0, r * 0.74, r * 0.66, '#7a5c3a');
      ctx.save();
      ctx.scale(0.82, 0.82);
      drawRice(ctx, 1, r * 0.85);
      ctx.restore();
    }
  } else if (base === 'bun') {
    ellipse(ctx, 0, 0, r, r * 0.92, '#d6b27a', '#7b5a2c', 2);
    ctx.strokeStyle = 'rgba(123,90,44,0.5)';
    ctx.lineWidth = 1;
    for (let i = -4; i <= 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.2, -r * 0.8);
      ctx.lineTo(i * r * 0.2, r * 0.8);
      ctx.stroke();
    }
    ellipse(ctx, 0, 0, r * 0.82, r * 0.74, null, '#9a7440', 3);
    ctx.save();
    ctx.translate(0, r * 0.05);
    drawBun(ctx, 1, r * 0.6);
    ctx.restore();
  } else {
    ellipse(ctx, 0, 0, r, r * 0.92, '#fbfaf7', '#a59c8e', 2);
    ellipse(ctx, 0, 0, r * 0.72, r * 0.64, null, '#e2ddd3', 2);
  }
  const spots = toppings.length === 1 ? [[0.18, -0.1]] : toppings.length === 2 ? [[-0.3, -0.15], [0.32, 0.08]] : [[-0.34, -0.2], [0.34, -0.18], [0, 0.32]];
  toppings.forEach((id, index) => {
    const [sx, sy] = spots[index] ?? [0, 0];
    const lift = base === 'bun' ? -r * 0.15 : 0;
    drawPart(ctx, id, sx * r, sy * r + lift, r * (toppings.length === 1 ? 0.95 : 0.72));
  });
  if (base === 'noodles' || base === 'rice') {
    ctx.fillStyle = '#7fc96b';
    for (let i = 0; i < 5; i += 1) ellipse(ctx, Math.cos(i * 1.3) * r * 0.5, Math.sin(i * 1.3) * r * 0.42, r * 0.05, r * 0.035, '#7fc96b');
  }
  ctx.restore();
}
