// The same cropped paintings are used on the paper, in the catalogue and in the gallery.
export const POND_ARTWORKS=[
  {id:2,width:800,height:1234},{id:1,width:600,height:900},
  {id:3,width:694,height:1286},{id:4,width:735,height:1530},
  {id:6,width:848,height:428},{id:7,width:1045,height:499},
  {
    id:5,width:439,height:1100,
    titles:{zh:"黄甲图",ja:"黄甲図",en:"Huangjia tu"},
    note:{
      zh:'明 · 徐渭《黄甲图》轴\n纸本墨笔，故宫博物院藏。将残的荷叶下，一只蟹缓缓爬过。',
      ja:'明時代・徐渭「黄甲図」\n紙本墨画、北京・故宮博物院蔵。枯れかけたハスの葉の下を、一匹のカニが歩いている。',
      en:'Huangjia tu · Xu Wei, Ming dynasty\nInk on paper. The Palace Museum, Beijing. A lone crab moves beneath fading lotus leaves.'
    }
  }
];

export function paintingSize(index,area){
  const art=POND_ARTWORKS[index],scale=Math.sqrt(area/(art.width*art.height));
  return {width:art.width*scale,height:art.height*scale};
}
