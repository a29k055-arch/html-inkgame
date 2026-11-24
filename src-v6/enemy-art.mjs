// Independent painted materials. The collision and edible-state rings belong to the
// simulation and HUD; the brushwork is allowed to breathe inside that silhouette.
export const enemyArtFiles = Object.freeze({
  urchin: new URL('./art/urchin-ink.webp?paint=2', import.meta.url).href,
  spines: new URL('./art/urchin-breath.webp?paint=2', import.meta.url).href,
  vortex: new URL('./art/vortex-ink.webp', import.meta.url).href
});

const TAU = 2 * Math.PI;
const ATLAS_COLUMNS = 4;
const ATLAS_FRAMES = 16;
// Measured on the originals: continuous opaque disk under the spines, and
// continuous white lip before the vortex turns into translucent brush strokes.
const coreFraction={spike:.742,hole:.775};
const auraExtent=1.34;

function makePigment(rgb){
  const side=280,center=side/2,r=center/auraExtent;
  const sheet=document.createElement('canvas');sheet.width=sheet.height=side;
  const wash=sheet.getContext('2d');
  const color=a=>'rgba('+rgb+','+a+')';
  const g=wash.createRadialGradient(center,center,.78*r,center,center,center);
  for(const [at,alpha] of [[0,0],[.12,.015],[.28,.085],[.42,.21],[.52,.28],[.63,.25],[.76,.15],[.90,.045],[1,0]]){
    g.addColorStop(at,color(alpha));
  }
  wash.fillStyle=g;wash.fillRect(0,0,side,side);

  // The same curved wisps are shared by every body. Animation changes their
  // orientation and the independent grains' ages, never the collision radius.
  let seed=18271;
  const roll=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const wisps=document.createElement('canvas');wisps.width=wisps.height=side;
  const wc=wisps.getContext('2d');wc.translate(center,center);
  for(let i=0;i<340;i++){
    const a=roll()*TAU,rad=r*(.99+.27*roll()),size=(1+roll()*3)*(1.45-(rad/r-.99));
    const x=Math.cos(a)*rad,y=Math.sin(a)*rad;
    wc.save();wc.translate(x,y);wc.rotate(a+1.15+roll()*.74);wc.scale(1,.29+roll()*.44);
    const ink=wc.createRadialGradient(0,0,0,0,0,size*1.7);
    ink.addColorStop(0,color(.14+.24*roll()));ink.addColorStop(.48,color(.12));ink.addColorStop(1,color(0));
    wc.fillStyle=ink;wc.fillRect(-size*1.7,-size*1.7,size*3.4,size*3.4);wc.restore();
  }
  // A soft droplet has no hard circular centre, even when a giant is viewed
  // close up. The same sprite is baked into the overview animation.
  const fleck=document.createElement('canvas');fleck.width=fleck.height=24;
  const fc=fleck.getContext('2d'),falloff=fc.createRadialGradient(12,12,0,12,12,12);
  for(const [p,a] of [[0,.55],[.28,.45],[.6,.22],[.82,.07],[1,0]])falloff.addColorStop(p,color(a));
  fc.fillStyle=falloff;fc.fillRect(0,0,24,24);
  const grains=Array.from({length:68},()=>({angle:roll()*TAU,offset:roll(),span:.14+.15*roll(),
    drift:(roll()-.5)*.25,size:.006+.014*roll(),speed:.17+.22*roll()}));
  const cell=128,frames=24,columns=6;
  const distant=document.createElement('canvas');distant.width=cell*columns;distant.height=cell*frames/columns;
  const dc=distant.getContext('2d');
  for(let frame=0;frame<frames;frame++){
    const dx=cell*(frame%columns),dy=cell*Math.floor(frame/columns);
    dc.drawImage(wisps,dx,dy,cell,cell);
    dc.save();dc.translate(dx+cell/2,dy+cell/2);const rr=cell/(2*auraExtent);
    for(const g of grains){
      const age=(frame/frames*(g.speed>.30?2:1)+g.offset)%1;
      const a=g.angle+g.drift*age,orbit=rr*(1+g.span*age),size=rr*g.size*Math.sin(Math.PI*age);
      const x=Math.cos(a)*orbit,y=Math.sin(a)*orbit;
      const d=size*3.2;
      if(d>.03)dc.drawImage(fleck,x-.5*d,y-.5*d,d,d);
    }
    dc.restore();
  }
  return {wash:sheet,wisps,grains,fleck,distant,frames,columns,cell};
}


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
  const blue=makePigment('61,157,184'),red=makePigment('183,76,75'),grey=makePigment('51,61,62');
  function corona(c,e,phase,t,scale,material){
    const r=e.r,extent=r*auraExtent;
    c.save();c.translate(e.x,e.y);
    square(c,material.wash,extent);
    if(r*scale>=2.5){
      c.rotate(phase+t*(e.type==='hole'?.079:.046));
      if(r*scale<88){
        // At overview scale each fleck moves a fraction of a screen pixel
        // per phase. Composite the motes and paper grain in one texture call.
        const frame=Math.floor(((phase/TAU+t*.23)%1)*material.frames),cell=material.cell;
        const x=cell*(frame%material.columns),y=cell*Math.floor(frame/material.columns);
        c.drawImage(material.distant,x,y,cell,cell,-extent,-extent,extent*2,extent*2);
      }else{
        square(c,material.wisps,extent);
        for(const g of material.grains){
          const age=(t*g.speed+g.offset)%1;
          const angle=g.angle+g.drift*age,orbit=r*(1+g.span*age);
          const size=r*g.size*Math.sin(Math.PI*age);
          const x=Math.cos(angle)*orbit,y=Math.sin(angle)*orbit;
          const d=size*3.2;
          if(d>.03)c.drawImage(material.fleck,x-.5*d,y-.5*d,d,d);
        }
      }
    }
    c.restore();
  }
  let urchin, spines, vortex, urchinDetail, vortexThroat;
  // At pond scale a rival may only be five screen pixels wide. Bake its
  // actual painting, coloured wash and particle motion together, so hundreds
  // of little rivals sample a single modest texture instead of multiple
  // high-resolution paintings and rotated layers every display frame.
  const compositeExtent=1.39,cell=112,frames=24,columns=6;
  const thumbnails=new Map();
  function buildThumbnail(type,edible){
    const sheet=document.createElement('canvas');
    sheet.width=cell*columns;sheet.height=cell*frames/columns;
    const c=sheet.getContext('2d'),r=cell/(2*compositeExtent);
    c.imageSmoothingQuality='high';
    const material=edible?blue:red,radius=r/coreFraction[type];
    for(let i=0;i<frames;i++){
      c.save();c.translate((i%columns+.5)*cell,(Math.floor(i/columns)+.5)*cell);
      square(c,material.wash,r*auraExtent);
      const mc=material.cell,x=i%material.columns*mc,y=Math.floor(i/material.columns)*mc;
      c.drawImage(material.distant,x,y,mc,mc,-r*auraExtent,-r*auraExtent,2*r*auraExtent,2*r*auraExtent);
      if(type==='spike'){
        spineFrame(c,spines,Math.floor(i*ATLAS_FRAMES/frames),radius);
      }else{
        square(c,vortex,radius);
        c.rotate(.14*Math.sin(TAU*i/frames));square(c,vortexThroat,radius);
      }
      c.restore();
    }
    sheet.dataset.inkPainting=(type==='spike'?spines:vortex).currentSrc;
    const levels=[{sheet,cell}];
    for(const side of [56,28,14,7]){
      const mip=document.createElement('canvas');
      mip.width=side*columns;mip.height=side*frames/columns;
      const brush=mip.getContext('2d');brush.imageSmoothingQuality='high';
      brush.drawImage(levels.at(-1).sheet,0,0,mip.width,mip.height);
      mip.dataset.inkPainting=sheet.dataset.inkPainting;levels.push({sheet:mip,cell:side});
    }
    return levels;
  }
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
  ]).then(()=>{
    for(const type of ['spike','hole']){
      thumbnails.set(type,[buildThumbnail(type,false),buildThumbnail(type,true)]);
    }
  });

  function draw(context, enemy, worldTime, scale = 1, edible=false) {
    const hole = enemy.type === 'hole';
    if (hole ? !vortex : !spines && !urchin) return false;
    let phase = phases.get(enemy);
    if (phase === undefined) {
      phase = phaseFor(enemy.id);
      phases.set(enemy, phase);
    }
    const tile=thumbnails.get(enemy.type);
    if(tile&&enemy.r*scale<=34&&!(enemy.absorption&&worldTime-enemy.absorption.lastAt<.6)){
      const cycle=worldTime/(2.6+.3*Math.sin(phase))+phase/TAU;
      const frame=Math.floor((cycle-Math.floor(cycle))*frames),radius=enemy.r*compositeExtent;
      const px=radius*scale*2,level=tile[Number(edible)][px>56?0:px>28?1:px>14?2:px>7?3:4];
      context.save();context.translate(enemy.x,enemy.y);
      context.rotate(hole?phase+worldTime*.055:.48*Math.sin(phase)+.055*Math.sin(worldTime*.59+phase));
      context.imageSmoothingQuality='low';
      context.drawImage(level.sheet,(frame%columns)*level.cell,Math.floor(frame/columns)*level.cell,
        level.cell,level.cell,-radius,-radius,radius*2,radius*2);context.restore();
      return true;
    }
    // The simulation radius is stable when a tip or a thin painted mist moves.
    const radius = enemy.r / coreFraction[enemy.type];
    corona(context,enemy,phase,worldTime,scale,edible?blue:red);
    context.save();
    context.translate(enemy.x, enemy.y);
    if (hole) {
      // Light on the outer current turns slowly, while the throat twists and
      // contracts on contact. Its painted diameter still follows physical mass.
      const absorption = enemy.absorption;
      const age = absorption ? Math.max(0, worldTime - absorption.lastAt) : Infinity;
      const pull = Math.exp(-age * 3.5);
      context.rotate(phase + worldTime * .055);
      square(context, vortex, radius);
      context.rotate(.14 * Math.sin(worldTime * .29 + phase) + .12 * pull);
      const throatRadius = radius * (1 + .012 * Math.sin(worldTime * .63 + phase) - .075 * pull);
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
  function drawBubble(c,shot,t,scale){
    c.save();
    // The dying membrane thins to nothing; its interior stays clear and
    // the ink grains travel over the expanding edge just like a rival's wash.
    c.globalAlpha*=Math.min(1,Math.max(0,(shot.lifetime-shot.age)/.14));
    corona(c,shot,shot.angle||0,t+shot.age,scale,grey);
    c.restore();
  }
  return {ready,draw,drawBubble};
}
