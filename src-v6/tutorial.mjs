import {spawnEnemy, spawnItem, spawnDrop, spawnLeaf, radius} from './sim.mjs';
import {introductions,results,LESSON_INTRO,LESSON_HOLD,LESSON_DISSOLVE} from './lesson-scenes.mjs';

const line=(zh,ja,en)=>({zh,ja,en});
const forms=['fish','shrimp','turtle','dragon'];
const hints={
  move:line('按住水面向右拖动，带着墨球游向淡蓝色的光。','水面を押したまま右に動かして、水色に光る相手に近づきましょう。','Hold the water and drag right. Swim toward the pale blue glow.'),
  eat:line('再近一点，碰到淡蓝圈就能把它吃下去。','もう少し近づいて、水色の輪に触れてみましょう。','Move a little closer. Touch the pale blue rim to absorb it.'),
  grew:line('你吃下了第一颗墨球。','最初の相手を吸収できました。','You absorbed your first rival.'),
  spike:line('游到右边，轻轻贴住红圈刺球，看看两边的墨量。','右に泳いで、赤いトゲ玉に少し触れてみましょう。','Swim right and stay against the red spiked ball for a moment.'),
  hole:line('这次贴住红圈黑洞。观察墨从哪里流向哪里。','今度は赤い渦に触れて、墨の流れを見てみましょう。','This time, touch the red whirl. Watch which way the ink flows.'),
  spikePair:line('游近一点，看两颗刺球怎样碰到一起。','少し近づいて、2つのトゲ玉がぶつかる様子を見ましょう。','Approach the two spiked balls and watch them touch.'),
  holePair:line('游近这两个黑洞。猜一猜，哪一个会变小？','2つの渦に近づきましょう。小さくなるのはどちらでしょう？','Approach the two whirls. Which one will shrink?'),
  mixedPair:line('游近刺球和黑洞，留意较小的那一个。','トゲ玉と渦に近づいて、小さい方を見てみましょう。','Approach the spiked ball and the whirl. Keep an eye on the smaller one.'),
  intercept:line('刺球已经泛起淡蓝光，现在游过去吃掉它。','トゲ玉が水色に変わりました。今なら吸収できます。','The spiked ball now glows blue. Swim into it to absorb it.'),
  fishTake:line('游向鲤鱼，让墨球碰到它的头。','コイの頭にそっと触れて、拾いましょう。','Swim up to the carp and touch its head to collect it.'),
  fishUse:line('鲤鱼已经在右侧道具格里。点它，变成鲤鱼。','右の道具欄にコイが入りました。選んでコイに変身しましょう。','The carp is in a slot on the right. Select it to take its form.'),
  fishTry:line('朝刺球吐泡，把它推开，再游过空隙。','トゲ玉に泡を吐いて押しのけ、すき間を通りましょう。','Blow bubbles at the spiked ball, then swim through the gap.'),
  shrimpTake:line('游过去，碰到虾的头就能收下它。','エビの頭に触れて拾いましょう。','Touch the shrimp’s head to collect it.'),
  shrimpUse:line('点右侧的虾，变身后靠近散墨。','右のエビを選んで変身し、墨の粒に近づきましょう。','Select the shrimp on the right, then approach the loose ink.'),
  shrimpTry:line('靠近散墨和淡蓝圈，看看谁先被虾吸过来。','墨の粒と水色の相手に近づきましょう。先に寄ってくるのはどちらでしょう？','Move near the loose ink and the blue rival. Which one comes to you first?'),
  turtleTake:line('接下来，游到龟的头边收下它。','次はカメです。頭に触れて拾いましょう。','Next, touch the turtle’s head to collect it.'),
  turtleUse:line('点右侧的龟，准备靠近红圈。','右のカメを選んで変身しましょう。','Select the turtle on the right to take its form.'),
  turtleTry:line('用龟壳碰一下红圈，观察自己的墨量。','甲羅で赤い輪に触れて、自分の墨の量を見てみましょう。','Brush the red rim with your shell. Watch your ink bar.'),
  dragonTake:line('最后一只游来的是龙。碰它的头，将它收进道具格。','最後は龍です。頭に触れて拾いましょう。','The last creature is a dragon. Touch its head to collect it.'),
  dragonUse:line('点右侧的龙。龙形态持续二十秒。','右の龍を選びましょう。変身は20秒間続きます。','Select the dragon. Its form lasts twenty seconds.'),
  dragonTry:line('靠近红圈，让散墨被吸过来，同时试着向前吐泡。','赤い輪に触れてみましょう。墨の粒が寄ってきたら、前に泡を吐いてみてください。','Approach the red rim. As ink drifts toward you, blow bubbles ahead.'),
  jet:line('面向右边，按住放墨键，用喷出的墨推开身后的刺球。','右を向いて墨を吐くボタンを長押しし、後ろのトゲ玉を押してみましょう。','Face right and hold the ink button. Use the jet to push the ball behind you.'),
  store:line('游进荷叶，在叶面上按住放墨键。','ハスの葉に乗って、墨を吐くボタンを長押ししましょう。','Swim onto the lotus leaf and hold the ink button.'),
  fullLeaf:line('这片叶子已经开了三朵花。先吃一朵，腾出位置。','この葉にはもう3輪咲いています。1輪食べて場所を空けましょう。','This leaf already has three flowers. Eat one to make room.'),
  bloom:line('再喷一点，看看叶面上的花苞。','もう少し墨を注いで、つぼみを見てみましょう。','Give it a little more ink. Watch the bud on the leaf.'),
  flower:line('松开放墨键，游到荷花上，把墨补回来。','ボタンを離して、咲いた花に触れましょう。墨が戻ります。','Release the button. Swim into the blossom to regain ink.'),
  done:line('教学完成。','練習できました。','Lesson complete.')
};
const sequences=[
  ['move','eat','grew'],
  ['spike','hole','spikePair','holePair','mixedPair','intercept'],
  forms.flatMap(f=>[f+'Take',f+'Use',f+'Try']),
  ['jet','store','bloom','flower']
];

