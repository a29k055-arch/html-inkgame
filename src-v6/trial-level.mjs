// An open pond before the numbered paintings. A northern route and a southern
// route join at the far lotus; the player can change banks midway.
export const TRIAL={
  id:'trial',kind:'trial',index:0,artworkIndex:6,
  title:{zh:'体验关卡',ja:'体験ステージ',en:'Open pond'},
  subtitle:{
    zh:'先吃身边的小墨团。向北跟着虾群觅食，或向南借龟壳穿过刺球。超过池里最大的对手，就能揭开《荷荫蟹趣》。',
    ja:'まずは近くの小さな墨玉から。北ではエビの力で墨を集め、南ではカメになってトゲ玉の間を通ろう。池でいちばん大きくなると絵が現れる。',
    en:'Start with the small motes nearby. Gather ink with the shrimp to the north, or use a turtle shell to cross the southern spines. Outgrow the largest rival to reveal the painting.'
  }
};

// Keep the first screen compact. Beyond it the feeding banks are separated by
// longer crossings, leaving the player free to choose when to change shores.
function openCrossings(cfg){
  const originalWidth=cfg.width,originalHeight=cfg.height;
  function axis(origin,scale,near){
    function expand(v){
      const distance=v-origin;
      return v+Math.sign(distance)*Math.max(0,Math.abs(distance)-near)*(scale-1);
    }
    const start=expand(0);
    return v=>expand(v)-start;
  }
  const x=axis(cfg.player.x,1.55,375),y=axis(cfg.player.y,1.35,250);
  const areaRatio=x(originalWidth)*y(originalHeight)/(originalWidth*originalHeight);
  for(const body of [cfg.player,...cfg.enemies,...cfg.leaves,...cfg.items,...cfg.drops]){
    body.x=x(body.x);body.y=y(body.y);
  }
  cfg.width=Math.round(x(originalWidth));cfg.height=Math.round(y(originalHeight));
  cfg.foodSpacing=Math.round(cfg.foodSpacing*Math.sqrt(areaRatio/1.14));
}

