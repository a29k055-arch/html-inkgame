import {getRigIcon} from './rig-icons.mjs';
import {createLevelScroll} from '../assets/ui/bamboo-scroll/bamboo-scroll.js?v=be7646f';
import {inkIcon} from '../src-v5/ui/ink-icons.js';
import {PaintingView} from '../src-v5/reveal/painting-view.js';
import {LEVELS, TUTORIALS} from './levels.mjs';
import {StartTransition, START_TRANSITIONS} from '../src-v5/ink/start-transitions.js';

const artwork = n => new URL('../assets/artworks/v4-cropped/' + n + '.png',import.meta.url).href;
export const paintings = [2,1,3,4,6,7].map(artwork);
const studies = [7,3,4,1].map(artwork);
const icons = Object.fromEntries(['fish','shrimp','turtle','dragon'].map(n=>[n,new URL('./art/'+n+'-icon.webp',import.meta.url).href]));
const translations = {
  backCover:['返回封面','表紙に戻る','Title screen'],
  paintingHint:['滚轮或双指缩放 · 拖动平移','ホイール／ピンチで拡大・ドラッグで移動','Scroll or pinch to zoom · drag to pan'],
  paintingDone:['继续','進む','Continue'],paintingReset:['适合屏幕','全体を表示','Fit to screen'],
  paintingViewLabel:['完整水墨画欣赏','完成した水墨画','Completed ink painting'],
  pond:['水墨池塘','墨の池','Ink Pond'],contents:['竹简目录','竹簡の目録','Scroll index'],
  primer:['习墨','墨の手ほどき','Primer'],paintings:['画卷','画巻','Paintings'],
  settings:['设置','設定','Settings'],sound:['水声与墨声','水と墨の音','Pond sounds'],
  controls:['操作','操作','Controls'],language:['语言','言語','Language'],close:['关闭','閉じる','Close'],
  goal:['淡蓝实圈可以吞食。让自己的墨量超过上方「最大敌人」的标记，即可揭画。','水色の実線は吸収できる相手の印。自分の墨量が上の「最大の敵」の印を超えると、絵が現れる。','Creatures with solid blue rings are edible. Pass the largest rival’s mark on the mass bar to reveal the painting.'],
  previous:['向前翻阅','前へ送る','Scroll back'],next:['向后翻阅','次へ送る','Scroll forward'],
  beginStudy:['进入习墨','手ほどきを始める','Begin lesson'],beginPond:['进入池塘','池に入る','Enter pond'],
  direct:['直接玩《浅汀》','「浅瀬」から遊ぶ','Skip to Shallow Shoal'],locked:['尚未开启','未開放','Locked'],
  unlockAfter:['完成《{name}》后开启','「{name}」を終えると開放','Complete {name} to unlock'],
  studyProgress:['习墨 {a}/4','手ほどき {a}/4','Lessons {a}/4'],levelProgress:['揭画 {a}/6','開いた画巻 {a}/6','Paintings revealed {a}/6'],
  done:['成','済','✓'],mass:['墨量比较','墨量の比較','Mass comparison'],own:['自身','自分','You'],largest:['最大敌人','最大の敵','Largest rival'],
  pause:['暂停','一時停止','Pause'],paused:['池上小憩','池のほとりで','Paused'],resume:['继续游动','続ける','Resume'],
  return:['返回竹简','目録へ戻る','Return to scrolls'],map:['池塘小地图','池の地図','Pond map'],
  release:['放墨','墨を吐く','Jet ink'],bubble:['吐泡','泡を吐く','Bubbles'],
  fish:['鲤鱼','鯉','Carp'],shrimp:['虾','海老','Shrimp'],turtle:['乌龟','亀','Turtle'],dragon:['墨龙','墨の龍','Ink dragon'],
  slot:['道具格 {n}','道具枠 {n}','Item slot {n}'],empty:['空','空','Empty'],
  use:['使用{name}','{name}を使う','Use {name}'],skipStep:['跳到下一段 →','次の段へ →','Skip to next →'],
  mouse:['按住水面拖动来游动；滚轮缩放。按住 Shift 或空格使用交互键，数字键 1–3 使用已收集的道具。','水面をドラッグして移動。ホイールで拡大・縮小。Shift またはスペースで墨や泡を吐き、数字キー 1–3 で道具を使います。','Hold and drag on the water to swim. Scroll to zoom. Hold Shift or Space to jet ink or blow bubbles. Use items with 1–3.'],
  touch:['在水面拖动来游动，双指捏合缩放。按住右下按钮放墨或吐泡，轻点右侧圆格使用道具。','水面をドラッグして移動。2本指で拡大・縮小。右下を長押しして墨や泡を吐き、右の丸い枠をタップして道具を使います。','Drag on the water to swim and pinch to zoom. Hold the lower-right button to jet ink or blow bubbles. Tap a circle on the right to use an item.'],
  won:['画卷已揭','画巻が開きました','Painting revealed'],lost:['墨量已尽','墨が尽きました','Ink depleted'],studied:['习墨完成','手ほどき完了','Lesson complete'],
  nextPond:['进入下一幅','次の画巻へ','Next painting'],firstPond:['进入《浅汀》','「浅瀬」へ','Enter Shallow Shoal'],
  retry:['重试此局','同じ配置で再挑戦','Try this layout again'],
  elapsed:['用时 {time}','所要時間 {time}','Time {time}'],
  tryNote:['再走一次这段水路，试试另一种选择。','同じ水路で、別の進み方を試しましょう。','Return to the same pond and try another route.'],
  studyNote:['现在可以去浅汀，把刚学的动作连起来。','浅瀬で覚えた動きをつないでみましょう。','Enter the shallows to put these moves together.']
};
const languages=['zh','ja','en'];
const saveKey='boku.v6.pond.progress.1';
const langIndex = lang => languages.indexOf(lang);
const chooseLanguage = input => {
  for (const s of input) {
    const lang=String(s).toLowerCase().split('-')[0];
    if (languages.includes(lang)) return lang;
  }
  return 'zh';
};
export function loadProgress(storage) {
  let data={};
  try { data=JSON.parse(storage?.getItem(saveKey) || '{}') || {}; } catch {}
  const indices=(value,n)=>Array.isArray(value)?[...new Set(value.filter(i=>Number.isInteger(i)&&i>=0&&i<n))]:[];
  return {lang:languages.includes(data.lang)?data.lang:chooseLanguage(globalThis.navigator?.languages||[]),
    sound:data.sound!==false, lessons:indices(data.lessons,4), levels:indices(data.levels,6)};
}
function stageList(kind) { return kind==='tutorial'?TUTORIALS:LEVELS; }
function readBrowserStore(){try{return window.localStorage;}catch{return null;}}
function formatTime(seconds) {
  const n=Math.max(0,Math.floor(seconds)||0);
  return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');
}
function loadTransitionAtlases() {
  const ready = [];
  for (const def of START_TRANSITIONS.slice(0,2)) {
    const image=new Image();
    image.onload=()=>{if(image.naturalWidth===def.columns*def.width)ready.push({...def,image});};
    image.src=def.src;
  }
  // A slow texture request must never prevent a scene change. The original
  // transition implements its own ink fade until either atlas is decoded.
  return ()=>Promise.resolve({items:ready});
}

