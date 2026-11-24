import {createLevelScroll} from '../assets/ui/bamboo-scroll/bamboo-scroll.js?v=4296ecc';
import {POND_ARTWORKS} from './artworks.mjs';
import {LEVELS,TUTORIALS,TRIAL} from './levels.mjs';

const copy = {
  zh:{index:'选画',tutorial:'教学关卡',tutorialInfo:'从认出自己的墨滴开始，依次练习移动与吞噬、敌人碰撞、使用道具和喷墨。',enter:'进入画作',back:'返回目录',locked:'完成前置关卡后开启',upcoming:'制作中',painting:'画作',done:'已完成',preview:'画作预览'},
  ja:{index:'絵を選ぶ',tutorial:'チュートリアル',tutorialInfo:'泳ぎながら、敵の吸収、アイテムでの変身、墨の吐き方を順に試してみよう。',enter:'絵に入る',back:'一覧に戻る',locked:'前のステージをクリアすると解放されます',upcoming:'準備中',painting:'ステージ',done:'クリア済み',preview:'絵のプレビュー'},
  en:{index:'Choose a painting',tutorial:'Tutorial',tutorialInfo:'Find your ink drop, then try swimming, absorbing, meeting rivals, using items and jetting ink.',enter:'Enter painting',back:'Back to the scroll',locked:'Complete the previous painting to unlock.',upcoming:'Coming soon',painting:'Painting',done:'Completed',preview:'Painting preview'}
};
const numbered=(entry)=>String(entry.index+1).padStart(2,'0');
const tutorial={kind:'tutorial',index:0,artworkIndex:0};
const futureNames=[['柒','VII'],['捌','VIII'],['玖','IX'],['拾','X']];
const future=futureNames.map(([han,en],i)=>({kind:'future',index:6+i,title:{zh:han,ja:han,en}}))
  .filter(entry=>entry.index>=LEVELS.length);
const entries=[tutorial,TRIAL,...LEVELS,...future];
function name(entry,lang) {
  if(entry.kind==='tutorial')return copy[lang].tutorial;
  return entry.title[lang];
}

function letterSlat(title,entry,lang){
  const label=name(entry,lang);
  if(title.dataset.language===lang && title.dataset.label===label)return;
  title.dataset.language=lang;title.dataset.label=label;
  const cells=lang==='zh' && (entry.kind==='tutorial'||entry.kind==='trial');
  title.classList.toggle('slip-glyphs',cells);
  if(!cells){title.textContent=label;return;}
  title.replaceChildren(...Array.from(label,glyph=>{
    const cell=document.createElement('span');cell.textContent=glyph;return cell;
  }));
}

