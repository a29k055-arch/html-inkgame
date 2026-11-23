import {LoadingScroll} from '../src-v5/ui/loading-scroll.js';
import {HomeArtwork} from '../src-v5/ink/home-artwork.js';
import {setupGallery} from '../src-v5/ui/gallery-records.js';
import {applyTranslations,setLanguage,getLanguage,t,artTitle} from '../src-v5/ui/i18n.js';
import {V4_ARTWORKS} from '../src-v5/data/v4-artworks.js';
import {createBambooLoader} from '../assets/ui/bamboo-scroll/bamboo-scroll.js?v=be7646f';
import {coverSettings,updateSettings,galleryIDs,unlockedArtworks} from './opening-save.mjs';

const $=id=>document.getElementById(id);
const words={zh:{assets:'游戏资源',file:'正在加载',ready:'素材就绪',prepare:'准备动画',elapsed:'已用',retry:'重试'},
 ja:{assets:'ゲーム素材',file:'読み込み中',ready:'素材の準備完了',prepare:'アニメーションの準備',elapsed:'経過',retry:'再試行'},
 en:{assets:'Game assets',file:'Loading',ready:'Assets ready',prepare:'Preparing animation',elapsed:'Elapsed',retry:'Retry'}};
const art=galleryIDs.map(id=>V4_ARTWORKS.find(a=>a.id===id));
const cfg={bgmVolume:.28,volume:.3,bgmMuted:false,sfxMuted:false,bgmTrack:'shuffle',sfxStyle:'water',quality:'balanced',homeVisual:'paper',...coverSettings()};
let state={phase:'start',loadedBytes:0,totalBytes:0,completed:0,total:0,preparation:0},visible=true;
let bamboo=null,album=null,ink=null,picture=null,pointerTime=0,lastFrame=0,ending=false,done=false,host=false;
const action=(name,value)=>window.frameElement?.openingAction?.(name,value);
const size=bytes=>(Math.max(0,bytes||0)/1e6).toFixed(2);
const wordsFor=()=>words[getLanguage()]||words.zh;
const estimating={zh:'正在核对总量',ja:'総容量を確認中',en:'Checking total size'};
const progressCanvas=$('bamboo-load');
document.body.dataset.homeVisual=cfg.homeVisual;

