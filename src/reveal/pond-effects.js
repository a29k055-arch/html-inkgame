import {coreRadius} from '../game/alien-geometry.js';

const TAU=Math.PI*2,clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const noise=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const approach=(a,b,rate,dt)=>a+(b-a)*(1-Math.exp(-rate*dt));

// Presentation only. Draw world strokes on the already transformed/clipped output
// context, then screen streaks after leaving that clip. Neither touches fluid/mask.
export class PondEffects {
 constructor({strength=1}={}){this.strength=clamp(strength,0,1.5);this.time=0;this.magnetMix=0;this.rushMix=0;this.giantMix=0;this.giantBefore=false;this.giantTier=0;this.pulses=[];this.lines=[];this.serial=0;this.metrics={magnet:{waves:0,targets:0},rush:{lineCount:0},giant:{pulses:0}};}
 clear(){this.time=0;this.magnetMix=this.rushMix=this.giantMix=0;this.giantBefore=false;this.giantTier=0;this.pulses.length=this.lines.length=0;this.player=null;this.metrics={magnet:{waves:0,targets:0},rush:{lineCount:0},giant:{pulses:0}};}
 trigger(kind,player,{fromRadius}={}){if(kind!=='shield'||!player||player.dead)return;const radius=coreRadius(player);this.pulses.push({x:player.x,y:player.y,age:0,radius,fromRadius:Number.isFinite(fromRadius)?Math.min(radius,fromRadius):radius*.82});if(this.pulses.length>2)this.pulses.shift();this.giantBefore=!!player.effects?.giant;this.giantTier=player.pondBuffs?.giant?.tier||1;}
 update(dt,arena,{mobile=false,width=1200,height=900,camera={scale:1}}={}){
  dt=clamp(Number(dt)||0,0,.1);this.time+=dt;const p=arena?.player;if(!p){this.clear();return;}if(this.player&&this.player!==p)this.clear();this.player=p;this.viewport={width,height,mobile};this.camera=camera;
  const alive=!p.dead,field=arena.magnetField,magnet=alive&&!!p.effects?.magnet&&(field?.active??true),giant=alive&&!!p.effects?.giant,tier=p.pondBuffs?.giant?.tier||1;
  if(giant&&(!this.giantBefore||tier>this.giantTier))this.trigger('shield',p);
  this.giantBefore=giant;this.giantTier=giant?tier:0;this.magnetMix=approach(this.magnetMix,magnet?1:0,magnet?9:7,dt);this.giantMix=approach(this.giantMix,giant?1:0,giant?7:4,dt);
  for(const pulse of this.pulses){pulse.age+=dt;if(giant&&pulse.age<.45)pulse.radius=Math.max(pulse.radius,coreRadius(p));}this.pulses=this.pulses.filter(q=>q.age<1.05);
  const speed=Math.hypot(p.vx||0,p.vy||0),base=arena.speed?.(p,false)||110,fish=alive&&!!p.effects?.rush,manual=alive&&!!p.effects?.manualRush;
  // Actual motion is mandatory: a stopped fish never leaves a screen full of lines.
  const moving=clamp((speed/base-.30)/.9),target=(fish?1:manual?.38:0)*moving;this.rushMix=approach(this.rushMix,target,target>this.rushMix?7:6,dt);
  const cap=mobile?12:22,wanted=this.rushMix<.008?0:Math.ceil(cap*this.rushMix);while(this.lines.length>cap)this.lines.pop();
  const dx=speed>1?(p.vx||0)/speed:1,dy=speed>1?(p.vy||0)/speed:0,screenSpeed=Math.min(Math.max(width,height)*1.7,Math.max(120,speed*(camera.scale||1)*1.15));
  for(let i=0;i<cap;i++){let line=this.lines[i];if(!line){line={age:99,life:0};this.lines.push(line);}line.age+=dt;if(i>=wanted)continue;
   if(line.age>=line.life||line.x<-width*.25||line.x>width*1.25||line.y<-height*.25||line.y>height*1.25){const seed=++this.serial,angle=Math.atan2(dy,dx)+(noise(seed+3)-.5)*.08;line={age:0,life:.28+noise(seed+11)*.33,x:noise(seed+19)*width,y:noise(seed+29)*height,dx:Math.cos(angle),dy:Math.sin(angle),length:Math.min(width,height)*(.055+noise(seed+37)*.12),weight:.55+noise(seed+41)*.45};this.lines[i]=line;}
   // Heading belongs to this stroke's birth. Turning never rotates existing strokes.
   line.x-=line.dx*screenSpeed*dt;line.y-=line.dy*screenSpeed*dt;
  }
  this.metrics.rush={lineCount:wanted,cap,intensity:this.rushMix,fish,manual,heading:[dx,dy]};
 }
 drawWorld(c,arena,scale=1){const p=arena?.player;if(!p||p.dead)return;const s=Math.max(.001,scale),radius=coreRadius(p),mix=this.magnetMix*this.strength,field=arena.magnetField;
  c.save();c.lineCap='round';let waveRadii=[],targets=0,ringRadius=radius+Math.max(7/s,radius*.14);
  if(mix>.008){const reach=field?.reach??(radius+(arena.magnetRules?.magnetReach||85))*(p.pondBuffs?.magnet?.strength||arena.magnetRules?.magnetMultiplier||1.5),outer=Math.max(ringRadius,reach);
   c.strokeStyle=`rgba(226,231,213,${.16*mix})`;c.lineWidth=4/s;c.beginPath();c.arc(p.x,p.y,ringRadius,0,TAU);c.stroke();c.strokeStyle=`rgba(102,121,104,${.34*mix})`;c.lineWidth=.8/s;c.beginPath();c.arc(p.x,p.y,ringRadius,0,TAU);c.stroke();
   // Inward waves disappear at the outer halo, never travelling through the body.
   for(let i=0;i<3;i++){const phase=(this.time*.48+i/3)%1,r=ringRadius+(outer-ringRadius)*(1-phase)**1.3;waveRadii.push(r);const a=Math.sin(phase*Math.PI)**1.3*.16*mix;c.strokeStyle=`rgba(89,109,95,${a})`;c.lineWidth=(.75+.4*(1-phase))/s;c.beginPath();c.arc(p.x,p.y,r,0,TAU);c.stroke();}
   const limit=this.viewport?.mobile?4:6;
   for(const e of arena.entities||[]){const pull=e.magnetPull;if(e===p||e.dead||!pull||!(pull.strength>0))continue;if(targets>=limit)break;const distance=Math.hypot(p.x-e.x,p.y-e.y),d=Math.max(.001,distance),dx=Number.isFinite(pull.dx)?pull.dx:(p.x-e.x)/d,dy=Number.isFinite(pull.dy)?pull.dy:(p.y-e.y)/d,core=coreRadius(e),space=distance-ringRadius-core;if(space<3/s)continue;
    const length=Math.min(32/s,space*.50),start=core+2/s,bend=(noise(targets+7)-.5)*8/s;c.strokeStyle=`rgba(86,106,92,${(.10+.15*clamp(pull.strength))*mix})`;c.lineWidth=(.65+.5*clamp(pull.strength))/s;c.beginPath();c.moveTo(e.x+dx*start,e.y+dy*start);c.quadraticCurveTo(e.x+dx*(start+length*.5)-dy*bend,e.y+dy*(start+length*.5)+dx*bend,e.x+dx*(start+length),e.y+dy*(start+length));c.stroke();targets++;
   }
   this.metrics.magnet={active:!!field?.active,ringRadius,reach,waves:waveRadii.length,waveRadii,targets,intensity:this.magnetMix};
  }else this.metrics.magnet={active:false,ringRadius,reach:0,waves:0,waveRadii:[],targets:0,intensity:this.magnetMix};
  if(this.giantMix>.008){const a=this.giantMix*this.strength*(.11+.025*Math.sin(this.time*1.3));c.strokeStyle=`rgba(112,105,80,${a})`;c.lineWidth=1.05/s;const r=radius+4/s;for(let i=0;i<3;i++){const start=i*TAU/3+this.time*.12;c.beginPath();c.arc(p.x,p.y,r,start,start+.50);c.stroke();}}
  for(const pulse of this.pulses){const t=clamp(pulse.age/1.05),ease=1-(1-t)**3;for(let i=0;i<2;i++){const r=pulse.fromRadius+(pulse.radius*(1.16+i*.13)-pulse.fromRadius)*ease,alpha=(1-t)**2*(i?.15:.25)*this.strength;c.strokeStyle=`rgba(104,99,78,${alpha})`;c.lineWidth=(1.1+2.3*(1-t))/s;c.beginPath();c.arc(pulse.x,pulse.y,r,0,TAU);c.stroke();}}
  this.metrics.giant={active:this.giantBefore,pulses:this.pulses.length,coreRadius:radius,intensity:this.giantMix};c.restore();
 }
 drawScreen(c,player,viewport=this.viewport,camera=this.camera){if(!player||player.dead||this.rushMix<.008){this.metrics.rush.drawn=0;return;}const {width,height}=viewport||{width:1200,height:900},cx=(player.x-(camera?.x||0))*(camera?.scale||1),cy=(player.y-(camera?.y||0))*(camera?.scale||1),safeX=Math.max(width*.18,coreRadius(player)*(camera?.scale||1)*1.35),safeY=Math.max(height*.17,coreRadius(player)*(camera?.scale||1)*1.35);let drawn=0;
  c.save();c.lineCap='round';for(let i=0;i<this.metrics.rush.lineCount;i++){const line=this.lines[i];if(!line||line.age>=line.life)continue;const mx=line.x+line.dx*line.length*.5,my=line.y+line.dy*line.length*.5;if(((mx-cx)/safeX)**2+((my-cy)/safeY)**2<1)continue;if(my<125&&mx>width*.25&&mx<width*.75)continue;
   const envelope=Math.sin(Math.PI*clamp(line.age/line.life)),alpha=envelope*.32*this.rushMix*this.strength*line.weight,g=c.createLinearGradient(line.x,line.y,line.x+line.dx*line.length,line.y+line.dy*line.length);g.addColorStop(0,'rgba(91,91,78,0)');g.addColorStop(.55,`rgba(91,91,78,${alpha})`);g.addColorStop(1,'rgba(91,91,78,0)');c.strokeStyle=g;c.lineWidth=.8+line.weight*.9;c.beginPath();c.moveTo(line.x,line.y);c.lineTo(line.x+line.dx*line.length,line.y+line.dy*line.length);c.stroke();drawn++;
  }c.restore();this.metrics.rush.drawn=drawn;
 }
}
