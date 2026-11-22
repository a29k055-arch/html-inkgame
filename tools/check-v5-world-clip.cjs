const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.argv[2]||'http://127.0.0.1:4191/v5.html',out='work/v5-clip';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true}),report=[];
try{for(const mobile of [false,true])for(const fallback of [false,true]){
 const ctx=await b.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},deviceScaleFactor:2}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base);await p.waitForSelector('#loading[hidden]',{state:'attached'});
 const results=await p.evaluate(async fallback=>{
  const {PondEffects}=await import('./src-v5/reveal/pond-effects.js');const {LivingPainter,preloadLivingCreatures}=await import('./src-v5/ink/living-painter.js');const {RevealRun}=await import('./src-v5/reveal/run.js'),{RevealPainter}=await import('./src-v5/reveal/painter.js'),{createRevealRenderer}=await import('./src-v5/reveal/renderer.js'),{CometTrail}=await import('./src-v5/reveal/trail.js');
  const rows=[];for(const form of ['shrimp','dragon'])for(const world of [{width:2607,height:3910},{width:3910,height:1867}]){
   const run=new RevealRun(()=>{},{...world,aiCount:0,foodTarget:0,foodSpawnRate:0,initialItems:0,completionThreshold:2}),img=new Image();img.src=new URL('./assets/artworks/v4-cropped/1.png',location).href;await img.decode();const ground=new RevealPainter(img,run),canvas=document.createElement('canvas');document.body.append(canvas);const npcPainter=new LivingPainter({assets:await preloadLivingCreatures()});const r=createRevealRenderer(canvas,'balanced',{world,ground,TrailClass:CometTrail,npcPainter},fallback);run.player.form={species:form,remaining:5};run.player.effects[form==='shrimp'?'magnet':'dragon']=5;
   r.camera={x:-180,y:-160,scale:.55};r.cameraReady=true;run.player.x=10;run.player.y=10;run.player.r=120;run.player.vx=100;run.player.vy=60;run.mask.reveal(5,5,200,{kind:'skill'});run.mask.update(.6);
   run.arena.entities.push({...run.player,id:'edge-creature',form:undefined,species:'turtle',appearance:'living',skinIndex:1,v4Visual:true,growth:null,controller:{type:'ai',intent:'hunt',goal:{id:'human'},prey:run.player,profile:{}}});
   await npcPainter.prepare(run.arena.entities);for(let i=0;i<12;i++){npcPainter.update(1/60,run.arena,r.camera,{width:r.viewW,height:r.viewH,mobile:false});r.step(1/60,run.player);}r.drawStone(run.arena);
   r.beginWorldClip();r.ctx.save();r.ctx.translate(-r.camera.x*r.camera.scale,-r.camera.y*r.camera.scale);r.ctx.scale(r.camera.scale,r.camera.scale);r.drops.add({x:0,y:0,r:140,kind:'enemy'});r.drops.draw(r.ctx,.05,r.camera.scale);run.player.effects.magnet=3;run.player.effects.giant=3;run.arena.magnetField={active:true,reach:400};const fx=new PondEffects();fx.update(.1,run.arena,{width:r.viewW,height:r.viewH,camera:r.camera,mobile:false});fx.drawWorld(r.ctx,run.arena,r.camera.scale);r.ctx.restore();r.endWorldClip();r.drawTopItems(run.arena);r.drawWorldFrame();
   const im=r.ctx.getImageData(0,0,canvas.width,canvas.height),dpr=canvas.width/r.viewW,x0=-r.camera.x*r.camera.scale,y0=-r.camera.y*r.camera.scale,x1=x0+world.width*r.camera.scale,y1=y0+world.height*r.camera.scale;let outside=0,bad=0;
   for(let y=4;y<r.viewH-4;y+=4)for(let x=4;x<r.viewW-4;x+=4){if(x>=x0-4&&x<=x1+4&&y>=y0-4&&y<=y1+4)continue;outside++;const k=(Math.floor(y*dpr)*canvas.width+Math.floor(x*dpr))*4;if(im.data[k]!==231||im.data[k+1]!==223||im.data[k+2]!==204)bad++;}
   // An additional fullscreen marker proves externally drawn world effects share the clip.
   r.beginWorldClip();r.ctx.fillStyle='#ff00ff';r.ctx.fillRect(0,0,r.viewW,r.viewH);r.endWorldClip();const marker=r.ctx.getImageData(Math.floor(10*dpr),Math.floor(10*dpr),1,1).data;
   rows.push({form,world,fallback:r.fallback,targets:r.fluid.targets.length,outside,bad,marker:[...marker]});r.dispose();canvas.remove();
  }return rows;
 },fallback);
 for(const row of results){assert.equal(row.bad,0,'all world passes stay inside frame');assert(row.outside>0);assert.deepEqual(row.marker,[231,223,204,255]);assert.equal(row.fallback,fallback);if(!fallback)assert.equal(row.targets,12);}assert.deepEqual(errors,[]);report.push({mobile,fallback,results,errors});await ctx.close();
}}finally{await b.close();fs.writeFileSync(out+'/clip-report.json',JSON.stringify(report,null,2));}
console.log(JSON.stringify(report));})().catch(e=>{console.error(e);process.exitCode=1;});
