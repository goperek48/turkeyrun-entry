// Turkey Run: The Great Escape — a make.fun turkey-run-game-01 entry (Node 22+, stdlib only).
//
// The game lives in game/ as plain static files (game/index.html + ES modules, no library,
// no network request) and this program hands it in: it copies game/ and screenshots/ from
// beside this file to /output and writes /output/dossier.json, the summary the judge reads,
// with the vendored make.fun library (vendor/makefun-game.ts, copied from the kit unchanged).
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const gameIndex = join(here, 'game', 'index.html');
if (!existsSync(gameIndex)) throw new Error('game/index.html is missing — the game was not built');

// The game must play offline from static files: no network request of any kind.
// Refuse to hand in a game that reaches outside its own folder.
function assertOffline(dir) {
  const offenders = [];
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (/\.(html|js|mjs|css|json)$/i.test(entry.name)) {
        const text = readFileSync(p, 'utf8');
        const hits = text.match(/https?:\/\/[^'"\s)]+|(?<![\w:])\/\/[a-z0-9][^'"\s)]*|\bfetch\s*\(|\bWebSocket\s*\(|\bimportScripts\s*\(/g);
        if (hits) offenders.push(`${p.replace(here, '')}: ${[...new Set(hits)].join(', ')}`);
      }
    }
  };
  walk(dir);
  if (offenders.length > 0) {
    throw new Error(`game/ must not make network requests, but found:\n${offenders.join('\n')}`);
  }
}
assertOffline(join(here, 'game'));

const shots = existsSync(join(here, 'screenshots'))
  ? readdirSync(join(here, 'screenshots')).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort()
  : [];
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shots.length}`);
}
for (const shot of shots) {
  const bytes = statSync(join(here, 'screenshots', shot)).size;
  if (bytes > 262144) throw new Error(`screenshot ${shot} is ${bytes} bytes, over the 256 KiB cap`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others
// refuse an entry the scorer would refuse (more than 4 screenshots or one over 256 KiB; more than
// 993 files in game/ or 48 MiB of game files, in all, or a path under game/ over 1000 bytes:
// game/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log(`Turkey Run handed in: ${shots.length} screenshots (${shots.join(', ')})`);