export function createTutorial(id){
  const index=Number(String(typeof id==='object'?id.id:id).split('-').pop())-1;
  if(!sequences[index]) throw new RangeError('Unknown lesson: '+id);
  return {index,step:0,key:sequences[index][0],phase:'intro',elapsed:0,done:false,cursor:0,entered:null,seen:new Set(),pairStarted:false,contactAt:null,firstEat:false};
}
const touchMove=line('手指按住水面，往右轻轻一拖，游向淡蓝色的光。','水面に指を置き、右に軽くスライドして水色の相手に近づきましょう。','Touch the water and slide your finger right, toward the pale blue glow.');
const keyboardMove=line('按住水面向右拖动，也可以按 D 或 →，游向淡蓝色的光。','水面を右にドラッグするか、D か → を押して水色の相手に近づきましょう。','Drag right on the water, or hold D or →, to swim toward the pale blue glow.');
const keyboardJet=line('面向右边，按住 Shift 向后喷墨，试着推开身后的刺球。','右を向いて Shift キーを長押しし、後ろのトゲ玉を墨で押してみましょう。','Face right and hold Shift. Use your backward jet to push the spiked ball.');
const actionClue={
  touch:line('按住右下按钮。','右下のボタンを長押しします。','Hold the button at the bottom right.'),
  keyboard:line('按住 Shift 或右下按钮。','Shift キーか右下のボタンを長押しします。','Hold Shift or the button at the bottom right.')
};
export function tutorialHint(t,lang='zh',touch=false){
  if(t.phase==='intro')return introductions[t.index][lang];
  if((t.phase==='hold'||t.phase==='fade-out')&&results[t.key])return results[t.key][lang];
  if(t.key==='move')return (touch?touchMove:keyboardMove)[lang];
  if(t.key==='jet'&&!touch)return keyboardJet[lang];
  const s=hints[t.done?'done':t.key==='store'&&t.fullLeaf?'fullLeaf':t.key];
  const control=['fishTry','dragonTry'].includes(t.key)?actionClue[touch?'touch':'keyboard'][lang]:'';
  return [s[lang]||s.zh,control].filter(Boolean).join(lang==='en'?' ':'');
}

