// Deterministic pond physics. All positions and radii use painting coordinates.
import {resolveLivingRig} from '../src-v5/game/living-rigs.js';
import {createFoodField,visibleFood,removeFood,regrowFood} from './food-field.mjs';
import {createPaintingProgress,updatePaintingProgress} from './painting-progress.mjs';

const TICK = 1 / 60;
const EPSILON = 1e-8;
const TAU = Math.PI * 2;
export const radius = mass => 2 * Math.sqrt(Math.max(0, mass));
// The dragon keeps the head and body size of the original 1,750-ink form.
export const DRAGON_RADIUS = radius(1750) * 1.16;
export const playerRadius = (mass,form) => form==='dragon'?DRAGON_RADIUS:radius(mass)*(form==='fish'?.85:1);
const forms = { fish: 12, shrimp: 12, turtle: 12, dragon: 20 };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const touching = (a, b, tolerance = 0) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= (a.r + b.r + tolerance) ** 2;
const shielded = p => p.form === 'turtle' || p.form === 'dragon';
const bubbles = p => p.form === 'fish' || p.form === 'dragon';
const flakeShapes=['circle','triangle','square','pentagon'];
const jetMass=.55, jetRadius=2.65;
// Opaque outer edge of the V5 lotus-leaf-v2 painting at 15-degree intervals.
// The remainder of the source square is transparent padding.
const lotusEdge=[.88,.86,.86,.81,.80,.75,.76,.80,.83,.86,.88,.89,.88,.86,.82,.79,.78,.79,.73,.78,.84,.79,.79,.86];
export const isMajorEnemy = enemy => Boolean(enemy.cornerBoss || enemy.major);
export const canEat = (player, enemy) => player.mass > enemy.mass && enemy.mass > EPSILON;

