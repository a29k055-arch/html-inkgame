import {InkCreature,INK_CREATURE_REV,sampleCurve,makeCurve,projectPoint} from '../../previews/creature-rig/runtime/ink-creature.mjs';
import {coreRadius} from '../game/alien-geometry.js';

// A rig's head is not its collision center. The transverse section through these
// torso anchors is measured from the alpha-bearing body, excluding fins/feelers.
export const LIVING_RIGS=Object.freeze({fish:'fish_04',shrimp:'shrimp_07',turtle:'turtle_02',dragon:'dragon_04'});
export const LIVING_VARIANTS=Object.freeze({fish:Object.freeze(['fish_04','fish_01','fish_02','fish_04_special']),shrimp:Object.freeze(['shrimp_07','shrimp_04','shrimp_05']),turtle:Object.freeze(['turtle_02','turtle_08']),dragon:Object.freeze(['dragon_04'])});
export const LIVING_ANCHORS=Object.freeze({fish:.35,shrimp:.30,turtle:.555,dragon:.06});
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sharedKeys=['bodyImage','bodyOrder','bodyBounds','layers','sourceImage','mesh'];
let warm;
const progressListeners=new Set();let warmProgress={loaded:0,total:0,stage:'rig'};
export const NPC_ANIMATION=Object.freeze({fish:{frames:48,seconds:1/(.38+(1.55-.38)*.65)},shrimp:{frames:48,seconds:1/(.24+(.9-.24)*.65)},turtle:{frames:48,seconds:1/.28},dragon:{frames:72,seconds:1/(.16+(.42-.16)*.65)}});
const PREPARATION_TOTAL=Object.entries(LIVING_VARIANTS).reduce((n,[species,ids])=>n+ids.length*(NPC_ANIMATION[species].frames+2),0);
const preparationYield=()=>new Promise(resolve=>setTimeout(resolve,0));
const reportPreparation=(stage,loaded)=>{warmProgress={loaded,total:PREPARATION_TOTAL,stage};for(const listener of progressListeners)listener(warmProgress);};
export const livingSpecies=e=>e?.form?.species&&e.form.remaining>0?e.form.species:e?.species;
const isPlayer=e=>e?.controller?.type==='human'||e?.id==='human';
const seedOf=e=>[...String(e?.id||'living')].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,17)/4294967296;
const point=(p,s)=>{const i=clamp(s,0,1)*(p.length-1),a=p[Math.floor(i)],b=p[Math.min(p.length-1,Math.ceil(i))],t=i%1;return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};};
export function anchorOffset(pose,s,t=0){const p=sampleCurve(pose.targetCurve,s);return pose.mapPoint(s,t);}

