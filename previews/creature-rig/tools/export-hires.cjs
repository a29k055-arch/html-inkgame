/* Export reproducible 4K authoring masters from the working cutout package.
   A larger pixel canvas improves sampling; it does not invent native detail. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('C:/Users/Nine/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),ids=process.argv.slice(2);
const vec=(v,sx,sy)=>Array.isArray(v)?[v[0]*sx,v[1]*sy]:v;
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
async function continuousBody(rig,dir,dest,W,H){
 const species=rig.id.split('_')[0],[width,height]=rig.sourceSize;
 const layers=[...rig.layers].sort((a,b)=>(a.order??0)-(b.order??0)).filter(l=>l.kind==='body'||['head','tail'].includes(l.kind)&&species!=='turtle');
 const native=await sharp({create:{width,height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers.map(l=>({input:path.join(dir,l.file),left:0,top:0}))).png().toBuffer();
 await sharp(native).resize(W,H,{kernel:'lanczos3',fit:'fill'}).png({compressionLevel:9}).toFile(path.join(dest,'continuous-body.png'));
}
async function exportOne(id){
 const dir=path.join(root,id),input=path.join(dir,'rig.json');if(!fs.existsSync(input))return null;
 const rig=JSON.parse(fs.readFileSync(input)),[w,h]=rig.sourceSize,s=4096/Math.max(w,h),W=Math.round(w*s),H=Math.round(h*s),sx=W/w,sy=H/h;
 const dest=path.join(root,'masters',id);fs.mkdirSync(path.join(dest,'textures'),{recursive:true});fs.mkdirSync(path.join(dest,'aligned'),{recursive:true});
 const fingerprint=crypto.createHash('sha256').update('master-schema-3').update(fs.readFileSync(input));for(const l of rig.layers)fingerprint.update(hash(path.join(dir,l.file)));fingerprint.update(hash(path.join(dir,'source.png')));const signature=fingerprint.digest('hex'),stamp=path.join(dest,'export.json');
 if(fs.existsSync(stamp)&&JSON.parse(fs.readFileSync(stamp)).signature===signature){
  const cached=JSON.parse(fs.readFileSync(stamp)),rigPath=path.join(dest,'rig.json'),master=JSON.parse(fs.readFileSync(rigPath));
  if(master.bodyTexture!=='continuous-body.png'||cached.bodyTextureSignature!==signature||!fs.existsSync(path.join(dest,'continuous-body.png'))){
   await continuousBody(rig,dir,dest,W,H);master.bodyTexture='continuous-body.png';cached.bodyTextureSignature=signature;
   fs.writeFileSync(rigPath,JSON.stringify(master,null,2)+'\n');fs.writeFileSync(stamp,JSON.stringify(cached,null,2)+'\n');
  }
  console.log(id,'4K export ready');return cached.resolution;
 }
 const scaled={...rig,id,source:`../../${id}/source.png`,sourceFile:`../../${id}/source.png`,sourceSize:[W,H],spine:rig.spine.map(p=>vec(p,sx,sy)),nominalLength:rig.nominalLength*s,layers:[],notes:'4K alpha-aware Lanczos3 supersampled raster master; native detail resolution is recorded separately. Cropped file+global bbox are authoritative. Local aligned/ copies are supplied for authoring. Original reference is shared with the working package; runtime scales it to the logical canvas.'};
 const resize=async(src,dst)=>sharp(src).ensureAlpha().resize(W,H,{kernel:'lanczos3',fit:'fill'}).png({compressionLevel:9}).toFile(dst);
 await resize(path.join(dir,'source.png'),path.join(dest,'source.png'));
 const composites=[];
 for(const l of rig.layers){
  const aligned=path.join(dest,'aligned',l.file);await resize(path.join(dir,l.file),aligned);
  const {data}=await sharp(aligned).ensureAlpha().raw().toBuffer({resolveWithObject:true});let x0=W,y0=H,x1=-1,y1=-1;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(data[(y*W+x)*4+3]>2){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  if(x1<0)throw Error(id+' empty master layer '+l.name);
  const pad=12,left=Math.max(0,x0-pad),top=Math.max(0,y0-pad),right=Math.min(W,x1+pad+1),bottom=Math.min(H,y1+pad+1),bbox=[left,top,right-left,bottom-top],file='textures/'+path.basename(l.file);
  await sharp(aligned).extract({left,top,width:bbox[2],height:bbox[3]}).png({compressionLevel:9}).toFile(path.join(dest,file));
  const rootRepair=l.rootRepair?{...l.rootRepair,outer:vec(l.rootRepair.outer,sx,sy),inner:vec(l.rootRepair.inner,sx,sy),...(l.rootRepair.innerTip?{innerTip:vec(l.rootRepair.innerTip,sx,sy)}:{}),...(l.rootRepair.paintFile?{paintFile:path.posix.relative('masters/'+id,path.posix.normalize(id+'/'+l.rootRepair.paintFile))}:{}),...(l.rootRepair.coverageMask?{coverageMask:path.posix.relative('masters/'+id,path.posix.normalize(id+'/'+l.rootRepair.coverageMask))}:{}),radius:(l.rootRepair.radius||0)*s}:undefined;
  const strand=l.strand?{...l.strand,...(l.strand.sourceTrace?{sourceTrace:l.strand.sourceTrace.map(p=>vec(p,sx,sy))}:{})}:undefined;
  scaled.layers.push({...l,file,croppedFile:file,bbox,bounds:[x0,y0,x1,y1],pivot:vec(l.pivot,sx,sy),...(rootRepair?{rootRepair}:{}),...(strand?{strand}:{}),fileLayout:'cropped-with-global-bbox',authoringAlignedFile:'aligned/'+l.file});
  composites.push({order:l.order||0,input:aligned,left:0,top:0});
 }
 const assembled=path.join(dir,'assembled-restored.png');
 if(fs.existsSync(assembled))await resize(assembled,path.join(dest,'assembled-restored.png'));
 else await sharp({create:{width:W,height:H,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(composites.sort((a,b)=>a.order-b.order).map(({order,...c})=>c)).png({compressionLevel:9}).toFile(path.join(dest,'assembled-restored.png'));
 const native=rig.resolution?.nativeSize||rig.resolution?.originalSize||rig.sourceNativeSize||[w,h];
 const resolution={id,nativeSize:native,workingSize:[w,h],masterSize:[W,H],masterRig:`masters/${id}/rig.json`,masterPreview:`masters/${id}/assembled-restored.png`,masterType:'Lanczos3 alpha-aware supersampled raster',recommendedCssLongEdgeAtDpr2:Math.floor(Math.max(...native)/2),smoothPreviewCssLongEdgeAtDpr2:2048,notes:'4K导出改善边缘采样；原画细节上限取决于原始像素。透明PNG属于位图。'};
 await continuousBody(rig,dir,dest,W,H);scaled.bodyTexture='continuous-body.png';
 scaled.resolution=resolution;fs.writeFileSync(path.join(dest,'rig.json'),JSON.stringify(scaled,null,2)+'\n');fs.writeFileSync(stamp,JSON.stringify({signature,bodyTextureSignature:signature,resolution},null,2)+'\n');console.log(id,W+'x'+H,rig.layers.length,'master layers');return resolution;
}
(async()=>{const list=ids.length?ids:JSON.parse(fs.readFileSync(path.join(root,'manifest.json'))).creatures.map(c=>c.id);const assets=[];for(const id of list){const r=await exportOne(id);if(r)assets.push(r);}const previous=path.join(root,'RESOLUTIONS.json'),old=fs.existsSync(previous)?JSON.parse(fs.readFileSync(previous)).assets:[];const map=new Map(old.map(a=>[a.id,a]));for(const a of assets)map.set(a.id,a);fs.writeFileSync(previous,JSON.stringify({version:1,defaultRuntime:'working',assets:[...map.values()]},null,2)+'\n');})().catch(e=>{console.error(e);process.exitCode=1});
