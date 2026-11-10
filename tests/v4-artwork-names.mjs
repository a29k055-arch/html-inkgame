import assert from 'node:assert/strict';
import {V4_ARTWORKS} from '../src/data/v4-artworks.js';
import {artTitle,setLanguage,t} from '../src/ui/i18n.js';
for(const language of ['ja','zh','en']){
 setLanguage(language);const names=V4_ARTWORKS.map(artTitle);
 assert.equal(new Set(names).size,11);assert(names.every(n=>n.length>2));
 for(const art of V4_ARTWORKS){assert.equal(artTitle(art),art.titles[language]);assert.equal(art.titleKind,'descriptive');}
 if(language==='ja'){assert.equal(names[0],'蓮の葉に宿る露');assert(names.every(n=>!/[绿听虾芦风荫]/.test(n)));}
 if(language==='zh')assert.equal(names[0],'荷露清圆');
 if(language==='en')assert.equal(names[0],'Dew on Lotus Leaves');
 assert.equal(artTitle({id:'ink-04',label:'legacy'}),t('painting01'),'legacy naming path stays intact');
}
console.log('PASS 11 stable IDs with independent Chinese/Japanese/English names; descriptive provenance and legacy fallback retained');