function random(w) {
  w.rng = (Math.imul(1664525, w.rng) + 1013904223) >>> 0;
  return w.rng / 4294967296;
}
function emissionRoll(w){
  w.emissionRng=(Math.imul(1664525,w.emissionRng)+1013904223)>>>0;
  return w.emissionRng/4294967296;
}
function event(w, type, details = {}) {
  w.events.push({ seq: ++w.sequence, time: w.time, type, ...details });
}
function cue(w, type, details, key, interval = .42) {
  if ((w.cueTimes.get(key) ?? -Infinity) + interval <= w.time) {
    w.cueTimes.set(key, w.time);
    event(w, type, details);
  }
}
function body(w, def, prefix) {
  return { x: 0, y: 0, vx: 0, vy: 0, angle: 0, ...def, id: def.id ?? prefix + (++w.idCounter) };
}
function bounded(w, entity, bounce = false) {
  const {r} = entity;
  const x = clamp(entity.x, r, w.width-r), y = clamp(entity.y, r, w.height-r);
  if (bounce) {
    if (x !== entity.x && (entity.x-x)*entity.vx > 0) entity.vx *= -.72;
    if (y !== entity.y && (entity.y-y)*entity.vy > 0) entity.vy *= -.72;
  }
  entity.x = x; entity.y = y;
}
function syncPlayer(p) {
  p.r = playerRadius(p.mass,p.form);
}
export function spawnEnemy(w, def) {
  const e = body(w, def, 'enemy');
  e.mass = Math.max(EPSILON, def.mass ?? 50);
  e.r = radius(e.mass);
  e.type = def.type ?? 'spike';
  if(e.homeRadius){e.homeX=e.x;e.homeY=e.y;}
  e.kickX = 0; e.kickY = 0;
  w.enemies.push(e);
  if(isMajorEnemy(e))w.majorRemaining++;
  return e;
}
function dragonPresent(w){
  return w.player.form==='dragon'||w.player.inventory.some(item=>item.type==='dragon')||
    w.items.some(item=>item.type==='dragon');
}
export function spawnItem(w, def) {
  if(def.type==='dragon'&&dragonPresent(w))return null;
  const item = body(w, def, 'item');
  item.r = def.type==='dragon'?DRAGON_RADIUS:(def.r??17);
  item.angle = def.angle ?? Math.atan2(item.vy,item.vx);
  const ordinal=w.rigCounts.get(item.type) ?? 0;
  item.rigId=def.rigId ?? resolveLivingRig(item.type,undefined,w.tutorial?0:w.rigSeed+ordinal);
  w.rigCounts.set(item.type,ordinal+1);
  if((item.type==='fish'||item.type==='shrimp')&&(!w.tutorial||String(item.id).startsWith('lesson-'))){
    const phase=((w.rigSeed%997)*.017+ordinal*2.40+(item.vx<0?Math.PI:0))%TAU;
    const range=def.swimRange??(w.tutorial?21:item.type==='fish'?64:33);
    item.swim={phase,range,originX:item.x,originY:item.y,start:phase,age:0,
      course:Math.atan2(item.vy,item.vx)};
  }
  w.items.push(item);
  return item;
}
export function spawnDrop(w, def) {
  const d = body(w, def, 'drop');
  d.mass = def.mass ?? 2;
  d.r = def.r ?? clamp(radius(d.mass)*1.22,1.9,9);
  d.shape=def.shape ?? flakeShapes[Math.floor(emissionRoll(w)*flakeShapes.length)];
  d.angle=def.angle ?? emissionRoll(w)*TAU;
  d.readyAt = w.time + (def.delay ?? (def.ready === false ? .45 : 0));
  d.ready = w.time >= d.readyAt;
  w.drops.push(d);
  return d;
}
function flowerSites(w,leaf) {
  const r=Math.min(15,leaf.r*.18);
  const petalRadius=r*1.225;
  const centre=leaf.angle+(w.rigSeed%113)*.037+leaf.x*.013+leaf.y*.017;
  const arc=2*Math.asin(petalRadius/(leaf.r+petalRadius));
  let best=[];
  // Move the cluster as a whole around the rim until all stems fit between
  // the pad and the shore. This keeps a corner from splitting a flower bed.
  for(let i=0;i<72;i++){
    const base=centre+(i%2?1:-1)*Math.ceil(i/2)*TAU/72;
    const sites=[];
    for(const offset of [0,arc*1.16,-arc*1.36]){
      const angle=base+offset;
      const sector=((angle/TAU%1+1)%1)*lotusEdge.length,index=Math.floor(sector);
      const edge=lotusEdge[index]+(lotusEdge[(index+1)%lotusEdge.length]-lotusEdge[index])*(sector-index);
      const reach=Math.max(leaf.r+.5,leaf.r*1.05*edge+petalRadius*.94);
      const x=leaf.x+reach*Math.cos(angle),y=leaf.y+reach*Math.sin(angle);
      if(x<petalRadius||x>w.width-petalRadius||y<petalRadius||y>w.height-petalRadius)continue;
      if(sites.some(other=>Math.hypot(other.x-x,other.y-y)<2*petalRadius*.91))continue;
      sites.push({x,y,r,slot:sites.length});
    }
    if(sites.length===3)return sites;
    if(sites.length>best.length)best=sites;
  }
  return best;
}
function placeFlower(leaf) {
  const site=leaf.sites.find(s=>!leaf.flowers.some(f=>f.slot===s.slot));
  if(site)leaf.flowers.push({...site,id:leaf.id+'-f'+site.slot,mass:leaf.capacity});
}
export function spawnLeaf(w, def) {
  const leaf = body(w, def, 'leaf');
  leaf.r = def.r ?? 66; leaf.capacity = def.capacity ?? w.flowerMass;
  leaf.stored = def.stored ?? 0; leaf.flowers = [];
  leaf.sites=flowerSites(w,leaf);
  const count = Array.isArray(def.flowers) ? def.flowers.length : def.flowers ?? 0;
  for(let i=0;i<Math.min(3,count);i++) placeFlower(leaf);
  w.leaves.push(leaf);
  return leaf;
}
export function createWorld(config = {}) {
  const seed=config.seed ?? 1;
  // Appearance has its own per-species sequence. Selecting a fish painting
  // must never draw from the generator that controls currents and arrivals.
  let rigSeed=typeof seed==='number'?seed>>>0:2166136261;
  if(typeof seed!=='number')for(const c of String(seed))rigSeed=Math.imul(rigSeed^c.charCodeAt(0),16777619)>>>0;
  const w = {kind:config.kind,width:config.width ?? 1800,height:config.height ?? 1100,
    speed:(config.speed ?? 150)*.86, seed, rng:seed>>>0, rigSeed, rigCounts:new Map(),
    time:0, remainder:0, status:'playing', tutorial:!!config.tutorial,
    spawnItems:config.spawnItems ?? !config.tutorial, nextItem:config.nextItem ?? 9,
    itemInterval:config.itemInterval ?? 13, flowerMass:config.flowerMass ?? 30,
    idCounter:0,sequence:0,events:[],cueTimes:new Map(),contacts:new Map(),
    enemies:[], enemySweep:[], drops:[], leaves:[], items:[], departingItems:[], shots:[], safePath:[],
    largest:0, majorRemaining:0, held:false, waitRelease:false, nextJet:0, bubbleDelay:0,
    emissionRng:(rigSeed^0x2ef54bc1)>>>0,
    travel:0, recordedMove:false};
  const p = w.player = body(w,{x:w.width/2,y:w.height/2,mass:100,...config.player},'player');
  p.form='ink'; p.formTime=0; p.activeItem=null; p.emitting=false; p.inventory=[];
  syncPlayer(p);
  if(!w.tutorial && config.spawnItems!==false) w.stalemate={milestone:p.mass,lastGain:0,checkAt:1,retryAt:0};
  w.painting=createPaintingProgress(w.width,w.height);
  w.foodField=createFoodField(w.width,w.height,config.foodSpacing,rigSeed,config.foodMassScale);
  for (const def of config.enemies ?? []) spawnEnemy(w,def);
  for (const def of config.drops ?? []) spawnDrop(w,def);
  for (const def of config.leaves ?? []) spawnLeaf(w,def);
  for(const def of config.items??[]){
    if(def.type==='dragon'&&!w.tutorial)sendDragonFromBank(w,def,{id:def.id,rigId:def.rigId});
    else spawnItem(w,def);
  }
  w.largest = Math.max(0,...w.enemies.map(e=>e.mass));
  w.safePath.push({x:p.x,y:p.y});
  return w;
}

