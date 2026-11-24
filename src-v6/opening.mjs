import {prefetchV5Resources,resourceBytes} from '../src-v5/reveal/resource-loader.js';
import {preloadLivingCreatures} from '../src-v5/ink/living-painter.js';
import {POND_PICKUP_VARIANTS} from '../src-v5/reveal/pickups.js';
import {BGM_TRACKS} from '../src-v5/reveal/bgm-audio.js';
import {LIVING_VARIANTS} from '../src-v5/game/living-rigs.js';

const root=new URL('../',import.meta.url);
function bootImages(){
 const files=['assets/home/menu-reference.png','assets/home/brush.svg','assets/ui/cloud-lines.svg',
  'assets/ui/bamboo-scroll/bamboo-slip.png',
  ...[2,1,3,4,6,7,5].map(n=>'assets/artworks/v4-cropped/'+n+'.png'),
  ...['01','02'].map(n=>'assets/effects/start/start-'+n+'.webp'),
  ...Object.values(LIVING_VARIANTS).flat().map(id=>'src-v6/art/forms/'+id+'.webp'),
  ...['fish-icon','shrimp-icon','turtle-icon','dragon-icon','urchin-ink','vortex-ink','urchin-breath'].map(n=>'src-v6/art/'+n+'.webp'+(n.startsWith('urchin-')?'?paint=2':''))
 ];
 return [...new Set([...files.map(f=>new URL(f,root).href),...Object.values(POND_PICKUP_VARIANTS).flat().map(item=>item.src)])];
}
function resourceName(address){
 try{return decodeURIComponent(new URL(address,root).pathname.split('/').slice(-2).join('/'));}catch{return String(address);}
}
async function withWorkers(items,count,run){
 let next=0;await Promise.all(Array.from({length:Math.min(count,items.length)},async()=>{
   while(next<items.length)await run(items[next++]);
 }));
}
async function loadResources(report,prepare){
 const files=bootImages(),lengths=new Map(),loaded=new Map(),unknownSizes=new Set(files);
 let rigBytes=0,rigExpected=resourceBytes,rigFiles=0,rigTotal=0,extraFiles=0,current='',extraBytes=0,lastReported=-Infinity;
 const started=performance.now();
 function snapshot(phase,force=false,prep=0){
   const now=performance.now();if(!force&&now-lastReported<50)return;lastReported=now;
   const bytes=[...loaded.values()].reduce((acc,x)=>acc+x,0)+rigBytes;
   const total=Math.max(bytes,rigExpected+extraBytes);
   report({phase,current,loadedBytes:bytes,totalBytes:total,sizeComplete:!unknownSizes.size,progress:Math.min(1,bytes/Math.max(1,total)),completed:rigFiles+extraFiles,total:rigTotal+files.length,elapsedMs:now-started,preparation:prep});
 }
 // Image sizes come from the deployed response, including newly supplied artwork.
 // A host without HEAD support is still supported by measuring the streamed GET.
 await withWorkers(files,6,async url=>{
   let size=0;try{const response=await fetch(url,{method:'HEAD',cache:'force-cache',signal:AbortSignal.timeout(10000)});if(response.ok)size=Number(response.headers.get('content-length'))||0;}catch{}
   lengths.set(url,size);extraBytes+=size;if(size>0)unknownSizes.delete(url);
 });
 snapshot('download',true);
 const artwork=withWorkers(files,4,async url=>{
   let failure;
   for(let attempt=0;attempt<3;attempt++){
     try{
       const res=await fetch(url,{cache:attempt?'reload':'force-cache',signal:AbortSignal.timeout(40000)});
       if(!res.ok)throw Error(res.status+' '+resourceName(url));
       if(unknownSizes.has(url)){
         const announced=Number(res.headers.get('content-length'))||0;
         if(announced>0){extraBytes+=announced;lengths.set(url,announced);unknownSizes.delete(url);}
       }
       let n=0;const reader=res.body?.getReader();
       if(reader){for(;;){const chunk=await reader.read();if(chunk.done)break;n+=chunk.value.length;loaded.set(url,n);current=resourceName(url);snapshot('download');}}
       else{n=(await res.arrayBuffer()).byteLength;loaded.set(url,n);}
       if(n<1)throw Error('Empty resource: '+resourceName(url));
       extraBytes+=n-(lengths.get(url)||0);lengths.set(url,n);unknownSizes.delete(url);extraFiles++;current=resourceName(url);snapshot('download',true);return;
     }catch(error){failure=error;loaded.delete(url);}
   }
   throw failure;
 });
 const rigs=prefetchV5Resources({fetcher:(url,options)=>{current=resourceName(url);return fetch(url,options);},onProgress(q){
   rigBytes=q.loadedBytes;rigExpected=q.totalBytes;rigFiles=q.completed;rigTotal=q.total;snapshot('download');
 }});
 await Promise.all([artwork,rigs]);
 current='';snapshot('download-ready',true);
 await Promise.all([preloadLivingCreatures({onProgress:q=>{snapshot('prepare',true,q.progress??q.loaded/q.total);}}),prepare?.()]);
 snapshot('ready',true,1);
}

