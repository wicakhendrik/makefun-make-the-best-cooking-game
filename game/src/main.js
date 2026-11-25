// Lantern Alley Kitchen: boots the canvas, runs the fixed-step loop and moves between the
// screens (title with a demo kitchen behind it, a night of service, pause, results). With
// ?shot=<scene> it plays that screenshot scene instead and draws one still frame.
import { AutoChef } from './autochef.js';
import { HUD_HEIGHT, STEP, VIEW } from './config.js';
import { Input } from './input.js';
import { Night } from './night.js';
import { Sound } from './audio.js';
import { Effects } from './render/effects.js';
import { drawKitchenGuide } from './render/guide.js';
import { NightView, toKitchen } from './render/view.js';
import { drawCountIn, drawPause, drawResults, drawRushBanner, drawTitle, titleCards } from './render/screens.js';
import { stageShot } from './shots.js';

const BEST_KEY = 'lantern-alley-kitchen-best';

function loadBest() {
  try {
    const saved = JSON.parse(localStorage.getItem(BEST_KEY) ?? '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveBest(best) {
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(best));
  } catch {
    // Private windows may refuse storage; the stars simply are not remembered.
  }
}

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input(canvas);
    this.sound = new Sound();
    this.effects = new Effects();
    this.view = new NightView();
    this.best = loadBest();
    this.time = 0;
    this.screen = 'title';
    this.night = null;
    this.demo = null;
    this.demoChef = null;
    this.rushBanner = 0;
    /** The kitchen guide's callouts, toggled with G (and shown for a first Opening Night's start). */
    this.guide = false;
    this.sawRush = false;
    this.resultsSince = 0;
    this.lastTick = -1;
    this.input.onGesture(() => this.sound.unlock());
    this.startDemo();
  }

  startDemo() {
    this.demo = new Night(1, 7 + Math.floor(this.time));
    this.demo.countIn = 0.01;
    this.demoChef = new AutoChef(this.demo);
  }

  startNight(index) {
    this.night = new Night(index, (Date.now() & 0xffff) + index);
    this.effects.clear();
    this.screen = 'play';
    this.rushBanner = 0;
    this.sawRush = false;
    this.lastTick = -1;
  }

  update(dt) {
    this.time += dt;
    const input = this.input;
    if (input.wasPressed('KeyM')) this.sound.toggleMute();
    if (this.screen === 'title') this.updateTitle(dt);
    else if (this.screen === 'play') this.updatePlay(dt);
    else if (this.screen === 'paused') {
      input.takeClicks();
      if (input.wasPressed('Escape', 'KeyP')) this.screen = 'play';
      else if (input.wasPressed('KeyQ')) this.screen = 'title';
    } else if (this.screen === 'results') {
      this.resultsSince += dt;
      this.effects.update(dt);
      const clicked = input.takeClicks().length > 0 && this.resultsSince > 1;
      if (input.wasPressed('Enter', 'Space') || clicked) this.startNight(this.night.shiftIndex);
      else if (input.wasPressed('KeyN') && this.night.shiftIndex < 2) this.startNight(this.night.shiftIndex + 1);
      else if (input.wasPressed('Escape')) this.screen = 'title';
    }
    this.sound.updateMusic(this.screen === 'play' && this.night.phase === 'open', this.screen === 'play' && this.night.rush);
    input.endStep();
  }

  updateTitle(dt) {
    const input = this.input;
    const idle = { axis: { x: 0, y: 0 }, use: false, chop: false };
    this.demo.step(dt, idle);
    this.demo.drainEvents();
    this.demoChef.update(dt);
    if (this.demo.phase === 'closed') this.startDemo();
    for (const [index, code] of ['Digit1', 'Digit2', 'Digit3'].entries()) {
      if (input.wasPressed(code, `Numpad${index + 1}`)) this.startNight(index);
    }
    if (this.screen === 'title' && input.wasPressed('Enter', 'Space')) this.startNight(0);
    for (const click of input.takeClicks()) {
      const card = titleCards().find((c) => click.x >= c.x && click.x <= c.x + c.w && click.y >= c.y && click.y <= c.y + c.h);
      if (card) this.startNight(card.index);
    }
    sizzleFor(this.sound, null);
  }

  updatePlay(dt) {
    const input = this.input;
    const night = this.night;
    if (input.wasPressed('KeyG')) this.guide = !this.guide;
    if (input.wasPressed('Escape', 'KeyP')) {
      this.screen = 'paused';
      sizzleFor(this.sound, null);
      return;
    }
    for (const click of input.takeClicks()) {
      if (click.y < HUD_HEIGHT) continue;
      const point = toKitchen(click.x, click.y);
      const cell = night.kitchen.cellAtPixel(point.x, point.y);
      if (cell !== null) night.clickStation(cell);
    }
    night.step(dt, {
      axis: input.axis(),
      use: input.wasPressed('Space', 'KeyE', 'Enter'),
      chop: input.isHeld('KeyF', 'KeyJ'),
    });
    for (const event of night.drainEvents()) {
      this.effects.handle(event);
      this.sound.play(event.type === 'nothing' ? null : event.type);
      if (event.type === 'closed') this.finishNight();
    }
    this.effects.ambient(dt, night.kitchen);
    this.effects.update(dt);
    sizzleFor(this.sound, night.kitchen);
    if (night.rush && !this.sawRush) {
      this.sawRush = true;
      this.rushBanner = 2.6;
    }
    this.rushBanner = Math.max(0, this.rushBanner - dt);
    const left = Math.ceil(night.timeLeft);
    if (night.phase === 'open' && left <= 10 && left !== this.lastTick) {
      this.lastTick = left;
      this.sound.play('tick');
    }
  }

  finishNight() {
    const night = this.night;
    const stars = night.orders.stars();
    this.best[night.shiftIndex] = Math.max(this.best[night.shiftIndex] ?? 0, stars);
    saveBest(this.best);
    this.screen = 'results';
    this.resultsSince = 0;
    sizzleFor(this.sound, null);
  }

  hoverCell(night) {
    const mouse = this.input.mouse;
    if (!mouse.inside || mouse.y < HUD_HEIGHT) return null;
    const point = toKitchen(mouse.x, mouse.y);
    return night.kitchen.cellAtPixel(point.x, point.y);
  }

  hoverCard() {
    const mouse = this.input.mouse;
    if (!mouse.inside) return null;
    const card = titleCards().find((c) => mouse.x >= c.x && mouse.x <= c.x + c.w && mouse.y >= c.y && mouse.y <= c.y + c.h);
    return card ? card.index : null;
  }

  render() {
    const ctx = this.ctx;
    if (this.screen === 'title') {
      this.view.draw(ctx, this.demo, this.effects, this.time, null);
      drawTitle(ctx, this.time, this.best, this.hoverCard());
      return;
    }
    const night = this.night;
    this.view.draw(ctx, night, this.effects, this.time, this.screen === 'play' ? this.hoverCell(night) : null);
    if (this.screen === 'play' && night.phase === 'open' && this.showsGuide(night)) drawKitchenGuide(ctx, night);
    if (night.phase === 'count-in') drawCountIn(ctx, night);
    if (this.rushBanner > 0) drawRushBanner(ctx, 1 - this.rushBanner / 2.6);
    if (this.screen === 'paused') drawPause(ctx);
    if (this.screen === 'results') drawResults(ctx, night, this.time, this.resultsSince);
  }

  /** The guide is on when toggled, and for the first seconds of a cook's first Opening Night. */
  showsGuide(night) {
    return this.guide || (night.shiftIndex === 0 && !this.best[0] && night.elapsed < 16);
  }

  run() {
    let last = performance.now();
    let pending = 0;
    const frame = (now) => {
      pending += Math.min(0.1, (now - last) / 1000);
      last = now;
      while (pending >= STEP) {
        this.update(STEP);
        pending -= STEP;
      }
      this.render();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  /** Draw one still of a screenshot scene (see shots.js). */
  shoot(name, seed, guide = false) {
    this.guide = guide;
    const staged = stageShot(name, seed, this.effects);
    this.time = staged.night.elapsed;
    if (staged.screen === 'title') {
      this.demo = staged.night;
      this.screen = 'title';
    } else {
      this.night = staged.night;
      this.screen = staged.screen;
      this.resultsSince = 3;
      // A still taken just after the rush begins shows its banner, as play would at that moment.
      const sinceRush = staged.night.elapsed - staged.night.shift.length * 0.6;
      if (staged.night.rush && sinceRush < 2.6) {
        this.sawRush = true;
        this.rushBanner = 2.6 - sinceRush;
      }
    }
    this.render();
  }
}

function sizzleFor(sound, kitchen) {
  if (kitchen === null) {
    sound.setSizzle(0);
    return;
  }
  const busy = kitchen.ofType('wok').filter((cell) => cell.item !== null && !cell.item.burnt).length;
  sound.setSizzle(busy);
}

const canvas = document.getElementById('game');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const game = new Game(canvas);
const params = new URLSearchParams(location.search);
if (params.has('shot')) {
  game.shoot(params.get('shot'), Number(params.get('seed') ?? 1), params.get('guide') === '1');
  document.body.dataset.shot = 'ready';
} else {
  game.run();
}
