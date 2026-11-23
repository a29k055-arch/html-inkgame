import {spawnEnemy, spawnItem, spawnDrop, spawnLeaf, radius} from './sim.mjs';

const line=(zh,ja,en)=>({zh,ja,en});
const forms=['fish','shrimp','turtle','dragon'];
const hints={
  move:line('按住水面拖动，轻推摇杆向淡蓝圈游去。','水面を押したまま少し動かし、水色の輪へ泳ごう。','Hold the water and drag a little to swim toward the pale blue ring.'),
  eat:line('碰到淡蓝圈，就能吞下它；远处的红圈先绕开。','水色の輪に触れて吸収しよう。赤い輪はよけよう。','Touch the blue ring to absorb it. Give the red ring space.'),
  grew:line('第一口墨入体，身形与上方的墨量一起增长。','最初の墨を吸収。体と上の墨量が一緒に増えた。','Your first catch grew your body and the ink bar above.'),
  spike:line('轻触红圈刺球，再松手。看看双方怎样一起变小。','赤いトゲ玉に軽く触れ、離れよう。両方が縮む。','Brush the red spiked ball, then move away. Both lose equal ink.'),
  hole:line('再轻碰红圈黑洞：它会把你的墨吸进自己体内。','赤い渦に少し触れよう。君の墨が渦へ移る。','Briefly touch the red whirl. Watch your ink flow into it.'),
  spikePair:line('游近两颗刺球，观察它们接触：双方损失相同的墨量。','二つのトゲ玉に近づこう。触れると同じ量の墨を失う。','Approach the two spiked balls. Watch both lose equal ink on contact.'),
  holePair:line('游近两颗黑洞。黑洞碰到同类也会同时变小。','二つの渦に近づこう。渦どうしも一緒に縮む。','Approach the twin whirls. Two whirls also lose ink together.'),
  mixedPair:line('游到两者身旁。黑洞比刺球大，正在吸走它的墨。','二つに近づこう。大きな渦は小さなトゲ玉から墨を吸う。','Approach the pair. The larger whirl draws ink from the smaller spiked ball.'),
  intercept:line('刺球已成淡蓝圈，现在可以截住它。','トゲ玉が水色になった。今なら吸収できる。','The spiked ball has turned blue. Intercept it now.'),
  fishTake:line('游过去拾取鲤鱼。先把它收入右侧的空格。','鯉を拾おう。まずは右の空いた枠へ。','Swim to the carp to store it in a slot on the right.'),
  fishUse:line('点右侧鲤鱼变形，再看右下交互键。','右の鯉を選び、右下の技ボタンを見よう。','Select the carp in your inventory. See the action button change.'),
  fishTry:line('面向前方的刺球，按住交互键吐泡推开它；再游过空隙。','前のトゲ玉に向き、技ボタンで泡を吐いて押し、すきまへ泳ごう。','Face the spiked ball and hold Action to push it with bubbles, then swim through the gap.'),
  shrimpTake:line('下一只生物是虾。游过去收入道具格。','次はエビ。近づいて枠に入れよう。','The shrimp is next. Swim over to collect it.'),
  shrimpUse:line('点虾，靠近散墨和淡蓝圈。','エビを選び、墨の粒と水色の輪へ近づこう。','Activate the shrimp and approach the ink and blue ring.'),
  shrimpTry:line('靠近两种目标：散墨较快，蓝圈敌人较慢；红圈不会被吸来。','二つに近づこう。墨の粒は速く、水色の敵はゆっくり近づく。赤い敵は動かない。','Draw both close. Loose ink comes quickly, blue foes slowly; red foes resist.'),
  turtleTake:line('拾取游来的龟。','泳いできたカメを拾おう。','Collect the turtle as it drifts near.'),
  turtleUse:line('点龟，准备从红圈旁通过。','カメを選び、赤い輪のそばを通ろう。','Activate the turtle to pass beside the red ring.'),
  turtleTry:line('用龟身轻碰红圈。游速稍慢，碰撞时能守住墨量。','カメで赤い輪に触れよう。泳ぎは少し遅く、触れても墨は減らない。','Brush the red ring as a turtle. You move a little slower and keep your ink.'),
  dragonTake:line('最后拾取龙。','最後に竜を拾おう。','Collect the dragon last.'),
  dragonUse:line('点龙。守墨、磁吸、吐泡同时生效二十秒。','竜を選ぼう。守り、引き寄せ、泡が同時に20秒続く。','Activate the dragon. Protection, magnetism and bubbles last twenty seconds together.'),
  dragonTry:line('靠近红圈承受接触，吸近散墨，并按交互键向前吐泡。','赤い輪に触れ、墨の粒を引き寄せながら、技ボタンで前に泡を吐こう。','Brush the red ring, draw ink close, and press Action to blow bubbles.'),
  jet:line('朝右轻推摇杆。按住交互键向后喷墨，让身后的刺球退开。','右を向き、技ボタンを長押し。後ろに墨を放ち、後方のトゲ玉を押そう。','Face right and hold Action to jet ink backward. Push the ball behind you.'),
  store:line('游到荷叶上，再按住交互键，把墨存入叶面。','ハスの葉へ泳ぎ、技ボタンを押して葉に墨をためよう。','Swim onto the lotus leaf and hold Action to deposit ink.'),
  bloom:line('继续向叶面喷墨，直到花苞展开。','つぼみが開くまで葉に墨を注ごう。','Keep the jet on the leaf until its bud opens.'),
  flower:line('松开放墨，游近刚开的荷花，把墨量补回来。','技を放し、咲いた花へ泳いで墨を取り戻そう。','Release Action and touch the new blossom to regain ink.'),
  done:line('习成','修了','Lesson complete')
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
  return {index,step:0,key:sequences[index][0],done:false,cursor:0,entered:null,seen:new Set(),pairStarted:false,contactAt:null,firstEat:false};
}
export function tutorialHint(t,lang='zh'){
  const s=hints[t.done?'done':t.key];
  return s[lang]||s.zh;
}

