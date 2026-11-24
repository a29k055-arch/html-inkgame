// The same cropped paintings are used on the paper, in the catalogue and in the gallery.
export const POND_ARTWORKS=[
  {id:2,width:800,height:1234},{id:1,width:600,height:900},
  {id:3,width:694,height:1286},{id:4,width:735,height:1530},
  {id:6,width:848,height:428},{id:7,width:1045,height:499},
  {id:5,width:439,height:1100}
];

export function paintingSize(index,area){
  const art=POND_ARTWORKS[index],scale=Math.sqrt(area/(art.width*art.height));
  return {width:art.width*scale,height:art.height*scale};
}
