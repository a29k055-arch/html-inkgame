/* R8 bounded anatomy restoration. Always starts from the frozen R7 cutouts. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('C:/Users/Nine/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'dragon_04'),base=path.join(root,'backups/r8-dragon/dragon_04');
const plateFile='../repair-plates/dragon_04_joints-r8.png';
const roots=[
 {suffix:'leg_fl',outer:[454,528],inner:[533,520],tip:[539,519],radius:25,armTrace:[[405,526],[430,527],[454,528],[490,524],[533,520]],pruneFromX:410},
 {suffix:'leg_fr',outer:[617,526],inner:[535,520],tip:[529,519],radius:25,armTrace:[[660,520],[640,527],[617,526],[575,523],[535,520]],pruneFromX:655},
 {suffix:'leg_bl',outer:[485,992],inner:[579,986],tip:[585,985],radius:26,armTrace:[[435,1002],[461,1000],[485,992],[535,990],[579,986]],pruneFromX:440},
 {suffix:'leg_br',outer:[645,990],inner:[579,986],tip:[573,985],radius:25,armTrace:[[668,999],[645,990],[615,988],[579,986]],pruneFromX:665}
];
const horns={
 horn_l:[[490,230],[477,251],[452,253],[433,239],[413,237],[400,227],[390,232],[396,252],[416,280],[430,294],[409,300],[398,326],[378,334],[370,350],[403,355],[445,317],[483,311],[495,267]],
 horn_r:[[540,230],[554,252],[575,251],[596,235],[608,226],[626,230],[634,243],[624,261],[605,274],[620,284],[646,292],[661,304],[652,318],[624,313],[610,310],[622,326],[644,332],[659,345],[640,357],[609,342],[584,313],[548,305]]
};
const hornPaths={
 horn_l:[[[490,240],[470,255],[449,271],[431,283]],[[433,282],[414,273],[405,259],[403,234]],[[415,268],[420,252],[422,236]],[[431,283],[412,299],[393,309],[379,309]],[[431,283],[426,302],[419,323],[410,341]]],
 horn_r:[[[548,241],[569,258],[591,277],[603,285]],[[603,285],[618,269],[627,248],[631,235]],[[617,266],[612,251],[609,234]],[[603,285],[622,298],[644,309],[654,306]],[[603,285],[609,305],[614,325],[619,342]]]
};
const traces={
 whisker_l:[[496,133],[477,111],[458,119],[444,131],[430,146],[418,161],[401,176],[383,185],[364,189],[345,187],[327,184],[307,184],[288,187],[271,194],[258,207],[250,223],[244,245]],
 whisker_r:[[535,133],[546,105],[564,112],[578,128],[590,146],[606,161],[624,176],[644,187],[663,193],[681,193],[700,188],[720,183],[737,185],[751,195],[762,212],[770,231]]
};
function inside(x,y,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>y)!=(p[j][1]>y)&&x<(p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0])c=!c;return c;}
function segment(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;return{u:(x-a[0])*ux+(y-a[1])*uy,n:(x-a[0])*-uy+(y-a[1])*ux,L,ux,uy};}
function distTrace(x,y,trace){let best=Infinity;for(let i=1;i<trace.length;i++){const q=segment(x,y,trace[i-1],trace[i]),u=Math.max(0,Math.min(q.L,q.u));best=Math.min(best,Math.hypot(q.u-u,q.n));}return best;}
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const rig=JSON.parse(fs.readFileSync(path.join(base,'rig.json'))),[w,h]=rig.sourceSize;
 const source=await sharp(path.join(base,'source.png')).ensureAlpha().raw().toBuffer(),paint=await sharp(path.resolve(dir,plateFile)).ensureAlpha().resize(w,h,{fit:'fill'}).raw().toBuffer();
 const buffers=await Promise.all(rig.layers.map(l=>sharp(path.join(base,l.file)).ensureAlpha().raw().toBuffer())),old=buffers.map(b=>Buffer.from(b));
 const approved=Buffer.alloc(w*h*4),bodyMask=Buffer.alloc(w*h*4),rootMask=Buffer.alloc(w*h*4),bodyIndices=rig.layers.map((l,i)=>l.kind==='body'||['head','tail'].includes(l.kind)?i:-1).filter(i=>i>=0);
 const {makeCurve,projectPoint}=await import('../runtime/ink-creature.mjs');const curve=makeCurve(rig.spine);
 const bodyOwner=(x,y)=>{const s=Math.max(0,Math.min(1,projectPoint(curve,x,y).s));return bodyIndices.find(i=>s>=rig.layers[i].spineRange[0]&&s<rig.layers[i].spineRange[1])??bodyIndices.at(-1);};
 const mark=(p,mask=approved)=>{mask[p]=255;mask[p+1]=255;mask[p+2]=255;mask[p+3]=255;approved[p]=255;approved[p+1]=255;approved[p+2]=255;approved[p+3]=255;};
 function fillHost(x,y,rgba){const p=(y*w+x)*4,i=bodyOwner(x,y);for(const j of bodyIndices)buffers[j].fill(0,p,p+4);for(let c=0;c<4;c++)buffers[i][p+c]=rgba[c];mark(p,bodyMask);}
 function hostPixel(p){let a=0,r=0,g=0,b=0;for(const i of [...bodyIndices].sort((a,b)=>rig.layers[a].order-rig.layers[b].order)){const sa=buffers[i][p+3]/255;r=buffers[i][p]*sa+r*(1-sa);g=buffers[i][p+1]*sa+g*(1-sa);b=buffers[i][p+2]*sa+b*(1-sa);a=sa+a*(1-sa);}return a?[Math.round(r/a),Math.round(g/a),Math.round(b/a),Math.round(a*255)]:[0,0,0,0];}
 const report={version:8,sourceHash:hash(fs.readFileSync(path.join(base,'source.png'))),paintFile:plateFile,sourcePreserved:true,regions:[],horns:[],whiskers:[]};
 // Restore receiving torso skin around all four joints, including areas that the
 // earlier broad leg masks had incorrectly assigned to the moving cutouts.
 for(const r of roots){let hostPixels=0;const cy=r.inner[1],minY=Math.floor(cy-64),maxY=Math.ceil(cy+64);
  for(let y=minY;y<=maxY;y++)for(let x=Math.max(0,r.inner[0]-135);x<=Math.min(w-1,r.inner[0]+135);x++){
   const q=projectPoint(curve,x,y),d=Math.abs(q.t*curve.length),radius=cy<700?67:60,ey=Math.abs(y-cy),edge=Math.min(radius-d,64-ey);if(edge<=0)continue;
   const p=(y*w+x)*4,oldPixel=hostPixel(p),f=Math.min(1,edge/8),targetAlpha=Math.round(paint[p+3]*f);
   const alpha=Math.max(oldPixel[3],targetAlpha);if(alpha<=oldPixel[3])continue;
   const gain=alpha-oldPixel[3],rgba=[0,0,0,alpha];for(let c=0;c<3;c++)rgba[c]=Math.round((oldPixel[c]*oldPixel[3]+paint[p+c]*gain)/alpha);
   fillHost(x,y,rgba);hostPixels++;
  }
  const i=rig.layers.findIndex(l=>l.name.endsWith('_'+r.suffix)),layer=rig.layers[i],buf=buffers[i];let added=0,removed=0,recoveredSource=0;
  const recoverHost=(x,y,p)=>{const q=projectPoint(curve,x,y);if(Math.abs(q.t*curve.length)>60||source[p+3]<hostPixel(p)[3]+8)return;fillHost(x,y,[source[p],source[p+1],source[p+2],source[p+3]]);recoveredSource++;};
  // The old root cutout also owned a torso wedge BEFORE its nominal root.
  // Keep the anatomical arm corridor, not those side-of-body brush fragments.
  for(let y=Math.max(0,minY-16);y<=Math.min(h-1,maxY+16);y++)for(let x=280;x<770;x++){
   const inward=r.suffix.endsWith('l')?x>r.pruneFromX:x<r.pruneFromX;if(!inward||distTrace(x,y,r.armTrace)<=20)continue;
   const p=(y*w+x)*4;if(buf[p+3]){buf.fill(0,p,p+4);recoverHost(x,y,p);removed++;mark(p,rootMask);}
  }
  // Remove old rectangular torso tabs from each limb, then paint a complete
  // rounded upper arm through and beyond its hidden pivot.
  for(let y=Math.max(0,minY);y<=Math.min(h-1,maxY);y++)for(let x=Math.max(0,Math.min(r.outer[0],r.tip[0])-38);x<=Math.min(w-1,Math.max(r.outer[0],r.tip[0])+38);x++){
   const q=segment(x,y,r.outer,r.tip),p=(y*w+x)*4;
   if(q.u>4&&buf[p+3]){buf.fill(0,p,p+4);recoverHost(x,y,p);removed++;mark(p,rootMask);}
   const progress=Math.max(0,Math.min(1,q.u/q.L)),width=r.radius*(1-.55*progress),distance=Math.abs(q.n),fade=Math.min(1,(width-distance)/5,Math.max(0,(q.u+14)/14),Math.max(0,(q.L+8-q.u)/8));if(fade<=0)continue;
   // The paint plate provides gray arm texture; hidden roots deliberately do
   // not inherit the torso's black dorsal stripe.
   const hidden=hostPixel(p)[3]>180,rgba=[paint[p],paint[p+1],paint[p+2],Math.round(Math.min(248*fade,hidden?255:paint[p+3]))];const blend=Math.min(1,Math.max(0,(q.u+14)/18));
   if(q.u<4){for(let c=0;c<4;c++)rgba[c]=Math.round(buf[p+c]*(1-blend)+rgba[c]*blend);}
   for(let c=0;c<4;c++)buf[p+c]=rgba[c];added++;mark(p,rootMask);
  }
  layer.pivot=r.inner;layer.order=3;layer.rootRepair={outer:r.outer,inner:r.inner,innerTip:r.tip,radius:r.radius,paintFile:plateFile,extension:'R8 complete rounded painted upper arm extends past pivot beneath repaired torso',coverageMask:'restoration/r8-host-mask.png'};
  let overlap=0;for(let p=3;p<buf.length;p+=4)if(buf[p]>=200&&bodyIndices.some(j=>buffers[j][p]>=200))overlap++;
  report.regions.push({part:layer.name,hostPixels,recoveredSourceHostPixels:recoveredSource,rootPaintedPixels:added,removedTorsoTabPixels:removed,underHostPixels:overlap,...r});
 }
 // Re-extract the actual antler brush strokes from the original approved art,
 // instead of retaining the previous gray rectangular head/skin fragments.
 for(const [suffix,shape]of Object.entries(horns)){
  const i=rig.layers.findIndex(l=>l.name.endsWith('_'+suffix)),layer=rig.layers[i],buf=buffers[i];for(let p=0;p<buf.length;p+=4)if(buf[p+3])mark(p);buf.fill(0);let pixels=0,removedHostPixels=0;
  for(let y=220;y<365;y++)for(let x=suffix==='horn_l'?360:530;x<(suffix==='horn_l'?500:670);x++){
   if(!hornPaths[suffix].some((trace,j)=>distTrace(x+.5,y+.5,trace)<(j===0?16:11)))continue;const p=(y*w+x)*4,luma=(source[p]+source[p+1]+source[p+2])/3,atHead=suffix==='horn_l'?x>470:x<570;if(source[p+3]<=2||luma>(atHead?130:178))continue;
   source.copy(buf,p,p,p+4);mark(p);pixels++;
   for(const j of bodyIndices)if(buffers[j][p+3]){buffers[j].fill(0,p,p+4);removedHostPixels++;}
  }
  for(let p=0;p<buf.length;p+=4)if(old[i][p+3]&&!buf[p+3]&&source[p+3]>hostPixel(p)[3]){const x=p/4%w,y=Math.floor(p/4/w);fillHost(x,y,[source[p],source[p+1],source[p+2],source[p+3]]);}
  layer.kind='horn';layer.headAttachment=true;layer.order=11;layer.pivot=suffix==='horn_l'?[485,253]:[550,253];delete layer.rootRepair;layer.rigid=true;
  report.horns.push({part:layer.name,sourcePixels:pixels,removedHostPixels,rigid:true,headAttachment:true});
 }
 for(const [suffix,trace]of Object.entries(traces)){
  const i=rig.layers.findIndex(l=>l.name.endsWith('_'+suffix)),layer=rig.layers[i],buf=buffers[i];let removed=0;
  for(let y=70;y<170;y++)for(let x=450;x<575;x++){const p=(y*w+x)*4;if(buf[p+3]&&distTrace(x,y,trace)>4.5){buf.fill(0,p,p+4);if(source[p+3])fillHost(x,y,[source[p],source[p+1],source[p+2],source[p+3]]);mark(p);removed++;}}
  layer.pivot=trace[0];layer.headAttachment=true;layer.order=12;layer.strand={sourceTrace:trace,rootPinned:true,mode:'inertial-flexible-whisker',preserveSourceInk:true};
  report.whiskers.push({part:layer.name,sourceTrace:trace,removedHeadSkinPixels:removed});
 }
 // Two tiny inherited host-edge brush tabs become flat ears under a strong S bend.
 // Feather only the outer silhouette in these bounded ROIs; preserve all inner
 // pigment, dorsal ink and the already accepted moving claw images.
 const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
 function boundary(points,y){let i=0;while(i<points.length-2&&points[i+1][0]<y)i++;const a=points[Math.max(0,i-1)][1],b=points[i][1],c=points[i+1][1],d=points[Math.min(points.length-1,i+2)][1],t=Math.max(0,Math.min(1,(y-points[i][0])/(points[i+1][0]-points[i][0])));return .5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);}
 report.hostContourRefinements=[];
 for(const region of [
  {name:'tail-side inherited brush tab',roi:[390,1105,40,90],side:'left',mode:'source-contour',points:[[1105,414],[1120,418],[1140,419],[1155,419],[1170,418],[1195,418]]},
  {name:'hind-right receiving-edge tab',roi:[605,980,48,54],side:'right',points:[[980,636],[995,628],[1010,618],[1025,608],[1034,601]]}
 ]){
  const [left,top,width,height]=region.roi;let count=0;
  for(let y=top;y<top+height;y++)for(let x=left;x<left+width;x++){
   const edge=boundary(region.points,y),distance=region.side==='left'?x-edge:edge-x,fade=smooth((distance+2)/6),strength=smooth((y-top)/10)*smooth((top+height-y)/10),p=(y*w+x)*4;
   if(region.mode==='source-contour'){
    const oldPixel=hostPixel(p),rgba=oldPixel.map((v,c)=>Math.round(v*(1-strength)+source[p+c]*strength));if(rgba.some((v,c)=>v!==oldPixel[c])){if(!rgba[3])rgba.fill(0);fillHost(x,y,rgba);count++;}continue;
   }
   for(const i of bodyIndices){const before=buffers[i][p+3],after=Math.round(before*(1-strength+strength*fade));if(after!==before){buffers[i][p+3]=after;mark(p,bodyMask);count++;}}
  }
  report.hostContourRefinements.push({...region,changedPixels:count,method:region.mode==='source-contour'?'restore original selected-source alpha and pigment within ROI; no limb edits':'bounded feathered silhouette only; inner pigment and all claw layers retained'});
 }
 rig.headFrame={s:.065,rigidUntil:.14,blendUntil:.20};rig.artRevision='r8-dragon-joints-head-strands';rig.notes+=' R8: independent rigid antlers follow head frame; two independently deformable whiskers; four painted upper-arm underlaps and repaired receiving torso surfaces.';
 const audit=path.join(dir,'restoration');fs.mkdirSync(audit,{recursive:true});
 const write=(b,f)=>sharp(b,{raw:{width:w,height:h,channels:4}}).png().toFile(f);
 await write(approved,path.join(audit,'r8-approved-mask.png'));await write(bodyMask,path.join(audit,'r8-host-mask.png'));await write(rootMask,path.join(audit,'r8-root-mask.png'));
 const cards=[];let outside=0,changed=0;
 for(let i=0;i<rig.layers.length;i++){
  const l=rig.layers[i],buf=buffers[i];for(let p=0;p<buf.length;p+=4)if(!buf.subarray(p,p+4).equals(old[i].subarray(p,p+4))){changed++;if(!approved[p+3])outside++;}
  let x0=w,y0=h,x1=-1,y1=-1,count=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const a=buf[(y*w+x)*4+3];if(a>2){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}if(a)count++;}
  const left=Math.max(0,x0-8),top=Math.max(0,y0-8),width=Math.min(w,x1+9)-left,height=Math.min(h,y1+9)-top;l.bbox=[left,top,width,height];l.bounds=[x0,y0,x1,y1];l.pixelCount=count;
  await write(buf,path.join(dir,l.file));await sharp(buf,{raw:{width:w,height:h,channels:4}}).extract({left,top,width,height}).png().toFile(path.join(dir,l.croppedFile));
  const tile=await sharp(path.join(dir,l.croppedFile)).resize(236,210,{fit:'contain',background:'#ebe7d9'}).png().toBuffer(),label=Buffer.from(`<svg width="256" height="32"><rect width="256" height="32" fill="#ebe7d9"/><text x="8" y="22" font-family="Arial" font-size="14">${l.name.replace('dragon_04_','')} · ${l.kind}</text></svg>`);
  const card=await sharp({create:{width:256,height:256,channels:4,background:'#ebe7d9'}}).composite([{input:tile,left:10,top:35},{input:label,left:0,top:0}]).png().toBuffer();cards.push({input:card,left:i%4*256,top:Math.floor(i/4)*256});
 }
 const order=rig.layers.map((l,i)=>({l,i})).sort((a,b)=>a.l.order-b.l.order);await sharp({create:{width:w,height:h,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(order.map(({l})=>({input:path.join(dir,l.file),left:0,top:0}))).png().toFile(path.join(dir,'assembled-restored.png'));
 await sharp({create:{width:1024,height:1024,channels:4,background:'#ebe7d9'}}).composite(cards).png().toFile(path.join(dir,'layers-preview.png'));
 report.changedLayerPixels=changed;report.changedOutsideApprovedMask=outside;if(outside)throw Error('Unapproved changes '+outside);
 fs.writeFileSync(path.join(audit,'r8-repair-report.json'),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(dir,'rig.json'),JSON.stringify(rig,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
