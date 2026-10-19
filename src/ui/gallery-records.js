import {unlockedArtworks,unlockNext,storageAvailable,fragmentIds} from '../data/save.js';
import {ARTWORKS} from '../data/artworks.js';
import {readRecord} from '../data/records.js';
export async function setupGallery(onBackground,onRestore){
 window.BokuGalleryConfig={artworks:[ARTWORKS.find(a=>a.id==='ink-04'),...ARTWORKS.filter(a=>a.id!=='ink-04')],persistence:{unlockedIds:unlockedArtworks,unlockNext:()=>unlockNext(ARTWORKS),available:storageAvailable},language:'ja',allowOriginal:true,note:' · 異墨から断片を集め、画巻を修復します。',onPreview:async(art,dialog)=>{
  const host=dialog.querySelector('aside'),img=dialog.querySelector('img');host.replaceChildren();if(art.id==='ink-04'){const status=document.createElement('p'),button=document.createElement('button');status.textContent=`画巻の断片 ${fragmentIds().length} / 3`;button.textContent='画巻を修復';button.className='ink-button';button.disabled=fragmentIds().length<3;button.onclick=()=>onRestore();host.append(status,button);}const token=Symbol();dialog.previewToken=token;const record=await readRecord(art.id);if(!dialog.open||dialog.previewToken!==token)return;let objectURL=null;
  const display=(run)=>{if(objectURL)URL.revokeObjectURL(objectURL);objectURL=run?.blob?URL.createObjectURL(run.blob):null;img.src=objectURL||art.src;};
  const label=document.createElement('p');label.className='muted';label.textContent=record.best?`最高完成度 ${(record.best.completion*100).toFixed(1)}%`:'この作品はまだ描かれていません。';host.append(label);
  for(const [text,run] of [['Original · 原画',null],['Best · ベスト',record.best]]){const b=document.createElement('button');b.className='ink-button secondary';b.textContent=text;b.disabled=text.startsWith('Best')&&!run;b.onclick=()=>display(run);host.append(b);}
  if(record.history.length){const history=document.createElement('div');history.className='history-row';const h=document.createElement('p');h.textContent='History · 最近の記録';host.append(h,history);for(const run of record.history){const b=document.createElement('button');b.textContent=`${new Date(run.date).toLocaleDateString('ja-JP')} · ${(run.completion*100).toFixed(1)}%`;b.onclick=()=>display(run);history.append(b);}}
  const bg=document.createElement('button');bg.className='ink-button secondary';bg.textContent='ホームの背景にする';bg.disabled=!window.BokuGallery.unlockedIds().has(art.id);bg.onclick=()=>onBackground(art.id);host.append(bg);display(record.best);
  dialog.addEventListener('close',()=>{dialog.previewToken=null;if(objectURL)URL.revokeObjectURL(objectURL);},{once:true});
 }};
 await import('../../outputs/ui/boku-gallery.js');window.BokuGallery.setLabels();
}