export function connectOpening({getLanguage,onPlay,onHelp,onGallery,onLanguage,onPreferences,onSoundUnlock,prepare}={}){
 const frame=document.getElementById('v6-opening'),scene=document.getElementById('pond-app');
 let active=true,ready=false,loading=null,state={phase:'start'},failure=null,returnFromSettings=null;
 const send=(message)=>frame.contentWindow?.postMessage({scope:'boku-v6-cover',...message},location.origin);
 function status(){send({type:'state',value:state});}
 function init(){send({type:'init',tracks:BGM_TRACKS.map(({id,label})=>({id,label}))});status();if(failure)send({type:'error',message:failure});}
 function hide(){
   active=false;scene.inert=false;frame.hidden=true;delete frame.dataset.settingsOnly;
   send({type:'visibility',open:false});
 }
 function show(){
   active=true;delete frame.dataset.settingsOnly;frame.hidden=false;scene.inert=true;
   send({type:'visibility',open:true});init();frame.focus();
 }
 function showSettings(onReturn){
   if(active||returnFromSettings)return;
   returnFromSettings=onReturn||(()=>{});frame.dataset.settingsOnly='true';
   scene.inert=true;frame.hidden=false;send({type:'settings'});frame.focus();
 }
 frame.openingAction=(action,value)=>{
   if(action==='hello'){init();return;}
   if(action==='current-language')return getLanguage?.()||'zh';
   if(action==='unmute'){onSoundUnlock?.();return;}
   if(action==='language'){onLanguage?.(value);return;}
   if(action==='preferences'){onPreferences?.(value);return;}
   if(action==='settings-closed' && returnFromSettings){const resume=returnFromSettings;returnFromSettings=null;hide();resume();return;}
   if(action==='retry'){location.reload();return;}
   if(!ready||!active)return;
   onSoundUnlock?.();
   if(action==='play'){hide();onPlay?.();}
   else if(action==='help'){hide();(onHelp||onPlay)?.();}
   else if(action==='gallery'){hide();(onGallery||onPlay)?.(value);}
 };
 scene.inert=true;
 frame.addEventListener('load',init);
 window.addEventListener('message',event=>{
   if(event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.scope!=='boku-v6-cover')return;
   if(event.data.type==='hello')init();
 });
 loading=loadResources(q=>{state=q;status();},prepare).then(()=>{
   ready=true;state={...state,phase:'ready'};status();
 }).catch(error=>{failure=error?.message||String(error);console.error('V6 startup:',error);send({type:'error',message:failure});});
 init();
 function setLanguage(lang){
   // Selecting a language inside the same-origin frame already applied it there.
   // Echoing that choice asynchronously can roll back a later keyboard selection.
   const current=frame.contentDocument?.documentElement.lang.split('-')[0];
   if(current!==lang)send({type:'language'});
 }
 return {hide,show,showSettings,setLanguage,get ready(){return ready;},get loading(){return loading;}};
}