export function createUI(actions={}) {
  const $=id=>document.getElementById(id);
  const store=readBrowserStore(), progress=loadProgress(store);
  const write=()=>{try{store?.setItem(saveKey,JSON.stringify(progress));}catch{}};
  const text=(key,values={})=>{
    let value=translations[key]?.[langIndex(progress.lang)] || key;
    for (const [name,v] of Object.entries(values)) value=value.replace('{'+name+'}',v);
    return value;
  };
  const library=$('library'),field=$('field'),slips=$('slips'),settings=$('options'),ending=$('ending');
  const order=[...TUTORIALS,...LEVELS];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop=()=>!window.matchMedia('(pointer: coarse)').matches;
  const wipe=new StartTransition($('ink-wipe'),{preload:loadTransitionAtlases(),coverDuration:reduced?0:.39,revealDuration:reduced?0:.42});
  let selection=progress.levels.length?TUTORIALS.length+Math.min(5,Math.max(...progress.levels)+1):0;
  let activeKind='tutorial',activeIndex=0,playing=false,paused=false,lastData=null,lastHint='';
  let ended=null;
  const slots=[];
  let bamboo,artGeneration=0;
  const artPlate=$('catalogue-ground');
  const viewing=new PaintingView($('paintingView'),{
    translate:text,frameDuration:reduced?0:1100,flashDuration:reduced?0:450,
    onDone(){if(ended&&!ending.open)ending.showModal();}
  });
  const unlocked=meta=>meta.kind==='tutorial'||meta.index===0||progress.levels.includes(meta.index-1);
  const finished=meta=>(meta.kind==='tutorial'?progress.lessons:progress.levels).includes(meta.index);
  const stageArt=meta=>(meta.kind==='tutorial'?studies:paintings)[meta.index];
  const stageKind=kind=>text(kind==='tutorial'?'primer':'paintings');
  const place=meta=>stageKind(meta.kind)+'  /  '+String(meta.index+1).padStart(2,'0');
  function closeDialog(dialog){if(dialog.open)dialog.close();}
  function go(kind,index){
    const meta=stageList(kind)[index];
    if(!meta||!unlocked(meta))return;
    actions.onStart?.(kind,index);
  }
  function followSelection(smooth=true) {
    const card=bamboo.buttons[selection];
    const a=slips.getBoundingClientRect(),b=card.getBoundingClientRect();
    let amount=0;
    if(b.left<a.left)amount=b.left-a.left-1;
    if(b.right>a.right)amount=b.right-a.right+1;
    if(amount)slips.scrollBy({left:amount,behavior:smooth&&!reduced?'smooth':'instant'});
  }
  function select(index,follow=false){
    if(index<0||index>=order.length)return;
    selection=index;
    updateMenu();
    if(follow)followSelection();
  }
  function makeCards(){
    // The source artist's component owns the physical slats, cord, swiping and hit areas.
    bamboo=createLevelScroll(slips,order.map(m=>({name:m.title[progress.lang]})),(_,i)=>{
      select(i,true);
      const m=order[i];
      go(m.kind,m.index);
    });
    bamboo.buttons.forEach((el,i)=>{
      const m=order[i];
      el.dataset.kind=m.kind;el.dataset.index=String(m.index);
    });
  }
  function updateMenu(){
    const chosen=order[selection],lang=progress.lang;
    $('hero-title').textContent=chosen.title[lang];
    $('hero-desc').textContent=chosen.subtitle[lang];
    const src=stageArt(chosen);
    if(artPlate.dataset.src!==src){
      artPlate.dataset.src=src;
      artPlate.style.backgroundImage='url("'+src+'")';
    }
    const isOpen=unlocked(chosen),start=$('start'),lock=$('hero-lock');
    start.disabled=!isOpen;start.firstElementChild.textContent=isOpen?text(chosen.kind==='tutorial'?'beginStudy':'beginPond'):text('locked');
    lock.hidden=isOpen;
    if(!isOpen)lock.textContent=text('unlockAfter',{name:LEVELS[chosen.index-1].title[lang]});
    $('skip-intro').hidden=chosen.kind!=='tutorial';$('skip-intro').textContent=text('direct');
    $('tutorial-tab').setAttribute('aria-pressed',String(chosen.kind==='tutorial'));
    $('level-tab').setAttribute('aria-pressed',String(chosen.kind==='level'));
    slips.setAttribute('aria-label',text('contents'));
    bamboo.buttons.forEach((el,i)=>{
      const m=order[i],done=finished(m),locked=!unlocked(m);
      el.setAttribute('aria-current',String(i===selection));
      el.setAttribute('aria-pressed',String(i===selection));
      el.dataset.locked=String(locked);
      el.querySelector('.bamboo-level-name').textContent=m.title[lang];
      el.querySelector('.bamboo-level-no').textContent=done?text('done'):String(m.index+1).padStart(2,'0');
      const label=place(m)+' · '+m.title[lang]+(locked?' · '+text('locked'):done?' · '+text('done'):'');
      el.setAttribute('aria-label',label);el.title=label;
    });
  }
  function makeSlots(){
    for(let i=0;i<3;i++){
      const el=document.createElement('button');el.type='button';el.className='slot';el.disabled=true;
      el.addEventListener('click',()=>actions.onUseItem?.(i));$('inventory').append(el);slots.push(el);
    }
  }
  function localize(){
    const lang=progress.lang;document.documentElement.lang=lang;
    document.title='墨 · '+text('pond')+' | BOKU';
    document.querySelectorAll('[data-text]').forEach(el=>el.textContent=text(el.dataset.text));
    document.querySelectorAll('[data-label]').forEach(el=>{
      const label=text(el.dataset.label);el.setAttribute('aria-label',label);el.title=label;
    });
    document.querySelectorAll('[data-lang]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.lang===lang)));
    field.setAttribute('aria-label',text('pond'));
    $('options-title').textContent=text(playing?'paused':'settings');
    $('controls-copy').textContent=text(desktop()?'mouse':'touch');
    $('sound-toggle').checked=progress.sound;
    updateMenu();
    if(playing){
      const meta=stageList(activeKind)[activeIndex];
      $('pond-name').textContent=meta.title[lang];$('lesson-title').textContent=place(meta)+'　'+meta.title[lang];
      if(lastData)hud(lastData);
    }
    if(ended){putResult();if(viewing.phase!=='hidden')viewing.labels();}
  }
  function pausedState(value){
    if(!playing||ended)return;
    const v=Boolean(value);
    if(v===paused)return;
    paused=v;actions.onPause?.(v);
    if(v){localize();$('pause-actions').hidden=false;if(!settings.open)settings.showModal();}
    else closeDialog(settings);
  }
  function dismissSettings(){if(playing)pausedState(false);else closeDialog(settings);}
  settings.addEventListener('cancel',event=>{event.preventDefault();dismissSettings();});
  ending.addEventListener('cancel',event=>{event.preventDefault();});
  function chooseLang(lang){
    if(!languages.includes(lang)||progress.lang===lang)return;
    progress.lang=lang;write();localize();actions.onLanguage?.(lang);
  }
  function hud(data){
    lastData=data;
    const {mass=0,maxMass=0,scaleMax=1,items=[],form,formRemaining=0,actionHeld=false}=data;
    const pct=n=>Math.max(0,Math.min(100,100*n/Math.max(1,scaleMax)))+'%';
    $('mass-value').textContent=String(Math.round(mass));$('rival-value').textContent=String(Math.round(maxMass));
    $('revealProgress').value=Math.min(1,mass/Math.max(1,scaleMax));$('mass-marker').style.left=pct(maxMass);$('mass-marker').hidden=!maxMass;
    const bubbles=form==='fish'||form==='dragon';
    const actionName=text(bubbles?'bubble':'release');
    $('action').setAttribute('aria-label',actionName);$('action').title=actionName;
    $('action-name').textContent=actionName;
    const actionIcon=$('action-icon'),mode=bubbles?'bubble':'surge';
    if(actionIcon.dataset.mode!==mode){
      actionIcon.dataset.mode=mode;
      actionIcon.innerHTML=bubbles?'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="20" r="8"/><circle cx="23" cy="9" r="4.5"/><circle cx="24" cy="24" r="2.2"/></svg>':inkIcon('surge');
    }
    $('timer').textContent=formatTime(data.elapsed);
    $('action').dataset.held=String(Boolean(actionHeld));
    $('active-form').hidden=!icons[form]||formRemaining<=0;
    if(!$('active-form').hidden){$('form-name').textContent=text(form);$('form-time').textContent=Math.ceil(formRemaining)+' s';}
    slots.forEach((el,i)=>{
      const item=items[i],type=typeof item==='string'?item:item?.type;
      const label=text('slot',{n:i+1})+' · '+(icons[type]?text('use',{name:text(type)}):text('empty'));
      if(el.title!==label){el.title=label;el.setAttribute('aria-label',label);}
      const rig=item?.rigId||'';
      if(el.dataset.type!==(type||'')||el.dataset.rig!==rig){
        el.dataset.type=type||'';el.dataset.rig=rig;el.replaceChildren();el.disabled=!icons[type];
        if(icons[type]){const img=new Image();img.alt='';img.src=getRigIcon(rig)||icons[type];el.append(img);}
      }
    });
  }
  function begin(kind,index){
    artGeneration++;viewing.hide();activeKind=kind;activeIndex=index;playing=true;paused=false;ended=null;lastData=null;lastHint='';
    closeDialog(settings);closeDialog(ending);library.hidden=true;field.hidden=false;
    $('lesson').hidden=kind!=='tutorial';$('lesson-line').textContent='';
    $('active-form').hidden=true;document.body.style.overflow='hidden';localize();
    $('world').focus({preventScroll:true});
  }
  function home(){
    artGeneration++;viewing.hide();closeDialog(ending);closeDialog(settings);ended=null;paused=false;playing=false;
    lastData=null;lastHint='';field.hidden=true;library.hidden=false;document.body.style.overflow='';
    localize();requestAnimationFrame(()=>followSelection(false));
  }
  function complete(kind,index){
    const meta=stageList(kind)[index];if(!meta)return;
    const list=kind==='tutorial'?progress.lessons:progress.levels;
    if(!list.includes(index)){list.push(index);write();}
    selection=kind==='tutorial'?(index===3?4:index+1):4+Math.min(index+1,5);
  }
  function putResult(){
    const meta=stageList(activeKind)[activeIndex],{won,seconds}=ended,lesson=activeKind==='tutorial';
    $('end-kicker').textContent=text(lesson?'studied':won?'won':'lost');$('end-title').textContent=meta.title[progress.lang];
    $('end-note').textContent=lesson?text('studyNote'):won?text('elapsed',{time:formatTime(seconds)}):text('tryNote');
    const btn=$('end-main');
    if(lesson){btn.textContent=text('firstPond');btn.onclick=()=>go('level',0);}
    else if(!won){btn.textContent=text('retry');btn.onclick=()=>actions.onRetry?.();}
    else if(activeIndex<5){btn.textContent=text('nextPond');btn.onclick=()=>go('level',activeIndex+1);}
    else{btn.textContent=text('return');btn.onclick=()=>actions.onLeave?.();}
    $('end-home').hidden=!lesson&&won&&activeIndex===5;
  }
  async function result(won,seconds,viewInfo){
    ended={won,seconds};putResult();
    if(won&&activeKind==='level'){
      const token=++artGeneration,image=new Image();
      image.src=paintings[activeIndex];
      try{
        await image.decode();
        if(token!==artGeneration||!ended)return;
        viewing.prepare(image,viewInfo);
        await viewing.reveal();
        return;
      }catch{
        if(token!==artGeneration||!ended)return;
        viewing.hide();
      }
    }
    if(!ending.open)ending.showModal();
  }
  async function transition(callback){
    // Native dialogs occupy the browser's top layer. Close them before the
    // canvas wipe so selection always leads into the same full-screen wash.
    if(wipe.busy)return false;
    closeDialog(ending);closeDialog(settings);
    library.inert=true;field.inert=true;
    try{return await wipe.run(callback);}
    finally{
      library.inert=false;field.inert=false;
      if(playing&&!settings.open&&!ending.open)$('world').focus({preventScroll:true});
    }
  }
  makeCards();makeSlots();
  function openSettings(){if(playing){pausedState(true);return;}localize();$('pause-actions').hidden=true;if(!settings.open)settings.showModal();}
  $('settings-open').onclick=openSettings;
  $('back-cover').onclick=()=>actions.onCover?.();
  $('close-options').onclick=dismissSettings;$('resume').onclick=dismissSettings;
  $('sound-toggle').onchange=event=>{progress.sound=event.currentTarget.checked;write();actions.onSound?.(progress.sound);};
  document.querySelectorAll('[data-lang]').forEach(el=>el.onclick=()=>chooseLang(el.dataset.lang));
  $('start').onclick=()=>{const m=order[selection];go(m.kind,m.index);};$('skip-intro').onclick=()=>go('level',0);
  $('tutorial-tab').onclick=()=>select(0,true);$('level-tab').onclick=()=>select(4,true);
  $('prev').onclick=()=>select(Math.max(0,selection-1),true);$('next').onclick=()=>select(Math.min(order.length-1,selection+1),true);
  slips.addEventListener('keydown',event=>{
    if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
    event.preventDefault();event.stopImmediatePropagation();
    const direction=event.key==='ArrowLeft'?-1:1;
    select(Math.max(0,Math.min(order.length-1,selection+direction)),true);
    bamboo.buttons[selection].focus({preventScroll:true});
  },{capture:true});
  $('pause').onclick=()=>pausedState(true);$('exit-run').onclick=()=>actions.onLeave?.();$('end-home').onclick=()=>actions.onLeave?.();
  $('skip-step').onclick=()=>actions.onNextTutorial?.();
  localize();
  return {home,begin,transition,complete,result,update:hud,setPaused:pausedState,openSettings,setLanguage:chooseLang,
    openCatalogue(group,index=0){
      if(group==='tutorial'&&TUTORIALS[index])selection=index;
      if(group==='level'&&LEVELS[index])selection=TUTORIALS.length+index;
      home();
    },
    hint(value){if(value===lastHint)return;lastHint=value;$('lesson-line').textContent=value||'';},
    get lang(){return progress.lang;},get paused(){return paused;},get soundEnabled(){return progress.sound;}};
}
