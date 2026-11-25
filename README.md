# Lantern Alley Kitchen

A night-market cooking game for desktop browsers, played with keyboard and mouse. Run a tiny street
kitchen under the lanterns: take raw food from the crates, cut it on a board, boil it in a stock pot
or sear it in a wok, gather the finished parts on a plate and serve it at the pass before the
ticket's patience runs out.

- **Three nights**: Opening Night (2 dishes), Festival Crowd (4 dishes) and Lantern Rush (all 7).
- **Seven dishes from nine ingredients**: Harbor Noodles, Lantern Pork Bun, Forest Rice,
  Firecracker Noodles, Garden Bun, Ember Rice and Midnight Ramen. Each ingredient has its own route
  (pork belly is cut and then seared; noodles only boil), so every ticket is a small route to plan.
- **Pressure that grows without chores**: tickets come faster and wait less as the night goes on,
  finished food burns if it is left in the pot, and the lantern rush takes the last 40% of the night.
- **Tips and streaks**: a fast serve earns a tip, and an unbroken streak adds a bonus.
- Everything (art, sounds and music) is drawn or synthesized in code. Nothing is loaded from the
  network.

## Controls

| Action | Keyboard | Mouse |
| --- | --- | --- |
| Walk | WASD or arrow keys | click a station and the chef walks there |
| Take / put down / plate / serve | Space or E (at the station you face) | click the station |
| Chop | hold F (or J) at a board | click a board with food on it |
| Pause, sound | Esc or P, M | |

## Run it

```sh
node serve.ts            # then open http://localhost:8080 in desktop Chrome
```

`game/` is plain static files with no build step: `game/index.html` and its ES modules.

## Layout

- `game/src/`: the game. `night.js` steps one night; `kitchen.js` holds the station rules,
  `chef.js` movement and click-to-walk paths, `orders.js` the order board, `recipes.js` the menu,
  `autochef.js` the demo chef behind the title screen, and `render/` the drawing.
- `main.ts`: hands the entry in (copies `game/` and `screenshots/` and writes `dossier.json`).
- `tools/simulate.mjs` plays every night headless with the demo chef, to check the pacing.
- `tools/shoot.mjs` takes `screenshots/` with headless Chrome from the scenes in `shots.json`.

MIT licensed.
