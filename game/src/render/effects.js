// Short-lived flourishes that answer the player at once: chop bits, wok sparks, pot steam, smoke,
// floating coin pops, a flash at the pass and a little screen shake. Driven by the night's events.
import { TILE } from '../config.js';

const MAX_PARTICLES = 400;

export class Effects {
  constructor() {
    this.particles = [];
    this.floaters = [];
    this.shake = 0;
    this.flash = 0;
    this.steamClock = 0;
  }

  clear() {
    this.particles = [];
    this.floaters = [];
    this.shake = 0;
    this.flash = 0;
  }

  burst(x, y, count, style) {
    for (let i = 0; i < count && this.particles.length < MAX_PARTICLES; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = style.speed * (0.4 + Math.random() * 0.8);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - style.lift,
        life: style.life * (0.6 + Math.random() * 0.6),
        age: 0,
        size: style.size * (0.6 + Math.random() * 0.8),
        color: style.colors[i % style.colors.length],
        gravity: style.gravity,
        fade: style.fade ?? false,
      });
    }
  }

  float(x, y, text, color, big = false) {
    this.floaters.push({ x, y, text, color, age: 0, life: 1.3, big });
  }

  /** Turn one of the night's events into a flourish. */
  handle(event) {
    const cell = event.cell;
    const cx = cell ? cell.col * TILE + 40 : 0;
    const cy = cell ? cell.row * TILE + 32 : 0;
    switch (event.type) {
      case 'knife':
        this.burst(cx, cy, 5, { speed: 90, lift: 40, life: 0.45, size: 4, gravity: 260, colors: ['#5fbf5a', '#f3e9d2', '#e0301e', '#e8908c'] });
        this.shake = Math.max(this.shake, 1.5);
        break;
      case 'chopped':
        this.burst(cx, cy, 12, { speed: 120, lift: 60, life: 0.5, size: 3, gravity: 200, colors: ['#ffe9a8', '#ffffff'] });
        this.float(cx, cy - 20, 'Chopped!', '#ffe9a8');
        break;
      case 'cooked':
        this.burst(cx, cy, 14, { speed: 50, lift: 70, life: 0.9, size: 7, gravity: -30, colors: ['rgba(255,255,255,0.7)'], fade: true });
        this.float(cx, cy - 24, 'Ready!', '#9df08f');
        break;
      case 'warn':
        this.float(cx, cy - 36, 'Hurry!', '#ffb36b');
        break;
      case 'burnt':
        this.burst(cx, cy, 20, { speed: 40, lift: 60, life: 1.4, size: 10, gravity: -20, colors: ['rgba(60,55,52,0.8)', 'rgba(90,86,82,0.7)'], fade: true });
        this.float(cx, cy - 30, 'Burnt!', '#ff6a5a');
        this.shake = Math.max(this.shake, 5);
        break;
      case 'plated':
        this.burst(cx, cy, 8, { speed: 80, lift: 30, life: 0.4, size: 3, gravity: 0, colors: ['#fff3c4', '#ffd36b'] });
        break;
      case 'drop-in':
        this.burst(cx, cy, 10, { speed: 70, lift: 50, life: 0.5, size: 3, gravity: 240, colors: ['#bfe4ff', '#ffffff'] });
        break;
      case 'trash':
        this.burst(cx, cy, 8, { speed: 60, lift: 20, life: 0.4, size: 4, gravity: 200, colors: ['#8b939a', '#55606a'] });
        break;
      case 'refused':
        this.float(cx, cy - 26, 'No one ordered that', '#ff8a7a');
        this.shake = Math.max(this.shake, 6);
        break;
      case 'served':
        this.flash = 1;
        this.burst(cx, cy, 26, { speed: 200, lift: 80, life: 0.8, size: 4, gravity: 260, colors: ['#ffd36b', '#ff7f45', '#9df08f', '#7ad3ff'] });
        this.float(cx - 30, cy - 24, `+${event.earned}`, '#ffd36b', true);
        if (event.bonus > 0) this.float(cx - 30, cy + 4, `streak x${event.bonus + 1}`, '#9df08f');
        if (event.vip) this.float(cx - 30, cy + 30, 'VIP paid double!', '#ffe9a6');
        break;
      case 'missed':
        this.shake = Math.max(this.shake, 7);
        break;
      default:
        break;
    }
  }

  /** Steam over boiling pots and sparks over a busy wok, a few each step. */
  ambient(dt, kitchen) {
    this.steamClock += dt;
    if (this.steamClock < 0.08) return;
    this.steamClock = 0;
    for (const cell of kitchen.stations) {
      if (cell.item === null || cell.item.burnt) continue;
      const x = cell.col * TILE + 40;
      const y = cell.row * TILE + 30;
      if (cell.type === 'pot') this.burst(x + (Math.random() - 0.5) * 30, y, 1, { speed: 8, lift: 45, life: 1.2, size: 8, gravity: -10, colors: ['rgba(255,255,255,0.35)'], fade: true });
      if (cell.type === 'wok') this.burst(x, y, 1, { speed: 90, lift: 60, life: 0.4, size: 2.5, gravity: 220, colors: ['#ffcf5a', '#ff8a2a'] });
    }
  }

  update(dt) {
    for (const particle of this.particles) {
      particle.age += dt;
      particle.vy += particle.gravity * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
    }
    this.particles = this.particles.filter((particle) => particle.age < particle.life);
    for (const floater of this.floaters) floater.age += dt;
    this.floaters = this.floaters.filter((floater) => floater.age < floater.life);
    this.shake = Math.max(0, this.shake - dt * 30);
    this.flash = Math.max(0, this.flash - dt * 2.5);
  }

  draw(ctx) {
    for (const particle of this.particles) {
      const share = particle.age / particle.life;
      ctx.globalAlpha = particle.fade ? 1 - share : Math.min(1, (1 - share) * 2);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * (particle.fade ? 1 + share : 1), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const floater of this.floaters) {
      const share = floater.age / floater.life;
      ctx.globalAlpha = 1 - share * share;
      ctx.font = `bold ${floater.big ? 30 : 17}px "Trebuchet MS", sans-serif`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(30,18,12,0.85)';
      const y = floater.y - share * 40;
      ctx.strokeText(floater.text, floater.x, y);
      ctx.fillStyle = floater.color;
      ctx.fillText(floater.text, floater.x, y);
    }
    ctx.globalAlpha = 1;
  }
}