// Same constant-arc-length R4 dragon integration, sampled twice as densely only
// for the player's tight S pose. No NPC or approved preview prototype is changed.
export function playerDragonPose(creature,count=96){
 const p=creature.profile,N=count,points=[[creature.x,creature.y]],straight=creature.mode==='straight';
 const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);},amp=straight?0:p.idle+(p.amplitude-p.idle)*creature.drive;
 for(let i=1;i<=N;i++){const s=(i-.5)/N,flexible=smooth((s-.08)/.14),wave=amp*flexible*Math.cos(s*TAU*p.waves-creature.wavePhase),delay=smooth(s)*p.delay;
  const angle=(straight?creature.heading:creature.angleAt(creature.time-delay))+Math.PI+wave*creature.handedness;
  points.push([points.at(-1)[0]+Math.cos(angle)*creature.length/N,points.at(-1)[1]+Math.sin(angle)*creature.length/N]);
 }return points;
}
export function denseDragonMesh(data,width,height,curve,origin={x:0,y:0},resolution=84){
 const cell=Math.max(width,height)/resolution,nx=Math.ceil(width/cell),ny=Math.ceil(height/cell),vertices=[],triangles=[],occupied=new Uint8Array(nx*ny);
 for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){const px=x*width/nx,py=y*height/ny;vertices.push({x:px,y:py,...projectPoint(curve,px+origin.x,py+origin.y)});}
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>2)occupied[Math.min(ny-1,Math.floor(y/height*ny))*nx+Math.min(nx-1,Math.floor(x/width*nx))]=1;
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++)if(occupied[y*nx+x]){const a=y*(nx+1)+x,b=a+1,c=a+nx+1,d=c+1;triangles.push([a,b,d],[a,d,c]);}
 return{vertices,triangles,activeIndices:[...new Set(triangles.flat())]};
}
function playerDragonDetail(asset){
 if(asset.playerDragonDetail)return asset.playerDragonDetail;
 const template=asset.template,b=template.bodyBounds,image=template.bodyImage;
 // The separate image identity is required: the runtime GPU cache uses image as
 // its key, so reusing the NPC image with a different index mesh would corrupt it.
 const x=Math.max(0,Math.floor(b.x)-2),y=Math.max(0,Math.floor(b.y)-2),right=Math.min(image.width,Math.ceil(b.x+b.w)+2),bottom=Math.min(image.height,Math.ceil(b.y+b.h)+2);
 const bodyImage=document.createElement('canvas');bodyImage.width=right-x;bodyImage.height=bottom-y;
 const context=bodyImage.getContext('2d',{willReadFrequently:true});context.drawImage(image,x,y,bodyImage.width,bodyImage.height,0,0,bodyImage.width,bodyImage.height);
 const pixels=context.getImageData(0,0,bodyImage.width,bodyImage.height).data,mesh=denseDragonMesh(pixels,bodyImage.width,bodyImage.height,template.sourceCurve,{x,y});
 asset.playerDragonDetail={bodyImage,mesh,bytes:bodyImage.width*bodyImage.height*4};return asset.playerDragonDetail;
}

function calibrate(creature,species){
 const image=creature.bodyImage,context=image.getContext('2d',{willReadFrequently:true}),{data}=context.getImageData(0,0,image.width,image.height);
 const section=at=>{const p=sampleCurve(creature.sourceCurve,at),span=Math.floor(Math.max(image.width,image.height)*.43),runs=[];let start=null,last=0;
  for(let d=-span;d<=span;d++){const x=Math.round(p.x-p.ty*d),y=Math.round(p.y+p.tx*d),solid=x>=0&&y>=0&&x<image.width&&y<image.height&&data[(y*image.width+x)*4+3]>32;
   if(solid){if(start===null)start=d;last=d;}else if(start!==null&&d-last>6){runs.push([start,last]);start=null;}}
  if(start!==null)runs.push([start,last]);
  // Use the connected torso crossing the spine, not a separated horn/fin/feeler.
  const run=runs.filter(([a,b])=>b-a>8).sort((a,b)=>Math.max(0,a[0],-a[1])-Math.max(0,b[0],-b[1]))[0];
  return run?{half:(run[1]-run[0])/2,mid:(run[0]+run[1])/2}:null;
 };
 const range=species==='fish'?[.15,.60,.025]:species==='shrimp'?[.04,.55,.025]:species==='dragon'?[.04,.085,.0075]:[LIVING_ANCHORS.turtle,LIVING_ANCHORS.turtle,.1];
 let s=LIVING_ANCHORS[species],cross=null;
 for(let candidate=range[0];candidate<=range[1]+.00001;candidate+=range[2]){const rows=[candidate-.012,candidate,candidate+.012].map(section).filter(Boolean).sort((a,b)=>a.half-b.half);if(rows.length<3)continue;const stable=rows[0].half/rows[2].half;if(stable<.62)continue;const q=rows[1];if(!cross||q.half>cross.half){cross=q;s=candidate;}}
 if(!cross)throw Error('No solid torso section for '+species);
 const source=sampleCurve(creature.sourceCurve,s);
 const lengthPerRadius=creature.sourceCurve.length/cross.half,anchorT=cross.mid/creature.sourceCurve.length;
 creature.reset(0,0,0);const b=creature.visualBounds(),a=creature.mapPoint(s,anchorT);
 const extent=Math.max(...[[b.minX,b.minY],[b.minX,b.maxY],[b.maxX,b.minY],[b.maxX,b.maxY]].map(([x,y])=>Math.hypot(x-a.x,y-a.y)));
 // At most sixty alpha-weighted body points, measured once at startup. Separate
 // fin/antenna layers never enter these samples. Runtime collision never reads pixels.
 const bounds=creature.bodyBounds||{x:0,y:0,w:image.width,h:image.height},bodySamples=[];
 for(let gy=0;gy<10;gy++)for(let gx=0;gx<6;gx++){
  const x0=Math.max(0,Math.floor(bounds.x+bounds.w*gx/6)),x1=Math.min(image.width,Math.ceil(bounds.x+bounds.w*(gx+1)/6)),y0=Math.max(0,Math.floor(bounds.y+bounds.h*gy/10)),y1=Math.min(image.height,Math.ceil(bounds.y+bounds.h*(gy+1)/10));let weight=0,xSum=0,ySum=0;
  for(let y=y0;y<y1;y+=2)for(let x=x0;x<x1;x+=2){const alpha=data[(y*image.width+x)*4+3];if(alpha<38)continue;weight+=alpha;xSum+=x*alpha;ySum+=y*alpha;}
  if(weight)bodySamples.push({...projectPoint(creature.sourceCurve,xSum/weight,ySum/weight),w:weight,r:Math.hypot(x1-x0,y1-y0)*.5});
 }
 const total=bodySamples.reduce((n,p)=>n+p.w,0);for(const p of bodySamples)p.w/=total;
 const bodySections=[];for(let n=0;n<13;n++){const at=.025+n*.95/12,q=section(at);if(q)bodySections.push({s:at,t:q.mid/creature.sourceCurve.length,r:q.half});}
 return Object.freeze({anchorS:s,anchorT,sourceHalfWidth:cross.half,sourceAnchor:{x:source.x,y:source.y},lengthPerRadius,bubbleExtent:extent,bodySamples,bodySections,sourceArea:total*4/255,revision:INK_CREATURE_REV});
}

