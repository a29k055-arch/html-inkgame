import assert from 'node:assert/strict';
import {createPaintingProgress,enemyBloomRadius,updatePaintingProgress} from '../src-v6/painting-progress.mjs';

function pond(width=3000,height=1800){
  return {painting:createPaintingProgress(width,height),player:{x:width/2,y:height/2,r:20},enemies:[],events:[]};
}
function advance(w,frames){
  for(let i=0;i<frames;i++)updatePaintingProgress(w,1/60);
}
function stroke(w){
  for(let x=125;x<725;x+=4){
    w.player.x=x;w.player.y=210+80*Math.sin(x*.009);
    advance(w,5);
  }
}

// The physics mask is also the renderer's source alpha, with an O(1) mean.
const w=pond();
advance(w,6);
const resting=w.painting.fraction;
advance(w,360);
assert.equal(w.painting.fraction,resting);
stroke(w);
advance(w,360);
const first=w.painting.fraction;
assert.ok(first>resting);
stroke(w);
assert.equal(w.painting.fraction,first);
assert.ok(Math.abs(first-w.painting.cells.reduce((a,b)=>a+b,0)/w.painting.cells.length)<1e-8);

function bloom(mass){
  const w=pond(1500,1100);
  w.player.x=30;w.player.y=30;
  w.events.push({type:'eat',target:'hole',x:750,y:550,mass});
  advance(w,120);
  const mask=w.painting,target=enemyBloomRadius(mass);
  assert.ok(mask.at(750,550)>.90);
  assert.equal(mask.blooms.length,0);
  let reach=0;
  for(let row=0;row<mask.rows;row++)for(let col=0;col<mask.cols;col++){
    const x=(col+.5)*mask.width/mask.cols,y=(row+.5)*mask.height/mask.rows;
    if(x<100&&y<100)continue;
    if(mask.cells[row*mask.cols+col]>0)assert.ok(Math.hypot(x-750,y-550)<=target,'The drop must stop at one prey diameter');
    if(mask.cells[row*mask.cols+col]>.03)reach=Math.max(reach,Math.hypot(x-750,y-550));
  }
  assert.ok(Math.abs(reach-target)<=Math.max(8,target*.04),`expected radius near ${target}, measured ${reach}`);
  return reach;
}
assert.equal(enemyBloomRadius(625),100);
assert.equal(enemyBloomRadius(10000),400);
bloom(625);bloom(10000);

// A proportionately large rival can reveal a small painting at its true scale.
const small=pond(100,70);
small.events.push({type:'eat',target:'spike',x:50,y:35,mass:900});
advance(small,6);
const start=small.painting.fraction;
advance(small,84);
assert.ok(start<.80 && small.painting.nearlyComplete);

function pattern(isPainted){
  const mask=createPaintingProgress(3600,2100);
  for(let y=0;y<mask.rows;y++)for(let x=0;x<mask.cols;x++){
    mask.cells[y*mask.cols+x]=isPainted((x+.5)/mask.cols,(y+.5)/mask.rows,x,y)?1:0;
  }
  mask.recount();
  return mask;
}
const speckles=pattern((u,v,x,y)=>(x+3*y)%6!==0);
assert.ok(speckles.fraction>.82 && speckles.fraction<.85);
assert.ok(speckles.nearlyComplete,'Distributed small islands should finish');
assert.ok(!pattern((u,v,x,y)=>(x+y)%4!==0).nearlyComplete,'Three quarters is insufficient');
const emptyCorner=pattern((u,v)=>u>.30 || v>.28);
assert.ok(emptyCorner.fraction>.90 && !emptyCorner.nearlyComplete);
const wholeBay=pattern((u,v)=>Math.abs(u-.5)>.2 || Math.abs(v-.5)>.19);
assert.ok(wholeBay.fraction>.84 && wholeBay.fraction<.86 && !wholeBay.nearlyComplete);
wholeBay.brush(wholeBay.width*.5,wholeBay.height*.5,wholeBay.height*.5,1);
assert.ok(wholeBay.nearlyComplete,'Ink arriving in a bay must update the cached regional verdict');
const fineCracks=pattern((u,v)=>Math.abs(v-.55)>.015&&Math.abs(u-.39)>.016);
assert.ok(fineCracks.nearlyComplete,'Thin continuous creases are smaller than an open bay');
// A last-corner wash can rewet the route already drawn; a shore the player
// never visited receives no pigment from this backflow.
const visited=pond(6000,3200);
visited.player.r=95;visited.player.y=1000;
for(let x=700;x<=2100;x+=14){visited.player.x=x;advance(visited,5);}
advance(visited,360);
const wash=visited.painting;
const probe=()=>Array.from({length:18},(_,i)=>wash.at(700+i*80,1175)).reduce((a,b)=>a+b,0);
const before=probe();
wash.soakFootprints({x:3400,y:1500},130);
assert.ok(wash.seeps.length>0 && wash.seeps.length<=12);
for(let i=0;i<25;i++)wash.update(.08);
assert.ok(probe()>before+.5);
assert.equal(wash.at(5600,250),0);

// A previously absorbed major's wet edge can feed an adjacent bay even when
// the player is now on the other shore. A dry candidate has no such effect.
const edge=createPaintingProgress(8000,4000);
edge.brush(1550,1000,800,.99);
edge.largeWashes.push({x:1550,y:1000,r:830},{x:7100,y:450,r:600});
edge.soakFootprints({x:4400,y:2600},160);
const nearOld=()=>edge.at(2450,1100)+edge.at(1550,1950)+edge.at(660,1000);
const initialEdge=nearOld();
for(let i=0;i<25;i++)edge.update(.08);
assert.ok(nearOld()>initialEdge+.5,'Actual ink from an old rival should expand into adjoining paper');
assert.equal(edge.at(7100,450),0,'A dry old source cannot paint a remote shore');
console.log('World painting passes path overlap, rest, alpha integral, bloom growth, open bays, corners and scattered final flecks.');
