/* Bounded R9 replacement of the old constant-gray upper-arm root bridge. */
const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/Nine/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'shrimp_05'),base=path.join(root,'backups/r9-strands/shrimp_05');
const plateFile='../repair-plates/shrimp_05_roots-r9.png';
function nearest(x,y,points){let best=Infinity;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b[0]-a[0],dy=b[1]-a[1],u=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));best=Math.min(best,Math.hypot(x-a[0]-dx*u,y-a[1]-dy*u));}return best;}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
async function repair(){
 const rig=JSON.parse(fs.readFileSync(path.join(dir,'rig.json'))),[w,h]=rig.sourceSize,layers=rig.layers,buffers=await Promise.all(layers.map(l=>sharp(path.join(base,l.file)).ensureAlpha().raw().toBuffer())),old=buffers.map(b=>Buffer.from(b)),paint=await sharp(path.resolve(dir,plateFile)).ensureAlpha().resize(w,h,{fit:'fill'}).raw().toBuffer(),source=await sharp(path.join(base,'source.png')).ensureAlpha().raw().toBuffer();
 const ai=layers.findIndex(l=>l.name==='shrimp_05_forearm_l'),hi=layers.findIndex(l=>l.name==='shrimp_05_head_chest'),arm=buffers[ai],head=buffers[hi],mask=Buffer.alloc(w*h*4),mark=p=>{mask[p]=mask[p+1]=mask[p+2]=mask[p+3]=255;};
 const pathPoints=[[757,532],[758,545],[767,557],[784,545],[806,546],[827,552],[845,554],[870,544]],oldPath=[[757,532],[845,554]];
 let removed=0,painted=0,hostAdded=0,sourceHeadRecovered=0;
 for(let y=510;y<=590;y++)for(let x=735;x<=875;x++){
  const p=(y*w+x)*4,d=nearest(x+.5,y+.5,pathPoints),oldD=nearest(x+.5,y+.5,oldPath),isRepair=oldD<17||d<13;if(!isRepair)continue;
  const transition=clamp((872-x)/18,0,1),alpha=Math.round(paint[p+3]*clamp((12-d)/3,0,1)),rgba=[paint[p],paint[p+1],paint[p+2],alpha];
  if(x<854&&arm[p+3])removed++;
  for(let c=0;c<4;c++)arm[p+c]=Math.round(old[ai][p+c]*(1-transition)+rgba[c]*transition);
  if(alpha>0)painted++;mark(p);
 }
 // The receiving chest patch is small and uses the real painted alpha contour;
 // abdomen gaps and all original distal pincer/foot strokes are untouched.
 for(let y=515;y<=557;y++)for(let x=739;x<=783;x++){
  const dx=(x-761)/22,dy=(y-535)/21,d=Math.hypot(dx,dy);if(d>=1)continue;const p=(y*w+x)*4,fade=clamp((1-d)*5,0,1),a=Math.round(paint[p+3]*fade);if(a<=head[p+3])continue;
  const gain=a-head[p+3];for(let c=0;c<3;c++)head[p+c]=Math.round((head[p+c]*head[p+3]+paint[p+c]*gain)/a);head[p+3]=a;mark(p);hostAdded++;
 }
 // Recover genuine head skin that the old thin-leg corridor had cut out.
 // An opened alpha silhouette rejects the original thin feet/feelers; only
 // original painted head material in this small receiving ROI is returned.
 const left=710,top=485,mw=100,mh=120,eroded=new Uint8Array(mw*mh);
 for(let yy=9;yy<mh-9;yy++)for(let xx=9;xx<mw-9;xx++){let yes=true;for(let dy=-9;dy<=9&&yes;dy++)for(let dx=-9;dx<=9;dx++)if(source[((top+yy+dy)*w+left+xx+dx)*4+3]<25){yes=false;break;}if(yes)eroded[yy*mw+xx]=1;}
 for(let y=518;y<=585;y++)for(let x=732;x<=790;x++){const p=(y*w+x)*4;if(source[p+3]<=head[p+3])continue;let yes=false;for(let dy=-11;dy<=11&&!yes;dy++)for(let dx=-11;dx<=11;dx++){const xx=x-left+dx,yy=y-top+dy;if(xx>=0&&yy>=0&&xx<mw&&yy<mh&&eroded[yy*mw+xx]){yes=true;break;}}if(!yes)continue;source.copy(head,p,p,p+4);mark(p);sourceHeadRecovered++;}
 let strayAlphaRemoved=0;
 for(let y=510;y<=615;y++)for(let x=710;x<=810;x++){
  const p=(y*w+x)*4,a=head[p+3],material=Math.max(source[p+3],paint[p+3]);if(!a||a>=200||material>=150)continue;
  const alpha=Math.round(a*material/150);if(alpha<a){head[p+3]=alpha;mark(p);strayAlphaRemoved++;}
 }
 const report={id:'shrimp_05',paintFile:plateFile,scope:'forearm_l hidden bridge and bounded receiving head/chest, no abdomen edits',rootPath:pathPoints,removedGrayBridgePixels:removed,paintedPixels:painted,hostAddedPixels:hostAdded,sourceHeadRecoveredPixels:sourceHeadRecovered,strayLowAlphaPixelsCleaned:strayAlphaRemoved,changedPixels:0,outsideApproved:0};
 for(const i of [ai,hi]){
  const l=layers[i],buf=buffers[i];let x0=w,y0=h,x1=-1,y1=-1,count=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=(y*w+x)*4;if(buf[p+3]>2){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);count++;}if(!buf.subarray(p,p+4).equals(old[i].subarray(p,p+4))){report.changedPixels++;if(!mask[p+3])report.outsideApproved++;}}
  l.bounds=[x0,y0,x1,y1];const left=Math.max(0,x0-8),top=Math.max(0,y0-8),width=Math.min(w,x1+9)-left,height=Math.min(h,y1+9)-top;l.bbox=[left,top,width,height];l.pixelCount=count;
  await sharp(buf,{raw:{width:w,height:h,channels:4}}).png().toFile(path.join(dir,l.file));await sharp(buf,{raw:{width:w,height:h,channels:4}}).extract({left,top,width,height}).png().toFile(path.join(dir,l.croppedFile));
 }
 layers[ai].rootRepair={...layers[ai].rootRepair,inner:[757,532],outer:[845,554],radius:9,paintFile:plateFile,extension:'R9 natural mottled ink upper-arm bridge, replacing old constant-gray geometric cap'};
 delete layers[ai].rootRepair.sourcePath; // Native paint guide lives in the audit report, not scaled rig fields.
 rig.artRevision='r9-strands-and-anterior-root';await sharp({create:{width:w,height:h,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers.map((l,i)=>({l,i})).sort((a,b)=>a.l.order-b.l.order).map(({l})=>({input:path.join(dir,l.file),left:0,top:0}))).png().toFile(path.join(dir,'assembled-restored.png'));
 await sharp(mask,{raw:{width:w,height:h,channels:4}}).png().toFile(path.join(dir,'restoration/r9-root-repair-mask.png'));fs.writeFileSync(path.join(dir,'restoration/r9-root-repair-report.json'),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(dir,'rig.json'),JSON.stringify(rig,null,2)+'\n');
 const strandReport=path.join(dir,'restoration/r9-strand-report.json');if(fs.existsSync(strandReport)){const audit=JSON.parse(fs.readFileSync(strandReport));audit.traceGenerationPreservedPNG=true;audit.pngPreserved=false;audit.subsequentLocalJointRepair='r9-root-repair-report.json';fs.writeFileSync(strandReport,JSON.stringify(audit,null,2)+'\n');}
 const cards=[];for(let i=0;i<layers.length;i++){const l=layers[i],tile=await sharp(path.join(dir,l.croppedFile)).resize(236,210,{fit:'contain',background:'#e9e4d8'}).png().toBuffer(),label=Buffer.from(`<svg width="256" height="32"><text x="8" y="22" font-family="Arial" font-size="14">${l.name.replace('shrimp_05_','')}</text></svg>`),card=await sharp({create:{width:256,height:256,channels:4,background:'#e9e4d8'}}).composite([{input:tile,left:10,top:35},{input:label,left:0,top:0}]).png().toBuffer();cards.push({input:card,left:i%4*256,top:Math.floor(i/4)*256});}await sharp({create:{width:1024,height:1024,channels:4,background:'#e9e4d8'}}).composite(cards).png().toFile(path.join(dir,'layers-preview.png'));
 if(report.outsideApproved)throw Error('Root paint escaped mask');console.log(JSON.stringify(report));return report;
}
module.exports={repair};if(require.main===module)repair().catch(e=>{console.error(e);process.exitCode=1});
