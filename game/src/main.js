// Main loop: owns the canvas, the state machine (title -> play -> caught/escaped),
// the sound triggers and the staged-shot mode (?shot=...&seed=...).
import { CFG } from './config.js';
import { Sfx } from './audio.js';
import { Input } from './input.js';
import { newRun, step, startRun } from './world.js';
import { render } from './render.js';
import { shotRun } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const sfx = new Sfx();
const input = new Input(canvas);

const params = new URLSearchParams(window.location.search);
const shotKind = params.get('shot');
const seed = Number(params.get('seed') || '20261127');

let run;
if (shotKind) {
  run = shotRun(shotKind, seed);
  document.title = `Turkey Run — shot ${shotKind}`;
} else {
  run = newRun(Date.now() % 2147483647);
  try {
    run.best = Number(window.localStorage.getItem('turkeyrun.best') || '0');
  } catch { run.best = 0; }
}
// Debug handle for automated playtests (read-only state inspection).
window.__turkey = run;

function saveBest() {
  if (run.score > run.best) {
    run.best = run.score;
    try { window.localStorage.setItem('turkeyrun.best', String(Math.floor(run.best))); } catch { /* private mode */ }
  }
}

function drainEvents() {
  for (const ev of run.events) {
    if (ev === 'jump') sfx.jump();
    else if (ev === 'jump2') sfx.doubleJump();
    else if (ev === 'slide') sfx.slide();
    else if (ev === 'corn') sfx.corn();
    else if (ev === 'feather') sfx.feather();
    else if (ev === 'pie') sfx.pie();
    else if (ev === 'stumble') sfx.stumble();
    else if (ev === 'gobble') sfx.gobble();
    else if (ev === 'heartbeat') sfx.heartbeat();
    else if (ev === 'win') sfx.win();
    else if (ev === 'lose') sfx.lose();
  }
  run.events.length = 0;
}

function frame() {
  if (!shotKind) {
    // Global keys first: pause, mute, restart.
    if (input.hit('KeyP') && (run.state === 'play' || run.state === 'paused')) {
      run.state = run.state === 'play' ? 'paused' : 'play';
    }
    if (input.hit('KeyM')) {
      const muted = sfx.toggleMute();
      run.floaters.push({ x: 480, y: 120, text: muted ? 'SOUND OFF' : 'SOUND ON', life: 40, colour: '#fff' });
    }
    if (run.state === 'title' && (input.hit('Space', 'Enter') || input.click())) {
      sfx.ensure();
      startRun(run);
    } else if ((run.state === 'caught' || run.state === 'escaped') && (input.hit('KeyR', 'Space', 'Enter') || input.click())) {
      saveBest();
      startRun(run);
    } else if (run.state === 'play' || run.state === 'paused') {
      step(run, input);
      if (run.state === 'caught' || run.state === 'escaped') saveBest();
    }
    drainEvents();
    input.endFrame();
  }
  render(ctx, run);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
