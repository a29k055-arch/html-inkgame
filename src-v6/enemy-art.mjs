// Independent painted materials. The collision and edible-state rings belong to the
// simulation and HUD; the brushwork is allowed to breathe inside that silhouette.
export const enemyArtFiles = Object.freeze({
  urchin: new URL('./art/urchin-ink.webp', import.meta.url).href,
  spines: new URL('./art/urchin-breath.webp', import.meta.url).href,
  vortex: new URL('./art/vortex-ink.webp', import.meta.url).href
});

const TAU = 2 * Math.PI;
const ATLAS_COLUMNS = 4;
const ATLAS_FRAMES = 16;

function loadPainting(url) {
  const image = new Image();
  image.decoding = 'async';
  return new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Ink painting unavailable: ' + url));
    image.src = url;
  });
}

// A feathered portion of the same original can move on a slower current. A
// feathered detail layer also keeps large sea urchins crisp at maximum zoom.
function softCenter(image, solidFraction, outerFraction) {
  const side = image.naturalWidth;
  const layer = document.createElement('canvas');
  layer.width = layer.height = side;
  const brush = layer.getContext('2d');
  brush.drawImage(image, 0, 0);
  brush.globalCompositeOperation = 'destination-in';
  const r = side / 2;
  const fade = brush.createRadialGradient(r, r, r * solidFraction, r, r, r * outerFraction);
  fade.addColorStop(0, '#000');
  fade.addColorStop(1, 'transparent');
  brush.fillStyle = fade;
  brush.fillRect(0, 0, side, side);
  return layer;
}

function phaseFor(id) {
  let hash = 2166136261;
  for (const letter of String(id)) hash = Math.imul(hash ^ letter.charCodeAt(0), 16777619);
  return ((hash >>> 0) / 4294967296) * TAU;
}

function square(context, image, radius) {
  context.drawImage(image, -radius, -radius, 2 * radius, 2 * radius);
}

function spineFrame(context, image, frame, radius) {
  const size = image.naturalWidth / ATLAS_COLUMNS;
  const x = frame % ATLAS_COLUMNS;
  const y = Math.floor(frame / ATLAS_COLUMNS);
  context.drawImage(image, x * size, y * size, size, size, -radius, -radius, 2 * radius, 2 * radius);
}

export function createEnemyArt() {
  const phases = new WeakMap();
  let urchin, spines, vortex, urchinDetail, vortexThroat;
  const ready = Promise.all([
    loadPainting(enemyArtFiles.urchin).then(image => {
      urchin = image;
      urchinDetail = softCenter(image, .51, .66);
    }),
    loadPainting(enemyArtFiles.spines).then(image => { spines = image; }),
    loadPainting(enemyArtFiles.vortex).then(image => {
      vortex = image;
      vortexThroat = softCenter(image, .25, .63);
    })
  ]);

  function draw(context, enemy, worldTime, scale = 1) {
    const hole = enemy.type === 'hole';
    if (hole ? !vortex : !spines && !urchin) return false;
    let phase = phases.get(enemy);
    if (phase === undefined) {
      phase = phaseFor(enemy.id);
      phases.set(enemy, phase);
    }
    const radius = enemy.r * 1.035;
    context.save();
    context.translate(enemy.x, enemy.y);
    if (hole) {
      // Light on the outer current turns slowly, while the throat twists and
      // contracts on contact. Its painted diameter still follows physical mass.
      const absorption = enemy.absorption;
      const age = absorption ? Math.max(0, worldTime - absorption.lastAt) : Infinity;
      const pull = Math.exp(-age * 3.5);
      context.rotate(phase + worldTime * .19);
      square(context, vortex, radius);
      context.rotate(.27 * Math.sin(worldTime * .64 + phase) + .22 * pull);
      const throatRadius = radius * (1 + .018 * Math.sin(worldTime * 1.45 + phase) - .075 * pull);
      square(context, vortexThroat, throatRadius);
    } else {
      context.rotate(.48 * Math.sin(phase) + .055 * Math.sin(worldTime * .59 + phase));
      if (spines) {
        const cycle = worldTime / (2.6 + .3 * Math.sin(phase)) + phase / TAU;
        const frame = (cycle - Math.floor(cycle)) * ATLAS_FRAMES;
        const whole = Math.floor(frame);
        spineFrame(context, spines, whole, radius);
        if (radius * scale > 36) {
          const alpha = context.globalAlpha;
          context.globalAlpha = alpha * (frame - whole);
          spineFrame(context, spines, (whole + 1) % ATLAS_FRAMES, radius);
          context.globalAlpha = alpha;
        }
        if (urchinDetail && radius * scale > 120) square(context, urchinDetail, radius);
      } else {
        square(context, urchin, radius);
      }
    }
    context.restore();
    return true;
  }
  return {ready, draw};
}
