import {GAME_CONFIG} from '../game/config.js';
// All NEW game metadata goes through this module. Legacy pages retain their own saves.
export const SAVE_KEY='boku.save.v1';
export const SAVE_VERSION=2;
const firstArtwork='ink-13';
const defaults=()=>({saveVersion:SAVE_VERSION,inkAmount:GAME_CONFIG.paperBaseInk,unlockedArtworks:[firstArtwork],settings:{},progress:{rounds:0,earnedInk:0,spentInk:0,artworks:{},receipts:[],fragments:{},bossReceipts:[],restoredArtworks:[]}});
let available=true,timer=null;
const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'null');}catch{available=false;return null;}};
const finite=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
function load(){
 const stored=read(SAVE_KEY),save=defaults();
 if(stored&&stored.saveVersion>SAVE_VERSION){available=false;return save;}
 if(stored&&typeof stored==='object'){
  if(finite(stored.inkAmount))save.inkAmount=stored.inkAmount;
  if(Array.isArray(stored.unlockedArtworks))save.unlockedArtworks=[...new Set([firstArtwork,...stored.unlockedArtworks.filter(id=>/^ink-\d{2}$/.test(id))])];
  if(stored.settings&&typeof stored.settings==='object')save.settings={...stored.settings};
  if(stored.progress&&typeof stored.progress==='object'){for(const key of ['rounds','earnedInk','spentInk'])if(finite(stored.progress[key]))save.progress[key]=stored.progress[key];if(stored.progress.artworks&&typeof stored.progress.artworks==='object')save.progress.artworks={...stored.progress.artworks};if(stored.progress.fragments&&typeof stored.progress.fragments==='object'){for(const [id,parts] of Object.entries(stored.progress.fragments))if(Array.isArray(parts))save.progress.fragments[id]=[...new Set(parts.filter(i=>[0,1,2].includes(i)))];}if(Array.isArray(stored.progress.bossReceipts))save.progress.bossReceipts=stored.progress.bossReceipts.filter(s=>typeof s==='string').slice(-128);if(Array.isArray(stored.progress.restoredArtworks))save.progress.restoredArtworks=stored.progress.restoredArtworks.filter(s=>typeof s==='string');if(Array.isArray(stored.progress.receipts))save.progress.receipts=stored.progress.receipts.filter(id=>typeof id==='string').slice(-40);}
 }else{
  const oldSettings=read('boku.settings.v1'),oldUnlocks=read('boku.album.unlocked.v1');
  if(oldSettings&&typeof oldSettings==='object')save.settings={...oldSettings};
  if(Array.isArray(oldUnlocks))save.unlockedArtworks=[...new Set([firstArtwork,...oldUnlocks.filter(id=>/^ink-\d{2}$/.test(id))])];
 }
 return save;
}
let state=load();
export const getSave=()=>structuredClone(state);
export const inkBalance=()=>state.inkAmount;
export const unlockedArtworks=()=>new Set(state.unlockedArtworks);
export const storageAvailable=()=>available;
export function flushSave(){clearTimeout(timer);timer=null;if(!available)return false;try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));return true;}catch{available=false;return false;}}
function changed(immediate=true){if(immediate)flushSave();else if(!timer)timer=setTimeout(flushSave,200);if(typeof document!=='undefined')document.dispatchEvent(new Event('boku:save-changed'));}
export function updateSettings(settings){state.settings={...settings};changed();}
export function creditInk(amount,receipt){if(!finite(amount)||!receipt||state.progress.receipts.includes(receipt))return false;state.inkAmount+=amount;state.progress.earnedInk+=amount;state.progress.rounds++;state.progress.receipts=[...state.progress.receipts,receipt].slice(-40);changed();return true;}
export function spendInk(amount,immediate=false){if(!finite(amount)||amount>state.inkAmount+1e-8)return false;state.inkAmount=Math.max(0,state.inkAmount-amount);state.progress.spentInk+=amount;changed(immediate);return true;}
export function recordCompletion(id,completion){if(!finite(completion))return;state.progress.artworks[id]=Math.max(Number(state.progress.artworks[id])||0,Math.min(1,completion));changed();}
export function unlockNext(catalog){const next=catalog.find(a=>a.id!=='ink-04'&&!state.unlockedArtworks.includes(a.id));if(!next)return null;state.unlockedArtworks.push(next.id);changed();return next.id;}
export function resetSave(){const settings={...state.settings};state=defaults();state.inkAmount=0;state.settings={...settings,backgroundId:null};changed();}
flushSave();
if(typeof addEventListener==='function'){addEventListener('pagehide',flushSave);addEventListener('storage',e=>{if(e.key===SAVE_KEY){state=load();if(typeof document!=='undefined')document.dispatchEvent(new Event('boku:save-changed'));}});}

export function fragmentIds(id='ink-04'){return [...(state.progress.fragments[id]||[])];}
export function awardFragment(id,receipt){if(typeof receipt!=='string'||!receipt||state.progress.bossReceipts.includes(receipt))return null;const parts=fragmentIds(id),next=[0,1,2].find(n=>!parts.includes(n));if(next===undefined)return null;state.progress.fragments[id]=[...parts,next];state.progress.bossReceipts=[...state.progress.bossReceipts,receipt].slice(-128);changed();return next;}
export function restoreArtwork(id){if(fragmentIds(id).length!==3||state.progress.restoredArtworks.includes(id))return false;state.progress.restoredArtworks.push(id);if(!state.unlockedArtworks.includes(id))state.unlockedArtworks.push(id);state.progress.artworks[id]=1;changed();return true;}
