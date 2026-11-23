export const LIVING_VARIANTS=Object.freeze({
 fish:Object.freeze(['fish_04','fish_01','fish_02','fish_04_special']),
 shrimp:Object.freeze(['shrimp_07','shrimp_04','shrimp_05']),
 turtle:Object.freeze(['turtle_02','turtle_08']),
 dragon:Object.freeze(['dragon_04'])
});

export function resolveLivingRig(species,requested,skinIndex=0){
 const ids=LIVING_VARIANTS[species];
 if(!ids)return undefined;
 if(ids.includes(requested))return requested;
 const index=Number.isInteger(skinIndex)?Math.max(0,skinIndex):0;
 return ids[index%ids.length];
}
