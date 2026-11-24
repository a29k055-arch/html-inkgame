import {RevealMask} from '../src-v5/reveal/mask.js';
import {DROP_SHAPE,DROP_VARIANTS,dropSilhouette} from '../src-v5/reveal/drop-shape.js';
import {REVEAL_CONFIG} from '../src-v5/reveal/config.js';

// This is the painting's alpha, integrated over its entire surface. The simulation
// owns it so an unvisited corner cannot turn painted when a camera zooms or pans.
const MIN_PAINTED_AREA=.80;
const REGION_COLS=16,REGION_ROWS=12;
// Each original ink-drop silhouette has its own transparent margins. Measure
// its visible edge so different brush variants reach the same physical radius.
const DROP_REACH=Array.from({length:DROP_VARIANTS},(_,variant)=>{
  const pixels=dropSilhouette(variant),n=DROP_SHAPE.size;
  let reach=0;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    if(pixels[y*n+x]>=8)reach=Math.max(reach,Math.hypot(x+.5-n/2,y+.5-n/2)*2/n);
  }
  return reach;
});
export function enemyBloomRadius(mass){
  // Radius in world units, measured to the furthest ink in the drop artwork.
  return 4*Math.sqrt(Math.max(0,mass));
}

class PondPainting extends RevealMask {
  constructor(width,height){
    super({...REVEAL_CONFIG,width,height,columns:Math.min(400,Math.max(96,Math.round(width/14)))});
    this.seen=0;this.clock=0;this.lastMark=null;this.dirty=null;
    this.footprints=new Map();this.largeWashes=[];this.seeps=[];this.traveled=0;
  }
  get fraction(){return Math.max(0,Math.min(1,this.completion));}
  // Once the total pigment is high enough, maintain the area of 192 regions
  // incrementally. Zoom, the minimap and the current painting texture are never
  // consulted. A repeated check of an unchanged mask is constant time.
  get nearlyComplete(){
    if(this.fraction<MIN_PAINTED_AREA)return false;
    if(this.checkedVersion===this.version)return this.qualified;
    if(!this.regions)this.buildRegions();
    this.qualified=this.gapsAreSmall();
    this.checkedVersion=this.version;
    return this.qualified;
  }
  buildRegions(){
    const n=REGION_COLS*REGION_ROWS;
    const ink=new Float64Array(n),area=new Uint32Array(n),owner=new Uint8Array(this.cells.length);
    for(let y=0;y<this.rows;y++){
      const row=Math.floor(y*REGION_ROWS/this.rows)*REGION_COLS;
      for(let x=0;x<this.cols;x++){
        const k=y*this.cols+x,id=row+Math.floor(x*REGION_COLS/this.cols);
        owner[k]=id;area[id]++;ink[id]+=this.cells[k];
      }
    }
    this.regions={ink,area,owner,blank:new Uint8Array(n),queue:new Uint8Array(n)};
  }
  commit(k,value){
    const old=this.cells[k];
    const changed=super.commit(k,value);
    if(changed&&this.regions)this.regions.ink[this.regions.owner[k]]+=this.cells[k]-old;
    return changed;
  }
  recount(){
    this.regions=null;
    return super.recount();
  }
  fill(value){
    this.regions=null;
    super.fill(value);
  }
  gapsAreSmall(){
    const {ink,area,blank,queue}=this.regions;
    const w=REGION_COLS,h=REGION_ROWS,n=w*h;
    for(let i=0;i<n;i++)blank[i]=Number(ink[i]<area[i]*.46);
    // Examine the corners independently. Fine gaps in the border are normal,
    // but an entire untouched corner still reads as a missing piece of the art.
    for(const i of [0,w-2,(h-2)*w,(h-1)*w-2]){
      const coverage=ink[i]+ink[i+1]+ink[i+w]+ink[i+w+1];
      const size=area[i]+area[i+1]+area[i+w]+area[i+w+1];
      if(coverage<size*.26)return false;
    }
    // Flood-fill only mostly blank regions. A narrow path through the paper
    // may be long; it only counts as a large hole when it is also two regions
    // wide. Several separate islands never add up to one big unpainted blot.
    for(let start=0;start<n;start++){
      if(blank[start]!==1)continue;
      let next=0,count=1,wide=false;queue[0]=start;blank[start]=2;
      while(next<count){
        const k=queue[next++],col=k%w;
        if(col<w-1&&k+w+1<n&&blank[k+1]&&blank[k+w]&&blank[k+w+1])wide=true;
        if(col>0&&blank[k-1]===1){blank[k-1]=2;queue[count++]=k-1;}
        if(col<w-1&&blank[k+1]===1){blank[k+1]=2;queue[count++]=k+1;}
        if(k>=w&&blank[k-w]===1){blank[k-w]=2;queue[count++]=k-w;}
        if(k+w<n&&blank[k+w]===1){blank[k+w]=2;queue[count++]=k+w;}
      }
      if(wide&&count>=7)return false;
    }
    return true;
  }
  recordFootprint(p){
    const x=Math.floor(p.x/this.width*28),y=Math.floor(p.y/this.height*18),key=x+y*28;
    const previous=this.footprints.get(key);
    if(!previous || p.r>previous.r*1.12)this.footprints.set(key,{x:p.x,y:p.y,r:p.r});
    if(previous)return 0;
    const last=this.lastFresh;
    this.lastFresh={x:p.x,y:p.y};
    return last?Math.min(Math.hypot(p.x-last.x,p.y-last.y),Math.hypot(this.width/28,this.height/18)):0;
  }
  soakFootprints(e,bloomRadius,fromTravel=false){
    if(this.nearlyComplete)return;
    // This is capillary flow along previously explored paper, independent of
    // the last rival's size. Its own drop always stops at one enemy diameter.
    const shore=Math.min(this.width,this.height);
    const cap=fromTravel?Math.min(shore*.32,Math.max(shore*.15,e.r*4)):shore*.42;
    const sources=[...this.footprints.values()];
    // Filled edges of earlier major washes also carry ink. Sample the actual
    // paper alpha to avoid inventing routes through an unpainted bay.
    for(const old of this.largeWashes)for(let i=0;i<20;i++){
      const angle=i*Math.PI/10;
      for(const reach of [.62,.86]){
        const x=old.x+Math.cos(angle)*old.r*reach,y=old.y+Math.sin(angle)*old.r*reach;
        if(x>=0&&y>=0&&x<=this.width&&y<=this.height&&this.at(x,y)>.40)
          sources.push({x,y,r:Math.min(cap*.23,old.r*.15)});
      }
    }
    if(!sources.length)return;
    if(!this.regions)this.buildRegions();
    const {ink,area}=this.regions,tiles=[],candidates=[];
    for(let i=0;i<ink.length;i++){
      const x=((i%REGION_COLS)+.5)*this.width/REGION_COLS;
      const y=(Math.floor(i/REGION_COLS)+.5)*this.height/REGION_ROWS;
      const dry=1-ink[i]/area[i];
      // The direct final bloom is already on its way to the impact site.
      tiles.push({x,y,dry:Math.hypot(x-e.x,y-e.y)<bloomRadius*.70?dry*.14:dry});
      if(dry<.23)continue;
      let nearest=null,distance=Infinity;
      for(const mark of sources){
        const d=(mark.x-x)**2+(mark.y-y)**2;
        if(d<distance){distance=d;nearest=mark;}
      }
      distance=Math.sqrt(distance);
      const spread=Math.min(cap,.75*cap+nearest.r*1.45);
      if(distance>spread*1.55)continue;
      // Don't create a second, oversized impact mark around the final prey.
      if(Math.hypot(nearest.x-e.x,nearest.y-e.y)<bloomRadius*1.6)continue;
      // A connected tongue of ink expands into the dry side of the stroke.
      // Its centre moves less than its radius and remains joined to that stroke.
      const shift=Math.min(1,spread*.57/Math.max(1,distance));
      candidates.push({...nearest,spread,toX:nearest.x+(x-nearest.x)*shift,toY:nearest.y+(y-nearest.y)*shift});
    }
    for(const c of candidates){
      c.reach=tiles.map(tile=>Math.min(1,Math.max(0,(1-Math.hypot(tile.x-c.toX,tile.y-c.toY)/c.spread)/.35)));
    }
    // Choose fresh paper each time. A cluster of overlapping wet strokes
    // must not divert all the returning ink from a different open shore.
    const limit=fromTravel?2:12;
    for(let opened=0;opened<limit&&candidates.length;opened++){
      let best=-1,benefit=.12;
      for(let i=0;i<candidates.length;i++){
        const reach=candidates[i].reach;
        let score=0;
        for(let j=0;j<tiles.length;j++)score+=tiles[j].dry**2*reach[j];
        if(score>benefit){benefit=score;best=i;}
      }
      if(best<0)break;
      const [mark]=candidates.splice(best,1);
      for(let j=0;j<tiles.length;j++)tiles[j].dry*=1-mark.reach[j]*.94;
      const distance=Math.hypot(mark.x-e.x,mark.y-e.y)/Math.hypot(this.width,this.height);
      delete mark.reach;
      this.seeps.push({...mark,age:-.26-distance*.48,
        duration:fromTravel?5:.9,opacity:fromTravel?.90:.94});
    }
  }
  update(dt){
    super.update(dt);
    for(const s of this.seeps){
      s.age+=dt;if(s.age<=0)continue;
      const t=Math.min(1,s.age/s.duration),radius=s.r+(s.spread-s.r)*(1-(1-t)**2);
      const slide=1-(1-t)**2;
      this.brush(s.x+(s.toX-s.x)*slide,s.y+(s.toY-s.y)*slide,radius,s.opacity);
    }
    if(this.seeps.length)this.seeps=this.seeps.filter(s=>s.age<s.duration);
  }
  markDirty(x,y,r){
    const sx=this.cols/this.width,sy=this.rows/this.height;
    const left=Math.max(0,Math.floor((x-r)*sx)-2),top=Math.max(0,Math.floor((y-r)*sy)-2);
    const right=Math.min(this.cols,Math.ceil((x+r)*sx)+2),bottom=Math.min(this.rows,Math.ceil((y+r)*sy)+2);
    const d=this.dirty;
    this.dirty=d?{left:Math.min(d.left,left),top:Math.min(d.top,top),right:Math.max(d.right,right),bottom:Math.max(d.bottom,bottom)}
                :{left,top,right,bottom};
  }
  brush(x,y,r,amount){
    const version=this.version;
    super.brush(x,y,r,amount);
    if(version!==this.version)this.markDirty(x,y,r*1.13);
  }
  stampDrop(b){
    const version=this.version;
    super.stampDrop(b);
    if(version!==this.version)this.markDirty(b.x,b.y,b.r*1.42);
  }
}

