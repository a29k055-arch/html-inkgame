// Detached pigment is recorded in pool coordinates. Camera movement, releasing
// the stick and changing the current input do not affect an older mark's age.
let stamps;
function noise(seed) {
  return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
}
function makeStamps(){
  const random=noise(0x815750);
  return Array.from({length:6},()=>{
    const sheet=document.createElement('canvas');sheet.width=sheet.height=72;
    const c=sheet.getContext('2d');
    for(let j=0;j<26;j++){
      const a=random()*Math.PI*2,dist=Math.sqrt(random())*18;
      const x=36+Math.cos(a)*dist,y=36+Math.sin(a)*dist,r=5+random()*10;
      const wash=c.createRadialGradient(x,y,0,x,y,r);
      wash.addColorStop(0,'rgba(35,41,38,.24)');wash.addColorStop(.43,'rgba(44,49,44,.13)');
      wash.addColorStop(1,'rgba(53,57,51,0)');c.fillStyle=wash;c.fillRect(x-r,y-r,r*2,r*2);
    }
    return sheet;
  });
}

export function createInkDrift(){
  stamps??=makeStamps();
  const marks=[],random=noise(0xd912b);
  let timer=0;
  function update(w,dt){
    const p=w.player,speed=Math.hypot(p.vx,p.vy);
    const paid=p.emitting&&p.form!=='fish'&&p.form!=='dragon';
    while(marks.length&&w.time-marks[0].born>5)marks.shift();
    timer-=dt;
    if(speed<5&&!paid){timer=0;return;}
    if(timer>0)return;
    timer=(paid?.044:.057)*(.74+.6*random());
    const heading=paid?p.angle:Math.atan2(p.vy,p.vx);
    const a=heading+Math.PI+(random()-.5)*(paid?.77:.45);
    const offset=p.r*(.48+.29*random()),drift=(paid?17:4)*(1+random());
    const spread=p.r*(paid?.46:.30);
    const l=(random()-.5)*spread;
    marks.push({x:p.x+Math.cos(a)*offset-Math.sin(a)*l,y:p.y+Math.sin(a)*offset+Math.cos(a)*l,
      dx:Math.cos(a)*drift,dy:Math.sin(a)*drift,angle:a,twist:(random()-.5)*.8,
      size:p.r*(paid?.87:.75)*(.58+.84*random()),born:w.time,life:(paid?2.65:1.95)*(.8+.50*random()),
      opacity:(paid?.64:.53)*(.76+.40*random()),stamp:stamps[Math.floor(random()*stamps.length)]});
  }
  function draw(c,time,visible=false){
    for(const m of marks){
      const age=time-m.born,q=age/m.life;
      if(q<0||q>=1)continue;
      const size=m.size*(1+.9*q),distance=(1-Math.exp(-2*age))*.5;
      c.save();c.globalAlpha*=m.opacity*(1-q*q)**1.67*(visible?.76-.26*q:1);
      c.translate(m.x+m.dx*distance,m.y+m.dy*distance);c.rotate(m.angle+m.twist*age);
      c.drawImage(m.stamp,-size,-size*.69,size*2,size*1.38);c.restore();
    }
  }
  return {update,draw};
}
