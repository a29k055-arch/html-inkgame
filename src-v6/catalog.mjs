import {createLevelScroll} from '../assets/ui/bamboo-scroll/bamboo-scroll.js?v=4296ecc';
import {LEVELS,TUTORIALS} from './levels.mjs';

const copy = {
  zh:{index:'选画',tutorial:'教学',enter:'进入画作',back:'返回目录',locked:'完成前置关卡后开启',painting:'画作',done:'已完成',preview:'画作预览'},
  ja:{index:'絵を選ぶ',tutorial:'遊び方',enter:'絵に入る',back:'一覧に戻る',locked:'前のステージをクリアすると遊べます',painting:'ステージ',done:'クリア済み',preview:'絵のプレビュー'},
  en:{index:'Choose a painting',tutorial:'Tutorial',enter:'Enter painting',back:'Back to the scroll',locked:'Complete the previous painting to unlock.',painting:'Painting',done:'Completed',preview:'Painting preview'}
};
// Reserve the real artwork rectangle before decoding. A late image must not move a button under a finger.
const artworkSize=[[800,1234],[600,900],[694,1286],[735,1530],[848,428],[1045,499]];
const number = entry => String(entry.index+1).padStart(2,'0');
const entries = [{divider:'tutorial'},...TUTORIALS,{divider:'space'},...LEVELS];

export function createCatalogue({progress,paintings,unlocked,finished,onEnter}) {
  const $=id=>document.getElementById(id);
  const library=$('library'),slips=$('slips'),preview=$('catalog-preview'),slat=$('preview-slip');
  const start=$('start'),back=$('preview-back'),image=$('preview-art');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let current=null, flight=null;
  const bamboo=createLevelScroll(slips,entries.map(entry=>({name:'',locked:Boolean(entry.divider)})),show);
  bamboo.buttons.forEach((button,i)=>{
    const entry=entries[i];
    if(entry.divider){
      button.dataset.divider=entry.divider;
      button.setAttribute('aria-hidden','true');
      button.tabIndex=-1;
    }else{
      button.dataset.kind=entry.kind;
      button.dataset.index=entry.index;
    }
  });
  function update(){
    const lang=progress.lang,c=copy[lang];
    library.setAttribute('aria-label',c.index);slips.setAttribute('aria-label',c.index);
    bamboo.buttons.forEach((button,i)=>{
      const entry=entries[i],title=button.querySelector('.bamboo-level-name'),no=button.querySelector('.bamboo-level-no');
      if(entry.divider){
        title.textContent=entry.divider==='tutorial'?c.tutorial:'';
        no.textContent='';return;
      }
      const locked=!unlocked(entry);
      button.dataset.locked=String(locked);
      button.dataset.complete=String(finished(entry));
      title.textContent=entry.title[lang];
      no.textContent=number(entry);
      button.setAttribute('aria-label',[(entry.kind==='tutorial'?c.tutorial:c.painting)+' '+number(entry),entry.title[lang],locked?c.locked:finished(entry)?c.done:''].filter(Boolean).join(' · '));
    });
    if(current==null)return;
    const entry=entries[current],locked=!unlocked(entry);
    slat.dataset.kind=entry.kind;
    $('hero-title').textContent=entry.title[lang];
    $('preview-number').textContent=number(entry);
    $('hero-desc').textContent=entry.subtitle[lang];
    const artIndex=entry.kind==='tutorial'?0:entry.index;
    const [width,height]=artworkSize[artIndex];
    preview.style.setProperty('--art-ratio',String(width/height));
    image.width=width;image.height=height;
    const src=paintings[artIndex];
    if(image.src!==src)image.src=src;
    image.alt=c.preview+' · '+entry.title[lang];
    preview.setAttribute('aria-label',c.preview);
    start.disabled=locked;start.textContent=c.enter;back.textContent=c.back;
    $('hero-lock').textContent=locked?c.locked:'';
    $('hero-lock').hidden=!locked;
  }
  function show(_,index){
    const button=bamboo.buttons[index];
    if(!button||entries[index].divider)return;
    bamboo.stopMotion();
    const origin=button.getBoundingClientRect();
    current=index;
    update();preview.hidden=false;slips.inert=true;library.dataset.view='preview';
    flight?.cancel();
    if(!reduce.matches){
      const end=slat.getBoundingClientRect();
      flight=slat.animate([
        {transform:'translate('+ (origin.left-end.left)+'px,'+(origin.top-end.top)+'px) scale('+(origin.width/end.width)+','+(origin.height/end.height)+')'},
        {transform:'none'}
      ],{duration:470,easing:'cubic-bezier(.22,.72,.19,1)'});
    }
    (start.disabled?back:start).focus({preventScroll:true});
  }
  function close({focus=false}={}){
    const old=current;
    flight?.cancel();flight=null;current=null;
    preview.hidden=true;slips.inert=false;library.dataset.view='scroll';
    if(focus&&old!==null)bamboo.buttons[old].focus({preventScroll:true});
  }
  function open(group,index=0){
    close();
    const i=entries.findIndex(e=>e.kind===group&&e.index===index);
    if(i<0){slips.scrollLeft=0;return;}
    bamboo.select(i,true);
    show(null,i);
  }
  start.addEventListener('click',()=>{
    const entry=entries[current];
    if(entry&&unlocked(entry))onEnter(entry.kind,entry.index);
  });
  back.addEventListener('click',()=>close({focus:true}));
  $('prev').onclick=()=>bamboo.scrollBy(-1);
  $('next').onclick=()=>bamboo.scrollBy(1);
  function arrows(){
    const limit=slips.scrollWidth-slips.clientWidth;
    $('prev').hidden=limit<3||slips.scrollLeft<=2;
    $('next').hidden=limit<3||slips.scrollLeft>=limit-2;
  }
  slips.addEventListener('scroll',arrows,{passive:true});
  new ResizeObserver(arrows).observe(slips);
  slips.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
    e.preventDefault();e.stopImmediatePropagation();
    const buttons=bamboo.buttons.filter(b=>b.dataset.kind);
    const i=buttons.indexOf(document.activeElement);
    const next=buttons[Math.max(0,Math.min(buttons.length-1,i+(e.key==='ArrowLeft'?-1:1)))];
    next?.focus();
  },{capture:true});
  library.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!preview.hidden){event.preventDefault();close({focus:true});}
  });
  close();update();
  return {open,close,update};
}
