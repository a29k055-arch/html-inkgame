import {POND_ARTWORKS} from './artworks.mjs';
import {START_MASS} from './levels-scale.mjs';

// An open pond before the numbered paintings. A northern route and a southern
// route join at the far lotus; the player can change banks midway.
export const TRIAL={
  id:'trial',kind:'trial',index:0,artworkIndex:6,
  title:{zh:'体验关卡',ja:'体験ステージ',en:'Trial stage'},
  subtitle:{
    zh:'吸收比自己小的墨团，一点点长大。待你成为池中最大的墨团，沿途的墨迹也将连成一幅完整的画。',
    ja:'自分より小さな墨玉を吸収して、大きくなろう。池でいちばん大きくなるころには、泳いだ跡から一枚の絵が浮かび上がる。',
    en:'Absorb smaller drops of ink and grow. As you become the largest in the pond, the marks you leave will come together into a painting.'
  }
};

// A player begins on the two-unit step. Taking one prey on each successive
// step pays exactly the mass needed to follow the sequence 2, 3, 5, 8 ...
const units=[1,2,3,5,8,13,21,34,55,89,144,233];
const masses=units.map(unit=>unit*START_MASS/2);
const radius=mass=>2*Math.sqrt(mass);

export function makeTrial(seed,rng){
  const art=POND_ARTWORKS[TRIAL.artworkIndex];
  const width=art.width*8.1,height=art.height*8.1;
  const point=(u,v)=>({x:u*width,y:v*height});
  const start=point(.23,.51);
  const inlet=(x,y)=>({x:start.x+x,y:start.y+y});
  const cfg={id:TRIAL.id,kind:'trial',index:0,seed,width,height,speed:132,foodSpacing:68,foodMassScale:.65,flowerMass:36,
    player:{...start,mass:START_MASS,angle:0},tutorial:false,spawnItems:true,nextItem:7,itemInterval:11,
    enemies:[],leaves:[],items:[],drops:[]};
  function leaf(id,pos,r,stored,flowers){
    cfg.leaves.push({id,...pos,r,stored,flowers});
  }
  leaf('home-lotus',inlet(-242,244),146,20,1);
  leaf('reed-lotus',point(.39,.24),244,14,1);
  leaf('shelter-lotus',point(.56,.73),330,12,1);
  leaf('far-lotus',point(.86,.54),188,25,1);
  function item(type,pos,swimRange){
    cfg.items.push({id:'trial-'+type+'-'+cfg.items.length,type,...pos,swimRange});
  }
  item('fish',inlet(126,68),34);item('shrimp',inlet(282,-210),40);item('turtle',inlet(320,136),36);
  item('shrimp',point(.43,.28),40);item('fish',point(.62,.40),62);item('turtle',point(.74,.77),42);

  function add(id,type,tier,pos,extra={}){
    const angle=rng()*Math.PI*2,v=(type==='hole'?1.15:1.85)+rng()*2.7;
    cfg.enemies.push({id,type,...pos,mass:masses[tier],vx:Math.cos(angle)*v,vy:Math.sin(angle)*v,homeRadius:110,...extra});
  }
  // The first catch holds its position. From there either side offers an
  // immediate equal-to-the-old-player rival, then a staggered chain of larger
  // bodies. These coordinates stay readable while the initial camera pulls back.
  add('trial-first-blue','spike',0,inlet(91,3),{vx:0,vy:0});
  add('north-seed','hole',0,point(.29,.26));
  add('south-seed','spike',0,point(.32,.79));
  const arms=[
    [[220,-66],[365,-159],[477,-272],[615,-362],[752,-484],[889,-645],[1040,-882]],
    [[222,100],[300,242],[455,330],[605,417],[746,548],[903,680],[1047,902]]
  ];
  for(const [side,arm] of arms.entries())for(const [i,[x,y]] of arm.entries()){
    add('inlet-'+side+'-'+i,(i+side)%2?'hole':'spike',i+1,inlet(x,y));
  }
  add('inlet-tall-spine','spike',6,inlet(-202,-177));
  add('inlet-dark-eddy','hole',4,inlet(-43,-191));
  // Exactly one of the five named banks contains the top step. Alternate the
  // deepest eddy with a distant bank so the centre can be the final landmark.
  const centralCrown=rng()<.55;
  for(const [slot,tier,u,v] of [['nw',8,.13,.14],['ne',9,.86,.13],['se',10,.86,.86],['sw',centralCrown?10:11,.14,.87]]){
    add('trial-'+slot+'-adult',slot==='nw'||slot==='sw'?'spike':'hole',tier,point(u,v),{cornerBoss:true,cornerSlot:slot,homeRadius:40});
  }
  add('trial-deep-adult','hole',centralCrown?11:10,point(.57+.04*rng(),.49+.04*rng()),{major:true,homeRadius:70});
  const crossing=point(.62,.31);
  add('crossing-spike','spike',3,crossing,{vx:3.1,vy:.45,homeRadius:145});
  add('crossing-hole','hole',4,{x:crossing.x+188,y:crossing.y+18},{vx:-2.3,vy:-.12,homeRadius:145});

  function clear(x,y,r){
    if(x<r+20||x>width-r-20||y<r+20||y>height-r-20)return false;
    if(Math.hypot(x-start.x,y-start.y)<r+320)return false;
    if(cfg.leaves.some(l=>Math.hypot(x-l.x,y-l.y)<r+l.r+26))return false;
    if(cfg.items.some(i=>Math.hypot(x-i.x,y-i.y)<r+60))return false;
    return cfg.enemies.every(e=>Math.hypot(x-e.x,y-e.y)>r+radius(e.mass)+36);
  }
  // Every tier has a fixed population, independent of seed. Populate high
  // tiers first; staggered shore bands keep multiple copies discoverable
  // without cramming large silhouettes into one school.
  const counts=[3,5,8,12,16,19,23,26,28,20,8,1];
  for(let tier=counts.length-1;tier>0;tier--){
    const fixed=cfg.enemies.filter(e=>e.mass===masses[tier]).length;
    const r=radius(masses[tier]);
    for(let i=fixed;i<counts[tier];i++){
      const band=(i*3+tier)%7;
      let pos;
      for(let attempt=0;attempt<100;attempt++){
        const u=.045+.91*rng(),v=attempt<55?(band+.1+.8*rng())/7:rng();
        const candidate=point(u,v);
        if(clear(candidate.x,candidate.y,r)){pos=candidate;break;}
      }
      if(!pos){
        for(let y=r+24;y<height-r&&!pos;y+=r+35)for(let x=r+24;x<width-r;x+=r+35){
          if(clear(x,y,r)){pos={x,y};break;}
        }
      }
      if(!pos)throw new Error('No room for trial tier '+tier);
      add('trial-school-'+tier+'-'+i,(tier+i)%3?'spike':'hole',tier,pos);
    }
  }
  // Sweeps of food visible at normal zoom lead from the fork to each item.
  // Slight bends and lateral jitter keep these trails distinct from geometry.
  for(const path of [
    [[.19,.52],[.24,.49],[.28,.42],[.32,.33],[.39,.26],[.49,.24]],
    [[.20,.54],[.245,.575],[.28,.62],[.35,.67],[.418,.71],[.52,.73]],
    [[.48,.26],[.57,.32],[.655,.40],[.73,.43],[.81,.52]],
    [[.50,.75],[.59,.72],[.65,.67],[.76,.64],[.83,.54]]
  ]){
    for(let i=1;i<path.length;i++){
      const a=point(...path[i-1]),b=point(...path[i]);
      const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/52);
      for(let j=1;j<=n;j++){
        const t=j/n;
        cfg.drops.push({x:a.x+(b.x-a.x)*t+12*(rng()-.5),
          y:a.y+(b.y-a.y)*t+18*Math.sin(t*Math.PI)+12*(rng()-.5),mass:1.5+1.4*rng()});
      }
    }
  }

  return cfg;
}