export async function preloadLivingCreatures({onProgress}={}){
 if(onProgress){progressListeners.add(onProgress);onProgress({...warmProgress,total:PREPARATION_TOTAL});}
 if(!warm)warm=Promise.all(Object.entries(LIVING_VARIANTS).flatMap(([species,ids])=>ids.map(async id=>{
  const template=await InkCreature.load(new URL('../../previews/creature-rig/'+id+'/rig.json',import.meta.url),{length:100,speed:0});reportPreparation('rig',warmProgress.loaded+1);return [id,{id,species,template,calibration:calibrate(template,species)}];
 }))).then(async rows=>{
  const byId=Object.fromEntries(rows),assets=Object.fromEntries(Object.entries(LIVING_RIGS).map(([species,id])=>[species,byId[id]]));Object.defineProperty(assets,'byId',{value:byId});
  playerDragonDetail(assets.dragon);
  for(const [id,asset]of rows){const species=asset.species;await bakeNPCAnimation(asset,species);const player={id:'human',controller:{type:'human'},form:{species,remaining:5}},c=clone(asset,player),canvas=document.createElement('canvas');canvas.width=canvas.height=160;const ctx=canvas.getContext('2d');ctx.translate(130,80);ctx.scale(.8,.8);c.draw(ctx);asset.playerWarm=c;reportPreparation('gpu',warmProgress.loaded+1);await preparationYield();}
  reportPreparation('ready',PREPARATION_TOTAL);return assets;
 }).catch(error=>{warm=null;warmProgress={loaded:0,total:PREPARATION_TOTAL,stage:'rig'};throw error;});
 try{return await warm;}finally{if(onProgress)progressListeners.delete(onProgress);}
}

