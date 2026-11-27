// World: the run itself. The turkey auto-runs to the right while the farm scrolls past;
// obstacles spawn ahead, pickups hang in the air, and the farmer gains ground every time
// the turkey stumbles or dawdles. All positions are world-x (px); the camera follows the
// turkey, which sits at a fixed screen x.
import { CFG } from './config.js';
import { mulberry32, pick, range } from './random.js';

const TURKEY_X = 210; // screen x of the turkey (world scrolls under it)
const TURKEY_W = 46;
const TURKEY_H = 52;
const TURKEY_H_SLIDE = 30;

export const OBSTACLE_KINDS = ['fence', 'hay', 'oven', 'knife', 'puddle', 'scarecrow'];

export function newRun(seed) {
  return {
    seed,
    rng: mulberry32(seed),
    state: 'title', // title | play | caught | escaped | paused
    frame: 0,
    time: 0,
    distanceM: 0,
    score: 0,
    lives: CFG.LIVES,
    speed: CFG.BASE_SPEED,
    worldX: 0, // px scrolled so far
    turkey: {
      y: CFG.GROUND_Y - TURKEY_H, vy: 0, jumps: 0,
      sliding: 0, slideCd: 0, invincible: 0, stumble: 0,
    },
    farmerGap: CFG.FARMER_START_GAP, // px behind the turkey
    farmerAnim: 0,
    obstacles: [], // {kind, x, y, w, h, ...}
    pickups: [], // {kind, x, y, taken}
    particles: [], // {x, y, vx, vy, life, colour, size}
    floaters: [], // {x, y, text, life, colour}
    nextSpawnX: 900,
    events: [], // one-frame sound/event flags the main loop drains: 'jump','jump2','slide','corn','feather','pie','stumble','gobble','heartbeat','win','lose'
    best: 0,
    endReason: '',
    shake: 0,
  };
}

export function turkeyBox(run) {
  const t = run.turkey;
  const h = t.sliding > 0 ? TURKEY_H_SLIDE : TURKEY_H;
  return { x: TURKEY_X, y: t.y + (TURKEY_H - h), w: TURKEY_W, h };
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function spawnGroup(run) {
  const rng = run.rng;
  const x = run.nextSpawnX;
  const d = run.distanceM;
  const roll = rng();
  // The farm gets meaner the further the turkey gets.
  const kinds = d < 120 ? ['fence', 'hay', 'puddle']
    : d < 400 ? ['fence', 'hay', 'oven', 'puddle', 'knife']
    : OBSTACLE_KINDS;
  const kind = pick(rng, kinds);
  const G = CFG.GROUND_Y;

  if (kind === 'fence') {
    run.obstacles.push({ kind, x, y: G - 46, w: 14, h: 46 });
    if (rng() < 0.35) run.pickups.push({ kind: 'corn', x: x + 4, y: G - 108, taken: false });
  } else if (kind === 'hay') {
    run.obstacles.push({ kind, x, y: G - 44, w: 52, h: 44 });
    if (rng() < 0.4) run.pickups.push({ kind: 'corn', x: x + 16, y: G - 104, taken: false });
  } else if (kind === 'oven') {
    // A hot oven: tall, wide, and it hurts. Jump it clean or slide under its open door gap.
    run.obstacles.push({ kind, x, y: G - 78, w: 64, h: 78, hot: true });
  } else if (kind === 'knife') {
    // A carving knife drops from the sky where the turkey is about to be.
    const dropX = x + range(rng, 60, 200);
    run.obstacles.push({ kind, x: dropX, y: -90, w: 12, h: 58, vy: 0, falling: true, stuck: false });
    if (rng() < 0.3) run.pickups.push({ kind: 'corn', x: x - 30, y: G - 70, taken: false });
  } else if (kind === 'puddle') {
    run.obstacles.push({ kind, x, y: G - 8, w: 96, h: 8, slow: true });
    run.pickups.push({ kind: 'corn', x: x + 36, y: G - 64, taken: false });
  } else if (kind === 'scarecrow') {
    run.obstacles.push({ kind, x, y: G - 84, w: 30, h: 84 });
    if (rng() < 0.5) run.pickups.push({ kind: 'corn', x: x - 26, y: G - 66, taken: false });
  }

  // Double trouble at higher distance: a second small obstacle trailing the first.
  if (d > 500 && rng() < 0.45) {
    const x2 = x + range(rng, 150, 240);
    const k2 = pick(rng, ['fence', 'hay', 'puddle']);
    if (k2 === 'fence') run.obstacles.push({ kind: k2, x: x2, y: G - 46, w: 14, h: 46 });
    else if (k2 === 'hay') run.obstacles.push({ kind: k2, x: x2, y: G - 44, w: 52, h: 44 });
    else run.obstacles.push({ kind: k2, x: x2, y: G - 8, w: 96, h: 8, slow: true });
  }

  // Pickups between groups: a corn arc, sometimes a golden feather or a pie slice.
  const n = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i += 1) {
    run.pickups.push({
      kind: 'corn',
      x: x + 260 + i * 42,
      y: G - 78 - (i === 1 ? 34 : 0),
      taken: false,
    });
  }
  if (rng() < 0.16) {
    run.pickups.push({ kind: 'feather', x: x + 300, y: G - 150, taken: false });
  } else if (rng() < 0.1) {
    run.pickups.push({ kind: 'pie', x: x + 300, y: G - 110, taken: false });
  }

  const gap = range(rng, CFG.SPAWN_MIN, CFG.SPAWN_MAX) * (1 - Math.min(0.25, d / 4000));
  run.nextSpawnX = x + gap + 320;
}

