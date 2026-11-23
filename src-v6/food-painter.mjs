import {foodFlow} from './food-field.mjs';
// At full-map zoom flecks are at most 2 px wide. Draw their actual drift in
// batches. Harvesting, magnetism and regrowth replace slot references.
const TILE=12;
const INKS=['rgba(39,35,27,.44)','rgba(39,35,27,.52)','rgba(39,35,27,.60)','rgba(39,35,27,.69)'];
function addOutline(path,d){
  if(d.shape==='circle'){path.moveTo(d.homeX+d.r,d.homeY);path.arc(d.homeX,d.homeY,d.r,0,Math.PI*2);return;}
  const n=d.shape==='triangle'?3:d.shape==='square'?4:5;
  for(let i=0;i<n;i++){
    const a=d.rot0-Math.PI/2+i*Math.PI*2/n,x=d.homeX+Math.cos(a)*d.r,y=d.homeY+Math.sin(a)*d.r;
    if(i===0)path.moveTo(x,y);else path.lineTo(x,y);
  }
  path.closePath();
}
export function createFoodPainter(f){
  const chunks=new Map();
  function paintTile(c,tx,ty){
    const key=ty*Math.ceil(f.columns/TILE)+tx;
    let tile=chunks.get(key);
    if(!tile){tile={slots:[],paths:null};chunks.set(key,tile);}
    let i=0,changed=!tile.paths;
    for(let y=ty*TILE;y<Math.min((ty+1)*TILE,f.rows);y++){
      for(let x=tx*TILE;x<Math.min((tx+1)*TILE,f.columns);x++,i++){
        const d=f.slots[y*f.columns+x];
        if(tile.slots[i]!==d){tile.slots[i]=d;changed=true;}
      }
    }
    if(changed){
      tile.paths=Array.from({length:3},()=>INKS.map(()=>new Path2D()));
      for(const d of tile.slots)if(d)addOutline(tile.paths[d.lane][Math.max(0,Math.min(3,Math.floor((d.alpha-.42)/.075)))],d);
    }
    for(let lane=0;lane<3;lane++){
      const {x,y}=foodFlow(f,tx,ty,lane);
      c.save();c.translate(x,y);
      for(let j=0;j<INKS.length;j++){c.fillStyle=INKS[j];c.fill(tile.paths[lane][j]);}
      c.restore();
    }
  }
  return (c,b)=>{
    if(!f||!b)return;
    const w=TILE*f.cw,h=TILE*f.ch;
    const lastX=Math.min(Math.ceil(f.columns/TILE)-1,Math.floor(b.right/w));
    const lastY=Math.min(Math.ceil(f.rows/TILE)-1,Math.floor(b.bottom/h));
    for(let y=Math.max(0,Math.floor(b.top/h));y<=lastY;y++)
      for(let x=Math.max(0,Math.floor(b.left/w));x<=lastX;x++)paintTile(c,x,y);
  };
}