class PondLoadingScroll extends LoadingScroll {
 renderResourceLines(now){
   const l=wordsFor(),s=state;
   if(!s.totalBytes)return;
   const fraction=Math.min(1,s.loadedBytes/Math.max(1,s.totalBytes)),pct=fraction===1?100:Math.min(99,Math.round(fraction*100));
   const readyBytes=(s.phase==='download-ready'||s.phase==='prepare'||s.phase==='ready');
   this.resourceLine.hidden=false;
   const bytesLine=s.sizeComplete?l.assets+' '+size(s.loadedBytes)+' / '+size(s.totalBytes)+' MB · '+pct+'%':l.assets+' '+size(s.loadedBytes)+' MB · '+estimating[getLanguage()];
   this.resourceLine.textContent=bytesLine+' · '+l.elapsed+' '+Math.floor((s.elapsedMs||0)/1000)+(getLanguage()==='en'?'s':'秒');
   this.prepareLine.hidden=!readyBytes;
   if(readyBytes)this.prepareLine.textContent=l.prepare+' '+Math.round(100*Math.min(1,s.preparation||0))+'%';
   $('loadingCurrent').textContent=readyBytes?l.ready:s.current?l.file+' · '+s.current:'';
   if(s.sizeComplete&&bamboo&&this.drawnFraction!==fraction){bamboo.setProgress(fraction);progressCanvas.setAttribute('aria-valuenow',pct);progressCanvas.setAttribute('aria-label',l.assets+' '+pct+'%');this.drawnFraction=fraction;}
   if(s.sizeComplete)$('loadProgress').value=fraction;
   if(!this.alignedResources||readyBytes&&!this.alignedPreparation){this.align();this.alignedResources=true;if(readyBytes)this.alignedPreparation=true;}
 }
}
const loader=new PondLoadingScroll($('loading'),{title:1,bamboo:1,creatures:8});
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
 loader.partials.set('creatures',Math.min(.99,bytes*.87+prep*.13));loader.updateTarget();
 if(state.phase==='ready'&&!ending){
   ending=true;
   (async()=>{
     await visualAssets;await loader.track('creatures',Promise.resolve(),{required:true});
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
$('homeHelp').onclick=()=>action('help');
$('settingsBtn').onclick=()=>$('settings').showModal();
$('closeSettings').onclick=()=>$('settings').close();
$('materialNoticeBtn').onclick=()=>$('materialNotice').showModal();
$('closeMaterialNotice').onclick=()=>$('materialNotice').close();
document.addEventListener('keydown',e=>{if(done&&e.key==='F1'&&!document.querySelector('dialog[open]')){e.preventDefault();action('help');}});
document.addEventListener('pointerdown',()=>action('unmute'),{passive:true});
function persist(){updateSettings({...cfg,language:getLanguage()});action('preferences',{...cfg});}
function displayPrefs(){
 $('language').value=getLanguage();$('bgmVolume').value=Math.round(cfg.bgmVolume*100);$('bgmValue').textContent=$('bgmVolume').value+'%';
 $('sfxVolume').value=Math.round(cfg.volume*100);$('sfxValue').textContent=$('sfxVolume').value+'%';
 $('sfxStyle').value=cfg.sfxStyle;
 for(const channel of ['bgm','sfx'])$(channel+'Mute').setAttribute('aria-pressed',String(cfg[channel+'Muted']));
 $('quality').value=cfg.quality;$('homeVisual').value=cfg.homeVisual;$('bgmTrack').value=cfg.bgmTrack;
 $('backgroundCaption').textContent=cfg.homeVisual==='painting'&&picture?artTitle(picture):'';
}
function localize(lang,notify=false){
 if(!['zh','ja','en'].includes(lang))return;
 if(lang!==getLanguage())setLanguage(lang);else applyTranslations();
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
 const entry=art.find(a=>a.id===id)||art.at(-1);
 const image=new Image();image.src=entry.src;
 try{await image.decode();if(revision!==current)return;document.body.dataset.homeVisual='painting';
   ink??=new HomeArtwork($('homeFluid'),cfg.quality);ink.resize();ink.setBackground(image);picture=entry;
   cfg.backgroundId=entry.id;displayPrefs();
 }catch{if(current===revision){cfg.homeVisual='paper';document.body.dataset.homeVisual='paper';displayPrefs();}}
}
$('homeVisual').onchange=e=>{cfg.homeVisual=e.target.value;background(cfg.backgroundId).then(persist);};
$('nextBackground').onclick=()=>{
 const options=art.filter(a=>a===art.at(-1)||unlockedArtworks().has(a.id));
 background(options[(options.indexOf(picture)+1)%options.length].id).then(persist);
};
for(const ev of ['pointerdown','pointermove'])$('stage').addEventListener(ev,e=>{
 if(!ink||!visible||e.target.closest('button,dialog')||(ev==='pointermove'&&e.timeStamp-pointerTime<65))return;
 pointerTime=e.timeStamp;ink.interact(e.clientX,e.clientY,ev==='pointerdown');
});
let frame=0;
function startBackgroundLoop(){if(!visible||!ink||frame)return;lastFrame=0;
 const draw=now=>{frame=0;if(!visible||!ink)return;ink.draw(lastFrame?Math.min(.05,(now-lastFrame)/1000):0);lastFrame=now;frame=requestAnimationFrame(draw);};
 frame=requestAnimationFrame(draw);
}
$('stage').addEventListener('pointermove',startBackgroundLoop,{passive:true});
addEventListener('resize',()=>ink?.resize());
function setVisible(value){
 visible=!!value;if(!visible){cancelAnimationFrame(frame);frame=0;for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();}
 else{album?.refresh();if(done)$('grindBtn').focus({preventScroll:true});startBackgroundLoop();}
}
setupGallery(id=>{cfg.homeVisual='painting';background(id).then(persist);},()=>{},()=>{$('grindBtn').focus();},{
 mode:'reveal',artworks:art,onSelectLevel:id=>{for(const d of document.querySelectorAll('dialog[open]'))d.close();action('gallery',Math.max(0,galleryIDs.indexOf(id)));},
 selectedLevel:()=>null
}).then(value=>{album=value;applyTranslations();}).catch(fail);
localize(getLanguage());background(cfg.backgroundId).then(startBackgroundLoop);
window.addEventListener('message',e=>{
 if(e.origin!==location.origin||e.source!==parent||e.data?.scope!=='boku-v6-cover')return;
 const q=e.data;
 if(q.type==='init'){if(!host){host=true;const tracks=[{id:'shuffle',label:'bgmShuffle'},...(q.tracks||[])];
   for(const tr of tracks){const o=document.createElement('option');o.value=tr.id;o.dataset.i18n=tr.label;$('bgmTrack').append(o);}
   action('preferences',{...cfg});
 }localize(q.lang);}
 else if(q.type==='state'){state=q.value;updateBoot();}
 else if(q.type==='error')fail(q.message);
 else if(q.type==='language')localize(q.lang);
 else if(q.type==='visibility')setVisible(q.open);
});
parent.postMessage({scope:'boku-v6-cover',type:'hello'},location.origin);action('hello');
setTimeout(()=>{if(!host)fail('未能连接游戏 / ゲームに接続できません / Game could not start');},25000);
