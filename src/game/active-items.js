import {ACTIVE_CONFIG as C} from './config.js';
export function useActive(e,id){const config=C[id],level=e.talents?.[id]||0,state=e.actives?.[id];if(!config||!level||!state||e.dead||state.cooldown>0||state.remaining>0)return false;state.remaining=config.duration[level-1];state.cooldown=config.cooldown[level-1];if(id==='veil')e.effects.water=state.remaining;return true;}
export function tickActives(e,dt){if(!e.actives)return;for(const state of Object.values(e.actives)){state.remaining=Math.max(0,state.remaining-dt);state.cooldown=Math.max(0,state.cooldown-dt);}}
export function stopActives(e){if(!e.actives)return;for(const state of Object.values(e.actives))state.remaining=0;delete e.effects.water;}
