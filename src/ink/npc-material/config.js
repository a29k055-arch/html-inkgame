import {QUALITY as PLAYER_QUALITY} from '../../../prototypes/ink/src/config.js';
export {INK} from '../../../prototypes/ink/src/config.js';
// Private bake preset; never mutates the player or study quality settings.
export const QUALITY={...PLAYER_QUALITY,npc:{grid:96,iterations:4,simulationHz:15,renderScale:1,maxWidth:256,maxHeight:256}};
