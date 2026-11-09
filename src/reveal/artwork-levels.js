import {V4_ARTWORKS as ARTWORKS} from '../data/v4-artworks.js';
import {REVEAL_CONFIG} from './config.js';

// Stable gallery IDs and existing pictures; no duplicate catalog or save namespace.
export const REVEAL_ARTWORKS=Object.freeze([
 ARTWORKS.find(a=>a.id===REVEAL_CONFIG.artworkId),
 ...ARTWORKS.filter(a=>a.id!==REVEAL_CONFIG.artworkId)
].filter(Boolean));
export function selectRevealArtwork(save,manualId=save.settings?.selectedRevealArtwork){
 const manual=REVEAL_ARTWORKS.find(a=>a.id===manualId);if(manual)return manual;
 const unlocked=new Set(save.unlockedArtworks||[]),progress=save.progress?.revealArtworks||{};
 return REVEAL_ARTWORKS.find(a=>!unlocked.has(a.id)&&!progress[a.id]?.completed)||REVEAL_ARTWORKS[0];
}
export function artworkWorld(art,config=REVEAL_CONFIG){
 const ratio=art.width/art.height,longest=Math.max(config.width,config.height);
 const width=ratio>=1?longest:longest*ratio,height=ratio>=1?longest/ratio:longest;
 // Bound grid cost for portrait pictures as well as landscape pictures.
 const columns=Math.max(128,Math.round(config.columns*Math.min(1,ratio)));
 return {width,height,columns,artworkId:art.id};
}
