import {unlockedArtworks} from './save.js';
// Same stable catalog IDs and ordering as the existing album. No invented attribution.
export const ARTWORKS = [
 ['ink-13','png',1175,499],['ink-01','jpg',690,1056],['ink-06','png',952,1464],
 ['ink-07','png',741,1586],['ink-08','png',821,1618],['ink-10','png',813,1596],
 ['ink-09','png',548,1512],['ink-11','png',439,1640],['ink-12','png',965,499],
 ['ink-04','png',2774,1275],['ink-05','png',2622,1269],
].map(([id,ext,width,height],i)=>({id,label:`作品 ${String(i+1).padStart(2,'0')}`,src:new URL(`../../outputs/assets/gallery/${id}.${ext}`,import.meta.url).href,width,height}));
export const UNLOCK_KEY='boku.album.unlocked.v1';
export const unlockedIds=unlockedArtworks;