export function burstFeathers(run, n, colour = '#8a5a2b') {
  const t = run.turkey;
  for (let i = 0; i < n; i += 1) {
    run.particles.push({
      x: TURKEY_X + 20 + (run.rng() - 0.5) * 30,
      y: t.y + 20 + (run.rng() - 0.5) * 20,
      vx: (run.rng() - 0.7) * 5,
      vy: -run.rng() * 4 - 1,
      life: 30 + run.rng() * 30,
      colour,
      size: 3 + run.rng() * 4,
    });
  }
}

function floater(run, text, colour = '#fff') {
  const t = run.turkey;
  run.floaters.push({ x: TURKEY_X + 10, y: t.y - 14, text, life: 55, colour });
}

function stumble(run, o) {
  const t = run.turkey;
  if (t.invincible > 0) return;
  run.lives -= 1;
  t.invincible = CFG.INVINCIBLE;
  t.stumble = 18;
  run.farmerGap = Math.max(0, run.farmerGap - CFG.FARMER_GAIN_HIT);
  run.shake = 10;
  run.events.push('stumble');
  burstFeathers(run, 14);
  floater(run, 'OUCH!', '#ff6b5e');
  if (o && o.kind === 'knife') {
    // A knife hit is a bad one: it also knocks the turkey's speed down.
    run.speed = Math.max(CFG.BASE_SPEED, run.speed - 2);
  }
  if (run.lives <= 0) {
    run.state = 'caught';
    run.endReason = 'The farmer caught you — Thanksgiving dinner is served.';
    run.events.push('lose');
    burstFeathers(run, 40);
  }
}

