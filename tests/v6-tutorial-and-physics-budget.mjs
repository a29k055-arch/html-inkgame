import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {arch,cpus,platform} from 'node:os';
import {createWorld,stepWorld,spawnDrop,spawnItem,useItem} from '../src-v6/sim.mjs';
import {makeLevel} from '../src-v6/levels.mjs';
import {createTutorial,tutorialFocus,updateTutorial} from '../src-v6/tutorial.mjs';

function steer(p,target){
  if(!target)return {x:0,y:0};
  const dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy);
  return {x:dx/Math.max(12,d),y:dy/Math.max(12,d)};
}

// A controller visits precisely the same stations as a human. It sends only
// joystick/action/item commands; no mass, positions or lesson events are edited.
for(let i=1;i<=4;i++){
  const id='tutorial-'+i, w=createWorld(makeLevel(id,784)),t=createTutorial(id);
  const history=[];
  for(let step=0;step<60*240&&!t.done;step++){
    const key=t.key;
    if(key!==history.at(-1))history.push(key);
    const f=tutorialFocus(t,w);
    const command=steer(w.player,f);
    if(key.endsWith('Use') && w.player.inventory.length)useItem(w,0);
    if(key==='jet'){command.x=0;command.y=0; command.action=true;}
    if(key==='fishTry'){const gate=w.enemies.find(e=>e.id==='fish-gate'); if(!t.seen.has('push')&&gate)Object.assign(command,steer(w.player,gate));command.action=true;}
    if(key==='dragonTry')command.action=true;
    if(key==='store'||key==='bloom'){command.action=true;}
    if(key.endsWith('Pair')&&f){Object.assign(command,steer(w.player,{x:f.x-84,y:f.y+15}));}
    stepWorld(w,command,1/60);updateTutorial(t,w);
    if(w.status==='lost')break;
  }
  console.log(id,{status:t.done?'completed':t.key,seconds:+w.time.toFixed(2),stations:history.length});
  assert.ok(t.done, id+' stopped at '+t.key+' after '+history.join(', '));
}

const w=createWorld({...makeLevel('level-6',163),tutorial:true});
const p=w.player;
// Crowded test: all the real level-6 enemies, plus extra loose ink distributed
// around the player. This measures the physics workload alone, without canvas.
for(let i=0;i<96;i++)spawnDrop(w,{x:200+i*23,y:210+(i%9)*45,mass:1.3});
spawnItem(w,{type:'dragon',x:p.x,y:p.y});stepWorld(w,{},1/60);useItem(w,0);
const samples=[];
for(let batch=0;batch<360;batch++){
  const start=performance.now();
  for(let i=0;i<60;i++)stepWorld(w,{x:Math.cos(w.time*.3),y:Math.sin(w.time*.3),action:true},1/60);
  if(batch>=30)samples.push((performance.now()-start)/60);
}
samples.sort((a,b)=>a-b);
const at=q=>+(samples[Math.floor((samples.length-1)*q)]).toFixed(4);
console.log({environment:[platform(),arch(),cpus()[0]?.model,process.version].join(' / '),
  samples:samples.length,unit:'ms per 60 Hz physics tick; percentiles of one-second batch means',
  median:at(.5),p95:at(.95),p99:at(.99), worldSeconds:+w.time.toFixed(2),finalEnemies:w.enemies.length});