function calmProfile(c){c.profile.amplitude*=.65;c.profile.idle*=.65;c.profile.appendage*=.75;c.profile.maxAngularVelocity*=.72;c.profile.maxAngularAcceleration*=.65;}
function mappedPoints(c,points,anchor){return(points||[]).map(p=>{const q=c.mapPoint(p.s,p.t);return{x:q.x-anchor.x,y:q.y-anchor.y,w:p.w,r:(p.r||0)*c.length/c.sourceCurve.length};});}
function bodyPoints(c,calibration,anchor){return mappedPoints(c,calibration.bodySamples,anchor);}
async function bakeNPCAnimation(asset,species){
 const config=NPC_ANIMATION[species],c=clone(asset,{id:'atlas-'+species,species}),poses=[];c.reset(0,0,0);c.drive=.65;c.locomotion=1;
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 for(let i=0;i<config.frames;i++){
  const phase=i/config.frames*TAU;c.time=phase/2.5;c.wavePhase=c.finPhase=c.gaitPhase=phase;c.pose=c.buildPose();c.targetCurve=makeCurve(c.pose,false);
  const a=c.mapPoint(asset.calibration.anchorS,asset.calibration.anchorT),b=c.visualBounds();minX=Math.min(minX,b.minX-a.x);minY=Math.min(minY,b.minY-a.y);maxX=Math.max(maxX,b.maxX-a.x);maxY=Math.max(maxY,b.maxY-a.y);
  poses.push({phase,anchor:a,body:bodyPoints(c,asset.calibration,a),sections:mappedPoints(c,asset.calibration.bodySections,a)});
 }
 const pad=2,bounds={x:minX-pad,y:minY-pad,w:maxX-minX+pad*2,h:maxY-minY+pad*2},pixels=Math.min(460/Math.max(bounds.w,bounds.h),Math.sqrt(30000/(bounds.w*bounds.h))),width=Math.ceil(bounds.w*pixels),height=Math.ceil(bounds.h*pixels),frames=[];
 for(const state of poses){
  c.time=state.phase/2.5;c.wavePhase=c.finPhase=c.gaitPhase=state.phase;c.pose=c.buildPose();c.targetCurve=makeCurve(c.pose,false);
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');ctx.setTransform(pixels,0,0,pixels,-(bounds.x+state.anchor.x)*pixels,-(bounds.y+state.anchor.y)*pixels);c.draw(ctx);frames.push({canvas,body:state.body,sections:state.sections});reportPreparation('animation',warmProgress.loaded+1);if(frames.length%3===0)await preparationYield();
 }
 const blendCanvas=document.createElement('canvas');blendCanvas.width=width;blendCanvas.height=height;asset.npcAtlas={bounds,frames,blendCanvas,seconds:config.seconds,bytes:width*height*4*(frames.length+1)};c.dispose();
}

function clone(asset,e){
 const c=new InkCreature(asset.template.rig,{length:100,speed:0});
 for(const key of sharedKeys)c[key]=asset.template[key];
 c.resourceEntry=asset.template.resourceEntry;c.resourceEntry.refs++;
 if(!isPlayer(e))calmProfile(c);
 // The long player dragon coils more tightly than the travelling event dragon.
 // This is a per-instance V5 pose profile; the approved R4 rig remains untouched.
 if(isPlayer(e)&&livingSpecies(e)==='dragon'){
  c.profile.idle=.66;c.profile.amplitude=.94;c.buildPose=function(){return playerDragonPose(this);};
  const detail=playerDragonDetail(asset);c.bodyImage=detail.bodyImage;c.mesh=detail.mesh;c.v5PlayerDetail=true;c.v5DetailBytes=detail.bytes;
 }
 if(c.species==='shrimp'){const update=c.update.bind(c);c.update=dt=>{update(dt);const inclination=clamp(c.inclination,-.50,.50);if(inclination!==c.inclination){c.inclination=inclination;c.inclinationVelocity=0;c.angularAcceleration=0;}c.heading=c.facing===1?c.inclination:Math.PI-c.inclination;c.pose=c.buildPose();c.targetCurve=makeCurve(c.pose,false);};}
 const phase=seedOf(e)*TAU;c.time=phase;c.wavePhase+=phase;c.finPhase=phase;c.gaitPhase=phase;
 const aim=e.aim&&Math.hypot(e.aim.x,e.aim.y)>.01?Math.atan2(e.aim.y,e.aim.x):0;
 let initial=Math.hypot(e.vx||0,e.vy||0)>1?Math.atan2(e.vy,e.vx):aim;if(c.species==='shrimp')initial=Math.cos(initial)<0?Math.PI:0;c.reset(0,0,initial);
 return c;
}
function release(record){record.creature.dispose();if(record.tile){record.tile.width=record.tile.height=1;}record.tile=null;}
function poseBounds(record){if(record.boundsPose!==record.creature.pose){record.boundsPose=record.creature.pose;record.localBounds=record.creature.visualBounds();}return record.localBounds;}