export function createCatalogue({progress,paintings,unlocked,finished,onEnter}) {
  const $=id=>document.getElementById(id);
  const library=$('library'),slips=$('slips'),preview=$('catalog-preview'),slat=$('preview-slip');
  const start=$('start'),back=$('preview-back'),image=$('preview-art');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let current=null, flight=null;
  const bamboo=createLevelScroll(slips,entries.map(entry=>({name:'',locked:entry.kind==='future'})),show);
  bamboo.buttons.forEach((button,i)=>{
    const entry=entries[i];
    if(entry.kind==='future')button.dataset.upcoming='true';
    else button.dataset.kind=entry.kind;
    button.dataset.index=entry.index;
    const badge=document.createElement('span');badge.className='slip-completion';badge.hidden=true;button.append(badge);
  });
  // Touch browsers occasionally swallow a compatibility click just after a
  // scrolling gesture. Recover only a motionless single-finger tap on the
  // same playable slat. Native clicks, drags and pinches keep their own path.
  let tap=null,tapTimer=0;
  slips.addEventListener('pointerdown',e=>{
    clearTimeout(tapTimer);
    const button=e.target.closest?.('button[data-kind]');
    tap=e.pointerType==='touch'&&e.isPrimary&&button?{id:e.pointerId,button,x:e.clientX,y:e.clientY}:null;
  });
  slips.addEventListener('pointermove',e=>{
    if(tap?.id===e.pointerId && Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>7)tap=null;
  });
  slips.addEventListener('pointercancel',()=>{tap=null;});
  slips.addEventListener('pointerup',e=>{
    const candidate=tap;tap=null;
    if(!candidate || candidate.id!==e.pointerId || !candidate.button.contains(e.target))return;
    tapTimer=setTimeout(()=>{
      if(current===null && !library.hidden && !slips.inert)candidate.button.click();
    },80);
  });
  slips.addEventListener('click',()=>clearTimeout(tapTimer),true);
  function update(){
    const lang=progress.lang,c=copy[lang];
    library.setAttribute('aria-label',c.index);slips.setAttribute('aria-label',c.index);
    bamboo.buttons.forEach((button,i)=>{
      const entry=entries[i],title=button.querySelector('.bamboo-level-name'),no=button.querySelector('.bamboo-level-no');
      const label=name(entry,lang),upcoming=entry.kind==='future',numberedEntry=entry.kind==='level'||upcoming;
      const locked=upcoming||!unlocked(entry);
      const complete=entry.kind==='tutorial'?TUTORIALS.every(finished):!upcoming&&finished(entry);
      button.dataset.locked=String(locked);
      button.dataset.complete=String(complete);
      letterSlat(title,entry,lang);
      no.textContent=numberedEntry?numbered(entry):'';
      const badge=button.querySelector('.slip-completion');
      badge.hidden=!complete;badge.textContent=c.done;
      if(upcoming){
        let pending=button.querySelector('.bamboo-future');
        if(!pending){pending=document.createElement('span');pending.className='bamboo-future';button.append(pending);}
        pending.textContent=c.upcoming;
      }
      button.setAttribute('aria-label',[numberedEntry?c.painting+' '+numbered(entry):'',label,upcoming?c.upcoming:locked?c.locked:complete?c.done:''].filter(Boolean).join(' · '));
    });
    if(current==null)return;
    const entry=entries[current],locked=!unlocked(entry);
    slat.dataset.kind=entry.kind;slat.dataset.mirror=String(current%2===1);
    letterSlat($('hero-title'),entry,lang);
    $('preview-number').textContent=entry.kind==='level'?numbered(entry):'';
    $('hero-desc').textContent=entry.kind==='tutorial'?c.tutorialInfo:entry.subtitle[lang];
    const artIndex=entry.artworkIndex??entry.index;
    const {width,height,note}=POND_ARTWORKS[artIndex];
    const artNote=$('art-note');
    artNote.textContent=note?.[lang]??'';
    artNote.hidden=!artNote.textContent;
    preview.style.setProperty('--art-ratio',String(width/height));
    image.width=width;image.height=height;
    const src=paintings[artIndex];
    if(image.src!==src)image.src=src;
    image.alt=c.preview+' · '+name(entry,lang);
    preview.setAttribute('aria-label',c.preview);
    start.disabled=locked;start.textContent=c.enter;back.textContent=c.back;
    $('hero-lock').textContent=locked?c.locked:'';
    $('hero-lock').hidden=!locked;
  }
  function show(_,index){
    const button=bamboo.buttons[index];
    if(!button||button.disabled)return;
    bamboo.stopMotion();
    const origin=button.getBoundingClientRect();
    current=index;
    update();preview.hidden=false;slips.inert=true;library.dataset.view='preview';
    flight?.cancel();
    if(!reduce.matches){
      const end=slat.getBoundingClientRect();
      flight=slat.animate([
        {transform:'translate('+ (origin.left-end.left)+'px,'+(origin.top-end.top)+'px) scale('+(origin.width/end.width)+')'},
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
    const direction=e.key==='ArrowLeft'?-1:1;
    const next=buttons[i+direction];
    if(next)next.focus();else bamboo.scrollBy(direction);
  },{capture:true});
  library.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!preview.hidden){event.preventDefault();close({focus:true});}
  });
  close();update();
  return {open,close,update};
}
