// Composes one frame of a night: the order board, the kitchen (scaled to fill the screen between
// the board and the hint bar), the live stations, the chef, the effects and the hint bar, with
// station highlights, the stall's carved posts at each side and the pass window's plate.
import { FOOTER_HEIGHT, HUD_HEIGHT, KITCHEN_VIEW, TILE, VIEW } from '../config.js';
import { RECIPES, recipeForParts } from '../recipes.js';
import { drawPlate } from './foodArt.js';
import { drawFooter, drawOrderBoard } from './hud.js';
import { drawChef, drawHighlight, drawStations, paintKitchenLayer } from './kitchenArt.js';

/** Turn a point on the canvas into kitchen units (tiles of TILE pixels). */
export function toKitchen(x, y) {
  return { x: (x - KITCHEN_VIEW.x) / KITCHEN_VIEW.scale, y: (y - KITCHEN_VIEW.y) / KITCHEN_VIEW.scale };
}

function drawPost(ctx, x, width, time, flip) {
  const top = HUD_HEIGHT;
  const height = VIEW.height - HUD_HEIGHT - FOOTER_HEIGHT;
  const wood = ctx.createLinearGradient(x, 0, x + width, 0);
  wood.addColorStop(0, '#3b1d14');
  wood.addColorStop(0.5, '#6e3420');
  wood.addColorStop(1, '#3b1d14');
  ctx.fillStyle = wood;
  ctx.fillRect(x, top, width, height);
  ctx.fillStyle = '#b8862f';
  for (let i = 0; i < 4; i += 1) ctx.fillRect(x, top + 40 + i * 140, width, 5);
  const banner = top + 70;
  ctx.fillStyle = '#c8372d';
  ctx.beginPath();
  ctx.moveTo(x + 5, banner);
  ctx.lineTo(x + width - 5, banner);
  ctx.lineTo(x + width - 5, banner + 300);
  ctx.lineTo(x + width / 2, banner + 286);
  ctx.lineTo(x + 5, banner + 300);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd36b';
  ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const word = flip ? 'KITCHEN' : 'LANTERN';
  for (let i = 0; i < word.length; i += 1) ctx.fillText(word[i], x + width / 2, banner + 26 + i * 36);
  const glow = 0.5 + 0.2 * Math.sin(time * 2 + (flip ? 1 : 0));
  const lanternY = top + height - 70;
  const halo = ctx.createRadialGradient(x + width / 2, lanternY, 2, x + width / 2, lanternY, 40);
  halo.addColorStop(0, `rgba(255,170,80,${glow})`);
  halo.addColorStop(1, 'rgba(255,170,80,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(x - 20, lanternY - 40, width + 40, 80);
  ctx.fillStyle = '#ff6b4a';
  ctx.beginPath();
  ctx.ellipse(x + width / 2, lanternY, 12, 15, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** A gold "ready" tag over a plate that some ticket on the board is waiting for. */
function drawReadyTag(ctx, x, y, time) {
  const lift = Math.sin(time * 5) * 2;
  ctx.fillStyle = '#ffd36b';
  ctx.strokeStyle = '#7a4a12';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 26, y - 11 + lift, 52, 20, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#5a2e0c';
  ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('READY', x, y + lift);
}

function isWanted(night, plate) {
  if (plate === null || plate.kind !== 'plate') return false;
  const recipe = recipeForParts(plate.parts, night.shift.menu);
  return recipe !== null && RECIPES[recipe] && night.orders.tickets.some((ticket) => ticket.recipe === recipe);
}

export class NightView {
  constructor() {
    this.layer = null;
  }

  draw(ctx, night, effects, time, hoverCell) {
    if (this.layer === null) this.layer = paintKitchenLayer(night.kitchen);
    ctx.fillStyle = '#17122b';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    drawPost(ctx, 0, KITCHEN_VIEW.x, time, false);
    drawPost(ctx, VIEW.width - KITCHEN_VIEW.x, KITCHEN_VIEW.x, time, true);

    const shake = effects.shake;
    const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    const sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    const width = night.kitchen.cols * TILE;
    const height = night.kitchen.rows * TILE;

    ctx.save();
    ctx.translate(KITCHEN_VIEW.x + sx, KITCHEN_VIEW.y + sy);
    ctx.scale(KITCHEN_VIEW.scale, KITCHEN_VIEW.scale);
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.clip();
    ctx.drawImage(this.layer, 0, 0);
    const chef = night.chef;
    const choppingAt = chef.chopping ? chef.chopAt ?? chef.facingCell(night.kitchen) : null;
    drawStations(ctx, night.kitchen, time, choppingAt);
    if (hoverCell !== null && hoverCell.type !== 'floor') drawHighlight(ctx, hoverCell, false, time);
    const facing = night.chef.facingCell(night.kitchen);
    if (facing !== null) drawHighlight(ctx, facing, true, time);
    if (night.chef.errand !== null) drawHighlight(ctx, night.chef.errand.target, false, time);
    this.drawPassWindow(ctx, night);
    drawChef(ctx, night.chef, time);
    for (const cell of night.kitchen.stations) {
      if (isWanted(night, cell.item)) drawReadyTag(ctx, cell.col * TILE + 40, cell.row * TILE + 4, time);
    }
    if (isWanted(night, night.chef.held)) drawReadyTag(ctx, night.chef.x, night.chef.y - 72, time);
    effects.draw(ctx);
    // Warm light from the lanterns, a little cooler at the floor.
    const light = ctx.createLinearGradient(0, 0, 0, height);
    light.addColorStop(0, 'rgba(255,190,110,0.10)');
    light.addColorStop(1, 'rgba(40,20,60,0.16)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, width, height);
    if (effects.flash > 0) {
      ctx.fillStyle = `rgba(255,220,140,${effects.flash * 0.18})`;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();

    drawOrderBoard(ctx, night, time);
    drawFooter(ctx, night);
  }

  /** The plate just served slides out through the pass with its price. */
  drawPassWindow(ctx, night) {
    const show = night.passShow;
    if (show === null) return;
    const share = 1 - show.time / 1.4;
    const x = show.cell.col * TILE + 40;
    const y = show.cell.row * TILE + 30 - share * 26;
    ctx.globalAlpha = Math.min(1, (1 - share) * 3);
    drawPlate(ctx, show.parts, x, y, 52);
    ctx.globalAlpha = 1;
  }
}
