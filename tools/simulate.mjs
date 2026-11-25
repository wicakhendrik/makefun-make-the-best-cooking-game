// Plays each night headless with the demo chef and prints what it served, missed and earned, so a
// change to the rules or the pacing can be checked without a browser: node tools/simulate.mjs [seed]
import { AutoChef } from '../game/src/autochef.js';
import { STEP } from '../game/src/config.js';
import { Night } from '../game/src/night.js';

const seed = Number(process.argv[2] ?? 1);
for (let shift = 0; shift < 3; shift += 1) {
  const night = new Night(shift, seed);
  const chef = new AutoChef(night);
  const idle = { axis: { x: 0, y: 0 }, use: false, chop: false };
  const tally = new Map();
  let steps = 0;
  let waiting = 0;
  const servedAt = [];
  while (night.phase !== 'closed' && steps < 60 * 400) {
    night.step(STEP, idle);
    for (const event of night.drainEvents()) {
      tally.set(event.type, (tally.get(event.type) ?? 0) + 1);
      if (event.type === 'served') servedAt.push(Math.round(night.elapsed));
    }
    if (night.chef.idle) waiting += 1;
    chef.update(STEP);
    steps += 1;
  }
  const orders = night.orders;
  console.log(
    `night ${shift + 1} (${night.shift.title}): served ${orders.served}, missed ${orders.missed}, coins ${orders.coins}, stars ${orders.stars()}, best streak ${orders.bestStreak}, chef idle ${Math.round((waiting / steps) * 100)}%`,
  );
  console.log('  served at', servedAt.join(' '), '| events', JSON.stringify(Object.fromEntries([...tally.entries()].sort())));
}
