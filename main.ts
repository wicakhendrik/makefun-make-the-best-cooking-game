// Hands in Lantern Alley Kitchen (Node 22, standard library only). The game is game/, plain static
// files a desktop browser plays offline; this program copies game/ and screenshots/ into the output
// directory and writes dossier.json, the judge's view of the entry, with the kit's own library.
//
// Run it locally with:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Play it locally with: node serve.ts   (then open http://localhost:8080)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const output = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(output, { recursive: true });
cpSync(join(root, 'game'), join(output, 'game'), { recursive: true });
mkdirSync(join(output, 'screenshots'), { recursive: true });
if (existsSync(join(root, 'screenshots'))) {
  cpSync(join(root, 'screenshots'), join(output, 'screenshots'), { recursive: true });
}

// The gate's caps: the dossier text is held to 160 KiB, at most four screenshots of 256 KiB each,
// and game/ to 993 entries and 48 MiB with paths of at most 1000 bytes.
const dossier = buildDossier(output, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(output, 'dossier.json'), dossier);