export class LivingPainter {
 constructor({assets=null}={}){this.assets=assets;this.ready=assets?Promise.resolve(assets):preloadLivingCreatures();this.records=new Map();this.playerSizes=new WeakMap();this.clock=0;this.bodyRevision=0;this.metrics={revision:INK_CREATURE_REV,loaded:0,drawn:0,animated:0,culled:0,tiles:0,liveRasters:0,sharedFrames:0,atlasBytes:0};this.disposed=false;}
 async prepare(entities=[]){this.assets=await this.ready;for(const e of entities)if(!e.dead&&LIVING_RIGS[livingSpecies(e)])this.ensure(e);return this;}
 ensure(e){const species=livingSpecies(e);if(!this.assets||!LIVING_RIGS[species])return null;const ids=LIVING_VARIANTS[species],requested=e.form?.rigId||e.rigId,id=requested&&ids.includes(requested)?requested:ids[(Math.max(0,e.skinIndex||0))%ids.length],asset=this.assets.byId?.[id]||this.assets[species];let q=this.records.get(e);if(q?.species!==species||q.asset!==asset){if(q)release(q);q={species,asset,rigId:asset.id||id,creature:clone(asset,e),calibration:asset.calibration,age:0,renderAge:Infinity,tile:null,world:null,visible:true};this.records.set(e,q);}e.rigId=q.rigId;return q;}
 configure(q,e){const r=coreRadius(e),c=q.creature,a=q.calibration,bubble=isPlayer(e)&&q.species==='shrimp',shown=isPlayer(e)?this.playerSizes.get(e)||r:r;
  const unitArea=(a.sourceArea||Math.PI*(c.sourceCurve.length/a.lengthPerRadius)**2)*(100/c.sourceCurve.length)**2;
  q.scale=bubble?shown*2.8/100:isPlayer(e)?shown*Math.sqrt(Math.PI/Math.max(.0001,unitArea)):r*a.lengthPerRadius/100;q.shownRadius=shown;q.renderRadius=bubble?shown:q.scale*100/a.lengthPerRadius;q.coreRadius=r;q.bubble=bubble;q.anchor=c.mapPoint(bubble?.30:a.anchorS,bubble?0:a.anchorT);q.x=e.x;q.y=e.y;}