export function createPaintingProgress(width,height){return new PondPainting(width,height);}

export function updatePaintingProgress(world,dt){
  const mask=world.painting;
  for(;mask.seen<world.events.length;mask.seen++){
    const e=world.events[mask.seen];
    if(e.type==='eat'&&(e.target==='spike'||e.target==='hole')){
      const radius=enemyBloomRadius(e.mass??(e.r/2)**2);
      const bloom=mask.reveal(e.x,e.y,radius);
      bloom.r=radius/DROP_REACH[bloom.variant];
      if(e.major){
        if(world.majorRemaining===0)mask.soakFootprints(e,radius);
        else mask.largeWashes.push({x:e.x,y:e.y,r:radius});
      }
    }
  }
  mask.clock+=dt;
  if(mask.clock<1/12)return;
  const elapsed=mask.clock;mask.clock=0;
  if(mask.blooms.length||mask.seeps.length)mask.update(elapsed);
  const p=world.player,r=p.r*(p.emitting?1.28:1.04);
  const newDistance=mask.recordFootprint(p);
  const last=mask.lastMark;
  if(!last){
    mask.lastMark={x:p.x,y:p.y,r};
    mask.brush(p.x,p.y,r,.96);
    return;
  }
  const distance=Math.hypot(p.x-last.x,p.y-last.y);
  if(distance<Math.max(.9,r*.1)&&Math.abs(r-last.r)<1)return;
  // Every stretch of real swimming sends a slow wash along a wet part of the
  // route already left behind. This occurs even in a stretch with no catches.
  const shore=Math.min(mask.width,mask.height);
  if(distance<Math.max(145,r*4)){
    mask.traveled+=newDistance;
    if(mask.traveled>=shore*.18){
      mask.traveled%=shore*.18;
      mask.soakFootprints(p,r*1.4,true);
    }
  }
  // Separate dabs follow the actual path, with smoothly feathered wet edges.
  // Don't join positions across a tutorial reset/teleport.
  const spacing=Math.max(3,Math.min(r,last.r)*.48);
  const steps=distance<Math.max(145,r*4)?Math.max(1,Math.ceil(distance/spacing)):1;
  for(let i=1;i<=steps;i++){
    const t=i/steps,brush=last.r+(r-last.r)*t;
    mask.brush(last.x+(p.x-last.x)*t,last.y+(p.y-last.y)*t,brush,.96);
  }
  mask.lastMark={x:p.x,y:p.y,r};
}
