// The V5 album presents the paintings completed in the V6 campaign.
const progressKey='boku.v6.pond.progress.1',settingsKey='boku.v6.cover.settings.1';
export const galleryIDs=['ink-06','ink-01','ink-07','ink-08','ink-12','ink-13'];
function read(key){try{return JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{return {};}}
export function coverSettings(){return read(settingsKey);}
export function updateSettings(settings){try{localStorage.setItem(settingsKey,JSON.stringify(settings));}catch{}}
export function getSave(){
 const progress=read(progressKey),completed=Array.isArray(progress.levels)?progress.levels:[];
 const revealArtworks=Object.fromEntries(galleryIDs.map((id,i)=>[id,{completed:completed.includes(i),bestProgress:completed.includes(i)?1:0}]));
 return {settings:{...coverSettings(),language:progress.lang||coverSettings().language||'zh'},progress:{revealArtworks}};
}
export function unlockedArtworks(){return new Set(galleryIDs.filter(id=>getSave().progress.revealArtworks[id].completed));}
export function fragmentIds(){return [];}
export function restoreArtwork(){return false;}
