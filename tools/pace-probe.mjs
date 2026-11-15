// Offline pacing probe for V4. Approximates the 8 Hz GPU-alpha contact sample by painting the
// body footprint along the scripted path, so ink/stage/completion curves can be measured
// without a browser. Script play is NOT a player: use it for order-of-magnitude tuning only.
import {RevealRun} from '../src/reveal/run.js';
import {coreRadius} from '../src/game/alien-geometry.js';
import {HERO_BODY_CONFIG as BODY} from '../src/ink/hero-visual-config.js';
// Contact readback samples the rendered body alpha, whose halo shrinks with size.
const halo=r=>{const t=Math.max(0,Math.min(1,(r-BODY.haloStartRadius)/(BODY.haloEndRadius-BODY.haloStartRadius)));return BODY.smallHalo+(BODY.largeHalo-BODY.smallHalo)*t;};

const seconds = Number(process.argv[2] || 600);
const dt = 1 / 30;
const run = new RevealRun(() => {}, { completionThreshold: 2 });
const p = run.player;
let paintClock = 0;
const log = [];
let nextMark = 0;
let peakStage = 1;

function steer() {
  const core = coreRadius(p);
  const reach = core * 1.06;
  let best = null, bestD = Infinity, threat = null, threatD = Infinity;
  for (const e of run.arena.entities) {
    if (e === p || e.dead) continue;
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (coreRadius(e) * 1.06 < reach) { if (d < bestD) { bestD = d; best = e; } }
    else if (coreRadius(e) > core * 1.06 && d < threatD) { threatD = d; threat = e; }
  }
  let target = best;
  if (!target) {
    let fd = Infinity;
    for (const f of run.arena.foods) { const d = Math.hypot(f.x - p.x, f.y - p.y); if (d < fd) { fd = d; target = f; } }
  }
  let dx = 0, dy = 0;
  if (target) { const d = Math.hypot(target.x - p.x, target.y - p.y) || 1; dx = (target.x - p.x) / d; dy = (target.y - p.y) / d; }
  if (threat && threatD < 220) {
    const d = threatD || 1, away = (220 - threatD) / 220;
    dx += -(threat.x - p.x) / d * away * 2.4; dy += -(threat.y - p.y) / d * away * 2.4;
  }
  const n = Math.hypot(dx, dy) || 1;
  run.setBoostHeld(!!(best && bestD > 130 && !(threat && threatD < 180)));
  return { x: dx / n, y: dy / n };
}

for (let t = 0; t < seconds; t += dt) {
  run.update(dt, steer());
  // contact proxy: 8 Hz readback of the visible body
  paintClock += dt;
  if (paintClock >= 1 / 8 && !p.dead && run.state === 'playing') {
    paintClock = 0;
    run.mask.brush(p.x, p.y, Math.max(3, p.r * halo(p.r)), 1);
  }
  peakStage = Math.max(peakStage, run.journey.stage);
  if (t >= nextMark) {
    log.push({ t: Math.round(t), ink: Math.round(p.ink), r: +p.r.toFixed(1), stage: run.journey.stage, pct: +(run.completion * 100).toFixed(2), inkPct: +(run.inkCompletion * 100).toFixed(2), zoom: null, npcs: run.arena.entities.filter(e => !e.dead).length, deaths: p.deaths });
    nextMark += 30;
  }
  if (run.state !== 'playing') break;
}
console.log(JSON.stringify({ seconds, peakStage, goalReached: run.goalReached, goalKind: run.goalKind, elapsed: +run.elapsed.toFixed(1), completion: +(run.completion * 100).toFixed(2), inkCompletion: +(run.inkCompletion * 100).toFixed(2), swallowed: p.swallowed, deaths: p.deaths, rows: log }, null, 1));
