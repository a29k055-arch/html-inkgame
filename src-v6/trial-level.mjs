// An open pond before the numbered paintings. A northern route and a southern
// route join at the far lotus; the player can change banks midway.
export const TRIAL={
  id:'trial',kind:'trial',index:0,artworkIndex:6,
  title:{zh:'体验关卡',ja:'体験ステージ',en:'Open pond'},
  subtitle:{
    zh:'先吃身边的小墨团。向北跟着虾群觅食，或向南借龟壳穿过刺球。游向画幅四角，吸尽大敌。当你成为池中最大的墨团，《荷荫蟹趣》也只剩零星留白，便可收笔。',
    ja:'まずは近くの小さな墨玉から。北ではエビの力で墨を集め、南ではカメになってトゲ玉の間を通ろう。四隅の大きな相手も吸い込もう。池でいちばん大きくなり、絵の全体がほぼ見えたらクリア。',
    en:'Start with the small motes nearby. Gather ink with the shrimp to the north, or use a turtle shell to cross the southern spines. Absorb the great rivals at the four corners. Finish as the largest in the pond, with only scattered patches of the painting left to uncover.'
  }
};

export function makeTrial(seed,rng){
  const width=4950,height=2850;
  const point=(u,v)=>({x:u*width,y:v*height});
  const start=point(.18,.52);
  const cfg={id:TRIAL.id,kind:'trial',index:0,seed,width,height,speed:132,foodSpacing:46,foodMassScale:.65,flowerMass:36,
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
  fixed('inlet-red-thorn','spike',2025,{x:start.x-175,y:start.y-131});
  fixed('inlet-dark-eddy','hole',190,{x:start.x-280,y:start.y+18});
  fixed('inlet-reed-thorn','spike',1450,{x:start.x+260,y:start.y-235});
  fixed('inlet-sun-whirl','hole',1332,{x:start.x+287,y:start.y+172});
  fixed('inlet-south-thorn','spike',980,{x:start.x-68,y:start.y+260});
  function corner(id,type,mass,u,v,slot){
    cfg.enemies.push({id,type,mass,...point(u,v),vx:0,vy:0,homeRadius:0,cornerBoss:true,cornerSlot:slot});
  }
  corner('trial-crown','hole',42000,.89,.165,'ne');
  corner('trial-far-adult','hole',15600,.887,.85,'se');
  corner('trial-south-adult','spike',21600,.112,.86,'sw');
  corner('trial-west-adult','spike',7900,.10,.15,'nw');
  // The adults alternate shores. A player can piece together the next meal
  // from a school, or cross the pond for one adult that now fits.
  fixed('trial-reed-adult','spike',480,point(.265,.86));
  fixed('trial-east-adult','hole',925,point(.73,.15));
  fixed('trial-thorn-mouth','spike',180,point(.415,.675));
  fixed('trial-thorn-tip','spike',136,point(.419,.745));
  fixed('trial-shoal-whirl','hole',238,point(.58,.24),-2,1,64);
  const r=m=>2*Math.sqrt(m);
  const first=cfg.enemies.find(e=>e.id==='trial-first-blue');
  const reachX=first.x-start.x,reachY=first.y-start.y;
  const clear=(p,mass,keepAway=190,padding=22)=>{
    const rad=r(mass);
    if(mass>=cfg.player.mass){
      const t=Math.max(0,Math.min(1,((p.x-start.x)*reachX+(p.y-start.y)*reachY)/(reachX**2+reachY**2)));
      if(Math.hypot(p.x-start.x-reachX*t,p.y-start.y-reachY*t)<rad+38)return false;
    }
    return p.x>rad+14&&p.y>rad+14&&p.x<width-rad-14&&p.y<height-rad-14
      &&Math.hypot(p.x-start.x,p.y-start.y)>rad+keepAway
      &&cfg.leaves.every(l=>Math.hypot(l.x-p.x,l.y-p.y)>rad+l.r+12)
      &&cfg.enemies.every(e=>Math.hypot(e.x-p.x,e.y-p.y)>r(e.mass)+rad+padding)
      &&cfg.items.every(i=>Math.hypot(i.x-p.x,i.y-p.y)>rad+25);
  };
  // These small families hug the larger silhouettes, leaving winding channels
  // through the opening. All sizes use the same physical clearance as the rest
  // of the pond. The initial blue mote stays directly reachable from the drop.
  const placeAround=(id,type,mass,x,y,spreadX,spreadY,keepAway,padding)=>{
    for(let attempt=0;attempt<160;attempt++){
      const p={x:x+(rng()-.5)*spreadX,y:y+(rng()-.5)*spreadY};
      if(!clear(p,mass,keepAway,padding))continue;
      const angle=rng()*Math.PI*2,v=(type==='hole'?1.4:3.3)+rng()*2.2;
      fixed(id,type,mass,p,Math.cos(angle)*v,Math.sin(angle)*v,36+rng()*44);
      return;
    }
  };
  for(const [group,dx,dy] of [[0,-104,-60],[1,105,-110],[2,94,105],[3,-88,107],[4,-110,-264],[5,181,242]]){
    const masses=[16,30,53,88,138];
    for(let i=0;i<masses.length;i++){
      placeAround('inlet-family-'+group+'-'+i,(group+i)%3===0?'hole':'spike',masses[i],
        start.x+dx,start.y+dy,196,140,68,6);
    }
  }
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
  // Spread mixed-size shoals over the whole painting as well as the authored
  // fork. Alternating large escorts and feeding motes make each crossing read
  // as water the player can navigate, even away from the marked routes.
  const escorts=[40,96,215,451,132,286,737,143,1210,270,1980,963,369];
  for(let row=0;row<8;row++)for(let col=0;col<13;col++){
    const x=(col+.5)*width/13,y=(row+.5)*height/8;
    const index=row*13+col;
    const mass=escorts[(col*3+row*5)%escorts.length];
    placeAround('escort-'+index,(row+col)%2?'spike':'hole',mass,x,y,width/13*.95,height/8*.94,230,15);
    if((row+col)%2===0){
      const small=[25,46,63,93,129][(row+col*2)%5];
      placeAround('shoal-'+index, row%3?'spike':'hole',small,x,y,width/13,height/8,165,9);
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

  // Preserve the first screen and spread the outer feeding grounds apart.
  // A return to the opposite shore costs travel, providing a reason to store a
  // shrimp or turtle for later. Food grain density follows the expanded paper.
  function stretchAxis(origin,near,ratio) {
    const excess=v=>Math.sign(v-origin)*Math.max(0,Math.abs(v-origin)-near)*(ratio-1);
    const shift=excess(0);
    return v=>v+excess(v)-shift;
  }
  const stretchX=stretchAxis(start.x,445,1.84),stretchY=stretchAxis(start.y,330,1.67);
  for(const body of [cfg.player,...cfg.enemies,...cfg.items,...cfg.leaves,...cfg.drops]){
    body.x=stretchX(body.x);
    body.y=stretchY(body.y);
  }
  cfg.width=Math.round(stretchX(width));
  cfg.height=Math.round(stretchY(height));
  cfg.foodSpacing=Math.round(cfg.foodSpacing*Math.sqrt(cfg.width*cfg.height/(width*height)));
  return cfg;
}
