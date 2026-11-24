import {LoadingScroll} from '../src-v5/ui/loading-scroll.js';
import {HomeArtwork} from '../src-v5/ink/home-artwork.js';
import {setupGallery} from '../src-v5/ui/gallery-records.js';
import {applyTranslations,setLanguage,getLanguage,t,artTitle} from '../src-v5/ui/i18n.js';
import {V4_ARTWORKS} from '../src-v5/data/v4-artworks.js';
import {createBambooLoader} from '../assets/ui/bamboo-scroll/bamboo-scroll.js?v=4296ecc';
import {coverSettings,updateSettings,galleryIDs,unlockedArtworks,resetPondSave} from './opening-save.mjs';

const $=id=>document.getElementById(id);
const words={zh:{assets:'游戏资源',file:'正在加载',ready:'素材就绪',prepare:'准备动画',elapsed:'已用',retry:'重试'},
 ja:{assets:'ゲーム素材',file:'読み込み中',ready:'素材の準備完了',prepare:'動きを準備しています',elapsed:'経過',retry:'再試行'},
 en:{assets:'Game assets',file:'Loading',ready:'Assets ready',prepare:'Preparing animation',elapsed:'Elapsed',retry:'Retry'}};
const art=galleryIDs.map(id=>V4_ARTWORKS.find(a=>a.id===id));
const defaultPainting=art.find(entry=>entry.id==='ink-13');
const cfg={bgmVolume:.28,volume:.3,bgmMuted:false,sfxMuted:false,bgmTrack:'shuffle',sfxStyle:'water',quality:'balanced',controls:'auto',homeVisual:'paper',backgroundPolicy:'fixed',...coverSettings()};
let state={phase:'start',loadedBytes:0,totalBytes:0,completed:0,total:0,preparation:0},visible=true;
let bamboo=null,album=null,ink=null,picture=null,pointerTime=0,lastFrame=0,ending=false,done=false,host=false,settingsOnly=false;
const action=(name,value)=>window.frameElement?.openingAction?.(name,value);
const size=bytes=>(Math.max(0,bytes||0)/1e6).toFixed(2);
const wordsFor=()=>words[getLanguage()]||words.zh;
const estimating={zh:'正在核对总量',ja:'総容量を確認中',en:'Checking total size'};
const progressCanvas=$('bamboo-load');
document.body.dataset.homeVisual=cfg.homeVisual;

class PondLoadingScroll extends LoadingScroll {
 renderResourceLines(){
   const l=wordsFor(),s=state;
   // The same displayed work fraction drives the title, the scroll and its label.
   // Only a completed and prepared scene can reach 100%.
   const fraction=this.ready&&this.progress>.998?1:Math.min(.999,this.progress);
   const percent=Math.floor(fraction*100);
   const lang=getLanguage(),isPreparing=['download-ready','prepare','ready'].includes(s.phase);
   document.body.style.setProperty('--title-reveal',fraction);
   this.scroll.style.setProperty('--unfold',fraction);
   if(bamboo&&this.drawnFraction!==fraction){bamboo.setProgress(fraction);this.drawnFraction=fraction;}
   progressCanvas.setAttribute('aria-valuenow',percent);progressCanvas.setAttribute('aria-label',l.assets);
   $('loading-percent').textContent=percent+'%';$('loadProgress').value=fraction;
   this.resourceLine.hidden=!s.totalBytes;
   if(s.totalBytes){
     const volume=size(s.loadedBytes)+(s.sizeComplete?' / '+size(s.totalBytes)+' MB':' MB · '+estimating[lang]);
     this.resourceLine.textContent=l.assets+' '+volume+' · '+l.elapsed+' '+Math.floor((s.elapsedMs||0)/1000)+(lang==='en'?'s':'秒');
   }
   $('loadingCurrent').textContent=isPreparing?(this.ready?l.ready:l.prepare):s.current?l.file+' · '+s.current:'';
   if(this.resourceLine.hidden!==this.lastLineHidden){this.lastLineHidden=this.resourceLine.hidden;this.align();}
 }
}
const loader=new PondLoadingScroll($('loading'),{title:1,bamboo:1,menu:1,pond:97});

