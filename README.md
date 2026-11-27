# turkeyrun-entry

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/goperek48/turkeyrun-entry/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/goperek48/turkeyrun-entry/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

**Turkey Run: The Great Escape** — a complete, original 2D turkey escape game for make.fun's
"Make the best turkey escape game" bounty ($250, top 20 share the pot). Thanksgiving is coming
and the farmer is coming faster: run 1500m across the farmyard to the safety of the woods,
dodging fences, hay bales, hot ovens and falling carving knives, grabbing corn (+25), pie
slices (+100) and golden feathers (+1 life) on the way. Stumble and the farmer gains ground;
let him catch you — or run out of lives — and you are Thanksgiving dinner.

## How it plays

- **SPACE / ↑ / click** — jump (jump again mid-air for a double jump)
- **↓** — slide under low things and through mud puddles
- **→** — sprint (puts distance between you and the farmer)
- **←** — slow down (to time a jump)
- **P** pause · **M** sound on/off · **R** restart

The HUD shows score, distance run and metres left to the woods, lives (hearts), a farmer
proximity meter, and an escape-progress bar. The sky shifts dawn → noon → dusk as the run
goes on, the speed ramps up, and the farm gets meaner with distance. Title screen, live run,
and caught/escaped end screens with restart. All art is drawn in code on canvas and all
sound is synthesised with WebAudio — no assets, no network requests, nothing to download.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or hand it in exactly as the grader does:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, stdlib only) copies `game/` and `screenshots/` to the output directory
and writes `dossier.json` with the vendored make.fun library. Screenshots are real renders
of the game's own code: `shots.json` lists the four staged states (`?shot=start|play|caught|escaped`),
rendered deterministically from a fixed seed.
