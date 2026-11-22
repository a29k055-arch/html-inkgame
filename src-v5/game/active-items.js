import {ACTIVE_CONFIG as C,ITEM_CONFIG as I} from './config.js';
export const ACTIVE_ITEMS=Object.keys(C).map(id=>({id,kind:'item',item:true}));
export function initItems(e){e.itemsHeld??=[...I.starter];e.itemUse??={id:null,remaining:0};}
export function obtainItem(e,id){initItems(e);if(!C[id]||e.itemsHeld.length>=I.capacity)return false;e.itemsHeld.push(id);return true;}
export function useActive(e,id){initItems(e);id??=e.itemsHeld[0];if(e.dead||e.itemUse.remaining>0||id!==e.itemsHeld[0]||!C[id])return false;const c=C[id];e.itemsHeld.shift();e.itemUse={id,remaining:c.duration};e.effects[c.effect]=c.duration;return true;}
export function tickActives(e,dt){if(e.itemUse){const state=e.itemUse;state.remaining=Math.max(0,state.remaining-Math.max(0,dt));if(!state.remaining&&C[state.id])delete e.effects[C[state.id].effect];}}
export function stopActives(e){if(!e.itemUse)return;e.itemUse={id:null,remaining:0};for(const c of Object.values(C))delete e.effects[c.effect];}
