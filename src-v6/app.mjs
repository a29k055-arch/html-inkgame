import {createWorld,stepWorld,useItem} from './sim.mjs';
import {makeLevel,LEVELS,TUTORIALS,TRIAL} from './levels.mjs';
import {advanceTutorialBeat,createTutorial,updateTutorial,tutorialHint,tutorialFocus} from './tutorial.mjs';
import {showLessonBeat} from './lesson-scenes.mjs';
import {createRenderer} from './render.mjs';
import {createUI,paintings} from './ui.mjs';
import {createInput} from './input.mjs';
import {createCamera,createMinimap} from './view.mjs';
import {createInkSound} from './sound.mjs';
import {connectOpening} from './opening.mjs';

const canvas=document.querySelector('#world');
const draw=createRenderer(canvas),camera=createCamera(canvas,document.querySelector('#revealMeter'));
const minimap=createMinimap(document.querySelector('#minimap'),(x,y)=>{if(running())camera.inspect(world,x,y);});
const sound=createInkSound();
const STEP=1/60;
let world=null,tutorial=null,kind='level',index=0,seed=0;
let liveLessonChange=false;
let switching=false,ending=false,resultOpen=false,endedTime=0,accumulator=0,previous=0,hudAt=0;
let readStamp=null;
let eventOffset=0,scaleMax=1,lastHint='';
let opening;
const ui=createUI({
  onStart:(k,i)=>start(k,i),
  onRetry:()=>start(kind,index,{keepSeed:true}),
  onNextTutorial:()=>advanceTutorial(false),
  onUseItem:slot=>{
    if(!running())return;
    if(useItem(world,slot)){input.blockAction();hudAt=0;}
  },
  onPause:()=>{input.reset();accumulator=0;previous=0;readStamp=null;},
  onLanguage:lang=>{opening?.setLanguage(lang);lastHint='';hudAt=0;},
  onSound:enabled=>{sound.setEnabled(enabled);if(enabled)sound.unlock();},
  onSettings:onReturn=>opening.showSettings(onReturn),
  onCover:()=>{input.reset();opening.show();},
  onLeave:()=>changeScene(()=>{world=null;tutorial=null;ending=false;showLessonBeat(null);ui.home();},Boolean(tutorial))
});
const input=createInput({
  canvas,actionButton:document.querySelector('#action'),joystick:document.querySelector('#joystick'),stick:document.querySelector('#stick'),
  active:running,zoom:(n,x,y)=>{if(running())camera.zoom(world,n,x,y);}
});
function showCatalogue(group,selection){
  opening.hide();
  ui.openCatalogue(group,selection);
  sound.unlock();
}
sound.setEnabled(ui.soundEnabled!==false);
opening=connectOpening({
  getLanguage:()=>ui.lang,
  onLanguage:lang=>{if(ui.lang!==lang)ui.setLanguage(lang);},
  onSoundUnlock:()=>sound.unlock(),
  onPreferences:prefs=>{
    sound.configure(prefs);if(prefs.quality)draw.setQuality(prefs.quality);
    document.body.dataset.controls=prefs.controls||'auto';
    document.body.classList.toggle('mobile',prefs.controls==='mobile'||(prefs.controls!=='pc'&&matchMedia('(pointer:coarse)').matches));
  },
  prepare:()=>draw.prepare(),
  onPlay:()=>showCatalogue(),
  onHelp:()=>{showCatalogue('tutorial',0);},
  onGallery:index=>index===TRIAL.artworkIndex?showCatalogue('trial',0):showCatalogue('level',index),
  onSettings:()=>{showCatalogue();ui.openSettings();}
});
function running(){return Boolean(world&&!ui.paused&&(!switching||liveLessonChange)&&!ending&&!document.hidden&&(tutorial||world.status==='playing'));}
function newSeed(){
  const bits=new Uint32Array(1);crypto.getRandomValues(bits);return bits[0];
}
async function changeScene(change,lessonFade=false,continuous=false){
  if(switching)return;
  switching=true;liveLessonChange=continuous;
  if(!continuous){input.reset();accumulator=0;previous=0;}
  try{await ui.transition(change,lessonFade,continuous);}
  finally{switching=false;liveLessonChange=false;previous=0;}
}
function start(nextKind,nextIndex,{keepSeed=false,continuation=false}={}){
  const list=nextKind==='tutorial'?TUTORIALS:nextKind==='trial'?[TRIAL]:LEVELS;
  if(!list[nextIndex])return;
  const nextSeed=keepSeed?seed:newSeed();
  return changeScene(async()=>{
    await draw.prepare();
    kind=nextKind;index=nextIndex;seed=nextSeed;
    const id=list[index].id;
    world=createWorld(makeLevel(id,seed));
    tutorial=kind==='tutorial'?createTutorial(id,continuation):null;
    if(tutorial)updateTutorial(tutorial,world,[]);
    eventOffset=world.events.length;
    scaleMax=Math.max(1,Math.ceil(Math.max(world.largest,world.player.mass)*1.25));
    ending=false;resultOpen=false;endedTime=0;hudAt=0;lastHint='';
    ui.begin(kind,index);camera.reset(world);
    if(!(tutorial&&continuation))camera.introduce(world,3);
    refresh(true);paint(0);
  },nextKind==='tutorial'||Boolean(tutorial),continuation);
}
function advanceTutorial(completed){
  if(switching||kind!=='tutorial'||!world)return;
  if(completed){
    ui.complete('tutorial',index);
    if(index<TUTORIALS.length-1){
      start('tutorial',index+1,{continuation:true});
      return;
    }
  }
  start('trial',0,{continuation:true});
}
function refresh(force=false){
  if(!world)return;
  const p=world.player;
  if(Math.max(p.mass,world.largest)>scaleMax*.97)scaleMax=Math.ceil(Math.max(p.mass,world.largest)*1.22);
  ui.update({mass:p.mass,maxMass:world.largest,scaleMax,elapsed:world.time,items:p.inventory,form:p.form,formRemaining:p.formTime,actionHeld:p.emitting});
  showLessonBeat(tutorial);
  const hint=tutorial?tutorialHint(tutorial,ui.lang,matchMedia('(pointer:coarse)').matches):'';
  if(hint!==lastHint||force){lastHint=hint;ui.hint(hint);}
}
function paint(dt){
  const view=camera.update(world,dt);
  const artwork=paintings[kind==='trial'?TRIAL.artworkIndex:kind==='tutorial'?0:index];
  draw.render(world,view,{artwork,focus:tutorial?tutorialFocus(tutorial,world):null,reveal:ending&&kind!=='tutorial'&&world.status==='won'?Math.min(1,endedTime/1.1):0});
  minimap(world,view,canvas,draw.mapLayer);
}
function update(){
  const control=input.read(),lastForm=world.player.form;
  if(Math.abs(control.x)+Math.abs(control.y)>.02)camera.follow();
  stepWorld(world,control,STEP);
  if(world.player.form!==lastForm)input.blockAction();
  const events=world.events.slice(eventOffset);eventOffset=world.events.length;
  if(ui.soundEnabled!==false)sound.events(events,world.player);
  if(tutorial){
    if(updateTutorial(tutorial,world,events)){advanceTutorial(true);return;}
  }else if(world.status!=='playing'){
    ending=true;endedTime=0;input.reset();
    if(world.status==='won')ui.complete(kind,index);
    refresh(true);
  }
}
function frame(now){
  requestAnimationFrame(frame);
  if(!world||resultOpen||document.hidden){previous=0;return;}
  const elapsed=previous?(now-previous)/1000:0;
  const dt=Math.min(.1,elapsed);previous=now;
  if(ui.paused){accumulator=0;return;}
  if(running()){
    const phase=tutorial?.phase;
    accumulator+=dt;
    while(accumulator+1e-9>=STEP&&running()){
      accumulator-=STEP;update();
    }
    if(tutorial&&phase!==tutorial.phase){
      // Display a newly earned result on this frame so all three seconds are visible.
      readStamp=null;refresh(true);hudAt=now+80;
    }
    // The reading timer uses foreground time; physics and input continue
    // throughout the result and the outgoing and incoming paper fades.
    if(tutorial&&!switching&&phase===tutorial.phase&&phase!=='active'){
      // Start the reading clock after the result has been painted. A costly
      // frame must not use its pre-render timestamp to shorten the message.
      const stamp=performance.now();
      const readTime=readStamp===null?0:(stamp-readStamp)/1000;
      readStamp=stamp;
      advanceTutorialBeat(tutorial,world,phase==='hold'?readTime:elapsed);
      showLessonBeat(tutorial);
      if(tutorial.done)advanceTutorial(true);
    }
  }
  if(ending&&!switching&&kind!=='tutorial'){
    const before=endedTime;endedTime+=dt;
    const wait=world.status==='won'?1.17:.40;
    if(before<wait&&endedTime>=wait){
      resultOpen=true;
      const view=camera.update(world,0),width=canvas.clientWidth,height=canvas.clientHeight;
      ui.result(world.status==='won',world.time,{
        viewport:{width,height},world:{width:world.width,height:world.height},
        camera:{x:view.x-width/(2*view.scale),y:view.y-height/(2*view.scale),scale:view.scale}
      });
    }
  }
  if((!switching||liveLessonChange)&&now>=hudAt){refresh();hudAt=now+80;}
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
