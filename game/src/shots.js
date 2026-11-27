// Staged shots: deterministic renders for screenshots/ (?shot=start|play|caught|escaped).
// Each builds a run from a fixed seed, steps it a fixed number of frames with scripted
// inputs, and hands it to the renderer — so the screenshots are real renders of the
// game's own code, reproducible from the URL alone.
import { CFG } from './config.js';
import { newRun, step, TURKEY_X } from './world.js';

// A minimal input stand-in: nothing held, nothing pressed.
const IDLE = { down: () => false, hit: () => false, click: () => false };

// An auto-player for the play shot: jumps when an obstacle is close ahead, double-jumps
// if still airborne over one — so the shot always shows the turkey clearing something
// instead of mid-stumble behind a fence.
function autoPlayer(run) {
  const t = run.turkey;
  const onGround = t.y >= CFG.GROUND_Y - 52 - 0.5;
  let nearest = null;
  for (const o of run.obstacles) {
    const sx = o.x - run.worldX;
    if (sx > TURKEY_X + 20 && sx < TURKEY_X + 190 && (!nearest || sx < nearest.sx)) {
      nearest = { sx, kind: o.kind };
    }
  }
  const jump = nearest !== null && (
    (onGround && nearest.sx < TURKEY_X + 150)
    || (!onGround && t.jumps < 2 && nearest.sx < TURKEY_X + 90)
  );
  return {
    down: () => false,
    hit: (...codes) => jump && codes.includes('Space'),
    click: () => false,
  };
}

function scriptedRun(seed, frames, script) {
  const run = newRun(seed);
  run.state = 'play';
  for (let f = 0; f < frames; f += 1) {
    const input = script.auto ? autoPlayer(run) : {
      down: (...codes) => (script.hold || []).some((c) => codes.includes(c)),
      hit: (...codes) => (script.pressAt[f] || []).some((c) => codes.includes(c)),
      click: () => false,
    };
    step(run, input);
    if (script.stopWhen && script.stopWhen(run, f)) return run;
    if (run.state !== 'play') break;
  }
  return run;
}

export function shotRun(kind, seed) {
  if (kind === 'start') {
    const run = newRun(seed);
    run.state = 'title';
    run.best = 1240;
    return run;
  }
  if (kind === 'play') {
    // A busy mid-run: the auto-player jumps the obstacles, and the shot is taken on a
    // hero moment — the turkey airborne over a fence with corn in the air and the
    // farmer closing in behind.
    const heroMoment = (run, f) => {
      if (f < 300) return false;
      const t = run.turkey;
      if (t.y > CFG.GROUND_Y - 52 - 60) return false; // must be properly airborne
      return run.obstacles.some((o) => {
        const sx = o.x - run.worldX;
        return sx > TURKEY_X - 10 && sx < TURKEY_X + 80 && o.kind !== 'puddle';
      });
    };
    const run = scriptedRun(seed, 900, { auto: true, stopWhen: heroMoment });
    run.state = 'play';
    run.lives = Math.max(run.lives, 2); // the shot must show a live run, mid-escape
    run.farmerGap = 96; // the farmer is breathing down the turkey's neck
    run.floaters.length = 0; // no stale "OUCH!" text over the action
    return run;
  }
  if (kind === 'caught') {
    const run = scriptedRun(seed, 260, { hold: [], pressAt: { 30: ['Space'] } });
    run.state = 'caught';
    run.lives = 0;
    run.score = 1875;
    run.distanceM = 642;
    run.farmerGap = 10; // the farmer is on top of the turkey in the render
    run.floaters.length = 0;
    run.endReason = 'The farmer grabbed you by the tail feathers!';
    return run;
  }
  if (kind === 'escaped') {
    const run = scriptedRun(seed, 400, { hold: ['ArrowRight'], pressAt: { 30: ['Space'], 200: ['Space'] } });
    run.state = 'escaped';
    run.lives = Math.max(run.lives, 2); // the escape shot shows a turkey that made it, alive
    run.score = 9340;
    run.distanceM = CFG.ESCAPE_M;
    run.floaters.length = 0;
    run.endReason = 'You reached the woods — free at last, just in time for Thanksgiving.';
    return run;
  }
  return newRun(seed);
}
