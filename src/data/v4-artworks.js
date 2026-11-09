import {unlockedArtworks} from './save.js';
// User-provided cropped, inscription-free pictures. Stable IDs preserve matching old records.
export const V4_ARTWORKS=Object.freeze([
 ['ink-01',1,600,900,'荷露清圆'],['ink-06',2,800,1234,'游鱼浅塘'],
 ['ink-07',3,694,1286,'芦石秋影'],['ink-08',4,735,1530,'墨虾游影'],
 ['ink-11',5,439,1100,'荷荫蟹趣'],['ink-12',6,848,428,'芦汀蟹影'],
 ['ink-13',7,1045,499,'荷塘清风'],['ink-10',8,765,1508,'寒枝栖禽'],
 ['ink-14',9,1861,1130,'疏竹清影'],['ink-15',10,1508,1009,'竹林听风'],
 ['ink-16',11,2999,1529,'青绿叠嶂']
].map(([id,file,width,height,title])=>Object.freeze({id,file,width,height,title,label:title,src:new URL(`../../assets/artworks/v4-cropped/${file}.png`,import.meta.url).href})));
export const V4_BACKGROUNDS=Object.freeze(V4_ARTWORKS.map(a=>({id:a.id==='ink-13'?'lotus-paper':a.id,src:a.src,label:a.title,artworkId:a.id,public:a.id==='ink-13'})));
export const unlockedV4Ids=unlockedArtworks;