 update(dt,arena,camera={x:0,y:0,scale:1},viewport={width:1200,height:900}){
  if(this.disposed)return;dt=clamp(Number(dt)||0,0,.1);this.clock+=dt;this.camera=camera;this.viewport=viewport;this.metrics.drawn=this.metrics.animated=this.metrics.culled=0;
  const entities=arena?.entities||[],player=arena?.player,alive=new Set(entities);if(player)alive.add(player);
  for(const [e,q]of this.records)if(!alive.has(e)||!LIVING_RIGS[livingSpecies(e)]){release(q);this.records.delete(e);delete e.livingBody;}
  for(const e of alive){if(e.dead)continue;if(isPlayer(e)){const before=this.playerSizes.get(e)??coreRadius(e);this.playerSizes.set(e,before+(coreRadius(e)-before)*(1-Math.exp(-dt*9)));}const q=this.ensure(e);if(!q)continue;this.configure(q,e);const radius=q.coreRadius,extent=radius*Math.max(2,q.calibration.lengthPerRadius*1.5),x=(e.x-camera.x)*camera.scale,y=(e.y-camera.y)*camera.scale,pad=extent*camera.scale;
   q.visible=isPlayer(e)||(x+pad>=0&&x-pad<viewport.width&&y+pad>=0&&y-pad<viewport.height);
   q.age+=dt;q.renderAge+=dt;const interval=isPlayer(e)?1/60:q.visible?1/30:1/6;
   if(q.age>=interval){const c=q.creature,speed=Math.hypot(e.vx||0,e.vy||0),maximum=Math.max(1,arena.speed?.(e,false)||100);c.setInput(speed>1?(e.vx||0)/Math.max(maximum,speed):0,speed>1?(e.vy||0)/Math.max(maximum,speed):0);c.update(Math.min(.1,q.age));q.age=0;this.configure(q,e);if(q.visible)this.metrics.animated++;}
   this.syncBody(q,e);
   if(!q.visible){this.metrics.culled++;if(q.tile&&this.clock-(q.lastDraw||0)>2){q.tile.width=q.tile.height=1;q.tile=null;q.world=null;}}
  }
  this.metrics.loaded=this.records.size;this.metrics.tiles=[...this.records.values()].filter(q=>q.tile).length;this.metrics.atlasBytes=Object.values(this.assets?.byId||this.assets||{}).reduce((n,a)=>n+(a.npcAtlas?.bytes||0),0);
 }
 atlasFrame(q,e){const atlas=q.asset?.npcAtlas||this.assets?.[q.species]?.npcAtlas;if(isPlayer(e)||!atlas)return null;const index=Math.floor(((this.clock/atlas.seconds+seedOf(e))%1)*atlas.frames.length);const fraction=((this.clock/atlas.seconds+seedOf(e))%1)*atlas.frames.length-index;return{atlas,index,fraction,frame:atlas.frames[index],next:atlas.frames[(index+1)%atlas.frames.length]};}
 syncBody(q,e){
  const sprite=this.atlasFrame(q,e),angle=sprite?(q.species==='shrimp'?q.creature.inclination*q.creature.facing:q.creature.heading):0,pose=sprite?sprite.index+Math.floor(sprite.fraction*16)/16+(q.species==='shrimp'?q.creature.shrimpTurnProgress*.001:0):q.creature.pose;
  if(q.bodyPose===pose&&q.bodyScale===q.scale&&Math.abs((q.bodyAngle??0)-angle)<.005)return;q.bodyPose=pose;q.bodyScale=q.scale;q.bodyAngle=angle;
  const k=q.scale,c=q.creature,a=q.anchor,co=Math.cos(angle),si=Math.sin(angle),mirror=sprite&&q.species==='shrimp'?q.creature.facing*Math.max(.08,q.creature.presentationWidth):1,transform=p=>({x:(p.x*mirror*co-p.y*si)*k,y:(p.x*mirror*si+p.y*co)*k,w:p.w,r:(p.r||0)*k});let samples,sections;
  if(q.bubble){samples=[];for(let ring=0;ring<4;ring++)for(let n=0;n<12;n++){const theta=(n+.5)*TAU/12,r=Math.sqrt((ring+.5)/4)*q.shownRadius;samples.push({x:Math.cos(theta)*r,y:Math.sin(theta)*r,w:1/48,r:q.shownRadius*.2});}sections=[{x:0,y:0,r:q.shownRadius}];}
  else{const interpolate=(rows,next)=>rows.map((p,i)=>{const b=next[i]||p,t=sprite.fraction;return{...p,x:p.x+(b.x-p.x)*t,y:p.y+(b.y-p.y)*t,r:p.r+(b.r-p.r)*t};});samples=(sprite?interpolate(sprite.frame.body,sprite.next.body):bodyPoints(c,q.calibration,a)).map(transform);sections=(sprite?interpolate(sprite.frame.sections,sprite.next.sections):mappedPoints(c,q.calibration.bodySections,a)).map(transform);}
  const bound=q.bubble?q.shownRadius:Math.max(q.coreRadius,...samples.map(p=>Math.hypot(p.x,p.y)+p.r));e.livingBody={species:q.species,coreRadius:q.coreRadius,samples,sections,bound,area:q.bubble?Math.PI*q.shownRadius**2:(q.calibration.sourceArea||0)*(c.length/c.sourceCurve.length*k)**2,revision:++this.bodyRevision};
 }
 pose(e){const q=this.records.get(e);if(!q||e.dead)return null;this.configure(q,e);const c=q.creature,a=q.anchor,k=q.scale,spine=c.pose.map(([x,y])=>{const p=c.presentationPoint({x,y});return{x:e.x+(p.x-a.x)*k,y:e.y+(p.y-a.y)*k};});
  return {species:q.species,coreRadius:q.coreRadius,worldRadius:q.renderRadius,renderRadius:q.renderRadius,heading:c.heading,spine,center:{x:e.x,y:e.y},anchorS:q.bubble?.30:q.calibration.anchorS,length:c.length*k,lengthPerRadius:c.length*k/Math.max(.001,q.renderRadius),extent:q.bubble?q.shownRadius:q.calibration.lengthPerRadius*q.coreRadius,revision:INK_CREATURE_REV};
 }
 playerPose(player){return this.pose(player);}
 visualPadding(e){const q=this.records.get(e),r=coreRadius(e);return r*(q?.bubble?1.1:(q?.calibration.lengthPerRadius||this.assets?.[livingSpecies(e)]?.calibration.lengthPerRadius||4)*1.25);}
 playerFrame(player){const q=this.records.get(player);if(!q)return null;this.configure(q,player);if(q.bubble){const r=q.shownRadius;return{minX:player.x-r,minY:player.y-r,maxX:player.x+r,maxY:player.y+r,coreRadius:r,species:q.species};}const b=poseBounds(q),a=q.anchor,k=q.scale;return{minX:player.x+(b.minX-a.x)*k,minY:player.y+(b.minY-a.y)*k,maxX:player.x+(b.maxX-a.x)*k,maxY:player.y+(b.maxY-a.y)*k,coreRadius:q.coreRadius,species:q.species};}
 raster(q,e,camera,viewport){
  const b=poseBounds(q),k=q.scale,a=q.anchor,world={x:e.x+(b.minX-a.x)*k,y:e.y+(b.minY-a.y)*k,w:(b.maxX-b.minX)*k,h:(b.maxY-b.minY)*k},pad=14/camera.scale;
  const x=Math.max(world.x-pad,camera.x-pad),y=Math.max(world.y-pad,camera.y-pad),right=Math.min(world.x+world.w+pad,camera.x+viewport.width/camera.scale+pad),bottom=Math.min(world.y+world.h+pad,camera.y+viewport.height/camera.scale+pad);
  if(!(right>x&&bottom>y))return false;
  const w=right-x,h=bottom-y,cap=viewport.mobile?768:1200,pixels=Math.min(camera.scale*Math.min(1.5,globalThis.devicePixelRatio||1),cap/Math.max(w,h),Math.sqrt(950000/(w*h)));
  const width=Math.max(1,Math.ceil(w*pixels)),height=Math.max(1,Math.ceil(h*pixels));q.tile??=document.createElement('canvas');if(q.tile.width!==width||q.tile.height!==height){q.tile.width=width;q.tile.height=height;}
  const c=q.tile.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,width,height);c.setTransform(pixels*k,0,0,pixels*k,(e.x-a.x*k-x)*pixels,(e.y-a.y*k-y)*pixels);c.save();q.creature.draw(c);c.restore();q.world={x,y,w,h};q.rasterX=e.x;q.rasterY=e.y;q.renderAge=0;this.metrics.liveRasters++;return true;
 }
 draw(ctx,e,index=0,entities=[],forced=null,contact=false){
  if(this.disposed||e.dead)return;const q=this.ensure(e);if(!q)return;const cam=this.camera||{x:0,y:0,scale:1},view=this.viewport||{width:1200,height:900};this.configure(q,e);if(!q.visible)return;
  const sprite=this.atlasFrame(q,e);if(sprite){const b=sprite.atlas.bounds;ctx.save();ctx.translate(e.x,e.y);ctx.rotate(q.species==='shrimp'?q.creature.inclination*q.creature.facing:q.creature.heading);ctx.scale(q.scale*(q.species==='shrimp'?q.creature.facing*Math.max(.08,q.creature.presentationWidth):1),q.scale);let picture=sprite.frame.canvas;const blend=sprite.atlas.blendCanvas;if(blend){const mixed=blend.getContext('2d');mixed.clearRect(0,0,blend.width,blend.height);mixed.globalCompositeOperation='source-over';mixed.globalAlpha=1-sprite.fraction;mixed.drawImage(sprite.frame.canvas,0,0);mixed.globalCompositeOperation='lighter';mixed.globalAlpha=sprite.fraction;mixed.drawImage(sprite.next.canvas,0,0);mixed.globalAlpha=1;mixed.globalCompositeOperation='source-over';picture=blend;}ctx.drawImage(picture,b.x,b.y,b.w,b.h);ctx.restore();q.lastDraw=this.clock;this.metrics.sharedFrames++;this.metrics.drawn++;return;}
  // Raster only real visible world pixels. Huge offscreen tails never allocate a
  // multi-thousand-pixel canvas, and each live rig shares the runtime GPU context.
  if(!q.tile||q.renderAge>=1/60||!q.world||Math.abs(cam.scale/(q.lastScale||cam.scale)-1)>.025||Math.abs(q.coreRadius/(q.lastRadius||q.coreRadius)-1)>.03||Math.hypot(e.x-q.rasterX,e.y-q.rasterY)*cam.scale>10){if(!this.raster(q,e,cam,view))return;q.lastScale=cam.scale;q.lastRadius=q.coreRadius;}
  q.lastDraw=this.clock;ctx.save();
  const w=q.world;ctx.drawImage(q.tile,w.x+e.x-q.rasterX,w.y+e.y-q.rasterY,w.w,w.h);ctx.restore();if(!contact)this.metrics.drawn++;
 }
 drawPlayer(ctx,player){const q=this.ensure(player);if(!q||player.dead)return;this.configure(q,player);if(!q.bubble){this.draw(ctx,player);return;}const r=q.shownRadius,scale=this.camera?.scale||1,x=player.x,y=player.y;
  ctx.save();const glass=ctx.createRadialGradient(x-r*.32,y-r*.40,r*.05,x,y,r);glass.addColorStop(0,'rgba(255,255,245,.15)');glass.addColorStop(.45,'rgba(210,237,233,.025)');glass.addColorStop(.80,'rgba(164,207,199,.04)');glass.addColorStop(.96,'rgba(182,222,215,.16)');glass.addColorStop(1,'rgba(235,249,234,.28)');ctx.fillStyle=glass;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore();
  this.draw(ctx,player);
  ctx.save();ctx.lineWidth=1.15/scale;ctx.strokeStyle='rgba(223,242,231,.70)';ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();ctx.strokeStyle='rgba(255,255,242,.82)';ctx.lineWidth=2.8/scale;ctx.beginPath();ctx.ellipse(x-r*.34,y-r*.37,r*.31,r*.16,-.70,-2.5,.4);ctx.stroke();ctx.strokeStyle='rgba(244,253,240,.32)';ctx.lineWidth=1/scale;ctx.beginPath();ctx.arc(x,y,r*.94,.40,1.30);ctx.stroke();ctx.restore();
 }

 // Reuse the live raster alpha: never include glow, bubbles or attraction waves.
 drawPlayerContact(ctx,player){if(!player?.form)return;this.draw(ctx,player,0,[],null,true);}
 snapshot(e){const q=this.records.get(e);return q?{...q.creature.snapshot(),calibration:q.calibration,rigId:q.rigId,renderRadius:q.renderRadius,worldScale:q.scale,physicalCenter:{x:e.x,y:e.y},worldSpeed:Math.hypot(e.vx||0,e.vy||0),coreRadius:coreRadius(e),frame:this.playerFrame(e),bubble:q.bubble,playerDragonDetail:!!q.creature.v5PlayerDetail,detailBytes:q.creature.v5DetailBytes||0,tile:q.tile?{width:q.tile.width,height:q.tile.height}:null}:null;}
 dispose(){if(this.disposed)return;this.disposed=true;for(const q of this.records.values())release(q);this.records.clear();this.metrics.loaded=this.metrics.tiles=0;}
}
