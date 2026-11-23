import {createWorld,stepWorld,useItem} from './sim.mjs';
import {makeLevel,LEVELS,TUTORIALS} from './levels.mjs';
import {createTutorial,updateTutorial,tutorialHint,tutorialFocus} from './tutorial.mjs';
import {createRenderer} from './render.mjs';
import {createUI,paintings} from './ui.mjs';
import {createInput} from './input.mjs';
import {createCamera,createMinimap} from './view.mjs';
import {createInkSound} from './sound.mjs';

const canvas=document.querySelector('#world');
const draw=createRenderer(canvas),camera=createCamera(canvas);
const minimap=createMinimap(document.querySelector('#minimap'));
const sound=createInkSound();
const STEP=1/60;
let world=null,tutorial=null,kind='level',index=0,seed=0,inSeries=false;
let switching=false,ending=false,resultOpen=false,endedTime=0,accumulator=0,previous=0,hudAt=0;
let eventOffset=0,scaleMax=1,lastHint='';
const ui=createUI({
  onStart:(k,i)=>start(k,i,{series:k==='tutorial'&&i===0}),
  onRetry:()=>start(kind,index,{keepSeed:true,series:inSeries}),
  onNextTutorial:()=>advanceTutorial(false),
  onUseItem:slot=>{
    if(!running())return;
    if(useItem(world,slot)){input.blockAction();hudAt=0;}
  },
  onPause:()=>{input.reset();accumulator=0;previous=0;},
  onLanguage:()=>{lastHint='';hudAt=0;},
  onLeave:()=>changeScene(()=>{world=null;tutorial=null;ending=false;ui.home();})
});
const input=createInput({
  canvas,actionButton:document.querySelector('#action'),joystick:document.querySelector('#joystick'),stick:document.querySelector('#stick'),
  active:running,zoom:(n,x,y)=>{if(running())camera.zoom(world,n,x,y);}
});
function running(){return Boolean(world&&!ui.paused&&!switching&&!ending&&!document.hidden&&world.status==='playing');}
function newSeed(){
  const bits=new Uint32Array(1);crypto.getRandomValues(bits);return bits[0];
}
async function changeScene(change){
  if(switching)return;
  switching=true;input.reset();accumulator=0;previous=0;
  try{await ui.transition(change);}
  finally{switching=false;previous=0;}
}
function start(nextKind,nextIndex,{keepSeed=false,series=false}={}){
  const list=nextKind==='tutorial'?TUTORIALS:LEVELS;
  if(!list[nextIndex])return;
  const nextSeed=keepSeed?seed:newSeed();
  return changeScene(()=>{
    kind=nextKind;index=nextIndex;seed=nextSeed;inSeries=series;
    const id=list[index].id;
    world=createWorld(makeLevel(id,seed));
    tutorial=kind==='tutorial'?createTutorial(id):null;
    if(tutorial)updateTutorial(tutorial,world,[]);
    eventOffset=world.events.length;
    scaleMax=Math.max(1,Math.ceil(Math.max(world.largest,world.player.mass)*1.25));
    ending=false;resultOpen=false;endedTime=0;hudAt=0;lastHint='';
    ui.begin(kind,index);camera.reset(world);refresh(true);paint(0);
  });
}
function advanceTutorial(completed){
  if(switching||kind!=='tutorial'||!world)return;
  if(completed)ui.complete('tutorial',index);
  if(index<TUTORIALS.length-1){
    start('tutorial',index+1,{series:inSeries});
  }else if(inSeries||!completed){
    start('level',0);
  }else{
    ending=true;endedTime=1.2;input.reset();resultOpen=true;ui.result(true,world.time);
  }
}
function refresh(force=false){
  if(!world)return;
  const p=world.player;
  if(Math.max(p.mass,world.largest)>scaleMax*.97)scaleMax=Math.ceil(Math.max(p.mass,world.largest)*1.22);
  ui.update({mass:p.mass,maxMass:world.largest,scaleMax,items:p.inventory,form:p.form,formRemaining:p.formTime,actionHeld:p.emitting});
  const hint=tutorial?tutorialHint(tutorial,ui.lang):'';
  if(hint!==lastHint||force){lastHint=hint;ui.hint(hint);}
}
function paint(dt){
  const view=camera.update(world,dt);
  const artwork=paintings[kind==='tutorial'?0:index];
  draw.render(world,view,{artwork,focus:tutorial?tutorialFocus(tutorial,world):null,reveal:ending&&kind==='level'&&world.status==='won'?Math.min(1,endedTime/1.1):0});
  minimap(world,view,canvas);
}
function update(){
  const control=input.read(),lastForm=world.player.form;
  stepWorld(world,control,STEP);
  if(world.player.form!==lastForm)input.blockAction();
  const events=world.events.slice(eventOffset);eventOffset=world.events.length;
  if(ui.soundEnabled!==false)sound.events(events);
  if(tutorial){
    if(updateTutorial(tutorial,world,events)){advanceTutorial(true);return;}
  }else if(world.status!=='playing'){
    ending=true;endedTime=0;input.reset();
    if(world.status==='won')ui.complete('level',index);
    refresh(true);
  }
}
function frame(now){
  requestAnimationFrame(frame);
  if(!world||resultOpen||document.hidden){previous=0;return;}
  const dt=previous?Math.min(.1,(now-previous)/1000):0; previous=now;
  if(ui.paused){accumulator=0;return;}
  if(running()){
    accumulator+=dt;
    while(accumulator+1e-9>=STEP&&running()){
      accumulator-=STEP;update();
    }
  }
  if(ending&&!switching&&kind==='level'){
    const before=endedTime;endedTime+=dt;
    const wait=world.status==='won'?1.17:.40;
    if(before<wait&&endedTime>=wait){resultOpen=true;ui.result(world.status==='won',world.time);}
  }
  if(!switching&&now>=hudAt){refresh();hudAt=now+80;}
  paint(dt);
}
window.addEventListener('keydown',e=>{
  if(!world||switching||e.repeat)return;
  if(e.key==='Escape'&&!ending){e.preventDefault();ui.setPaused(!ui.paused);input.reset();}
  if(running()&&['Digit1','Digit2','Digit3'].includes(e.code)) {
    if(useItem(world,Number(e.code.slice(-1))-1)){input.blockAction();hudAt=0;}
  }
});
function unlockSound(){if(ui.soundEnabled!==false)sound.unlock();}
window.addEventListener('pointerdown',unlockSound,{passive:true});
window.addEventListener('keydown',unlockSound);
document.addEventListener('visibilitychange',()=>{
  previous=0;accumulator=0;
  if(document.hidden&&world&&!switching&&!ending&&!ui.paused)ui.setPaused(true);
});
requestAnimationFrame(frame);
