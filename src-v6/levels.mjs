import {TRIAL,makeTrial} from './trial-level.mjs';
import {paintingSize} from './artworks.mjs';
import {START_MASS,rivalMass} from './levels-scale.mjs';
export {TRIAL};
// World units are independent of screen size. Each painting fixes its shores and
// teaching encounter; a seed moves secondary creatures within their home bays.
const words = (zh, ja, en) => ({ zh, ja, en });

export const LEVELS = [
  [words('壹','壹','I'), words('先收集浮墨，贴住泛蓝光的对手，把它吸尽。游向四角，吸收大敌。成为池中最大、画上只余零星留白时即可收笔。','浮かんだ墨を集め、水色に光る敵に触れ続けて吸収しよう。四隅の大きな敵も吸収して池でいちばん大きくなり、絵がほぼ見えたらクリア。','Gather ink and stay in contact with blue rivals to absorb them. Absorb the large rivals near the four corners. Finish as the largest in the pond with the painting nearly complete.')],
  [words('貳','貳','II'), words('喷墨缩身，穿过荷叶之间的窄隙，也可以沿岸绕行。','墨を吐いて小さくなれば、ハスの葉の間を通れる。岸沿いに回ってもいい。','Shed ink to slip through, or follow the lotus bank.')],
  [words('參','參','III'), words('让两颗刺球相撞，给自己挤出一条水路。','トゲ玉どうしをぶつけて、水路を開こう。','Nudge two spiked balls together to open the crossing.')],
  [words('肆','肆','IV'), words('赶在黑洞之前，选定觅食的岸。','黒い渦に先を越される前に、岸辺の墨を集めよう。','Choose a feeding bank before the whirl reaches it.')],
  [words('伍','伍','V'), words('沿外岸蓄墨，在窄口换路。','岸辺で墨を蓄え、狭い水路を渡ろう。','Gather ink on the outer bank, then change course at a narrow gate.')],
  [words('陸','陸','VI'), words('两岸合流，选择养花、截食或推开刺门。','流れが合わさる池。花を育てるか、先回りして墨を集めるか、トゲ玉を押しのけるか。進み方を選ぼう。','Two basins meet. Grow a flower, intercept a mote, or open the thorn gate.')]
].map(([title,subtitle],index)=>({id:'level-'+(index+1),kind:'level',index,title,subtitle}));

export const TUTORIALS = [
  [words('移动与吞噬','移動と吸収','Move and absorb'), words('移动、停住、辨认淡蓝圈。','泳いだり止まったりしながら、吸収できる相手の水色の輪を見つけよう。','Steer, slow down and recognize an edible ring.')],
  [words('敌人碰撞','敵との接触','Enemy contact'), words('观察两种敌人怎样交换或失去墨。','トゲ玉や黒い渦がぶつかると、墨の量はどう変わる？　近くで見てみよう。','See which encounters transfer ink and which wear both bodies down.')],
  [words('使用道具','アイテムの使い方','Use items'), words('先把游来的生物收入道具栏，再选择使用时机。','生き物を集めて、好きなタイミングで変身しよう。','Collect a creature, store it, then choose when to change.')],
  [words('喷墨','墨の吐き方','Jet ink'), words('向后喷墨可以推开对手。把墨留在荷叶上，等花开了再吃。','後ろに墨を吐いて相手を押そう。ハスの葉に墨をためると花が咲く。','Push a mote with your jet and regain ink from a blossom.')]
].map(([title,subtitle],index)=>({id:'tutorial-'+(index+1),kind:'tutorial',index,title,subtitle}));

const plans = [
// width, height, number of enemies, visibly drifting fraction, player speed
  [5350,3000,15,.60,100],
  [6900,3460,21,.30,103],
  [6620,3340,24,.20,105],
  [7530,3900,26,.60,108],
  [6860,3610,30,.20,110],
  [7460,3890,34,.56,112]
];

function randomFor(seed) {
  let state = typeof seed==='number' ? seed>>>0 : 2166136261;
  if (typeof seed!=='number') for (const c of String(seed)) state=Math.imul(state ^ c.charCodeAt(0),16777619)>>>0;
  return () => {
    state=(state+0x6D2B79F5)>>>0;
    let x=Math.imul(state ^ (state>>>15),1|state);
    x=(x+Math.imul(x ^ (x>>>7),61|x))^x;
    return ((x^(x>>>14))>>>0)/4294967296;
  };
}