export function makeTrial(seed,rng){
  const width=4950,height=2850;
  const point=(u,v)=>({x:u*width,y:v*height});
  const start=point(.18,.52);
  const cfg={id:TRIAL.id,kind:'trial',index:0,seed,width,height,speed:132,foodSpacing:48,foodMassScale:.65,flowerMass:36,
    player:{...start,mass:100,angle:0},tutorial:false,spawnItems:true,nextItem:7,itemInterval:11,
    enemies:[],leaves:[],items:[],drops:[]};
  const leaf=(id,u,v,r,stored,flowers)=>cfg.leaves.push({id,...point(u,v),r,stored,flowers});
  leaf('home-lotus',.145,.555,68,20,1);
  leaf('reed-lotus',.39,.24,85,14,1);
  leaf('shelter-lotus',.57,.72,93,12,1);
  leaf('far-lotus',.86,.53,87,25,1);
  const item=(type,u,v,range)=>cfg.items.push({id:'trial-'+type+'-'+cfg.items.length,type,...point(u,v),swimRange:range});
  item('fish',.206,.527,32);item('shrimp',.253,.466,34);item('turtle',.271,.598,33);
  item('shrimp',.438,.258,40);item('fish',.606,.39,62);item('turtle',.71,.77,42);
  const fixed=(id,type,mass,where,vx=0,vy=0,homeRadius=0)=>{
    cfg.enemies.push({id,type,mass,...where,vx,vy,homeRadius});
  };
  // Near the entrance, each turn reveals a blue catch beside a red comparison.
  fixed('trial-first-blue','spike',24,{x:start.x+89,y:start.y+5},-2,1,32);
  fixed('trial-blue-reed','hole',38,{x:start.x+168,y:start.y-69},-2,0,40);
  fixed('trial-blue-shore','spike',48,{x:start.x+140,y:start.y+111},0,-2,36);
  fixed('trial-red-rim','hole',300,{x:start.x+218,y:start.y+38},0,0);
  fixed('inlet-escape','spike',22,{x:start.x-73,y:start.y-86},1,-2,24);
  fixed('inlet-north-blue','hole',57,{x:start.x+80,y:start.y-154},2,1,36);
  fixed('inlet-home-blue','spike',21,{x:start.x-92,y:start.y+170},1,-1,25);
  fixed('inlet-red-thorn','spike',141,{x:start.x-145,y:start.y-127});
  fixed('inlet-dark-eddy','hole',190,{x:start.x-280,y:start.y+18});
  fixed('inlet-reed-thorn','spike',195,{x:start.x+285,y:start.y-170});
  fixed('trial-crown','hole',10625,point(.86,.23));
  // The adults alternate shores. A player can piece together the next meal
  // from a school, or cross the pond for one adult that now fits.
  fixed('trial-reed-adult','spike',480,point(.265,.86));
  fixed('trial-east-adult','hole',925,point(.73,.15));
  fixed('trial-west-adult','spike',1800,point(.11,.19));
  fixed('trial-far-adult','hole',3375,point(.83,.79));
  fixed('trial-south-adult','spike',5800,point(.135,.79));
  fixed('trial-thorn-mouth','spike',180,point(.415,.675));
  fixed('trial-thorn-tip','spike',136,point(.419,.745));
  fixed('trial-shoal-whirl','hole',238,point(.58,.24),-2,1,64);
  const r=m=>2*Math.sqrt(m);
  const clear=(p,mass)=>{
    const rad=r(mass);
    return p.x>rad+14&&p.y>rad+14&&p.x<width-rad-14&&p.y<height-rad-14
      &&Math.hypot(p.x-start.x,p.y-start.y)>rad+190
      &&cfg.leaves.every(l=>Math.hypot(l.x-p.x,l.y-p.y)>rad+l.r+12)
      &&cfg.enemies.every(e=>Math.hypot(e.x-p.x,e.y-p.y)>r(e.mass)+rad+22);
  };
  // The diagonal shore forms two feeding routes; a few large rivals occupy
  // the centre. Biggest bodies are placed first, leaving real navigable gaps.
  const banks=[
    [.22,.26,.25,.36,[22,31,49,57,66,74,83,103,119,133,169,224,286,365]],
    [.22,.72,.29,.38,[19,35,42,61,69,84,98,108,145,194,210,322,419,603]],
    [.47,.24,.32,.32,[37,59,82,113,126,162,196,270,374,485,600,810,1090,1650]],
    [.48,.77,.34,.37,[29,44,67,87,128,163,188,248,321,509,747,940,1450,2130]],
    [.73,.44,.42,.36,[42,61,81,102,132,185,230,290,420,680,850,1170,1570,2250,3160]],
    [.82,.77,.28,.39,[30,53,87,112,153,190,280,399,616,813,1060,1410,1850,2780,3850]],
    [.49,.50,.32,.27,[42,57,68,95,120,160,265,480,855,1290,2170]],
  ];
  function schoolMass(base,index){
    const juvenile=base>105?105+3.1*Math.sqrt(base-105):base;
    // Two larger escorts per full school outgrow the player at the opening.
    const scale = (index===10 || index===13) ? .64 : .25;
    return Math.max(8,Math.round(juvenile*scale*(.93+.14*rng())));
  }
  const candidates=banks.flatMap(([u,v,du,dv,masses],bank)=>masses.map((base,j)=>({
    u,v,du,dv,bank,j,mass:schoolMass(base,j)
  }))).sort((a,b)=>b.mass-a.mass);
  for(const c of candidates){
    let pos;
    for(let i=0;i<220;i++){
      const spread=1+Math.floor(i/70)*.35;
      pos=point(c.u+(rng()-.5)*c.du*spread,c.v+(rng()-.5)*c.dv*spread);
      if(clear(pos,c.mass))break;
    }
    // The banks are not hard boundaries: an overcrowded bank spills into
    // neighbouring water instead of stacking bodies on the same coordinate.
    if(!clear(pos,c.mass)){
      pos=undefined;
      for(let y=70;y<height&&!pos;y+=60)for(let x=70;x<width;x+=60){
        if(clear({x,y},c.mass)){pos={x,y};break;}
      }
      if(!pos)throw new Error('No room for a trial swimmer');
    }
    const type=(c.bank+c.j)%3===0?'hole':'spike';
    const angle=rng()*Math.PI*2,speed=(2+rng()*6)*(type==='hole'?.55:1);
    fixed('trial-school-'+c.bank+'-'+c.j,type,c.mass,pos,Math.cos(angle)*speed,Math.sin(angle)*speed,55+rng()*100);
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
  openCrossings(cfg);
  return cfg;
}
