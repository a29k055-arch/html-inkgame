// A large painting holds thousands of edible flecks. One gently jittered fleck
// per square gives the eye a continuous feeding route without a per-frame scan.
const shapes=['circle','triangle','square','pentagon'];
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));

export function createFoodField(width,height,spacing,seed,massScale=1){
  if(!spacing)return null;
  const columns=Math.max(1,Math.floor(width/spacing)),rows=Math.max(1,Math.floor(height/spacing));
  const field={columns,rows,massScale,cw:width/columns,ch:height/rows,slots:new Array(columns*rows),
    vacant:[],regrowAt:0,rng:(seed^0x63a77521)>>>0,count:columns*rows,
    time:0,phase:(seed>>>0)%301,tileColumns:Math.ceil(columns/12),flows:[]};
  for(let i=0;i<field.slots.length;i++)plant(field,i);
  return field;
}

function random(f){
  f.rng=(Math.imul(f.rng,1664525)+1013904223)>>>0;
  return f.rng/4294967296;
}

function plant(f,i){
  const x=(i%f.columns+.10+.8*random(f))*f.cw;
  const y=(Math.floor(i/f.columns)+.10+.8*random(f))*f.ch;
  const size=random(f);
  const shape=shapes[Math.floor(random(f)*shapes.length)],rot=random(f)*Math.PI*2;
  const flake={id:'flake-'+i,slot:i,x,y,homeX:x,homeY:y,r:2.2+2.15*size,mass:(.50+1.20*size)*f.massScale,
    shape,rot,rot0:rot,alpha:.42+.30*random(f),ready:true,
    tileX:Math.floor((i%f.columns)/12),tileY:Math.floor(i/f.columns/12),lane:i%3};
  f.slots[i]=sampleFood(f,flake);
}

// Only the occupied/query-visible blocks need a phase update. Translation is
// smaller than the gap to the cell edge, so the spatial lookup remains exact.
export function foodFlow(f,tileX,tileY,lane){
  const key=3*(tileX+f.tileColumns*tileY)+lane;
  const flow=f.flows[key]??={time:-1,x:0,y:0,angle:0};
  if(flow.time!==f.time){
    const phase=f.phase+tileX*1.43+tileY*2.21+lane*2.08,t=f.time;
    flow.x=3.8*Math.sin(t*.41+phase)+.6*Math.cos(t*.73+phase);
    flow.y=2.9*Math.cos(t*.34+phase*1.21)+.7*Math.sin(t*.66+phase);
    flow.angle=t*(lane===1?-.11:.09)+.15*Math.sin(t*.35+phase);
    flow.time=t;
  }
  return flow;
}

export function sampleFood(f,d){
  const flow=foodFlow(f,d.tileX,d.tileY,d.lane);
  d.x=d.homeX+flow.x;d.y=d.homeY+flow.y;d.rot=d.rot0+flow.angle;
  return d;
}

export function* visibleFood(f,left,top,right,bottom){
  if(!f)return;
  const col0=clamp(Math.floor(left/f.cw),0,f.columns-1),col1=clamp(Math.floor(right/f.cw),0,f.columns-1);
  const row0=clamp(Math.floor(top/f.ch),0,f.rows-1),row1=clamp(Math.floor(bottom/f.ch),0,f.rows-1);
  for(let row=row0;row<=row1;row++){
    for(let col=col0;col<=col1;col++){
      const d=f.slots[row*f.columns+col];
      if(d){
        sampleFood(f,d);
        if(d.x>=left && d.x<=right && d.y>=top && d.y<=bottom)yield d;
      }
    }
  }
}

export function removeFood(f,d){
  if(f.slots[d.slot]!==d)return;
  f.slots[d.slot]=null;f.vacant.push(d.slot);f.count--;
}

// Refill already harvested squares slowly, away from bodies. Neither a still
// player nor a stationary whirl can profit by sitting on a spawn coordinate.
export function regrowFood(f,w){
  if(!f||!f.vacant.length||f.regrowAt>w.time)return;
  f.regrowAt=w.time+.8;
  const i=Math.floor(random(f)*f.vacant.length),slot=f.vacant[i];
  const x=(slot%f.columns+.5)*f.cw,y=(Math.floor(slot/f.columns)+.5)*f.ch;
  const clear=body=>Math.hypot(body.x-x,body.y-y)>body.r+Math.max(f.cw,f.ch)+120;
  if(!clear(w.player)||!w.enemies.every(clear))return;
  f.vacant[i]=f.vacant[f.vacant.length-1];f.vacant.pop();plant(f,slot);f.count++;
}
