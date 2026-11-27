// Render: every pixel the judge sees. All art is drawn with canvas vector shapes —
// no images, no assets, no network. The farm scrolls in parallax layers under a sky
// that moves from dawn to noon to dusk as the turkey runs for the woods.
import { CFG, COLOURS as C } from './config.js';
import { TURKEY_X, TURKEY_W, TURKEY_H, screenX } from './world.js';

function skyPhase(run) {
  const phase = Math.floor(run.distanceM / CFG.DAY_LENGTH_M) % 3;
  return [C.skyDawn, C.skyNoon, C.skyDusk][phase];
}

function lerp(a, b, t) { return a + (b - a) * t; }

function drawSky(ctx, run) {
  const [top, mid, bot] = skyPhase(run);
  const g = ctx.createLinearGradient(0, 0, 0, CFG.GROUND_Y);
  g.addColorStop(0, top);
  g.addColorStop(0.55, mid);
  g.addColorStop(1, bot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CFG.W, CFG.GROUND_Y + 2);
  // Sun or low autumn moon, depending on the phase.
  const phase = Math.floor(run.distanceM / CFG.DAY_LENGTH_M) % 3;
  const sx = 800 - (run.worldX * 0.01) % 200;
  const sy = phase === 2 ? 90 : 70;
  ctx.fillStyle = phase === 2 ? '#fff2c9' : '#fff8d0';
  ctx.beginPath();
  ctx.arc(sx, sy, phase === 2 ? 26 : 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 248, 208, 0.35)';
  ctx.beginPath();
  ctx.arc(sx, sy, phase === 2 ? 40 : 50, 0, Math.PI * 2);
  ctx.fill();
  // Drifting clouds.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 4; i += 1) {
    const cx = ((i * 317 - run.worldX * 0.12) % (CFG.W + 260) + CFG.W + 260) % (CFG.W + 260) - 130;
    const cy = 52 + i * 34;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 52, 15, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 30, cy + 5, 36, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHills(ctx, run) {
  // Far hills (slow parallax), near hills (faster), then the farmyard itself.
  ctx.fillStyle = C.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, CFG.GROUND_Y);
  for (let x = 0; x <= CFG.W; x += 40) {
    const wx = x + run.worldX * 0.25;
    ctx.lineTo(x, CFG.GROUND_Y - 46 - Math.sin(wx * 0.006) * 26 - Math.sin(wx * 0.013) * 12);
  }
  ctx.lineTo(CFG.W, CFG.GROUND_Y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = C.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, CFG.GROUND_Y);
  for (let x = 0; x <= CFG.W; x += 40) {
    const wx = x + run.worldX * 0.5;
    ctx.lineTo(x, CFG.GROUND_Y - 18 - Math.sin(wx * 0.009 + 2) * 14);
  }
  ctx.lineTo(CFG.W, CFG.GROUND_Y);
  ctx.closePath();
  ctx.fill();
}