function clearExercise(w){
  for(const key of ['enemies','items','departingItems','drops','leaves','shots','safePath']) w[key].length=0;
  w.contacts.clear();
  w.cueTimes.clear();
  w.packet=0;w.packetTime=0;w.bubbleDelay=0;
  // The player's existing hold continues inside this lesson. A real change
  // of form still has the simulation's release latch.
  w.player.emitting=false;
}
function resetBody(w){
  Object.assign(w.player,{x:405,y:330,angle:0,vx:0,vy:0,mass:100,r:radius(100)*(w.player.form==='fish'?.85:1)});
  w.safePath.push({x:w.player.x,y:w.player.y});
}
function putEnemy(w,id,type,x,y,mass,extra={}){
  return spawnEnemy(w,{id,type,x,y,mass,vx:0,vy:0,...extra});
}
function stock(w,form){
  spawnItem(w,{id:'lesson-'+form,type:form,x:506,y:330,vx:-3,vy:0});
}
function pair(w,key){
  const mixed=key==='mixedPair',a=key==='holePair'?'hole':'spike',b=mixed?'hole':a;
  putEnemy(w,'demo-left',a,544,316,mixed?107:149);
  putEnemy(w,'demo-right',b,618,316,mixed?175:168);
}
function enter(t,w){
  const k=t.key;
  t.entered=w.time;t.seen.clear();t.contactAt=null;t.rivalStartMass=null;t.pairStarted=false;
  if(k==='hole'||k.endsWith('Pair')){
    clearExercise(w);resetBody(w);
    if(k==='hole')putEnemy(w,'touch-hole','hole',522,330,177);
    else pair(w,k);
  }
  if(k.endsWith('Take')){
    clearExercise(w);resetBody(w);
    // Each station supplies its own specimen; duplicates never occupy the pack.
    const f=k.slice(0,-4);
    if(!w.player.inventory.some(i=>(i?.type||i)===f))stock(w,f);
  }
  if(k.endsWith('Try')){
    clearExercise(w);resetBody(w);
    const f=k.slice(0,-3);
    if(f==='fish'){
      putEnemy(w,'fish-gate','spike',507,312,153);
      putEnemy(w,'fish-gate-far','spike',512,392,155);
      t.exit={x:554,y:342,r:27};
    } else if(f==='shrimp'){
      spawnDrop(w,{id:'lesson-ink',x:501,y:327,mass:7,ready:true});
      putEnemy(w,'shrimp-food','spike',529,355,25);
      putEnemy(w,'shrimp-danger','hole',645,239,178);
    } else {
      putEnemy(w,'guard-target','hole',507,330,195);
      if(f==='dragon'){
        spawnDrop(w,{id:'dragon-ink',x:469,y:360,mass:8,ready:true});
        putEnemy(w,'dragon-food','spike',510,395,21);
      }
    }
  }
  if(k==='store'){
    clearExercise(w);resetBody(w);
    spawnLeaf(w,{id:'lesson-leaf',x:540,y:330,r:71,stored:19,flowers:0});
  }
}
function enterNext(t,w){
  t.step++;
  t.key=sequences[t.index][t.step];
  enter(t,w);
}
function proceed(t,w){
  if(t.phase!=='active')return;
  if(results[t.key]){t.phase='hold';t.elapsed=0;return;}
  // A freshly activated form stays in the inventory position until its short
  // dissolve covers the new practice arrangement. Its timer is frozen here.
  if(t.key.endsWith('Use')){t.phase='fade-out';t.elapsed=0;return;}
  enterNext(t,w);
}
export function advanceTutorialBeat(t,w,dt){
  if(!t||t.done||t.phase==='active')return;
  t.elapsed+=Math.max(0,dt);
  if(t.phase==='intro'&&t.elapsed>=LESSON_INTRO){
    t.phase='active';t.elapsed=0;
    if(t.entered===null)t.entered=w.time;
  }else if(t.phase==='hold'&&t.elapsed>=LESSON_HOLD){
    if(t.step===sequences[t.index].length-1){
      t.done=true;t.phase='finished';t.key='done';
    }else{
      t.phase='fade-out';t.elapsed=0;
    }
  }else if(t.phase==='fade-out'&&t.elapsed>=LESSON_DISSOLVE){
    enterNext(t,w);
    t.phase='fade-in';t.elapsed=0;
  }else if(t.phase==='fade-in'&&t.elapsed>=LESSON_DISSOLVE){
    t.phase='active';t.elapsed=0;
  }
}
function eventIs(events,type,test=()=>true){return events.some(e=>e.type===type&&test(e));}
function live(t,w,id){return w.enemies.find(e=>e.id===id&&e.mass>0);}
function readEvents(t,w,events){
  if(events){t.cursor=(w.events||[]).length;return events;}
  const all=w.events||[];
  const from=t.cursor>all.length?0:t.cursor;
  t.cursor=all.length;
  return all.slice(from);
}
function runPair(t,w,events){
  const left=live(t,w,'demo-left'),right=live(t,w,'demo-right');
  if(eventIs(events,'eat',e=>e.id==='demo-left'))t.firstEat=true;
  if(!left||!right){
    if(t.key==='mixedPair'&&t.firstEat){enterNext(t,w);proceed(t,w);return;}
    enter(t,w);return;
  }
  if(Math.hypot(w.player.x-(left.x+right.x)/2,w.player.y-(left.y+right.y)/2)<155)t.pairStarted=true;
  if(!t.pairStarted)return;
  const a=Math.atan2(right.y-left.y,right.x-left.x);
  // These are the initial currents of the demonstration; all mass changes
  // come from the same contact solver used in the six paintings.
  left.vx=16*Math.cos(a);left.vy=16*Math.sin(a);
  right.vx=-16*Math.cos(a);right.vy=-16*Math.sin(a);
  if(eventIs(events,'enemyContact',e=>[e.aId,e.bId].includes('demo-left')&&[e.aId,e.bId].includes('demo-right')) && t.contactAt===null)t.contactAt=w.time;
  if(t.contactAt!==null&&w.time-t.contactAt>.95&&(t.key!=='mixedPair'||left.mass<w.player.mass)){
    if(t.key==='mixedPair'){
      left.vx=-8;left.vy=0;right.vx=72;right.vy=8;
    }
    proceed(t,w);
  }
}
function formTrial(t,w,f,events){
  for(const e of events){
    if(e.type==='push'&&e.source==='bubble')t.seen.add('push');
    if(e.type==='magnet')t.seen.add(e.target==='drop'?'ink':'enemy');
    if(e.type==='bubble'||e.type==='shield')t.seen.add(e.type);
  }
  const has=k=>t.seen.has(k);
  const succeeded=(f==='fish'&&has('push')&&Math.hypot(w.player.x-t.exit.x,w.player.y-t.exit.y)<t.exit.r+10) ||
    (f==='shrimp'&&has('ink')&&has('enemy')) || (f==='turtle'&&has('shield')) ||
    (f==='dragon'&&has('bubble')&&has('shield')&&(has('ink')||has('enemy')));
  if(succeeded){proceed(t,w);return;}
  if(w.player.form!==f&&w.time-t.entered>.15) {
    t.step-=2;t.key=f+'Take';enter(t,w);
  }
}
function recoverExercise(t,w){
  clearExercise(w);
  Object.assign(w.player,{form:'ink',formTime:0,activeItem:null,inventory:[]});
  resetBody(w);w.status='playing';w.waitRelease=w.held;
  const k=t.key;
  if(t.index===0){
    w.recordedMove=false;
    putEnemy(w,'first-blue','spike',520,337,39,{vy:1.5});
    putEnemy(w,'red-compare','hole',695,228,175);
  }else if(k==='spike'){
    putEnemy(w,'touch-spike','spike',521,330,175);
  }else if(k==='jet'){
    putEnemy(w,'push-behind','spike',334,330,151);
  }else{
    if(t.index===2)t.step-=t.step%3;
    if(k==='intercept')t.step--;
    if(k==='bloom'||k==='flower')t.step=1;
    t.key=sequences[t.index][t.step];
    enter(t,w);
  }
  t.entered=w.time;t.firstEat=false;t.contactAt=null;t.rivalStartMass=null;
}
export function updateTutorial(t,w,newEvents){
  if(!t||t.done)return Boolean(t?.done);
  if(t.phase!=='active')return false;
  if(t.entered===null)t.entered=w.time;
  const events=readEvents(t,w,newEvents);
  if(w.status==='lost'||w.player.mass<12){recoverExercise(t,w);return false;}
  const k=t.key;
  if(t.index===0){
    if(eventIs(events,'eat',e=>e.id==='first-blue'))t.firstEat=true;
    if(k==='move'&&(eventIs(events,'move')||t.firstEat))proceed(t,w);
    if(t.key==='eat'&&t.firstEat)proceed(t,w);
    if(t.key==='grew')proceed(t,w);
  }else if(k==='spike'||k==='hole'){
    const rival=live(t,w,'touch-'+k);
    if(rival){
      t.rivalStartMass??=rival.mass;
      if(t.contactAt===null&&eventIs(events,'damage',e=>e.id===rival.id))t.contactAt=w.time;
      // Leave both bodies in the water long enough to see the mass exchange.
      // Only the real collision's change to this rival can pass this station.
      if(t.contactAt!==null && Math.abs(rival.mass-t.rivalStartMass)>=7 && w.time-t.contactAt>=1.45)proceed(t,w);
    }
  }else if(k.endsWith('Pair')){
    runPair(t,w,events);
  }else if(k==='intercept'){
    if(eventIs(events,'eat',e=>e.id==='demo-left'))proceed(t,w);
    else if(!live(t,w,'demo-left')){
      // If the whirl got there first, restore just this experiment.
      t.step--;t.key='mixedPair';enter(t,w);
    }
  }else if(k.endsWith('Take')){
    const f=k.slice(0,-4);
    if(eventIs(events,'pickup',e=>e.form===f)||w.player.inventory.some(i=>(i?.type||i)===f))proceed(t,w);
  }else if(k.endsWith('Use')){
    const f=k.slice(0,-3);
    if(eventIs(events,'form',e=>e.form===f)||w.player.form===f)proceed(t,w);
  }else if(k.endsWith('Try')){
    formTrial(t,w,k.slice(0,-3),events);
  }else if(k==='jet'){
    if(eventIs(events,'push',e=>e.source==='spray'))proceed(t,w);
  }else if(t.index===3){
    t.fullLeaf=Boolean(w.leaves[0]?.flowers.length===3);
    if(eventIs(events,'flower')&&(k!=='store'||eventIs(events,'store')))t.firstEat=true;
    if(k==='store'&&eventIs(events,'store'))proceed(t,w);
    if(t.key==='bloom'&&(eventIs(events,'bloom')||w.leaves.some(l=>l.flowers.length)||t.firstEat))proceed(t,w);
    if(t.key==='flower'&&t.firstEat)proceed(t,w);
  }
  return t.done;
}

export function tutorialFocus(t,w){
  if(!t||t.done)return null;
  if(t.phase==='intro')return t.index===0?w.player:null;
  if(t.phase==='hold'||t.phase==='fade-out')return null;
  const k=t.key, e=id=>live(t,w,id);
  if(k==='move'||k==='eat')return e('first-blue');
  if(k==='spike'||k==='hole')return e('touch-'+k);
  if(k.endsWith('Pair')||k==='intercept')return e('demo-left');
  if(k.endsWith('Take'))return w.items[0];
  if(k==='fishTry')return t.seen.has('push')?t.exit:e('fish-gate');
  if(k==='shrimpTry')return e('shrimp-food');
  if(k==='turtleTry'||k==='dragonTry')return e('guard-target');
  if(k==='jet')return e('push-behind');
  if(k==='store'&&t.fullLeaf)return w.leaves[0]?.flowers[0];
  if(k==='store'||k==='bloom')return w.leaves[0];
  if(k==='flower')return w.leaves[0]?.flowers[0]||w.leaves[0];
  return null;
}