function fail(error){
 if(loader.failed||done)return;
 loader.fail();$('loading').setAttribute('aria-busy','false');$('loadingText').textContent=t('loadError');
 $('loadingCurrent').textContent=String(error?.message||error||'');$('loadingCurrent').title=$('loadingCurrent').textContent;
 $('loading').querySelector('[data-retry]').onclick=()=>{if(window.frameElement?.openingAction)action('retry');else window.parent.location.reload();};
}
const visualAssets=Promise.all([
 loader.track('title',$('home').querySelector('img').decode(),{required:true}),
 loader.track('bamboo',createBambooLoader(progressCanvas).then(obj=>{bamboo=obj;progressCanvas.setAttribute('role','progressbar');}),{required:true})
]);
visualAssets.catch(fail);
function updateBoot(){
 if(loader.failed||done)return;
 loader.resourceState=state;loader.resourceUpdated=performance.now();
 const bytes=Math.max(0,Math.min(1,state.progress||0)),prep=Math.max(0,Math.min(1,state.preparation||0));
 loader.partials.set('pond',Math.min(.99,bytes*.77+prep*.21));loader.updateTarget();
 if(state.phase==='ready'&&!ending){
   ending=true;
   (async()=>{
     await Promise.all([visualAssets,menuAssets]);await loader.track('pond',Promise.resolve(),{required:true});
     await loader.finish();
     done=true;bamboo?.setProgress(1);progressCanvas.setAttribute('aria-valuenow',100);
     $('loading').setAttribute('aria-busy','false');$('home').inert=false;
     $('grindBtn').focus({preventScroll:true});
     parent.postMessage({type:'boku:v6-opening-ready'},location.origin);
   })().catch(fail);
 }
}
function select(button){for(const item of document.querySelectorAll('.menu button'))item.classList.toggle('selected',item===button);}
for(const btn of document.querySelectorAll('.menu button'))for(const event of ['focus','pointerenter'])btn.addEventListener(event,()=>select(btn));
$('home').addEventListener('keydown',e=>{
 if(!['ArrowDown','ArrowUp'].includes(e.key))return;
 const menu=[...document.querySelectorAll('.menu button')],i=menu.indexOf(document.activeElement);
 e.preventDefault();menu[(Math.max(0,i)+(e.key==='ArrowDown'?1:menu.length-1))%menu.length].focus();
});
$('grindBtn').onclick=()=>action('play');
$('settingsBtn').onclick=()=>$('settings').showModal();
$('closeSettings').onclick=()=>$('settings').close();
$('materialNoticeBtn').onclick=()=>$('materialNotice').showModal();
$('closeMaterialNotice').onclick=()=>$('materialNotice').close();
$('settings').addEventListener('close',()=>{if(settingsOnly){settingsOnly=false;action('settings-closed');}});
$('resetData').onclick=()=>$('resetConfirm').showModal();
$('cancelReset').onclick=()=>$('resetConfirm').close();
$('confirmReset').onclick=()=>{resetPondSave();parent.location.reload();};
$('controls').onchange=e=>{cfg.controls=e.target.value;persist();};
document.addEventListener('pointerdown',()=>action('unmute'),{passive:true});
function persist(){updateSettings({...cfg,language:getLanguage()});action('preferences',{...cfg});}
function displayPrefs(){
 $('language').value=getLanguage();$('bgmVolume').value=Math.round(cfg.bgmVolume*100);$('bgmValue').textContent=$('bgmVolume').value+'%';
 $('sfxVolume').value=Math.round(cfg.volume*100);$('sfxValue').textContent=$('sfxVolume').value+'%';
 $('sfxStyle').value=cfg.sfxStyle;
 for(const channel of ['bgm','sfx'])$(channel+'Mute').setAttribute('aria-pressed',String(cfg[channel+'Muted']));
 $('controls').value=cfg.controls;$('backgroundPolicy').value=cfg.backgroundPolicy;$('quality').value=cfg.quality;$('homeVisual').value=cfg.homeVisual;$('bgmTrack').value=cfg.bgmTrack;
 $('backgroundCaption').textContent=cfg.homeVisual==='painting'&&picture?artTitle(picture):'';
}
const japaneseSettings={
 bgmVolume:'BGMの音量',bgmTrack:'BGMの選択',sfxVolume:'効果音の音量',sfxStyle:'効果音の種類',controls:'操作方法',
 homeVisual:'タイトル画面',background:'背景の切り替え',paperHome:'和紙',paintingHome:'絵を表示',
 fixed:'固定',random:'ランダム',rotate:'順番に切り替える',unlockedPool:'解放した絵から選ぶ',
 auto:'自動',pc:'マウス・キーボード',mobile:'タッチ操作',reset:'セーブデータを消去',
 resetQuestion:'セーブデータを消去しますか？',resetWarning:'クリアしたステージと設定が初期化されます。',
 resetConfirm:'消去する',loading:'水墨画を準備しています…'
};
function refreshLanguage(){
 applyTranslations();
 if(getLanguage()==='ja')for(const el of document.querySelectorAll('[data-i18n]')){
   const native=japaneseSettings[el.dataset.i18n];if(native)el.textContent=native;
 }
}
function localize(lang,notify=false){
 if(!['zh','ja','en'].includes(lang))return;
 if(lang!==getLanguage())setLanguage(lang);refreshLanguage();
 displayPrefs();if(notify)action('language',lang);
}
$('language').onchange=e=>localize(e.target.value,true);
for(const [id,key] of [['bgmVolume','bgmVolume'],['sfxVolume','volume']])$(id).oninput=e=>{
 cfg[key]=Number(e.target.value)/100;
 cfg[key==='volume'?'sfxMuted':'bgmMuted']=cfg[key]===0;displayPrefs();persist();
};
$('quality').onchange=e=>{cfg.quality=e.target.value;ink?.setQuality(cfg.quality);persist();};
$('bgmTrack').onchange=e=>{cfg.bgmTrack=e.target.value;persist();};
$('sfxStyle').onchange=e=>{cfg.sfxStyle=e.target.value;persist();};
for(const channel of ['sfx','bgm'])$(channel+'Mute').onclick=()=>{cfg[channel+'Muted']=!cfg[channel+'Muted'];displayPrefs();persist();};
let revision=0;
async function background(id){
 const current=++revision;
 if(cfg.homeVisual!=='painting'){ink?.dispose();ink=null;document.body.dataset.homeVisual='paper';displayPrefs();return;}
 const entry=art.find(a=>a.id===id)||defaultPainting;
 const image=new Image();image.src=entry.src;
 try{await image.decode();if(revision!==current)return;document.body.dataset.homeVisual='painting';
   ink??=new HomeArtwork($('homeFluid'),cfg.quality);ink.resize();ink.setBackground(image);picture=entry;
   cfg.backgroundId=entry.id;displayPrefs();
 }catch{if(current===revision){cfg.homeVisual='paper';document.body.dataset.homeVisual='paper';displayPrefs();}}
}
// V5's fixed, random, rotating and unlocked pools use the paintings won in this campaign.
let rotationAge=0;
function chooseBackground(next=false){
 const cleared=unlockedArtworks();
 let pool=art.filter(entry=>cleared.has(entry.id)||(cfg.backgroundPolicy!=='unlocked'&&(entry===art[0]||entry===defaultPainting)));
 if(!pool.length)pool=[defaultPainting];
 let chosen;
 if(cfg.backgroundPolicy==='random'||cfg.backgroundPolicy==='unlocked'){
   const alternatives=pool.filter(entry=>entry!==picture);
   const choices=alternatives.length?alternatives:pool;chosen=choices[Math.floor(Math.random()*choices.length)];
 }else if(next||cfg.backgroundPolicy==='rotate'){
   chosen=pool[(pool.indexOf(picture)+1)%pool.length];
 }else chosen=pool.find(entry=>entry.id===cfg.backgroundId)||defaultPainting;
 rotationAge=0;return background(chosen.id);
}
$('backgroundPolicy').onchange=e=>{cfg.backgroundPolicy=e.target.value;chooseBackground().then(persist);};
$('homeVisual').onchange=e=>{cfg.homeVisual=e.target.value;chooseBackground().then(()=>{persist();startBackgroundLoop();});};
$('nextBackground').onclick=()=>chooseBackground(true).then(persist);
for(const ev of ['pointerdown','pointermove'])$('stage').addEventListener(ev,e=>{
 if(!ink||!visible||e.target.closest('button,dialog')||(ev==='pointermove'&&e.timeStamp-pointerTime<65))return;
 pointerTime=e.timeStamp;ink.interact(e.clientX,e.clientY,ev==='pointerdown');
});
let frame=0;
function startBackgroundLoop(){if(!visible||!ink||frame)return;lastFrame=0;
 const draw=now=>{frame=0;if(!visible||!ink)return;const dt=lastFrame?Math.min(.1,(now-lastFrame)/1000):0;
   if(!document.querySelector('dialog[open]')){ink.draw(dt);if(cfg.backgroundPolicy==='rotate'&&(rotationAge+=dt)>=35)chooseBackground(true).then(persist);}
   lastFrame=now;frame=requestAnimationFrame(draw);};
 frame=requestAnimationFrame(draw);
}
$('stage').addEventListener('pointermove',startBackgroundLoop,{passive:true});
addEventListener('resize',()=>ink?.resize());
function setVisible(value){
 visible=!!value;if(!visible){cancelAnimationFrame(frame);frame=0;for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();}
 else{album?.refresh();if(done)$('grindBtn').focus({preventScroll:true});startBackgroundLoop();}
}
const menuAssets=loader.track('menu',Promise.all([setupGallery(id=>{cfg.homeVisual='painting';cfg.backgroundPolicy='fixed';background(id).then(()=>{persist();startBackgroundLoop();});},()=>{},()=>{$('grindBtn').focus();},{
 mode:'reveal',artworks:art,onSelectLevel:id=>{for(const d of document.querySelectorAll('dialog[open]'))d.close();action('gallery',Math.max(0,galleryIDs.indexOf(id)));},
 selectedLevel:()=>null
}).then(value=>{album=value;refreshLanguage();}),chooseBackground().then(startBackgroundLoop)]),{required:true});
menuAssets.catch(fail);
localize(getLanguage());
window.addEventListener('message',e=>{
 if(e.origin!==location.origin||e.source!==parent||e.data?.scope!=='boku-v6-cover')return;
 const q=e.data;
 if(q.type==='init'){if(!host){host=true;const tracks=[{id:'shuffle',label:'bgmShuffle'},...(q.tracks||[])];
   for(const tr of tracks){const o=document.createElement('option');o.value=tr.id;o.dataset.i18n=tr.label;$('bgmTrack').append(o);}
   action('preferences',{...cfg});
 }localize(action('current-language'));}
 else if(q.type==='state'){state=q.value;updateBoot();}
 else if(q.type==='error')fail(q.message);
 else if(q.type==='language')localize(action('current-language'));
 else if(q.type==='settings'){
   settingsOnly=true;document.documentElement.dataset.settingsOnly='true';$('stage').inert=true;
   displayPrefs();if(!$('settings').open)$('settings').showModal();
 }else if(q.type==='visibility'){
   delete document.documentElement.dataset.settingsOnly;$('stage').inert=false;setVisible(q.open);
 }
});
parent.postMessage({scope:'boku-v6-cover',type:'hello'},location.origin);action('hello');
setTimeout(()=>{if(!host)fail(({zh:'无法连接游戏',ja:'ゲームに接続できませんでした。',en:'Could not connect to the game.'})[getLanguage()]);},25000);
