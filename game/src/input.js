// Keyboard and mouse, read once per step: held keys, keys pressed since the last step, and mouse
// clicks and hover mapped from the window to the canvas's own 1280x720 pixels.
import { VIEW } from './config.js';

const BLOCKED = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.held = new Set();
    this.pressed = new Set();
    this.clicks = [];
    this.mouse = { x: -1, y: -1, inside: false };
    this.gestureListeners = [];
    window.addEventListener('keydown', (event) => {
      if (BLOCKED.has(event.code)) event.preventDefault();
      if (!event.repeat) this.pressed.add(event.code);
      this.held.add(event.code);
      this.gesture();
    });
    window.addEventListener('keyup', (event) => this.held.delete(event.code));
    window.addEventListener('blur', () => this.held.clear());
    canvas.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return;
      const point = this.toCanvas(event);
      this.clicks.push(point);
      this.gesture();
    });
    canvas.addEventListener('mousemove', (event) => {
      const point = this.toCanvas(event);
      this.mouse = { x: point.x, y: point.y, inside: true };
    });
    canvas.addEventListener('mouseleave', () => {
      this.mouse.inside = false;
    });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  /** Call `listener` on the first key or click (browsers start audio only after one). */
  onGesture(listener) {
    this.gestureListeners.push(listener);
  }

  gesture() {
    for (const listener of this.gestureListeners) listener();
  }

  toCanvas(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEW.width,
      y: ((event.clientY - rect.top) / rect.height) * VIEW.height,
    };
  }

  isHeld(...codes) {
    return codes.some((code) => this.held.has(code));
  }

  wasPressed(...codes) {
    return codes.some((code) => this.pressed.has(code));
  }

  /** The walking direction from WASD or the arrow keys. */
  axis() {
    const x = (this.isHeld('KeyD', 'ArrowRight') ? 1 : 0) - (this.isHeld('KeyA', 'ArrowLeft') ? 1 : 0);
    const y = (this.isHeld('KeyS', 'ArrowDown') ? 1 : 0) - (this.isHeld('KeyW', 'ArrowUp') ? 1 : 0);
    return { x, y };
  }

  takeClicks() {
    const clicks = this.clicks;
    this.clicks = [];
    return clicks;
  }

  endStep() {
    this.pressed.clear();
  }
}
