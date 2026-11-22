const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/Nine/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),id='turtle_08',dir=path.join(root,id);
function seg(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L;return{u:(x-a[0])*ux+(y-a[1])*uy,n:-(x-a[0])*uy+(y-a[1])*ux,L};}
const defs=[
 {part:'head',kind:'head',outer:[540,320],pivot:[540,410],radius:76,side:0},
 {part:'leg_fl',kind:'leg',outer:[295,466],pivot:[392,550],tip:[465,640],radius:78,side:-1},
 {part:'leg_fr',kind:'leg',outer:[789,466],pivot:[694,550],tip:[620,640],radius:78,side:1},
 {part:'leg_bl',kind:'leg',outer:[300,1130],pivot:[400,1060],tip:[470,1000],radius:76,side:-1},
 {part:'leg_br',kind:'leg',outer:[786,1130],pivot:[686,1060],tip:[620,1000],radius:76,side:1},
 {part:'tail',kind:'tail',outer:[540,1230],pivot:[540,1160],radius:34,side:0},
 {part:'shell',kind:'body',pivot:[540,800],side:0}
];
async function main(){
 const {data:source,info}=await sharp(path.join(dir,'source.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true}),w=info.width,h=info.height,N=w*h;
 const shellFile=path.join(root,'repair-plates/turtle_08_shell.png'),legsFile=path.join(root,'repair-plates/turtle_08_legs.png');
 const shellCrop=await sharp(shellFile).trim({threshold:5}).resize(755,909,{fit:'fill'}).extend({left:161,top:329,right:w-916,bottom:h-1238,background:{r:0,g:0,b:0,alpha:0}}).ensureAlpha().raw().toBuffer();
 const legs=await sharp(legsFile).resize(w,h,{fit:'fill'}).ensureAlpha().raw().toBuffer();
 const buffers=defs.map(()=>Buffer.alloc(source.length)),approved=Buffer.alloc(source.length),depth=new Float32Array(N);
 for(let i=0;i<N;i++)depth[i]=shellCrop[i*4+3]>24?1e5:0;
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){let z=y*w+x;depth[z]=Math.min(depth[z],depth[z-1]+1,depth[z-w]+1,depth[z-w-1]+1.414,depth[z-w+1]+1.414);}
 for(let y=h-2;y>0;y--)for(let x=w-2;x>0;x--){let z=y*w+x;depth[z]=Math.min(depth[z],depth[z+1]+1,depth[z+w]+1,depth[z+w-1]+1.414,depth[z+w+1]+1.414);}
 // Original pigment owns the visible outer feet, head, tail, and inner shell.
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){let p=(y*w+x)*4;if(!source[p+3])continue;let li;
  if(shellCrop[p+3]>24)li=6;
  else if(y<365&&x>400&&x<685)li=0;
  else if(y>1190&&Math.abs(x-540)<79)li=5;
  else {
   const candidates=[{i:1,a:[220,400],b:[295,466]},{i:2,a:[864,400],b:[789,466]},{i:3,a:[225,1190],b:[300,1130]},{i:4,a:[861,1190],b:[786,1130]}];
   for(const c of candidates){const q=seg(x,y,c.a,c.b);if(q.u> -180&&q.u<q.L+22&&Math.abs(q.n)<78){li=c.i;break;}}
  }
  if(li===undefined){approved.fill(255,p,p+4);continue;}source.copy(buffers[li],p,p,p+4);
 }
 // Close the entire independent oval shell rim, blend to source inner scutes.
 for(let p=0;p<source.length;p+=4){if(!shellCrop[p+3])continue;const d=depth[p/4],f=Math.min(1,Math.max(0,(52-d)/20));if(!f)continue;for(let c=0;c<4;c++)buffers[6][p+c]=Math.round(buffers[6][p+c]*(1-f)+shellCrop[p+c]*f);if(d>3)buffers[6][p+3]=Math.max(244,buffers[6][p+3]);approved.fill(255,p,p+4);}
 const audit=[];
 for(let li=0;li<6;li++){const d=defs[li],buf=buffers[li],leg=d.kind==='leg',end=d.tip||d.pivot;let count=0,overlap=0;
  if(leg)buf.fill(0);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   if(leg&&((li===1||li===3)!==(x<540)||(li===1||li===2)!==(y<790)))continue;
   if(leg){const p=(y*w+x)*4;if(!legs[p+3])continue;legs.copy(buf,p,p,p+4);approved.fill(255,p,p+4);count++;if(buffers[6][p+3]>96)overlap++;continue;}
   const q=seg(x,y,d.outer,end);if(q.u< -35||q.u>q.L+d.radius*.7||Math.abs(q.n)>d.radius)continue;
   const p=(y*w+x)*4,f=Math.min(1,Math.max(0,(q.u+35)/42));if(!f)continue;
   let rgba;if(leg)rgba=[legs[p],legs[p+1],legs[p+2],legs[p+3]];
   else {const along=Math.max(0,Math.min(q.L,q.u)),dist=Math.hypot(q.u-along,q.n),fade=Math.min(1,Math.max(0,(d.radius-dist)/8));if(!fade||!shellCrop[p+3])continue;rgba=[source[p]||130,source[p+1]||125,source[p+2]||120,Math.round(245*fade)];}
   const old=buf[p+3]*(1-f),fresh=rgba[3]*f,alpha=old+fresh;if(!alpha&&!buf[p+3])continue;
   for(let c=0;c<3;c++)buf[p+c]=alpha?Math.round((buf[p+c]*old+rgba[c]*fresh)/alpha):0;buf[p+3]=Math.round(alpha);approved.fill(255,p,p+4);if(buf[p+3]){count++;if(buffers[6][p+3]>96)overlap++;}
  }
  audit.push({part:d.part,paintedPixels:count,underHostPixels:overlap,pivot:d.pivot,hiddenTip:end});
 }
 await require('./turtle08-neck-r6.cjs').repairNeck({root,defs,buffers,w,h,approved,audit});
 fs.mkdirSync(path.join(dir,'textures'),{recursive:true});fs.mkdirSync(path.join(dir,'restoration'),{recursive:true});
 const layers=[],cards=[];for(let i=0;i<defs.length;i++){
  const d=defs[i],buf=buffers[i],file=id+'_'+d.part+'.png';await sharp(buf,{raw:{width:w,height:h,channels:4}}).png().toFile(path.join(dir,file));
  let x0=w,y0=h,x1=-1,y1=-1,count=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(buf[(y*w+x)*4+3]>2){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);count++;}
  const left=Math.max(0,x0-8),top=Math.max(0,y0-8),right=Math.min(w,x1+9),bottom=Math.min(h,y1+9),bbox=[left,top,right-left,bottom-top],croppedFile='textures/'+file;
  await sharp(buf,{raw:{width:w,height:h,channels:4}}).extract({left,top,width:bbox[2],height:bbox[3]}).png().toFile(path.join(dir,croppedFile));
  layers.push({name:id+'_'+d.part,file,croppedFile,bbox,bounds:[x0,y0,x1,y1],pixelCount:count,kind:d.kind,pivot:d.pivot,side:d.side,phase:i*.7,order:i===6?6:3,...(i<6?{rootRepair:{outer:d.outer,inner:d.pivot,radius:d.radius,innerTip:d.tip||d.pivot,paintFile:d.paintFile||(d.kind==='leg'?'../repair-plates/turtle_08_legs.png':'source.png'),extension:'Complete long proximal underlap below closed shell'}}:{spineRange:[0,1]})});
  const tile=await sharp(path.join(dir,croppedFile)).resize(240,212,{fit:'contain',background:'#e8e3d6'}).png().toBuffer(),label=Buffer.from(`<svg width="256" height="36"><text x="9" y="24" font-size="16">${d.part}</text></svg>`);cards.push({input:await sharp({create:{width:256,height:256,channels:4,background:'#e8e3d6'}}).composite([{input:tile,left:8,top:40},{input:label,left:0,top:0}]).png().toBuffer(),left:i%4*256,top:Math.floor(i/4)*256});
 }
 await sharp({create:{width:1024,height:512,channels:4,background:'#e8e3d6'}}).composite(cards).png().toFile(path.join(dir,'layers-preview.png'));
 await sharp({create:{width:w,height:h,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers.slice().sort((a,b)=>a.order-b.order).map(l=>({input:path.join(dir,l.file)}))).png().toFile(path.join(dir,'assembled-restored.png'));
 await sharp(approved,{raw:{width:w,height:h,channels:4}}).png().toFile(path.join(dir,'restoration/approved-repair-region.png'));
 const spine=[[540,95],[540,260],[540,390],[540,600],[540,850],[540,1090],[540,1230],[540,1340]],nominalLength=1245;
 const rig={version:3,id,source:'source.png',sourceSize:[w,h],spine,nominalLength,layers,resolution:{nativeSize:[w,h],workingSize:[w,h],nativeOrigin:'New reference-guided AI ink painting, actual output pixels; no native 4K claim'},restoration:{status:'applied',newArt:true,roots:audit,method:'Independent complete shell and reference-pose repainted long legs; original head/tail with hidden extensions'},notes:'New top-down ink turtle08. Shell stable, four individually attached long underlap limbs; original approval turtle02 retained separately.'};
 fs.writeFileSync(path.join(dir,'rig.json'),JSON.stringify(rig,null,2)+'\n');fs.writeFileSync(path.join(dir,'restoration/restoration-report.json'),JSON.stringify(rig.restoration,null,2)+'\n');console.log(id,w,h,layers.length,'layers',audit);
}
main().catch(e=>{console.error(e);process.exitCode=1});
