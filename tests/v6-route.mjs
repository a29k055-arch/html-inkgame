// Repeatable route probes. These are computer pilots, not human play-time estimates.
// node tests/v6-route.mjs [seeds=3] [seconds=750] [levels=1,2,3,4,5,6]
import assert from 'node:assert/strict';
import {makeLevel} from '../src-v6/levels.mjs';
import {createWorld, stepWorld} from '../src-v6/sim.mjs';

const totalSeeds = Number(process.argv[2] || 3);
const timeLimit = Number(process.argv[3] || 750);
const levels = (process.argv[4] || '1,2,3,4,5,6').split(',').map(Number);
const dt = 1 / 30;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function nearestCandidate(world, reach, avoid) {
  const p = world.player;
  let best = null;
  let score = Infinity;
  function consider(target, reward) {
    const distance = Math.max(1, dist(p, target) - p.r - target.r);
    if (distance > reach) return;
    let risk = 0;
    for (const e of avoid) {
      if (dist(e, target) < e.r + p.r * 1.6) risk += 4;
    }
    // Estimate travel versus reward. Fine particles never eclipse a whole edible ball.
    const cost = distance * (1 + risk) / Math.sqrt(Math.max(1, reward));
    if (cost >= score) return;
    score = cost;
    best = target;
  }
  for (const e of world.enemies) if (e.mass < p.mass) consider(e, e.mass);
  for (const d of world.drops) consider(d, d.mass);
  for (const leaf of world.leaves) for (const flower of leaf.flowers) consider(flower, flower.mass);
  return best;
}

function steer(world, target, hazards, speed, hand) {
  const p = world.player;
  let dx = target.x - p.x, dy = target.y - p.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.01) return {x:0,y:0,action:false};
  dx /= distance;
  dy /= distance;
  // Choose the nearest forward obstacle, then pass it on a stable side.
  let closest = null, approach = Infinity;
  for (const e of hazards) {
    const ex = e.x - p.x, ey = e.y - p.y;
    const forward = ex * dx + ey * dy;
    if (forward <= 0 || forward > Math.min(distance, e.r + p.r + 115)) continue;
    const clearance = Math.abs(ex * dy - ey * dx);
    if (clearance < e.r + p.r + 10 && forward < approach) {
      approach = forward;
      closest = e;
    }
  }
  if (closest) {
    const sideways = dx * (closest.y - p.y) - dy * (closest.x - p.x);
    const sign = Math.abs(sideways) < 1 ? hand : Math.sign(sideways);
    const turn = 1.8;
    const nx = dx + dy * sign * turn;
    const ny = dy - dx * sign * turn;
    const n = Math.hypot(nx, ny);
    dx = nx/n;
    dy = ny/n;
  }
  return {x:dx * speed, y:dy * speed, action:false};
}

function run(level, seed, policy) {
  const config = makeLevel('level-' + level, seed);
  const world = createWorld(config);
  assert.ok(world.enemies.length && world.player.mass > 0);
  const p = world.player;
  const radius = (policy === 'local' ? 0.27 : 2) * Math.min(world.width, world.height);
  const throttle = policy === 'local' ? 0.7 : 1;
  const corners = [[.78,.22],[.78,.78],[.22,.78],[.22,.22],[.5,.5]];
  let corner = seed % corners.length, first = null, eaten = 0, nextScan = 0, nextEvent = 0;
  let input = {x:0,y:0,action:false}, target = null;
  let maxMass = p.mass;
  while (world.status === 'playing' && world.time < timeLimit) {
    if (policy !== 'idle' && world.time >= nextScan) {
      const hazards = world.enemies.filter(e => e.mass >= p.mass);
      if (!target || !world.enemies.includes(target) || target.mass >= p.mass) target = null;
      const alternative = nearestCandidate(world, radius, hazards);
      if (!target || (alternative && dist(p, alternative) < dist(p, target) * .65)) target = alternative;
      let destination = target;
      if (!destination) {
        const [x,y] = corners[corner % corners.length];
        destination = {x:x * world.width, y:y * world.height};
        if (dist(p,destination) < 75) corner++;
      }
      input = steer(world, destination, hazards, throttle, corner % 2 ? -1 : 1);
      nextScan = world.time + .2;
    }
    stepWorld(world,input,dt);
    const events = world.events || [];
    // Some engines keep the whole event log, others emit per-tick. Accept either.
    if (events.length < nextEvent) nextEvent = 0;
    for (let i=nextEvent; i<events.length; i++) {
      if (events[i].type === 'eat' && ['spike','hole'].includes(events[i].target)) {
        eaten++;
        first ??= world.time;
      }
    }
    nextEvent = events.length;
    maxMass = Math.max(maxMass,p.mass);
    assert.ok(Number.isFinite(world.time) && Number.isFinite(p.mass) && p.mass >= 0);
  }
  return {level,seed,policy,status:world.status,elapsed:+world.time.toFixed(1),
    firstEnemy:first === null ? null : +first.toFixed(1),eaten,peak:Math.round(maxMass),
    remaining:world.enemies.length,largest:Math.round(world.largest || 0)};
}

for (const level of levels) {
  for (let seed=1; seed<=totalSeeds; seed++) {
    for (const policy of ['local','direct','idle']) console.log(JSON.stringify(run(level,seed,policy)));
  }
}