function clearExercise(w){
  for(const key of ['enemies','items','drops','leaves','shots','safePath']) w[key].length=0;
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
  t.entered=w.time;t.seen.clear();t.contactAt=null;t.pairStarted=false;
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
function proceed(t,w){
  if(++t.step>=sequences[t.index].length){t.done=true;t.key='done';return;}
  t.key=sequences[t.index][t.step];
  enter(t,w);
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
    if(t.key==='mixedPair'&&t.firstEat){proceed(t,w);proceed(t,w);return;}
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
  t.entered=w.time;t.firstEat=false;
}
export function updateTutorial(t,w,newEvents){
  if(!t||t.done)return Boolean(t?.done);
  if(t.entered===null)t.entered=w.time;
  const events=readEvents(t,w,newEvents);
  if(w.status==='lost'||w.player.mass<12){recoverExercise(t,w);return false;}
  const k=t.key;
  if(t.index===0){
    if(eventIs(events,'eat',e=>e.id==='first-blue'))t.firstEat=true;
    if(k==='move'&&(eventIs(events,'move')||t.firstEat))proceed(t,w);
    if(t.key==='eat'&&t.firstEat)proceed(t,w);
    if(t.key==='grew'&&w.time-t.entered>1.5)proceed(t,w);
  }else if(k==='spike'||k==='hole'){
    if(eventIs(events,'damage',e=>e.target===k))proceed(t,w);
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
    if(eventIs(events,'flower')&&(k!=='store'||eventIs(events,'store')))t.firstEat=true;
    if(k==='store'&&eventIs(events,'store'))proceed(t,w);
    if(t.key==='bloom'&&(eventIs(events,'bloom')||w.leaves.some(l=>l.flowers.length)||t.firstEat))proceed(t,w);
    if(t.key==='flower'&&t.firstEat)proceed(t,w);
  }
  return t.done;
}

export function tutorialFocus(t,w){
  if(!t||t.done)return null;
  const k=t.key, e=id=>live(t,w,id);
  if(k==='move'||k==='eat')return e('first-blue');
  if(k==='spike'||k==='hole')return e('touch-'+k);
  if(k.endsWith('Pair')||k==='intercept')return e('demo-left');
  if(k.endsWith('Take'))return w.items[0];
  if(k==='fishTry')return t.seen.has('push')?t.exit:e('fish-gate');
  if(k==='shrimpTry')return e('shrimp-food');
  if(k==='turtleTry'||k==='dragonTry')return e('guard-target');
  if(k==='jet')return e('push-behind');
  if(k==='store'||k==='bloom')return w.leaves[0];
  if(k==='flower')return w.leaves[0]?.flowers[0]||w.leaves[0];
  return null;
}