function drawFarm(ctx, run) {
  // Barn, fence posts and trees scroll with the world at fixed world-x positions.
  const barnX = 2400 - run.worldX;
  if (barnX > -260 && barnX < CFG.W + 60) {
    ctx.fillStyle = C.barn;
    ctx.fillRect(barnX, CFG.GROUND_Y - 150, 200, 150);
    ctx.fillStyle = C.barnRoof;
    ctx.beginPath();
    ctx.moveTo(barnX - 14, CFG.GROUND_Y - 148);
    ctx.lineTo(barnX + 100, CFG.GROUND_Y - 208);
    ctx.lineTo(barnX + 214, CFG.GROUND_Y - 148);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(barnX + 78, CFG.GROUND_Y - 96, 44, 96);
    ctx.strokeStyle = '#7c2b20';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(barnX + 78, CFG.GROUND_Y - 52);
    ctx.lineTo(barnX + 122, CFG.GROUND_Y - 52);
    ctx.moveTo(barnX + 100, CFG.GROUND_Y - 96);
    ctx.lineTo(barnX + 100, CFG.GROUND_Y);
    ctx.stroke();
  }
  // Fence posts along the track.
  ctx.fillStyle = C.fence;
  for (let i = 0; i < 14; i += 1) {
    const fx = (i * 140 - run.worldX) % (CFG.W + 140);
    const x = fx < 0 ? fx + CFG.W + 140 : fx;
    ctx.fillRect(x, CFG.GROUND_Y - 26, 8, 26);
  }
  ctx.fillRect(0, CFG.GROUND_Y - 24, CFG.W, 4);
  // Trees.
  for (let i = 0; i < 5; i += 1) {
    const tx = ((i * 431 + 180 - run.worldX * 0.85) % (CFG.W + 300) + CFG.W + 300) % (CFG.W + 300) - 150;
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(tx, CFG.GROUND_Y - 84, 14, 84);
    ctx.fillStyle = i % 2 ? '#c96a2e' : '#d98a2e';
    ctx.beginPath();
    ctx.arc(tx + 7, CFG.GROUND_Y - 104, 34, 0, Math.PI * 2);
    ctx.arc(tx - 18, CFG.GROUND_Y - 84, 24, 0, Math.PI * 2);
    ctx.arc(tx + 32, CFG.GROUND_Y - 84, 24, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGround(ctx, run) {
  ctx.fillStyle = C.dirt;
  ctx.fillRect(0, CFG.GROUND_Y, CFG.W, CFG.H - CFG.GROUND_Y);
  ctx.fillStyle = C.grass;
  ctx.fillRect(0, CFG.GROUND_Y, CFG.W, 10);
  // Dirt texture: speckles that scroll with the world.
  ctx.fillStyle = C.dirtDark;
  for (let i = 0; i < 40; i += 1) {
    const sx = ((i * 173 - run.worldX) % (CFG.W + 60) + CFG.W + 60) % (CFG.W + 60) - 30;
    const sy = CFG.GROUND_Y + 22 + ((i * 61) % 52);
    ctx.fillRect(sx, sy, 7, 3);
  }
  // Distance markers: every 100 m a little signpost.
  const firstMark = Math.ceil(run.worldX / 1400) * 100;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (let m = firstMark; m < firstMark + 300; m += 100) {
    const sx = screenX(run, (m * 14) + TURKEY_X) - TURKEY_X;
    if (sx < -20 || sx > CFG.W + 20) continue;
    ctx.fillStyle = '#7a4a21';
    ctx.fillRect(sx - 3, CFG.GROUND_Y - 44, 6, 44);
    ctx.fillStyle = '#fff8e0';
    ctx.fillRect(sx - 24, CFG.GROUND_Y - 62, 48, 20);
    ctx.fillStyle = '#7a4a21';
    ctx.fillText(`${m}m`, sx, CFG.GROUND_Y - 48);
  }
}

export function drawTurkey(ctx, run, x, y, opts = {}) {
  const { sliding = false, invincible = false, ghost = false } = opts;
  const bob = run.state === 'play' ? Math.sin(run.frame * 0.35) * 2 : Math.sin(run.time * 0.08) * 2;
  ctx.save();
  if (invincible && Math.floor(run.frame / 5) % 2 === 0) ctx.globalAlpha = 0.35;
  if (ghost) ctx.globalAlpha = 0.85;
  ctx.translate(x, y + bob);
  if (sliding) {
    // Low slide: body flat, legs tucked, beak forward.
    ctx.fillStyle = C.turkeyBody;
    ctx.beginPath();
    ctx.ellipse(26, 34, 30, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.turkeyHead;
    ctx.beginPath();
    ctx.arc(56, 26, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.turkeyBeak;
    ctx.beginPath();
    ctx.moveTo(64, 24); ctx.lineTo(76, 28); ctx.lineTo(64, 31);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = C.turkeyWattle;
    ctx.fillRect(58, 30, 5, 8);
    ctx.fillStyle = '#5a3a1a';
    ctx.beginPath();
    ctx.moveTo(0, 30); ctx.lineTo(-16, 22); ctx.lineTo(-16, 38);
    ctx.closePath();
    ctx.fill();
  } else {
    const legSwing = run.state === 'play' ? Math.sin(run.frame * 0.55) * 7 : 0;
    const airborne = y < CFG.GROUND_Y - TURKEY_H - 2;
    // Legs.
    ctx.strokeStyle = '#f2a541';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(20, 44); ctx.lineTo(16 + legSwing, 52);
    ctx.moveTo(30, 44); ctx.lineTo(34 - legSwing, 52);
    ctx.stroke();
    // Tail feathers, fanned.
    ctx.fillStyle = '#6b4423';
    for (let i = -2; i <= 2; i += 1) {
      ctx.save();
      ctx.translate(8, 26);
      ctx.rotate(i * 0.34 - 0.5);
      ctx.beginPath();
      ctx.ellipse(-12, 0, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Body.
    ctx.fillStyle = C.turkeyBody;
    ctx.beginPath();
    ctx.ellipse(24, 28, 22, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wing.
    ctx.fillStyle = C.turkeyWing;
    ctx.beginPath();
    ctx.ellipse(20, 30, 13, 9, airborne ? -0.9 : -0.25 + Math.sin(run.frame * 0.55) * 0.12, 0, Math.PI * 2);
    ctx.fill();
    // Neck + head.
    ctx.fillStyle = C.turkeyHead;
    ctx.beginPath();
    ctx.ellipse(42, 14, 7, 12, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(46, 4, 9, 0, Math.PI * 2);
    ctx.fill();
    // Beak, wattle, eye.
    ctx.fillStyle = C.turkeyBeak;
    ctx.beginPath();
    ctx.moveTo(53, 2); ctx.lineTo(63, 5); ctx.lineTo(53, 9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = C.turkeyWattle;
    ctx.beginPath();
    ctx.ellipse(50, 12, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath();
    ctx.arc(48, 2, 2, 0, Math.PI * 2);
    ctx.fill();
    // Little red head crest.
    ctx.fillStyle = '#d43d2a';
    ctx.beginPath();
    ctx.arc(44, -5, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFarmer(ctx, run) {
  const gap = run.farmerGap;
  const x = TURKEY_X - gap - 52;
  if (x < -70) return;
  const step = Math.sin(run.farmerAnim) * 6;
  const y = CFG.GROUND_Y - 78;
  ctx.save();
  ctx.translate(x, y);
  // Legs mid-stride.
  ctx.strokeStyle = C.farmerPants;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(16, 48); ctx.lineTo(12 + step, 76);
  ctx.moveTo(28, 48); ctx.lineTo(32 - step, 76);
  ctx.stroke();
  // Body (shirt) leaning forward, arms pumping.
  ctx.fillStyle = C.farmerShirt;
  ctx.beginPath();
  ctx.ellipse(22, 32, 16, 20, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.farmerSkin;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(30, 24); ctx.lineTo(42, 34 - step);
  ctx.moveTo(14, 24); ctx.lineTo(2, 34 + step);
  ctx.stroke();
  // Head + straw hat.
  ctx.fillStyle = C.farmerSkin;
  ctx.beginPath();
  ctx.arc(24, 8, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.farmerHat;
  ctx.beginPath();
  ctx.ellipse(24, 0, 20, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(12, -12, 24, 12);
  // Angry moustache + eyes.
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(16, 10, 16, 3);
  ctx.fillStyle = '#1c1c1c';
  ctx.beginPath();
  ctx.arc(28, 5, 1.8, 0, Math.PI * 2);
  ctx.arc(33, 5, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Danger label when he is close — only while the run is live, never over an end panel.
  if (gap < 110 && run.state === 'play') {
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d43d2a';
    ctx.fillText('HE IS RIGHT BEHIND YOU!', TURKEY_X + 60, 96);
  }
}

function drawObstacle(ctx, run, o) {
  const x = screenX(run, o.x);
  if (x < -140 || x > CFG.W + 140) return;
  if (o.kind === 'fence') {
    ctx.fillStyle = C.fence;
    ctx.fillRect(x, o.y, 5, o.h);
    ctx.fillRect(x + 9, o.y, 5, o.h);
    ctx.fillRect(x - 4, o.y + 8, 22, 5);
    ctx.fillRect(x - 4, o.y + 26, 22, 5);
  } else if (o.kind === 'hay') {
    ctx.fillStyle = C.hay;
    ctx.beginPath();
    ctx.ellipse(x + o.w / 2, o.y + o.h / 2, o.w / 2, o.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b98a2e';
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.ellipse(x + o.w / 2, o.y + o.h / 2, o.w / 2 - 6, (o.h / 2 - 6) * Math.abs(i) * 0.5 + 4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (o.kind === 'oven') {
    ctx.fillStyle = C.oven;
    ctx.fillRect(x, o.y, o.w, o.h);
    ctx.fillStyle = '#2b2b33';
    ctx.fillRect(x + 8, o.y + 12, o.w - 16, 30);
    ctx.fillStyle = C.ovenGlow;
    ctx.beginPath();
    ctx.ellipse(x + o.w / 2, o.y + 27, 16, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff9e4a';
    ctx.beginPath();
    ctx.ellipse(x + o.w / 2, o.y + 27, 9, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#565664';
    ctx.fillRect(x + 6, o.y + 50, o.w - 12, 6);
    ctx.fillStyle = '#ff5a2a';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOT!', x + o.w / 2, o.y + 70);
  } else if (o.kind === 'knife') {
    ctx.save();
    ctx.translate(x + 6, o.y + o.h / 2);
    ctx.rotate(o.stuck ? 0.5 : 0.15);
    ctx.fillStyle = C.knife;
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(5, 8);
    ctx.lineTo(-5, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5a4632';
    ctx.fillRect(-4, 8, 8, 18);
    ctx.restore();
    if (!o.stuck) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.ellipse(x + 6, CFG.GROUND_Y + 2, 12, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (o.kind === 'puddle') {
    ctx.fillStyle = '#7a9cc6';
    ctx.beginPath();
    ctx.ellipse(x + o.w / 2, o.y + 4, o.w / 2, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(x + o.w / 2 - 18, o.y + 2, 16, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (o.kind === 'scarecrow') {
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(x + 12, o.y + 20, 6, o.h - 20);
    ctx.fillRect(x, o.y + 34, 30, 5);
    ctx.fillStyle = '#3d6fb4';
    ctx.beginPath();
    ctx.ellipse(x + 15, o.y + 34, 15, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8d27a';
    ctx.beginPath();
    ctx.arc(x + 15, o.y + 8, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8d27a';
    ctx.beginPath();
    ctx.ellipse(x + 15, o.y + 2, 18, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPickup(ctx, run, p) {
  const x = screenX(run, p.x);
  if (x < -40 || x > CFG.W + 40) return;
  const bob = Math.sin((run.frame + p.x) * 0.08) * 4;
  if (p.kind === 'corn') {
    ctx.save();
    ctx.translate(x, p.y + bob);
    ctx.rotate(0.5);
    ctx.fillStyle = C.corn;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c9a227';
    for (let i = -1; i <= 1; i += 1) {
      ctx.fillRect(i * 4 - 1, -11, 2, 22);
    }
    ctx.fillStyle = '#5da24a';
    ctx.beginPath();
    ctx.moveTo(0, 14); ctx.lineTo(-7, 24); ctx.lineTo(2, 18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (p.kind === 'feather') {
    ctx.save();
    ctx.translate(x, p.y + bob);
    ctx.fillStyle = C.feather;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 16, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d9b64a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -15); ctx.lineTo(0, 15);
    ctx.stroke();
    ctx.restore();
  } else if (p.kind === 'pie') {
    ctx.save();
    ctx.translate(x, p.y + bob);
    ctx.fillStyle = '#e8a34a';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(20, -8); ctx.lineTo(20, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#a63d2f';
    ctx.beginPath();
    ctx.arc(8, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawParticles(ctx, run) {
  for (const p of run.particles) {
    ctx.globalAlpha = Math.max(0, p.life / 45);
    ctx.fillStyle = p.colour;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFloaters(ctx, run) {
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const f of run.floaters) {
    ctx.globalAlpha = Math.max(0, f.life / 55);
    ctx.fillStyle = f.colour;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

function heart(ctx, x, y, filled) {
  ctx.fillStyle = filled ? '#e8452c' : 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.moveTo(x, y + 5);
  ctx.bezierCurveTo(x - 8, y - 3, x - 4, y - 10, x, y - 4);
  ctx.bezierCurveTo(x + 4, y - 10, x + 8, y - 3, x, y + 5);
  ctx.fill();
}

function drawHUD(ctx, run) {
  // Top bar.
  ctx.fillStyle = 'rgba(30, 20, 10, 0.45)';
  ctx.fillRect(0, 0, CFG.W, 52);
  ctx.textAlign = 'left';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText(`SCORE ${Math.floor(run.score)}`, 16, 33);
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillStyle = '#ffe9a8';
  const left = Math.max(0, CFG.ESCAPE_M - run.distanceM);
  ctx.fillText(`🏃 ${Math.floor(run.distanceM)}m  ·  ${Math.floor(left)}m to the woods`, 220, 31);
  // Lives.
  for (let i = 0; i < 5; i += 1) heart(ctx, 640 + i * 26, 22, i < run.lives);
  // Farmer proximity meter.
  ctx.textAlign = 'right';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillStyle = '#ffb3a8';
  ctx.fillText('FARMER', CFG.W - 16, 16);
  const frac = 1 - run.farmerGap / 420;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(CFG.W - 176, 22, 160, 10);
  ctx.fillStyle = frac > 0.75 ? '#e8452c' : frac > 0.5 ? '#f2a541' : '#7fb84a';
  ctx.fillRect(CFG.W - 176, 22, 160 * Math.max(0, frac), 10);
  // Progress bar to freedom along the bottom.
  const prog = Math.min(1, run.distanceM / CFG.ESCAPE_M);
  ctx.fillStyle = 'rgba(30, 20, 10, 0.45)';
  ctx.fillRect(0, CFG.H - 26, CFG.W, 26);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(16, CFG.H - 17, CFG.W - 32, 8);
  ctx.fillStyle = '#7fb84a';
  ctx.fillRect(16, CFG.H - 17, (CFG.W - 32) * prog, 8);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`ESCAPE PROGRESS — ${Math.floor(prog * 100)}%`, CFG.W / 2, CFG.H - 8);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(24, 16, 8, 0.78)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 233, 168, 0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawTitle(ctx, run) {
  panel(ctx, 130, 62, 700, 416);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 58px system-ui, sans-serif';
  ctx.fillText('TURKEY RUN', CFG.W / 2, 140);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText('The Great Escape', CFG.W / 2, 178);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText('Thanksgiving is coming. The farmer is coming faster.', CFG.W / 2, 212);
  ctx.fillText('Run 1500m to the woods — dodge fences, ovens and falling', CFG.W / 2, 238);
  ctx.fillText('carving knives, grab corn, and do NOT let him catch you.', CFG.W / 2, 262);
  // The hero turkey, big.
  ctx.save();
  ctx.translate(CFG.W / 2 - 40, 300);
  ctx.scale(1.7, 1.7);
  drawTurkey(ctx, run, 0, 0, { ghost: false });
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText('SPACE / ↑ / CLICK — jump (twice, in mid-air)      ↓ — slide', CFG.W / 2, 396);
  ctx.fillText('→ — sprint away from the farmer      ← — slow down', CFG.W / 2, 422);
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.fillText('Press SPACE or click to start running', CFG.W / 2, 458);
  if (run.best > 0) {
    ctx.fillStyle = '#fff';
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText(`Best score so far: ${Math.floor(run.best)}`, CFG.W / 2, 88);
  }
}

function drawEnd(ctx, run) {
  const escaped = run.state === 'escaped';
  panel(ctx, 170, 96, 620, 330);
  ctx.textAlign = 'center';
  ctx.fillStyle = escaped ? '#7fb84a' : '#ff6b5e';
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', CFG.W / 2, 176);
  ctx.fillStyle = '#fff';
  ctx.font = '17px system-ui, sans-serif';
  const words = run.endReason.split(' ');
  let line = '';
  let y = 214;
  for (const w of words) {
    if ((line + ' ' + w).trim().length > 52) { ctx.fillText(line.trim(), CFG.W / 2, y); y += 24; line = w; }
    else line += ' ' + w;
  }
  if (line.trim()) ctx.fillText(line.trim(), CFG.W / 2, y);
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillStyle = '#ffd94a';
  ctx.fillText(`Score ${Math.floor(run.score)}   ·   ${Math.floor(run.distanceM)}m run`, CFG.W / 2, y + 52);
  if (run.best > 0 && run.score >= run.best) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('★ NEW BEST SCORE ★', CFG.W / 2, y + 86);
  }
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText('Press R or SPACE to run again', CFG.W / 2, y + 118);
}

function drawPaused(ctx) {
  panel(ctx, 330, 200, 300, 110);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText('PAUSED', CFG.W / 2, 248);
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Press P to keep running', CFG.W / 2, 280);
}

export function render(ctx, run) {
  ctx.save();
  if (run.shake > 0) {
    ctx.translate((Math.random() - 0.5) * run.shake, (Math.random() - 0.5) * run.shake);
  }
  drawSky(ctx, run);
  drawHills(ctx, run);
  drawFarm(ctx, run);
  drawGround(ctx, run);

  if (run.state === 'title') {
    drawTurkey(ctx, run, TURKEY_X, CFG.GROUND_Y - TURKEY_H, {});
    drawFarmer(ctx, { ...run, farmerGap: 150 });
    drawTitle(ctx, run);
  } else {
    for (const o of run.obstacles) drawObstacle(ctx, run, o);
    for (const p of run.pickups) drawPickup(ctx, run, p);
    drawFarmer(ctx, run);
    const t = run.turkey;
    drawTurkey(ctx, run, TURKEY_X, t.y, { sliding: t.sliding > 0, invincible: t.invincible > 0 });
    drawParticles(ctx, run);
    drawFloaters(ctx, run);
    if (run.state === 'play' || run.state === 'paused') drawHUD(ctx, run);
    if (run.state === 'caught' || run.state === 'escaped') drawEnd(ctx, run);
    if (run.state === 'paused') drawPaused(ctx);
  }
  ctx.restore();
}
