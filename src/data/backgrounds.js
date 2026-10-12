import {ARTWORKS,unlockedIds} from './artworks.js';
// Add a file under assets/home/backgrounds/ and one entry here. UI never owns an image path.
// artworkId associates a background with album unlocks; standalone entries may be public.
export const HOME_BACKGROUNDS=[
 {id:'lotus-paper',src:ARTWORKS[0].src,label:ARTWORKS[0].label,artworkId:'ink-13',public:true},
 {id:'landscape-paper',src:new URL('../../outputs/assets/ink_reference_painting.png',import.meta.url).href,label:'山水',public:true},
 ...ARTWORKS.slice(1).map(a=>({id:a.id,src:a.src,label:a.label,artworkId:a.id,public:false})),
];
export const BACKGROUND_CONFIG={rotationSeconds:35,defaultId:'lotus-paper'};
export class HomeBackgrounds {
 constructor(onChange){this.onChange=onChange;this.current=null;this.clock=0;this.policy='fixed';this.generation=0;}
 eligible(){const ids=window.BokuGallery?.unlockedIds?.()||unlockedIds();const pool=HOME_BACKGROUNDS.filter(b=>this.policy==='unlocked'?ids.has(b.artworkId):b.public||ids.has(b.artworkId));return pool.length?pool:[HOME_BACKGROUNDS[0]];}
 async choose(next=false){const choices=this.eligible();let entry=choices.find(b=>b.id===BACKGROUND_CONFIG.defaultId)||choices[0];if(this.policy==='random'||this.policy==='unlocked'){const pool=choices.filter(b=>b.id!==this.current?.id);entry=(pool.length?pool:choices)[Math.floor(Math.random()*(pool.length||choices.length))];}else if(next||this.policy==='rotate'){const i=choices.findIndex(b=>b.id===this.current?.id);entry=choices[(i+1)%choices.length];}else if(this.current&&choices.includes(this.current))entry=this.current;
  const generation=++this.generation;const img=new Image();img.src=entry.src;await img.decode();if(generation!==this.generation)return;this.current=entry;this.clock=0;this.onChange(img,entry);
 }
 async setPolicy(policy){this.policy=policy;await this.choose(policy==='rotate');}
 tick(dt){if(this.policy!=='rotate')return;this.clock+=dt;if(this.clock>=BACKGROUND_CONFIG.rotationSeconds){this.clock=0;this.choose(true).catch(e=>console.warn('Background:',e.message));}}
}