function lessonWorld(meta,seed) {
  const cfg = {id:meta.id,kind:meta.kind,index:meta.index,seed,...paintingSize(0,1000*1542.5),speed:129,flowerMass:30,
    player:{x:405,y:330,mass:START_MASS,angle:0}, enemies:[],leaves:[],drops:[],items:[],tutorial:true,spawnItems:false};
  if (meta.index===0) {
    cfg.enemies=[
      {id:'first-blue',type:'spike',x:520,y:337,mass:rivalMass(39),vx:0,vy:1.5},
      {id:'red-compare',type:'hole',x:695,y:228,mass:rivalMass(175)}
    ];
  }
  if (meta.index===1) cfg.enemies.push({id:'touch-spike',type:'spike',x:521,y:330,mass:rivalMass(175)});
  if (meta.index===2) cfg.items.push({id:'lesson-fish',type:'fish',x:498,y:330,vx:-3,vy:0});
  if (meta.index===3) cfg.enemies.push({id:'push-behind',type:'spike',x:334,y:330,mass:rivalMass(151)});
  for(const body of [cfg.player,...cfg.enemies,...cfg.items])body.y+=cfg.height/2-330;
  return cfg;
}

const bankRoutes = [
  [[.35,.29],[.87,.65],[.29,.78],[.83,.22],[.20,.54],[.78,.81]],
  [[.43,.68],[.86,.28],[.21,.32],[.79,.80],[.40,.20],[.85,.56]],
  [[.30,.26],[.86,.70],[.26,.77],[.72,.24],[.38,.57],[.82,.78]],
  [[.35,.72],[.84,.22],[.20,.27],[.82,.79],[.34,.48],[.83,.50]],
  [[.30,.20],[.84,.75],[.21,.70],[.82,.22],[.30,.83],[.83,.53]],
  [[.28,.74],[.80,.23],[.22,.29],[.83,.76],[.30,.49],[.82,.47]]
];