export function step(run, input) {
  run.frame += 1;
  if (run.state === 'title' || run.state === 'caught' || run.state === 'escaped') {
    // Idle animation on the title / end screens: the turkey bobs, the farmer waits.
    run.time += 1;
    for (const p of run.particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= 1; }
    run.particles = run.particles.filter((p) => p.life > 0);
    return;
  }
  if (run.state === 'paused') return;

  const t = run.turkey;
  const dt = 1;

  // --- speed: ramps with distance, burst with Right, brake with Left ---
  const target = Math.min(CFG.TOP_SPEED, CFG.BASE_SPEED + run.distanceM * CFG.SPEED_RAMP);
  run.speed = target;
  if (input.down('ArrowRight', 'KeyD')) run.speed += CFG.BURST;
  if (input.down('ArrowLeft', 'KeyA')) run.speed -= CFG.BRAKE;
  run.speed = Math.max(2.2, run.speed);

  // --- jumping: Space / Up / W / click; a second jump in mid-air ---
  const wantJump = input.hit('Space', 'ArrowUp', 'KeyW', 'Enter') || input.click();
  if (wantJump) {
    if (t.y >= CFG.GROUND_Y - TURKEY_H - 0.5) {
      t.vy = CFG.JUMP_V;
      t.jumps = 1;
      t.sliding = 0;
      run.events.push('jump');
    } else if (t.jumps < 2) {
      t.vy = CFG.JUMP_V2;
      t.jumps = 2;
      run.events.push('jump2');
    }
  }

  // --- sliding: Down / S ducks under low things and through puddles faster ---
  if (input.hit('ArrowDown', 'KeyS') && t.y >= CFG.GROUND_Y - TURKEY_H - 0.5 && t.slideCd <= 0) {
    t.sliding = CFG.SLIDE_TIME;
    t.slideCd = CFG.SLIDE_TIME + CFG.SLIDE_COOLDOWN;
    run.events.push('slide');
  }
  if (t.sliding > 0) t.sliding -= dt;
  if (t.slideCd > 0) t.slideCd -= dt;

  // --- vertical physics ---
  t.vy = Math.min(CFG.MAX_FALL, t.vy + CFG.GRAVITY);
  t.y += t.vy;
  if (t.y >= CFG.GROUND_Y - TURKEY_H) {
    t.y = CFG.GROUND_Y - TURKEY_H;
    t.vy = 0;
    t.jumps = 0;
  }

  // --- advance the world ---
  run.worldX += run.speed;
  const metres = run.speed / 14; // ~14 px per metre
  run.distanceM += metres;
  run.score += metres * CFG.DIST_SCORE;
  run.time += 1;

  // --- the farmer: a stumble lets him gain a lot; dawdling lets him creep closer;
  // sprinting pulls away. He only grabs the turkey when the gap is truly gone.
  const sprinting = input.down('ArrowRight', 'KeyD');
  const braking = input.down('ArrowLeft', 'KeyA');
  if (sprinting) run.farmerGap = Math.min(420, run.farmerGap + CFG.FARMER_LOSE_FAST);
  else if (braking) run.farmerGap = Math.max(0, run.farmerGap - 0.8);
  else run.farmerGap = Math.max(0, run.farmerGap - 0.06);
  run.farmerAnim += run.speed * 0.09;
  if (run.farmerGap < 90 && run.frame % 38 === 0) run.events.push('heartbeat');
  if (run.farmerGap <= CFG.FARMER_CATCH_GAP) {
    run.state = 'caught';
    run.endReason = 'The farmer grabbed you by the tail feathers!';
    run.events.push('lose');
    burstFeathers(run, 40);
    return;
  }

  // --- spawn ahead ---
  while (run.nextSpawnX < run.worldX + CFG.W + 500) spawnGroup(run);

  // --- obstacles: move with the world, knives fall, cull behind the camera ---
  // Obstacles live in world-x; on screen they sit at (o.x - worldX), the turkey at TURKEY_X.
  const box = turkeyBox(run);
  for (const o of run.obstacles) {
    if (o.falling && !o.stuck) {
      o.vy = Math.min(14, (o.vy || 0) + 0.7);
      o.y += o.vy;
      if (o.y >= CFG.GROUND_Y - o.h) { o.y = CFG.GROUND_Y - o.h; o.stuck = true; }
    }
    const ob = { x: o.x - run.worldX, y: o.y, w: o.w, h: o.h };
    if (o.slow) {
      // A mud puddle slows the turkey while it wades through.
      if (overlaps(box, ob)) run.speed = Math.max(2.2, run.speed - 1.6);
      continue;
    }
    if (overlaps(box, ob)) stumble(run, o);
  }
  run.obstacles = run.obstacles.filter((o) => o.x > run.worldX - 200);

  // --- pickups ---
  for (const p of run.pickups) {
    if (p.taken) continue;
    const pb = { x: p.x - run.worldX - 14, y: p.y - 14, w: 30, h: 30 };
    if (overlaps(box, pb)) {
      p.taken = true;
      if (p.kind === 'corn') { run.score += CFG.CORN_SCORE; run.events.push('corn'); floater(run, '+25', '#ffd94a'); }
      if (p.kind === 'feather') {
        run.score += CFG.FEATHER_SCORE;
        run.lives = Math.min(5, run.lives + 1);
        run.events.push('feather');
        floater(run, '+1 LIFE', '#fff3c4');
      }
      if (p.kind === 'pie') { run.score += CFG.PIE_SCORE; run.events.push('pie'); floater(run, '+100 PIE!', '#ff9e7a'); }
    }
  }
  run.pickups = run.pickups.filter((p) => !p.taken && p.x > run.worldX - 200);

  // --- particles & floaters ---
  for (const p of run.particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= 1; }
  run.particles = run.particles.filter((p) => p.life > 0);
  for (const f of run.floaters) { f.y -= 0.7; f.life -= 1; }
  run.floaters = run.floaters.filter((f) => f.life > 0);
  if (t.invincible > 0) t.invincible -= dt;
  if (t.stumble > 0) t.stumble -= dt;
  if (run.shake > 0) run.shake -= 1;

  // --- escape! ---
  if (run.distanceM >= CFG.ESCAPE_M) {
    run.state = 'escaped';
    run.endReason = 'You reached the woods — free at last, just in time for Thanksgiving.';
    run.events.push('win');
    burstFeathers(run, 60, '#fff3c4');
  }
}

export function startRun(run) {
  const seed = run.seed;
  const best = run.best;
  const fresh = newRun(seed + Math.floor(Math.random() * 100000));
  fresh.best = best;
  Object.assign(run, fresh);
  run.state = 'play';
  run.events.push('gobble');
}

// Screen-space x of a world-x (the camera has scrolled worldX px; the turkey sits
// fixed at TURKEY_X on screen).
export function screenX(run, worldX) {
  return worldX - run.worldX;
}

export { TURKEY_X, TURKEY_W, TURKEY_H };
