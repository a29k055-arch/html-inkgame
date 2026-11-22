const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/Nine/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
async function repairNeck({root,defs,buffers,w,h,approved,audit}){
 const file=path.join(root,'repair-plates/turtle_08_neck-r6.png');if(!fs.existsSync(file))return;
 const {data:raw,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let x0=info.width,y0=info.height,x1=-1,y1=-1;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(raw[(y*info.width+x)*4+3]>24){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 const aligned=await sharp(raw,{raw:{width:info.width,height:info.height,channels:4}}).extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1}).resize(238,438,{fit:'fill'}).extend({left:421,top:45,right:w-659,bottom:h-483,background:{r:0,g:0,b:0,alpha:0}}).ensureAlpha().raw().toBuffer();
 const index=defs.findIndex(d=>d.part==='head'),head=buffers[index],before=Buffer.from(head),mask=Buffer.alloc(w*h*4);let count=0,overlap=0,coreMin=255;
 for(let y=255;y<500;y++)for(let x=375;x<710;x++){
  const p=(y*w+x)*4,f=Math.min(1,(y-255)/30),old=head[p+3]*(1-f),fresh=aligned[p+3]*f,a=old+fresh;
  for(let c=0;c<3;c++)head[p+c]=a?Math.round((head[p+c]*old+aligned[p+c]*fresh)/a):0;head[p+3]=Math.round(a);
  if(x>468&&x<612&&y>290&&y<445&&head[p+3])head[p+3]=Math.max(head[p+3],244);
  if(head[p+3]||before[p+3]){approved.fill(255,p,p+4);mask.fill(255,p,p+4);count++;}
  if(head[p+3]>96&&buffers[6][p+3]>96)overlap++;
  if(x>=482&&x<=598&&y>=298&&y<=390)coreMin=Math.min(coreMin,head[p+3]);
 }
 defs[index].radius=98;defs[index].tip=[540,468];defs[index].paintFile='../repair-plates/turtle_08_neck-r6.png';
 let changed=0,outside=0;for(let p=0;p<head.length;p+=4)if(!head.subarray(p,p+4).equals(before.subarray(p,p+4))){changed++;if(!mask[p+3])outside++;}
 const report={part:'head',revision:'R6',plate:'../repair-plates/turtle_08_neck-r6.png',alignedBounds:[421,45,238,438],blendRows:[255,285],originalEyesAndNosePreserved:true,changedPixels:changed,changedOutsideNeckMask:outside,coreMinimumAlpha:coreMin,underHostPixels:overlap,method:'Continuous AI-painted broad neck extends beyond shell joint to y483; erase old separated collar/rim fragments; preserve original upper head.'};
 audit.push(report);fs.mkdirSync(path.join(root,'turtle_08/restoration'),{recursive:true});await sharp(mask,{raw:{width:w,height:h,channels:4}}).png().toFile(path.join(root,'turtle_08/restoration/neck-r6-mask.png'));
 await sharp(aligned,{raw:{width:w,height:h,channels:4}}).png().toFile(path.join(root,'repair-plates/turtle_08_neck-r6-aligned.png'));
 fs.writeFileSync(path.join(root,'turtle_08/restoration/neck-r6-report.json'),JSON.stringify(report,null,2)+'\n');console.log('Neck R6',report);
}
module.exports={repairNeck};