function bank(w,leaf,ink) {
  const amount = Math.max(0,Math.min(ink, (leaf.sites.length-leaf.flowers.length)*leaf.capacity-leaf.stored));
  leaf.stored += amount;
  while(leaf.flowers.length < leaf.sites.length && leaf.stored + EPSILON >= leaf.capacity) {
    leaf.stored=Math.max(0,leaf.stored-leaf.capacity);
    placeFlower(leaf);
    event(w,'bloom',{id:leaf.id});
  }
  return amount;
}
function paidInk(w,shot,mass,vx=0,vy=0) {
  if(mass>EPSILON)spawnDrop(w,{x:clamp(shot.x,3,w.width-3),y:clamp(shot.y,3,w.height-3),
    vx,vy,mass,shape:shot.shape,angle:shot.angle,r:shot.r,delay:.48});
}
function deposit(w,leaf,shot) {
  const stored=bank(w,leaf,shot.mass);
  if(stored>EPSILON) cue(w,'store',{id:leaf.id,mass:stored},'store:'+leaf.id,.18);
  paidInk(w,shot,shot.mass-stored);
}
function shoot(w,type,mass=0,growth=0) {
  const p=w.player;
  const bubble=type==='bubble';
  const mid=p.angle+(bubble?0:Math.PI);
  const spread=(bubble?9:17)*Math.PI/180;
  const bearing=mid+(2*emissionRoll(w)-1)*spread;
  const dx=Math.cos(bearing),dy=Math.sin(bearing);
  const v=bubble?215+emissionRoll(w)*78:(151+emissionRoll(w)*100)*(1+.68*growth);
  const r=bubble?3.9+emissionRoll(w)*2.6:jetRadius;
  const shot=body(w,{type,x:p.x+dx*(p.r+2),y:p.y+dy*(p.r+2),
    vx:dx*v,vy:dy*v,dx,dy,mass,r,thrust:bubble?1200:815*(1+1.8*growth),angle:emissionRoll(w)*TAU,
    shape:bubble?'circle':flakeShapes[Math.floor(emissionRoll(w)*flakeShapes.length)],
    lifetime:bubble?.79+.16*emissionRoll(w):.255+.195*emissionRoll(w),age:0},'shot');
  if(type==='spray'){
    const leaf=w.leaves.find(l=>distance(l,p)<=l.r || distance(l,shot)<=l.r);
    if(leaf){ deposit(w,leaf,shot); return; }
  }
  w.shots.push(shot);
}
function restoreClearance(w) {
  const p=w.player;
  const clear=pos=>pos.x>=p.r && pos.x<=w.width-p.r && pos.y>=p.r && pos.y<=w.height-p.r &&
    w.enemies.every(e=>canEat(p,e)||distance(e,pos)>=e.r+p.r-.2);
  if(clear(p)) return;
  for(let i=w.safePath.length-1;i>=0;i--) {
    if(clear(w.safePath[i])) {
      p.x=w.safePath[i].x;p.y=w.safePath[i].y;return;
    }
  }
}
function changeForm(w,item) {
  const p=w.player,oldRadius=p.r;
  p.activeItem=item;
  p.form=item?.type ?? 'ink'; p.formTime=forms[p.form] ?? 0;
  syncPlayer(p);
  if(!shielded(p) && p.r>oldRadius)restoreClearance(w);
  p.emitting=false;
  w.waitRelease=w.held;
  event(w,'form',{form:p.form,id:item?.id ?? null});
}
export function useItem(w,index) {
  if(w.status!=='playing' || !Number.isInteger(index) || !w.player.inventory[index]) return false;
  const item=w.player.inventory[index];
  if(!Object.hasOwn(forms,item.type)) return false;
  w.player.inventory.splice(index,1);
  // If a dragon is awakened on its pickup frame, its only painted body is now
  // the incoming player form. Retire the collected copy still fading in place.
  if(item.type==='dragon')w.departingItems=w.departingItems.filter(other=>other!==item);
  changeForm(w,item);
  return true;
}
function playerStep(w,input,dt) {
  const p=w.player;
  w.held=!!input.action;
  if(!w.held) w.waitRelease=false;
  if(p.formTime>0) {
    p.formTime=Math.max(0,p.formTime-dt);
    if(p.formTime<1e-7) changeForm(w,null);
  }
  const ix=Number(input.x)||0,iy=Number(input.y)||0;
  const len=Math.hypot(ix,iy),strength=Math.min(1,len);
  const requested=len>EPSILON?Math.atan2(iy,ix):p.angle;
  const currentSpeed=Math.hypot(p.vx,p.vy);
  if(input.keyboard && currentSpeed>2 && strength>.015){
    // A key changes the requested bearing instantly. Steer through the turn
    // at steady swimming speed so successive quarter-turns describe a circle.
    const bearing=Math.atan2(p.vy,p.vx);
    const turn=Math.atan2(Math.sin(requested-bearing),Math.cos(requested-bearing));
    p.angle=bearing+clamp(turn,-4.8*dt,4.8*dt);
  }else p.angle=requested;
  p.emitting=w.held&&!w.waitRelease;
  const growth=clamp(Math.log2(Math.max(1,p.mass/156))/7,0,1);
  const formSpeed=p.form==='fish'?1.60:p.form==='dragon'?1.18:p.form==='turtle'?.85:1;
  const cruise=w.speed*(.88+.78*growth)*formSpeed;
  let speed=cruise*strength;
  if(p.emitting && !bubbles(p)) {
    // Each visible flake is paid for once at launch. A larger body emits
    // slightly more often; one stroke never sheds a percentage of its mass.
    if(p.mass>jetMass+EPSILON){
      if(w.time+EPSILON>=w.nextJet){
        p.mass-=jetMass;syncPlayer(p);shoot(w,'spray',jetMass,growth);
        const rate=7+2.4*growth;
        w.nextJet=w.time+(.72+.56*emissionRoll(w))/rate;
        cue(w,'spray',{},'spray',.3);
      }
      speed+=cruise*(.14+.42*growth);
    }else p.emitting=false;
  } else {
    if(p.emitting) {
      w.bubbleDelay-=dt;
      if(w.bubbleDelay<=0) {
        shoot(w,'bubble'); event(w,'bubble',{form:p.form}); w.bubbleDelay=.22+emissionRoll(w)*.14;
      }
    } else w.bubbleDelay=0;
  }
  const dx=Math.cos(p.angle),dy=Math.sin(p.angle);
  if(speed===0){
    // With no thrust, water drag acts on the actual velocity vector. Releasing a
    // stick mid-turn must keep that tangent, just like releasing the keyboard.
    const drag=Math.exp(-1.8*dt);
    p.vx*=drag;p.vy*=drag;
    if(currentSpeed>.1)p.angle=Math.atan2(p.vy,p.vx);
  }else if(input.keyboard){
    const ease=1-Math.exp(-dt*9);
    const nextSpeed=currentSpeed+(speed-currentSpeed)*ease;
    p.vx=dx*nextSpeed;p.vy=dy*nextSpeed;
  }else{
    const ease=1-Math.exp(-dt*15);
    p.vx+=(dx*speed-p.vx)*ease;p.vy+=(dy*speed-p.vy)*ease;
  }
  if(speed===0 && Math.hypot(p.vx,p.vy)<.1) p.vx=p.vy=0;
  p.x+=p.vx*dt;p.y+=p.vy*dt;
  bounded(w,p);
  if(strength>.04){ w.travel+=Math.hypot(p.vx,p.vy)*dt;
    if(!w.recordedMove && w.travel>=2){ event(w,'move');w.recordedMove=true; }
  }
}
function obstacle(w,e) {
  for(const l of w.leaves){
    const dx=e.x-l.x,dy=e.y-l.y,d=Math.hypot(dx,dy);
    const gap=l.r+e.r-d;
    if(gap<=0)continue;
    const nx=d?dx/d:1,ny=d?dy/d:0;
    e.x+=nx*gap;e.y+=ny*gap;
    const inward=e.vx*nx+e.vy*ny;
    if(inward<0){e.vx-=1.2*inward*nx;e.vy-=1.2*inward*ny;}
  }
  bounded(w,e,true);
}
function projectileStep(w,dt) {
  for(const s of w.shots){
    s.x+=s.vx*dt;s.y+=s.vy*dt;s.age+=dt;
    if(s.type==='spray') {
      const leaf=w.leaves.find(l=>distance(s,l)<=l.r);
      if(leaf){deposit(w,leaf,s);s.done=true;continue;}
    }
    const e=w.enemies.find(e=>e.mass>EPSILON&&touching(e,s));
    if(e) {
      const impulse=Math.min(160,s.thrust/Math.max(10,e.mass));
      e.kickX+=s.dx*impulse;e.kickY+=s.dy*impulse;
      event(w,'push',{id:e.id,target:e.type,source:s.type,form:w.player.form});
    }
    if(e || s.age>=s.lifetime || s.x<2 || s.x>w.width-2 || s.y<2 || s.y>w.height-2) {
      if(s.type==='spray') paidInk(w,s,s.mass,s.vx*.18,s.vy*.18);
      s.done=true;
    }
  }
  w.shots=w.shots.filter(s=>!s.done);
}
export function magnetReach(p){return p.form==='dragon'?260:158;}
function magnet(w,obj,dt,kind) {
  const p=w.player;
  if((p.form!=='shrimp' && p.form!=='dragon') || obj.mass>=p.mass) return;
  const d=distance(obj,p),reach=p.r+magnetReach(p);
  if(!d || d>=reach) return;
  const speed=(kind==='drop'?205:40)*(p.form==='dragon'?1.25:1) * (.5+.5*(1-d/reach));
  const travel=Math.min(speed*dt,d);
  obj.x+=(p.x-obj.x)*travel/d; obj.y+=(p.y-obj.y)*travel/d;
  cue(w,'magnet',{target:kind,id:obj.id,form:p.form},'magnet:'+kind,.5);
}
function drift(w,dt) {
  for(const e of w.enemies) {
    e.x+=(e.vx+e.kickX)*dt; e.y+=(e.vy+e.kickY)*dt;
    if(e.homeRadius){
      // The large foragers patrol their own banks. Reflect their natural drift
      // at its rim; bubbles and paid jets can still push them out of the bank.
      const dx=e.x-e.homeX,dy=e.y-e.homeY,d=Math.hypot(dx,dy);
      const outward=dx*e.vx+dy*e.vy;
      if(d>=e.homeRadius && outward>0){e.vx-=2*outward*dx/(d*d);e.vy-=2*outward*dy/(d*d);}
    }
    const drag=Math.exp(-dt*1.45);
    e.kickX*=drag;e.kickY*=drag;
    magnet(w,e,dt,e.type);
    obstacle(w,e);
  }
  for(const d of w.drops) {
    d.x+=d.vx*dt;d.y+=d.vy*dt;
    const drag=Math.exp(-dt*1.7);
    d.vx*=drag;d.vy*=drag;
    d.ready=w.time>=d.readyAt;
    if(d.ready) magnet(w,d,dt,'drop');
    bounded(w,d);
  }
}
function foods(w) {
  const p=w.player;
  // The current carries a dense, edible field. Query only neighbouring squares
  // for each body. A magnet promotes individual flecks to drifting particles
  // without leaving a second copy in the field.
  const field=w.foodField;
  if(field){
    field.time=w.time;
    const nibble=(b,player)=>{
      const attracts=player&&(p.form==='shrimp'||p.form==='dragon');
      const reach=b.r+(attracts?magnetReach(p):5);
      for(const d of visibleFood(field,b.x-reach,b.y-reach,b.x+reach,b.y+reach)){
        const dist2=(d.x-b.x)**2+(d.y-b.y)**2;
        if((!player||d.mass<b.mass) && dist2<=(b.r+d.r)**2){
          removeFood(field,d);b.mass+=d.mass;
          if(player){syncPlayer(p);event(w,'eat',{target:'drop',id:d.id,mass:d.mass});}
          else b.r=radius(b.mass);
        }else if(attracts && d.mass<p.mass && dist2<reach*reach){
          removeFood(field,d);spawnDrop(w,{x:d.x,y:d.y,mass:d.mass,shape:d.shape,r:d.r,angle:d.rot});
        }
      }
    };
    nibble(p,true);
    for(const e of w.enemies)if(e.mass>EPSILON)nibble(e,false);
    regrowFood(field,w);
  }
  for(const d of w.drops) {
    if(!d.ready) continue;
    if(d.mass<p.mass && touching(p,d)) {
      p.mass+=d.mass;syncPlayer(p);d.done=true;
      event(w,'eat',{target:'drop',id:d.id,mass:d.mass});
      continue;
    }
    for(const e of w.enemies){
      if(e.mass>EPSILON&&touching(e,d)){e.mass+=d.mass;e.r=radius(e.mass);d.done=true;break;}
    }
  }
  w.drops=w.drops.filter(d=>!d.done);
  for(const leaf of w.leaves){
    leaf.flowers=leaf.flowers.filter(f=>{
      if(!touching(p,f)) return true;
      p.mass+=f.mass; syncPlayer(p); event(w,'flower',{id:leaf.id,mass:f.mass});return false;
    });
  }
}
function contact(w,a,b,next) {
  const key=a.id<b.id?a.id+'/'+b.id:b.id+'/'+a.id;
  let info=w.contacts.get(key);
  if(!info) info={base:Math.min(a.mass,b.mass)};
  next.set(key,info);
  return info;
}
function enemyContacts(w,dt,next) {
  // Scan only pairs whose horizontal extents overlap. Keep the canonical
  // gameplay list in its authored order for pickups, rendering and replays.
  const es=w.enemySweep;
  es.length=0;
  for(const e of w.enemies){
    e.sweepLeft=e.x-e.r;es.push(e);
  }
  es.sort((a,b)=>a.sweepLeft-b.sweepLeft);
  for(let i=0;i<es.length;i++) {
    const a=es[i];
    for(let j=i+1;j<es.length;j++){
      const b=es[j];
      if(a.mass<=EPSILON || b.sweepLeft>a.x+a.r+EPSILON)break;
      if(b.mass<=EPSILON || !touching(a,b,EPSILON))continue;
      const c=contact(w,a,b,next);
      if(!c.noted){c.noted=true;event(w,'enemyContact',{a:a.type,b:b.type,aId:a.id,bId:b.id});}
      if(a.type===b.type){
        let loss=Math.min(a.mass,b.mass,c.base*.10*dt);
        // If both equal bodies would annihilate, keep one drawable remnant
        // of each until the player can collect the last marked opponent.
        if((isMajorEnemy(a)||isMajorEnemy(b)) && Math.abs(a.mass-b.mass)<=EPSILON){
          loss=Math.min(loss,Math.max(0,Math.min(a.mass,b.mass)-1));
        }
        a.mass-=loss;b.mass-=loss;
      }else if(a.mass!==b.mass){
        const transfer=Math.min(a.mass,b.mass,c.base*.19*dt);
        const sign=a.mass>b.mass?1:-1;
        a.mass+=sign*transfer;b.mass-=sign*transfer;
      }
      // If wildlife consumes a marked rival, its surviving opponent inherits
      // the ink. Finishing that living successor fulfils the same objective.
      const donor=a.mass<=EPSILON?a:b.mass<=EPSILON?b:null;
      if(donor && isMajorEnemy(donor)){
        const survivor=donor===a?b:a;
        survivor.major=true;
        if(donor.cornerBoss && !survivor.cornerBoss){
          survivor.cornerBoss=true;survivor.cornerSlot=donor.cornerSlot;
        }
      }
      a.r=radius(a.mass);b.r=radius(b.mass);
      // Bodies compress while exchanging ink, allowing a visible sustained contact.
      const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
      const overlap=(a.r+b.r)*.77-d;
      if(overlap>0) {
        const nx=d>EPSILON?dx/d:1,ny=d>EPSILON?dy/d:0;
        const share=b.mass/Math.max(EPSILON,a.mass+b.mass);
        a.x-=nx*overlap*share;a.y-=ny*overlap*share;
        b.x+=nx*overlap*(1-share);b.y+=ny*overlap*(1-share);
      }
    }
  }
  for(const e of es) if(e.mass>EPSILON) obstacle(w,e);
}
function playerContacts(w,dt,next) {
  const p=w.player;
  const onLeaf=w.leaves.some(leaf=>distance(leaf,p)<=leaf.r);
  for(const e of w.enemies){
    if(e.mass<=EPSILON || p.mass<=EPSILON || !touching(e,p,EPSILON)) continue;
    const c=contact(w,p,e,next);
    if(canEat(p,e)){
      // A little mote takes a few strokes to dissolve. A near-peer or large
      // rival takes longer. Each transfer is paid exactly once by the donor.
      if(!c.sipRate){
        const seconds=.72+.36*Math.min(1,e.mass/p.mass)+.85*Math.log10(1+e.mass/40)+.61*Math.sqrt(e.mass/1600);
        c.sipRate=e.mass/seconds;
      }
      const amount=Math.min(e.mass,c.sipRate*dt),previousR=e.r;
      p.mass+=amount;e.mass-=amount;e.r=radius(e.mass);syncPlayer(p);
      e.absorbedByPlayer=(e.absorbedByPlayer??0)+amount;e.sipLastAt=w.time;
      if(e.mass<=EPSILON){
        const mass=e.absorbedByPlayer;
        event(w,'eat',{target:e.type,id:e.id,mass,x:e.x,y:e.y,r:radius(mass),
          major:isMajorEnemy(e),cornerBoss:!!e.cornerBoss,cornerSlot:e.cornerSlot});
      }else{
        // Only close the gap created by the lost radius this tick. Pulling the
        // centre toward the player during ordinary overlap makes prey shadow a
        // swimmer even without an active magnet.
        const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy);
        if(d>EPSILON){
          const shift=clamp(d-p.r-e.r,0,previousR-e.r);
          e.x+=dx/d*shift;e.y+=dy/d*shift;
        }
      }
      continue;
    }
    if(shielded(p)) {
      cue(w,'shield',{id:e.id,target:e.type,form:p.form},'shield:'+e.id,.6);
    } else if(!onLeaf && (e.type==='spike' || e.mass>p.mass)) {
      const amount=Math.min(p.mass,e.mass,c.base*(e.type==='spike'?.10:.19)*dt);
      p.mass-=amount;e.mass+=amount*(e.type==='spike'?-1:1);
      syncPlayer(p);e.r=radius(e.mass);
      if(e.type==='hole'){
        if(!c.absorption || w.time-c.absorption.lastAt>dt*1.5){
          c.absorption={amount:0,startedAt:w.time,lastAt:w.time};
        }
        c.absorption.amount+=amount;c.absorption.lastAt=w.time;
        e.absorption=c.absorption;
      }
      cue(w,'damage',{id:e.id,target:e.type,mass:amount},'damage:'+e.id,.5);
    }
    const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy);
    const overlap=p.r+e.r-d-.3;
    if(overlap>0){
      p.x+=(d?dx/d:1)*overlap;p.y+=(d?dy/d:0)*overlap;
    }
  }
  bounded(w,p);
  w.enemies=w.enemies.filter(e=>e.mass>EPSILON);
}
function enterItem(w){
  const roll=random(w);
  const type=roll<.33?'fish':roll<.63?'shrimp':roll<.94||dragonPresent(w)?'turtle':'dragon';
  if(type==='dragon'){sendDragonFromBank(w,w.player);return;}
  const side=type==='shrimp'?(random(w)<.5?1:3):Math.floor(random(w)*4);
  const vertical=side%2===0;
  const target=w.player;
  const x=vertical?clamp(target.x+(random(w)-.5)*520,25,w.width-25):(side===1?-14:w.width+14);
  const y=vertical?(side===0?-14:w.height+14):clamp(target.y+(random(w)-.5)*420,25,w.height-25);
  const tx=clamp(target.x+(random(w)-.5)*160,30,w.width-30);
  const ty=clamp(target.y+(random(w)-.5)*160,30,w.height-30);
  let angle=Math.atan2(ty-y,tx-x);
  if(type==='shrimp'){
    const pitch=clamp(Math.atan2(ty-y,Math.abs(tx-x)),-.27,.27);
    angle=side===1?pitch:Math.PI-pitch;
  }
  const speed=type==='fish'?38:type==='shrimp'?30:23;
  spawnItem(w,{x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,angle,type,arriving:true});
}
// The nose enters from the nearest shore. Initial travel starts entirely
// beyond the painting, including the horns in front of the rig's head.
export function sendDragonFromBank(w,target,options={}){
  if(dragonPresent(w))return null;
  const px=clamp(target.x,25,w.width-25),py=clamp(target.y,25,w.height-25);
  const margins=[px,w.width-px,py,w.height-py];
  const side=margins.indexOf(Math.min(...margins));
  const outside=DRAGON_RADIUS*2.2;
  const x=side===0?-outside:side===1?w.width+outside:px;
  const y=side===2?-outside:side===3?w.height+outside:py;
  const angle=Math.atan2(py-y,px-x),speed=options.rescue?87:75;
  return spawnItem(w,{type:'dragon',id:options.id,rigId:options.rigId,
    x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,angle,arriving:true,rescue:!!options.rescue,
    route:{x:px,y:py,speed,entering:true,follow:!!options.rescue}});
}
function swimDragon(w,item,dt){
  const route=item.route;
  if(route.entering && item.x>=0 && item.x<=w.width && item.y>=0 && item.y<=w.height)route.entering=false;
  if(route.follow){
    route.x=w.player.x;route.y=w.player.y;
    if(distance(item,w.player)<Math.max(65,w.player.r+42))route.follow=false;
  }
  if(!route.entering&&distance(route,item)<35){
    // Choose a distant interior waypoint so it swims back through the pond
    // instead of despawning at a bank or turning in tiny circles.
    const u=item.x/w.width<.5?.63+.22*random(w):.15+.22*random(w);
    const v=item.y/w.height<.5?.60+.25*random(w):.15+.25*random(w);
    route.x=w.width*u;route.y=w.height*v;
  }
  const heading=Math.atan2(route.y-item.y,route.x-item.x);
  const difference=Math.atan2(Math.sin(heading-item.angle),Math.cos(heading-item.angle));
  item.angle+=clamp(difference,-1.85*dt,1.85*dt);
  item.vx=Math.cos(item.angle)*route.speed;item.vy=Math.sin(item.angle)*route.speed;
  item.x+=item.vx*dt;item.y+=item.vy*dt;
}
// Resident fish patrol a small loop around their authored location. Shrimp
// spend most of each cycle resting, then swim in a short, shallow side stroke.
function swimItem(w,item,dt){
  if(item.route){swimDragon(w,item,dt);return;}
  const m=item.swim;
  if(!m){item.x+=item.vx*dt;item.y+=item.vy*dt;return;}
  m.age+=dt;
  if(item.arriving){
    const shrimp=item.type==='shrimp';
    const wave=Math.sin(m.phase+m.age*.60);
    const speed=shrimp?6+24*Math.pow(Math.max(0,wave),2):34+5*wave;
    const theta=m.course+(shrimp?.045:.15)*Math.sin(m.phase+m.age*.46);
    item.vx=speed*Math.cos(theta);item.vy=speed*Math.sin(theta);
    item.x+=item.vx*dt;item.y+=item.vy*dt;
    return;
  }
  const fish=item.type==='fish';
  const cadence=fish?.39:.81*Math.max(0,Math.sin(m.age*.81+m.start)-.08)**2;
  m.phase+=dt*cadence;
  const x=m.originX+m.range*(Math.sin(m.phase)-Math.sin(m.start));
  const y=m.originY+m.range*(fish?.42:.18)*(Math.sin(m.phase+(fish?Math.PI/2:0))-Math.sin(m.start+(fish?Math.PI/2:0)));
  const nx=clamp(x,12,w.width-12),ny=clamp(y,12,w.height-12);
  item.vx=(nx-item.x)/dt;item.vy=(ny-item.y)/dt;
  item.x=nx;item.y=ny;
}
function itemStep(w,dt) {
  if(w.spawnItems && w.time>=w.nextItem) {
    if(w.items.length<7) enterItem(w);
    w.nextItem=w.time+w.itemInterval*(.8+.4*random(w));
  }
  // A collected swimmer is immediately removed from gameplay while the
  // original rig finishes its last stroke at the point of collection.
  for(const item of w.departingItems){
    const t=clamp((w.time-item.pickedAt)/.56,0,1);
    item.opacity=1-t*t*(3-2*t);
    item.x+=item.vx*dt*(1-t);item.y+=item.vy*dt*(1-t);
  }
  w.departingItems=w.departingItems.filter(item=>item.opacity>0);
  for(const item of w.items) {
    swimItem(w,item,dt);
    if(Math.abs(item.vx)+Math.abs(item.vy)>.01) item.angle=Math.atan2(item.vy,item.vx);
    if(!item.route?.entering && distance(w.player,item)<=w.player.r && w.player.inventory.length<3){
      w.player.inventory.push(item);item.picked=true;item.pickedAt=w.time;
      w.departingItems.push(item);
      event(w,'pickup',{id:item.id,form:item.type});
    }
  }
  w.items=w.items.filter(i=>!i.picked && (i.type==='dragon'||
    (i.x>=-32 && i.y>=-32 && i.x<=w.width+32 && i.y<=w.height+32)));
}
// Small drips of floating ink should not postpone help indefinitely. Measure
// real growth from the previous high-water mark, never from a damage dip.
function offerStalemateDragon(w){
  const state=w.stalemate;
  if(!state || w.time<state.checkAt)return;
  state.checkAt=w.time+1;
  const p=w.player;
  if(p.mass>=state.milestone*1.12){
    state.milestone=p.mass;state.lastGain=w.time;
  }
  const retreated=p.mass<state.milestone*.68 && w.time-state.lastGain>=12;
  if((w.time-state.lastGain<38&&!retreated) || w.time<state.retryAt || w.travel<60)return;
  const item=sendDragonFromBank(w,p,{rescue:true});
  if(!item)return;
  state.retryAt=w.time+65;
  event(w,'dragonArrived',{id:item.id});
}
function tick(w,input,dt) {
  w.time+=dt;
  playerStep(w,input,dt);
  for(const l of w.leaves) bank(w,l,l.capacity*dt/30);
  projectileStep(w,dt);drift(w,dt);foods(w);itemStep(w,dt);
  offerStalemateDragon(w);
  const contacts=new Map();
  enemyContacts(w,dt,contacts);playerContacts(w,dt,contacts);w.contacts=contacts;
  w.largest=0;w.majorRemaining=0;
  for(const e of w.enemies){
    w.largest=Math.max(w.largest,e.mass);
    if(isMajorEnemy(e))w.majorRemaining++;
  }
  const p=w.player;
  if(distance(p,w.safePath[w.safePath.length-1])>5) {
    w.safePath.push({x:p.x,y:p.y});
    if(w.safePath.length>120) w.safePath.shift();
  }
  updatePaintingProgress(w,dt);
  if(p.mass<=EPSILON) {w.status='lost';event(w,'lose');}
  else if(!w.tutorial && p.mass>w.largest && !w.majorRemaining && w.painting.nearlyComplete) {
    w.status='won';event(w,'win');
  }
}
export function stepWorld(w,input={},dt=TICK) {
  if(w.status!=='playing' || !Number.isFinite(dt) || dt<=0) return w;
  w.remainder+=Math.min(dt,1);
  while(w.remainder+1e-10>=TICK && w.status==='playing'){
    tick(w,input,TICK);w.remainder=Math.max(0,w.remainder-TICK);
  }
  return w;
}
