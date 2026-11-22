import {unlockedArtworks} from './save.js';
// User-provided cropped pictures have numbered filenames, with no verified catalogue titles.
// These are descriptive display names, not claimed original titles or attributions. IDs stay stable.
const displayTitles={"ink-01":["荷露清圆","蓮の葉に宿る露","Dew on Lotus Leaves"],"ink-06":["游鱼浅塘","浅瀬を泳ぐ魚","Fish in the Shallows"],"ink-07":["芦石秋影","葦と岩の秋景","Autumn Reeds and Rocks"],"ink-08":["墨虾游影","泳ぐ海老","Swimming Shrimp"],"ink-11":["荷荫蟹趣","蓮陰の蟹","Crab beneath the Lotus"],"ink-12":["芦汀蟹影","葦辺の蟹","Crabs among the Reeds"],"ink-13":["荷塘清风","蓮池のそよ風","Lotus Pond Breeze"],"ink-10":["寒枝栖禽","冬の枝に憩う鳥","Bird on Winter Branches"],"ink-14":["疏竹清影","淡い竹の影","Soft Bamboo Shadows"],"ink-15":["竹林听风","竹林を渡る風","Wind through Bamboo"],"ink-16":["青绿叠嶂","青緑の連山","Blue-Green Mountain Ranges"]};
export const V4_ARTWORKS=Object.freeze([
 ['ink-01',1,600,900,'荷露清圆'],['ink-06',2,800,1234,'游鱼浅塘'],
 ['ink-07',3,694,1286,'芦石秋影'],['ink-08',4,735,1530,'墨虾游影'],
 ['ink-11',5,439,1100,'荷荫蟹趣'],['ink-12',6,848,428,'芦汀蟹影'],
 ['ink-13',7,1045,499,'荷塘清风'],['ink-10',8,765,1508,'寒枝栖禽'],
 ['ink-14',9,1861,1130,'疏竹清影'],['ink-15',10,1508,1009,'竹林听风'],
 ['ink-16',11,2999,1529,'青绿叠嶂']
].map(([id,file,width,height,title])=>Object.freeze({id,file,width,height,title,titles:Object.freeze({zh:displayTitles[id][0],ja:displayTitles[id][1],en:displayTitles[id][2]}),titleKind:'descriptive',label:title,src:new URL(`../../assets/artworks/v4-cropped/${file}.png`,import.meta.url).href})));
export const V4_BACKGROUNDS=Object.freeze(V4_ARTWORKS.map(a=>({id:a.id==='ink-13'?'lotus-paper':a.id,src:a.src,label:a.title,artworkId:a.id,public:a.id==='ink-13'})));
export const unlockedV4Ids=unlockedArtworks;
