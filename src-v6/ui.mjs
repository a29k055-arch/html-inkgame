import {POND_ARTWORKS} from './artworks.mjs';
import {getRigIcon} from './rig-icons.mjs';
import {createCatalogue} from './catalog.mjs';
import {inkIcon} from '../src-v5/ui/ink-icons.js';
import {PondPaintingView} from './painting-view.mjs';
import {LEVELS, TUTORIALS, TRIAL} from './levels.mjs';
import {StartTransition, START_TRANSITIONS} from '../src-v5/ink/start-transitions.js';
import {fadeLessonScene} from './lesson-scenes.mjs';

const artwork = n => new URL('../assets/artworks/v4-cropped/' + n + '.png',import.meta.url).href;
export const paintings = POND_ARTWORKS.map(a=>artwork(a.id));
const icons = Object.fromEntries(['fish','shrimp','turtle','dragon'].map(n=>[n,new URL('./art/'+n+'-icon.webp',import.meta.url).href]));
const translations = {
  backCover:['返回主页','タイトルに戻る','Back to title'],
  paintingHint:['滚轮或双指缩放 · 拖动平移','ホイールかピンチで拡大・縮小、ドラッグで移動','Scroll or pinch to zoom · drag to pan'],
  paintingDone:['继续','進む','Continue'],paintingReset:['适合屏幕','全体を表示','Fit to screen'],
  paintingViewLabel:['完整水墨画欣赏','完成した水墨画','Completed ink painting'],
  pond:['水墨池塘','墨の池','Ink Pond'],contents:['竹简目录','ステージ選択','Scroll index'],
  primer:['教学','チュートリアル','Tutorial'],paintings:['画卷','画巻','Paintings'],
  settings:['设置','設定','Settings'],sound:['水声与墨声','水と墨の音','Pond sounds'],
  controls:['操作','操作','Controls'],language:['语言','言語','Language'],close:['关闭','閉じる','Close'],
  goal:['持续接触蓝圈敌人可吸收墨量。成为池中最大，并吸尽靠近四角和池中的大敌，让画上只剩零星留白。','水色の輪が目印。触れ続けると、相手の墨を吸収できます。四隅や池の中の大きな敵を吸収し、池でいちばん大きくなりましょう。絵がほぼ浮かび上がればクリアです。','Stay in contact with blue rivals to absorb ink. Outgrow the pond and absorb the large rivals near its corners and across the water to uncover the painting.'],
  painted:['显画','絵の完成度','Painted'],majorCount:['剩余大敌 {n}','大きな敵　残り{n}体','Large rivals left: {n}'],previous:['向前翻阅','前へ','Scroll back'],next:['向后翻阅','次へ','Scroll forward'],
  done:['成','済','✓'],mass:['墨量比较','墨の量','Mass comparison'],own:['自身','自分','You'],inLead:['已是最大','自分が最大','In the lead'],largest:['最大敌人','最大の敵','Largest rival'],
  pause:['暂停','一時停止','Pause'],paused:['暂停','一時停止','Paused'],resume:['继续游动','続ける','Resume'],
  return:['返回目录','一覧に戻る','Back to level select'],map:['池塘小地图','池の地図','Pond map'],
  release:['放墨','墨を吐く','Jet ink'],bubble:['吐泡','泡を吐く','Bubbles'],
  fish:['鲤鱼','コイ','Carp'],shrimp:['虾','エビ','Shrimp'],turtle:['乌龟','カメ','Turtle'],dragon:['墨龙','墨の龍','Ink dragon'],
  slot:['道具格 {n}','アイテム枠 {n}','Item slot {n}'],empty:['空','空','Empty'],
  use:['使用{name}','{name}を使う','Use {name}'],skipStep:['跳过本关','チュートリアルをスキップ','Skip tutorial'],
  mouse:['按住水面拖动来游动；滚轮缩放。按住 Shift 或空格使用交互键，数字键 1–3 使用已收集的道具。','水面をドラッグして移動、ホイールで拡大・縮小します。Shiftキーかスペースキーを押し続けると墨や泡が出ます。アイテムは数字キーの1～3で使えます。','Hold and drag on the water to swim. Scroll to zoom. Hold Shift or Space to jet ink or blow bubbles. Use items with 1–3.'],
  touch:['在水面拖动来游动，双指捏合缩放。按住右下按钮放墨或吐泡，轻点右侧圆格使用道具。','水面をドラッグして移動、2本の指で拡大・縮小します。右下のボタンを長押しすると墨や泡が出ます。アイテムは右のアイコンをタップして使います。','Drag on the water to swim and pinch to zoom. Hold the lower-right button to jet ink or blow bubbles. Tap a circle on the right to use an item.'],
  won:['画卷已揭','絵が完成しました','Painting revealed'],lost:['墨量已尽','墨が尽きました','Ink depleted'],studied:['习墨完成','チュートリアル完了','Lesson complete'],
  nextPond:['进入下一幅','次のステージへ','Next painting'],firstPond:['进入第一幅画','最初の絵に入る','Enter the first painting'],
  enterTrial:['进入体验关卡','体験ステージへ','Enter trial pond'],
  restart:['重新开始','最初からやり直す','Restart'],
  retry:['重试此局','同じ配置で再挑戦','Try this layout again'],
  elapsed:['用时 {time}','プレイ時間 {time}','Time {time}'],
  tryNote:['再走一次这段水路，试试另一种选择。','同じ水路で、別の進み方を試しましょう。','Return to the same pond and try another route.'],
  studyNote:['可以进入体验关卡，或从第一幅画开始。','体験ステージか、最初の絵に進みましょう。','Explore the trial pond or start the first painting.']
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
    sound:data.sound!==false, lessons:indices(data.lessons,4), trial:data.trial===true, levels:indices(data.levels,6)};
}
function stageList(kind) { return kind==='tutorial'?TUTORIALS:kind==='trial'?[TRIAL]:LEVELS; }
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
  const library=$('library'),field=$('field'),settings=$('options'),ending=$('ending');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wipe=new StartTransition($('ink-wipe'),{preload:loadTransitionAtlases(),coverDuration:reduced?0:.39,revealDuration:reduced?0:.42});
  let activeKind='tutorial',activeIndex=0,playing=false,paused=false,lastData=null,lastHint='';
  let ended=null;
  const slots=[];
  let artGeneration=0;
  const viewing=new PondPaintingView($('paintingView'),{
    translate:text,frameDuration:reduced?0:1100,flashDuration:reduced?0:450,
    onDone(){if(ended&&!ending.open)ending.showModal();}
  });
  const unlocked=meta=>meta.kind==='tutorial'||meta.index===0||progress.levels.includes(meta.index-1);
  const finished=meta=>meta.kind==='trial'?progress.trial:(meta.kind==='tutorial'?progress.lessons:progress.levels).includes(meta.index);

  function closeDialog(dialog){if(dialog.open)dialog.close();}
  function go(kind,index){
    const meta=stageList(kind)[index];
    if(!meta||!unlocked(meta))return;
    actions.onStart?.(kind,index);
  }
  const catalogue=createCatalogue({progress,paintings,unlocked,finished,onEnter:go});
  function makeSlots(){
    for(let i=0;i<3;i++){
      const el=document.createElement('button');el.type='button';el.className='slot';el.disabled=true;el.hidden=true;
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
    field.setAttribute('aria-label',text('pond'));
    $('options-title').textContent=text(playing?'paused':'settings');
    catalogue.update();
    if(playing){
      const meta=stageList(activeKind)[activeIndex];
      $('pond-name').textContent=meta.title[lang];
      if(activeKind==='tutorial')$('lesson-title').textContent=text('primer')+' '+(activeIndex+1)+'/'+TUTORIALS.length+' · '+meta.title[lang];
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
    const leading=activeKind!=='tutorial' && mass>maxMass;
    $('own-label').textContent=text(leading?'inLead':'own');
    $('paint-goal').dataset.done=String(Boolean(data.paintedEnough));
    $('paint-goal').hidden=activeKind==='tutorial';
    $('major-count').hidden=activeKind==='tutorial';
    $('major-count').textContent=text('majorCount',{n:data.majors??0});
    $('paint-value').textContent=Math.floor((data.painted||0)*100)+'%';
    $('action').dataset.held=String(Boolean(actionHeld));
    $('active-form').hidden=!icons[form]||formRemaining<=0;
    if(!$('active-form').hidden){$('form-name').textContent=text(form);$('form-time').textContent=Math.ceil(formRemaining)+' s';}
    slots.forEach((el,i)=>{
      const item=items[i],type=typeof item==='string'?item:item?.type;
      el.hidden=!icons[type];
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
    $('lesson').hidden=kind!=='tutorial';$('skip-step').hidden=kind!=='tutorial';$('lesson-line').textContent='';
    $('lesson').querySelector('.lesson-echo')?.remove();
    $('active-form').hidden=true;document.body.style.overflow='hidden';localize();
    $('world').focus({preventScroll:true});
  }
  function home(){
    artGeneration++;viewing.hide();closeDialog(ending);closeDialog(settings);ended=null;paused=false;playing=false;
    lastData=null;lastHint='';field.hidden=true;library.hidden=false;document.body.style.overflow='';
    catalogue.close();localize();
  }
  function complete(kind,index){
    const meta=stageList(kind)[index];if(!meta)return;
    if(kind==='trial'){progress.trial=true;write();catalogue.update();return;}
    const list=kind==='tutorial'?progress.lessons:progress.levels;
    if(!list.includes(index)){list.push(index);write();}
    catalogue.update();
  }
  function putResult(){
    const meta=stageList(activeKind)[activeIndex],{won,seconds}=ended,lesson=activeKind==='tutorial';
    $('end-kicker').hidden=lesson;
    $('end-kicker').textContent=text(won?'won':'lost');
    $('end-title').textContent=lesson?text('studied'):meta.title[progress.lang];
    $('end-note').textContent=lesson?text('studyNote'):won?text('elapsed',{time:formatTime(seconds)}):text('tryNote');
    const btn=$('end-main');
    $('end-first').hidden=!lesson;
    if(lesson){btn.textContent=text('enterTrial');btn.onclick=()=>go('trial',0);}
    else if(!won){btn.textContent=text('retry');btn.onclick=()=>actions.onRetry?.();}
    else if(activeKind==='trial'){btn.textContent=text('firstPond');btn.onclick=()=>go('level',0);}
    else if(activeIndex<5){btn.textContent=text('nextPond');btn.onclick=()=>go('level',activeIndex+1);}
    else{btn.textContent=text('return');btn.onclick=()=>actions.onLeave?.();}
    $('end-home').hidden=!lesson&&won&&activeIndex===5;
  }
  async function result(won,seconds,viewInfo){
    ended={won,seconds};putResult();
    if(won&&activeKind!=='tutorial'){
      const token=++artGeneration,image=new Image();
      image.src=paintings[activeKind==='trial'?TRIAL.artworkIndex:activeIndex];
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
  async function transition(callback,lessonFade=false,continuous=false){
    // Native dialogs occupy the browser's top layer. Close them before the
    // canvas wipe so selection always leads into the same full-screen wash.
    if(wipe.busy)return false;
    closeDialog(ending);closeDialog(settings);
    library.inert=true;field.inert=!continuous;
    try{return lessonFade?await fadeLessonScene(callback):await wipe.run(callback);}
    finally{
      library.inert=false;field.inert=false;
      if(playing&&!settings.open&&!ending.open)$('world').focus({preventScroll:true});
    }
  }
  makeSlots();
  function openSettings(){
    const resumePause=playing&&paused;
    closeDialog(settings);
    actions.onSettings?.(()=>{
      if(resumePause && playing && paused && !ending.open){settings.showModal();$('pause-settings').focus();}
      else if(!playing)$('back-cover').focus({preventScroll:true});
    });
  }
  $('back-cover').onclick=()=>actions.onCover?.();
  $('end-first').onclick=()=>go('level',0);
  $('restart').onclick=()=>actions.onRestart?.();
  $('resume').onclick=dismissSettings;$('pause-settings').onclick=openSettings;
  $('pause').onclick=()=>pausedState(true);$('exit-run').onclick=()=>actions.onLeave?.();$('end-home').onclick=()=>actions.onLeave?.();
  $('skip-step').onclick=()=>actions.onNextTutorial?.();
  localize();
  return {home,begin,transition,complete,result,update:hud,setPaused:pausedState,openSettings,setLanguage:chooseLang,
    openCatalogue(group,index=0){home();catalogue.open(group,index);},
    hint(value){
      if(value===lastHint)return;
      lastHint=value;
      const line=$('lesson-line');
      const previous=line.textContent;
      line.parentElement.querySelector('.lesson-echo')?.remove();
      line.getAnimations().forEach(animation=>animation.cancel());
      line.textContent=value||'';
      if(!reduced&&value){
        if(previous){
          const echo=document.createElement('p');
          echo.className='lesson-echo';echo.setAttribute('aria-hidden','true');echo.textContent=previous;
          line.parentElement.append(echo);
          const outgoing=echo.animate([{opacity:1},{opacity:0}],{duration:170,easing:'ease-out',fill:'forwards'});
          outgoing.onfinish=()=>echo.remove();
        }
        line.animate([{opacity:0},{opacity:1}],{delay:previous?125:0,duration:320,easing:'ease-out',fill:'backwards'});
      }
    },
    get lang(){return progress.lang;},get paused(){return paused;},get soundEnabled(){return true;}};
}