export function makeLevel(id, seed=1) {
  const meta=typeof id==='object' ? id : [TRIAL,...LEVELS,...TUTORIALS].find(entry=>entry.id===id);
  if (!meta) throw new RangeError('Unknown pond: '+id);
  if (meta.kind==='trial') return makeTrial(seed,randomFor(seed));
  if (meta.kind==='tutorial') return lessonWorld(meta,seed);
  const {index}=meta, rng=randomFor(seed);
  const [planWidth,planHeight,count,driftFraction,speed]=plans[index];
  const {width,height}=paintingSize(index,planWidth*planHeight);
  const flip = rng() < .5;
  const point = (u,v) => ({x:u*width, y:(flip?1-v:v)*height});
  const cfg = {id:meta.id,kind:'level',index,seed,width,height,speed:Math.round(speed*1.12),tutorial:false,spawnItems:true,flowerMass:30,foodSpacing:79,
    player:{...point(.18,.50),mass:START_MASS,angle:0},enemies:[],leaves:[],drops:[],items:[]};
  const enemies=cfg.enemies;
  const add = (key,type,mass,p,extra={}) => {
    const entity={id:key,type,mass:rivalMass(mass),...p,vx:0,vy:0,...extra};
    enemies.push(entity);
    return entity;
  };
  const atOffset=(obj,x,y)=>({x:obj.x+x,y:obj.y+(flip?-y:y)});
  const leaf=(key,u,v,r,stored=0) => cfg.leaves.push({id:key,...point(u,v),r:r*1.2,stored,flowers:0});
  const first=add('first-blue','spike',26,atOffset(cfg.player,145,12),{vy:flip?-9:9});
  add('second-blue','hole',35,atOffset(cfg.player,255,-78),{vx:-3,vy:5});
  leaf('near-leaf',.18,.59,72,15);
  if(index===1) leaf('crossing-leaf',.43+165/width,.50,77,14);
  else if(index>=2) leaf('crossing-leaf',.56,index===3?.71:.39,86,9);
  if(index>=4) leaf('outer-leaf',.77,.60,78,11);

  // Every gate admits the starting body by a long detour. The short way is
  // measured between the two physical radii, not between texture edges.
  function gate(key,u,v,a,b,gap,same=true,stagger=0) {
    const center=point(u,v);
    add(key+'-north','spike',a,atOffset(center,-stagger,-(2*Math.sqrt(rivalMass(a))+gap/2)));
    add(key+'-south',same?'spike':'hole',b,atOffset(center,stagger,2*Math.sqrt(rivalMass(b))+gap/2));
  }
  if(index===0) add('red-compare','hole',202,atOffset(cfg.player,178,146));
  if(index===1) gate('lotus-gate',.43,.50,180,265,41,false);
  if(index===2) gate('twin-gate',.43,.47,260,380,15,true,4);
  if(index===3) {
    add('feeding-whirl','hole',210,point(.51,.44),{vx:11,vy:flip?-2:2});
    for(let i=0;i<8;i++) cfg.drops.push({id:'bay-drop-'+i,...point(.54+i*.006,.45+.014*Math.sin(i)),mass:4});
  }
  if(index>=4) {
    gate('west-gate',.43,.52,1550,2360,40,true,5);
    gate('east-gate',.59,.47,2930,2220,index===4?32:46,false,11);
    if(index===4) gate('outer-gate',.55,.65,1710,1360,56,true);
    else add('feeding-whirl','hole',3200,point(.65,.68),{vx:12,vy:flip?4:-4});
  }

  const fixed=enemies.length;
  let entrants=count-fixed-1, budget=161;
  // Each corner casts a large ink wash onto a different piece of the artwork.
  // Rotate the feeding order between paintings; the coordinates always refer
  // to physical corners even when the smaller banks are mirrored.
  const corners=[['nw',.115,.15],['ne',.885,.15],['se',.885,.85],['sw',.115,.85]];
  const cornerMass=[2800,5200,8600,3900];
  for(let i=0;i<corners.length;i++){
    const [slot,u,v]=corners[i],tier=(i+index)%4;
    const mass=Math.round(cornerMass[tier]*(1+index*.08));
    add('corner-'+slot,tier%2?'hole':'spike',mass,{x:width*u,y:height*v},
      {cornerBoss:true,cornerSlot:slot});
  }
  const bays=bankRoutes[index];
  const movers=[];
  const radius=m=>2*Math.sqrt(m);
  function clearSpot(pos,m) {
    const r=radius(rivalMass(m));
    return pos.x>r+12 && pos.x<width-r-12 && pos.y>r+12 && pos.y<height-r-12 &&
      enemies.every(e=>Math.hypot(e.x-pos.x,e.y-pos.y)>radius(e.mass)+r+28) &&
      cfg.leaves.every(l=>Math.hypot(l.x-pos.x,l.y-pos.y)>l.r+r+8) &&
      Math.hypot(cfg.player.x-pos.x,cfg.player.y-pos.y)>r+210;
  }
  function spareWater(intended,mass){
    let spot=null, nearest=Infinity;
    const margin=radius(rivalMass(mass))+15;
    for(let y=margin;y<height-margin;y+=60){
      for(let x=margin;x<width-margin;x+=60){
        const delta=(x-intended.x)**2+(y-intended.y)**2;
        if(delta<nearest&&clearSpot({x,y},mass)){spot={x,y};nearest=delta;}
      }
    }
    if(!spot)throw new Error('No clear water for '+cfg.id);
    return spot;
  }
  for(let band=0;band<bays.length;band++) {
    const slots=Math.ceil(entrants/(bays.length-band));
    // Each bank has one mouthful whose size only just becomes edible after
    // feeding at the preceding bank. The other swimmers make the approach
    // rewarding without letting an entire shore instantly turn blue.
    const openWater=index===0||index===3;
    const gain=budget*.93;
    const major = Math.round(openWater
      ? (slots===1?gain:budget*(.76+rng()*.045))
      : budget*(.82+rng()*.04));
    const satellite = openWater&&slots>1?Math.round((gain-major)/(slots-1)):10+band*2+index;
    for(let j=0;j<slots;j++){
      // The final feeder is intentionally smaller than its nominal tier:
      // even after a failed approach, the player can recover through a catch.
      const mass=j===0?Math.round(major*(openWater&&band===5?.82:1)):satellite;
      const [shore,v]=bays[band];
      const u=index<4&&index!==2?shore:(shore<.5?shore*.65:.90+(shore-.80)*.50);
      let pos;
      for(let attempt=0;attempt<240;attempt++) {
        const spread=attempt<80?1:attempt<160?2:3;
        pos=point(u+(rng()-.5)*.105*spread,v+(rng()-.5)*.17*spread);
        if(clearSpot(pos,mass)) break;
      }
      if(!clearSpot(pos,mass))pos=spareWater(point(u,v),mass);
      const e=add('bank-'+band+'-'+j,rng()<.45?'hole':'spike',mass,pos);
      // Keep the most valuable mobile prey drifting across its own bank,
      // where it stays interceptable rather than feeding the leader early.
      if(j===0){e.bankMajor=true;e.homeRadius=width*.065;}
      movers.push(e);
    }
    // Reserve a real margin for misses and natural losses. A player who
    // follows the main catches can reach the next one without waiting for flowers.
    budget+=openWater?gain:major+satellite*Math.min(2,slots-1);
    entrants-=slots;
  }
  // The leading creature has a reachable food budget even if the player
  // spent ink at several gates. Its initial home is clear of easy feeding chains.
  const leadMass=Math.round(budget*.82);
  let lead=point(.59,.14);
  if(!clearSpot(lead,leadMass)) {
    for(let i=0;i<200;i++) {
      lead=point(.53+.21*rng(),.10+.75*rng());
      if(clearSpot(lead,leadMass))break;
    }
    if(!clearSpot(lead,leadMass))lead=spareWater(point(.59,.14),leadMass);
  }
  add('leading-mote',index===5&&rng()<.5?'spike':'hole',leadMass,lead,{major:true});
  // Shuffle eligible movers, preserving the deliberate first intercept and the gates.
  for(let i=movers.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[movers[i],movers[j]]=[movers[j],movers[i]];}
  const n=Math.min(movers.length,Math.round(count*driftFraction)-enemies.filter(e=>e.vx||e.vy).length);
  for(const e of movers.slice(0,Math.max(0,n))){
    const angle=rng()*Math.PI*2, v=(e.bankMajor?.035+.015*rng():.10+.12*rng())*speed;
    e.vx=Math.cos(angle)*v;e.vy=Math.sin(angle)*v;
  }
  // Black whirls cross a bank more slowly than the lighter thorn seeds.
  for(const e of enemies)if(e.type==='hole'){e.vx*=.60;e.vy*=.60;}
  const forms=['fish','shrimp','turtle','dragon'];
  cfg.items.push({id:'near-form',type:forms[index%3],...atOffset(first,85,70),vx:0,vy:0});
  cfg.items.push({id:'far-form',type:forms[(index+1)%forms.length],...point(.67,.69),vx:-4,vy:1});
  cfg.items.push({id:'crossing-form',type:index===2?'fish':index===3?'shrimp':'turtle',...point(.48,.50),vx:0,vy:2});
  // Two gentle trails through the middle give both shore crossings something
  // to steer toward. Their ink budget is deliberately small.
  for(let j=0;j<13;j++) {
    cfg.drops.push({id:'crossing-ink-'+j,...point(.31+j*.032,.32+Math.sin(j*.53)*.08),mass:2+(j%3)});
    if(index>0)cfg.drops.push({id:'outer-ink-'+j,...point(.31+j*.032,.69+Math.cos(j*.44)*.06),mass:2});
  }
  if(index===1||index===2){
    const mouth=point(.43,index===1?.5:.47);
    for(let j=0;j<4;j++)cfg.drops.push({id:'gate-reward-'+j,...atOffset(mouth,55+j*14,(j%2?1:-1)*9),mass:3});
  }
  // A fork visible from the starting bank leads into both crossings. Clumps
  // of collectible ink outline the useful turns at a normal camera zoom.
  let marker=0;
  function trail(points) {
    for(let seg=1;seg<points.length;seg++){
      const a=point(...points[seg-1]),b=point(...points[seg]);
      const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/250);
      for(let k=1;k<=n;k++){
        const t=k/n;
        cfg.drops.push({id:'trail-'+(++marker),x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,mass:1.5});
      }
    }
  }
  trail([[.20,.50],[.27,.45],[.32,.33],[.35,.29]]);
  trail([[.24,.48],[.31,.59],[.35,.69]]);
  trail([[.67,.32],[.76,.32],[.83,.24]]);
  trail([[.67,.68],[.75,.74],[.84,.73]]);
  return cfg;
}
