// Pure pixel analysis: estimate paper luminance, then weight darker authored marks.
// Input is an ImageData-like object; no canvas/GPU reads or artwork mutation here.
export function estimateInkWeights(image,{columns=image.width,rows=image.height}={}){
 const width=Math.trunc(image.width),height=Math.trunc(image.height),data=image.data;
 if(width<1||height<1||!data||data.length<width*height*4)throw new TypeError('Invalid painting pixels');
 columns=Math.max(1,Math.trunc(columns));rows=Math.max(1,Math.trunc(rows));
 const hist=new Uint32Array(256),tilesX=Math.min(16,width),tilesY=Math.min(16,height),tileHist=Array.from({length:tilesX*tilesY},()=>new Uint32Array(256));let count=0;
 const luminance=i=>(data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722)/255;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;if(data[i+3]<128)continue;const bucket=Math.max(0,Math.min(255,Math.round(luminance(i)*255)));hist[bucket]++;tileHist[Math.min(tilesY-1,Math.floor(y/height*tilesY))*tilesX+Math.min(tilesX-1,Math.floor(x/width*tilesX))][bucket]++;count++;}
 const quantile=(h,q,fallback)=>{let total=0;for(const n of h)total+=n;if(!total)return fallback;let sum=0;for(let i=0;i<256;i++){sum+=h[i];if(sum>=total*q)return i/255;}return 1;};
 const detected=quantile(hist,.95,1),paperLuma=detected<.55?.94:detected,papers=tileHist.map(h=>Math.max(paperLuma-.08,quantile(h,.90,paperLuma)));
 const source=new Float32Array(width*height);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4,alpha=data[i+3]/255;if(!alpha)continue;const paper=papers[Math.min(tilesY-1,Math.floor(y/height*tilesY))*tilesX+Math.min(tilesX-1,Math.floor(x/width*tilesX))],contrast=Math.max(0,(paper-luminance(i))/Math.max(.55,paper)),t=Math.max(0,Math.min(1,(contrast-.05)/.20));source[y*width+x]=t*t*(3-2*t)*alpha;}
 const weights=new Float32Array(columns*rows);let totalWeight=0;for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){let sum=0;for(const oy of [.25,.75])for(const ox of [.25,.75]){const sx=Math.min(width-1,Math.floor((x+ox)/columns*width)),sy=Math.min(height-1,Math.floor((y+oy)/rows*height));sum+=source[sy*width+sx];}const value=sum/4;weights[y*columns+x]=value;totalWeight+=value;}
 return {weights,columns,rows,totalWeight,paperLuma,hasInk:count>0&&totalWeight>1e-6};
}
