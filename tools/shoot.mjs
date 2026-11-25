// Takes the entry's screenshots: serves game/, opens each scene of shots.json (game/index.html?shot=…)
// in headless Chrome through the DevTools protocol, waits for the game to draw its still frame and
// saves it as a 1280x720 JPEG in screenshots/. Node 22+ (it uses the built-in fetch and WebSocket).
//   node tools/shoot.mjs [--out screenshots] [--only <name>]
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const outDir = join(root, option('--out', 'screenshots'));
const only = option('--only', null);
const shots = JSON.parse(readFileSync(join(root, 'shots.json'), 'utf8')).filter((shot) => only === null || shot.name.startsWith(only));
const SERVE_PORT = 8191;
const DEBUG_PORT = 9231;
const MAX_BYTES = 256 * 1024;

const CHROME_PATHS = [
  process.env.CHROME,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(check, what, tries = 100) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const value = await check();
      if (value) return value;
    } catch {
      // not up yet
    }
    await pause(100);
  }
  throw new Error(`timed out waiting for ${what}`);
}

class DevTools {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      const waiter = this.pending.get(message.id);
      if (!waiter) return;
      this.pending.delete(message.id);
      if (message.error) waiter.reject(new Error(message.error.message));
      else waiter.resolve(message.result);
    });
  }

  open() {
    return new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true });
      this.socket.addEventListener('error', reject, { once: true });
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
}

const chromePath = CHROME_PATHS.find((path) => existsSync(path));
if (!chromePath) throw new Error('no Chrome found: set CHROME to its executable');
mkdirSync(outDir, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), 'lantern-shoot-'));
const server = spawn(process.execPath, [join(root, 'serve.ts'), '--port', String(SERVE_PORT)], { stdio: 'ignore' });
const chrome = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${profile}`,
  '--window-size=1280,720',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--mute-audio',
  'about:blank',
], { stdio: 'ignore' });

try {
  await waitFor(() => fetch(`http://127.0.0.1:${SERVE_PORT}/index.html`).then((r) => r.ok), 'the game server');
  const target = await waitFor(async () => {
    const list = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`).then((r) => r.json());
    return list.find((entry) => entry.type === 'page');
  }, 'Chrome');
  const tools = new DevTools(target.webSocketDebuggerUrl);
  await tools.open();
  await tools.send('Page.enable');
  await tools.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  for (const shot of shots) {
    await tools.send('Page.navigate', { url: `http://127.0.0.1:${SERVE_PORT}/index.html${shot.query}` });
    await waitFor(async () => {
      const result = await tools.send('Runtime.evaluate', { expression: 'document.body && document.body.dataset.shot' });
      return result.result.value === 'ready';
    }, `scene ${shot.name}`, 600);
    await pause(150);
    let quality = 88;
    let bytes;
    do {
      const picture = await tools.send('Page.captureScreenshot', { format: 'jpeg', quality, clip: { x: 0, y: 0, width: 1280, height: 720, scale: 1 } });
      bytes = Buffer.from(picture.data, 'base64');
      quality -= 6;
    } while (bytes.length > MAX_BYTES && quality > 40);
    writeFileSync(join(outDir, shot.name), bytes);
    console.log(`${shot.name}: ${Math.round(bytes.length / 1024)} KiB at quality ${quality + 6}`);
  }
  tools.socket.close();
} finally {
  chrome.kill();
  server.kill();
  await pause(300);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    // Chrome may still hold its profile for a moment; the temp folder is left behind.
  }
}
