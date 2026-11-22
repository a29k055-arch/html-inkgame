import {HeroInkFluid,HeroInkBody} from './hero-ink.js';
import {InkFluid as NativeInkFluid} from '../../visual-effects/reference-2d00e16/src/fluid.js';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),valid=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
export const LIVING_INK_PROFILES=Object.freeze({
 fish:Object.freeze({samples:[.035,.35,.68,.98],widths:[.38,.66,.47,.20],rates:[3.5,5,4.5,3],decay:.30,maxEmitters:24,budget:16}),
 dragon:Object.freeze({samples:[.025,.30,.65,.99],widths:[.38,.55,.48,.16],rates:[4,6,7,5],decay:.28,maxEmitters:28,budget:22}),
 turtle:Object.freeze({samples:[.05,.35,.70,.98],widths:[.32,.60,.55,.22],rates:[.6,1,.9,.5],decay:.40,maxEmitters:16,budget:3})
});
export function sampleLivingSpine(spine,s){const rows=(spine||[]).map(p=>Array.isArray(p)?{x:p[0],y:p[1]}:p).filter(valid);if(rows.length<2)return null;const at=clamp(s)*(rows.length-1),i=Math.min(rows.length-2,Math.floor(at)),u=at-i,a=rows[i],b=rows[i+1];return{x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u};}
export function livingWorldToUV(p,c){return{x:(p.x-c.x)*c.scale/c.width,y:(p.y-c.y)*c.scale/c.height};}
function sectionEmitters(sections,form){
 const p=LIVING_INK_PROFILES[form],count=Math.min(sections.length,Math.floor(p.maxEmitters/2)),rows=[];
 for(let i=0;i<count;i++){
  const at=Math.round(i*(sections.length-1)/Math.max(1,count-1)),a=sections[at],b=sections[Math.max(0,at-1)],c=sections[Math.min(sections.length-1,at+1)],dx=c.x-b.x,dy=c.y-b.y,n=Math.hypot(dx,dy)||1,nx=-dy/n,ny=dx/n,r=Math.max(.1,a.r),s=Number.isFinite(a.s)?a.s:at/Math.max(1,sections.length-1),weight=Math.sqrt(r)*(.60+.40*Math.sin(Math.PI*s));
  // Paired sources cover the measured cross-section. No source uses the large
  // logical ink-ball radius; the emitting silhouette follows the actual animal.
  for(const sign of [-1,1])rows.push({x:a.x+nx*r*.42*sign,y:a.y+ny*r*.42*sign,radius:r*.64,rate:weight,s,side:sign,normal:{x:nx*sign,y:ny*sign}});
 }
 const sum=rows.reduce((n,a)=>n+a.rate,0);for(const row of rows)row.rate*=p.budget/Math.max(.00001,sum);return rows;
}
export function livingEmitters(spine,radius,form){
 const p=LIVING_INK_PROFILES[form];if(!p||!(spine?.length>1))return[];const n=Math.floor(p.maxEmitters/2),sections=[];
 for(let i=0;i<n;i++){const s=p.samples[0]+(p.samples.at(-1)-p.samples[0])*i/(n-1);let j=0;while(j<p.samples.length-2&&s>p.samples[j+1])j++;const t=clamp((s-p.samples[j])/(p.samples[j+1]-p.samples[j]));sections.push({...sampleLivingSpine(spine,s),r:radius*(p.widths[j]+(p.widths[j+1]-p.widths[j])*t),s});}return sectionEmitters(sections,form);
}
export function livingShapeEmitters(body,center,pose,form,radius){
 if(body?.species===form&&body.sections?.length>1){const sections=body.sections.filter(p=>valid(p)&&Number.isFinite(p.r)&&p.r>0).map(p=>({...p,x:center.x+p.x,y:center.y+p.y}));if(sections.length>1)return sectionEmitters(sections,form);}
 return livingEmitters(pose.spine||[],pose.worldRadius||pose.renderRadius||radius,form);
}
const vertex=`#version 300 es
layout(location=0) in vec2 a;out vec2 uv;void main(){uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}`;
const fragment=`#version 300 es
precision highp float;in vec2 uv;out vec4 o;uniform sampler2D field,density;uniform vec4 anchors[32],drifts[32];uniform vec2 previousPoints[32];uniform int count;uniform float aspect,dt,velocityMode,activity;uniform vec2 texel,worldOrigin,worldExtent;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
void main(){vec4 old=texture(field,uv);float pigment=0.,nearBody=0.,total=0.,wetWidth=0.;vec2 carried=vec2(0.);vec2 world=worldOrigin+vec2(uv.x,1.-uv.y)*worldExtent;float paper=.6*noise(world*.045)+.4*noise(world*.113+vec2(17.,9.));
for(int i=0;i<32;i++){if(i>=count)break;if(velocityMode>.5&&(i/2)%2!=0)continue;vec2 d=uv-anchors[i].xy;d.x*=aspect;vec2 path=previousPoints[i]-anchors[i].xy;path.x*=aspect;float at=clamp(dot(d,path)/max(dot(path,path),.00000001),0.,1.);d-=path*at;float r=max(anchors[i].z,.000001),weight=exp(-dot(d,d)/(r*r));nearBody=max(nearBody,exp(-dot(d,d)/(r*r*6.25)));pigment+=weight*anchors[i].w*(.58+.65*paper);total+=weight;wetWidth+=weight*r;vec2 shear=vec2(-d.y/aspect,d.x)/texel*(i%2==0?-1.:1.)*.7*(.4+paper)*activity;carried+=weight*(drifts[i].xy+drifts[i].zw*(.3+.7*paper)+shear);}
if(velocityMode>.5){float wet=max(smoothstep(.015,.5,texture(density,uv).z),.06*activity);vec2 target=carried/max(total,.00001);old.xy+=(target-old.xy)*min(1.,dt*4.0)*wet*min(1.,total);vec2 n=world*.10;vec2 curl=vec2(noise(n+vec2(0.,.16))-noise(n-vec2(0.,.16)),-noise(n+vec2(.16,0.))+noise(n-vec2(.16,0.)));old.xy+=curl*dt*(wetWidth/max(total,.00001))/texel.y*18.*activity*min(1.,total);old.xy=clamp(old.xy,vec2(-650.),vec2(650.));}
else{float dense=smoothstep(.7,2.8,old.z),outside=1.-nearBody;float dilute=(texture(field,uv+vec2(texel.x,0.)).z+texture(field,uv-vec2(texel.x,0.)).z+texture(field,uv+vec2(0.,texel.y)).z+texture(field,uv-vec2(0.,texel.y)).z)*.25;old.z=mix(old.z,dilute,min(1.,dt*.8*outside));old.z*=exp(-dt*outside*(.20+dense*.95+(1.-activity)*.8));old.z+=dt*pigment;}o=old;}`;
function shapeProgram(f){
 if(f.livingShapeProgram)return f.livingShapeProgram;const g=f.gl,compile=(type,src)=>{const s=g.createShader(type);g.shaderSource(s,src);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS)){const error=g.getShaderInfoLog(s);g.deleteShader(s);throw Error(error);}return s;},p=g.createProgram(),v=compile(g.VERTEX_SHADER,vertex),s=compile(g.FRAGMENT_SHADER,fragment);g.attachShader(p,v);g.attachShader(p,s);g.linkProgram(p);g.deleteShader(v);g.deleteShader(s);if(!g.getProgramParameter(p,g.LINK_STATUS))throw Error(g.getProgramInfoLog(p));f.livingShapeProgram=p;f.livingShapeUniforms=Object.fromEntries(['field','density','anchors[0]','drifts[0]','previousPoints[0]','count','aspect','dt','velocityMode','activity','texel','worldOrigin','worldExtent'].map(k=>[k,g.getUniformLocation(p,k)]));f.livingShapeData=new Float32Array(128);f.livingDriftData=new Float32Array(128);f.livingPreviousData=new Float32Array(64);return p;
}
export class LivingInkFluid extends HeroInkFluid {
 prepareCloud(){const result=super.prepareCloud();shapeProgram(this);return result;}
 dispose(){if(this.livingShapeProgram){this.gl.deleteProgram(this.livingShapeProgram);this.livingShapeProgram=null;}super.dispose();}
 motionProfile(){const base=super.motionProfile(),form=this.livingForm;if(!form)return base;const ratio=Number.isFinite(this.sourceMotionRatio)?this.sourceMotionRatio:this.relativeMotion||0,rest=1-clamp((ratio-.015)/.15),profile=LIVING_INK_PROFILES[form];return{...base,solidBody:false,adaptive:false,bigBody:0,swingBody:0,restoredFlow:true,wakeFloor:0,fluidity:0,vorticity:1.45,decay:(profile?.decay||.3)*(1-rest)+1.75*rest,tailFade:0};}
 inject(ink){if(!this.livingForm)return super.inject(ink);if(this.livingForm==='shrimp'||!ink.living)return;return NativeInkFluid.prototype.inject.call(this,ink);}
 pass(name,target,uniforms={}){if(name==='display'&&this.livingForm)return NativeInkFluid.prototype.pass.call(this,name,target,{...uniforms,sizeBoundary:0});return super.pass(name,target,uniforms);}
 feedLivingShape(anchors,{camera,velocity,dt,activity,previous=[]}){
  if(!this.gl){for(const a of anchors){const p=livingWorldToUV(a,camera);if(activity)this.inject({living:true,x:p.x,y:p.y,radius:a.radius*camera.scale/camera.height,intensity:a.rate*dt*activity});}return;}
  const g=this.gl,p=shapeProgram(this),u=this.livingShapeUniforms,count=Math.min(32,anchors.length),data=this.livingShapeData,drifts=this.livingDriftData,trace=this.livingPreviousData;
  for(let i=0;i<count;i++){const a=anchors[i],uv=livingWorldToUV(a,camera),old=previous[i],localMix=this.livingForm==='dragon'?.36:this.livingForm==='fish'?.20:.12,limit=Math.max(25,Math.hypot(velocity.x,velocity.y)*1.6),local=old&&dt>0?{x:clamp((a.x-old.x)/dt-velocity.x,-limit,limit),y:clamp((a.y-old.y)/dt-velocity.y,-limit,limit)}:{x:0,y:0};data.set([uv.x,1-uv.y,a.radius*camera.scale/camera.height,a.rate*activity],i*4);const prevUV=old&&Math.hypot(old.x-a.x,old.y-a.y)<Math.max(a.radius*4,Math.hypot(velocity.x,velocity.y)*dt*4)?livingWorldToUV(old,camera):uv;trace.set([prevUV.x,1-prevUV.y],i*2);const outward=a.normal||{x:0,y:1};drifts.set([(velocity.x*.22+local.x*localMix)*camera.scale/camera.width*this.w,(-velocity.y*.22-local.y*localMix)*camera.scale/camera.height*this.h,outward.x*a.radius*camera.scale/camera.width*this.w*3.0*activity,-outward.y*a.radius*camera.scale/camera.height*this.h*3.0*activity],i*4);}
  g.useProgram(p);g.bindVertexArray(this.vao);g.bindBuffer(g.ARRAY_BUFFER,this.buffer);g.viewport(0,0,this.w,this.h);g.uniform4fv(u['anchors[0]'],data);g.uniform4fv(u['drifts[0]'],drifts);g.uniform2fv(u['previousPoints[0]'],trace);g.uniform1i(u.count,count);g.uniform1f(u.aspect,this.aspect);g.uniform1f(u.dt,dt);g.uniform1f(u.activity,activity);g.uniform2f(u.texel,1/this.w,1/this.h);g.uniform2f(u.worldOrigin,camera.x,camera.y);g.uniform2f(u.worldExtent,camera.width/camera.scale,camera.height/camera.scale);g.uniform1i(u.field,0);g.uniform1i(u.density,1);
  for(const [pair,mode]of [[this.d,0],[this.v,1]]){g.bindFramebuffer(g.FRAMEBUFFER,pair.write.f);g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,pair.read.t);g.activeTexture(g.TEXTURE1);g.bindTexture(g.TEXTURE_2D,this.d.read.t);g.uniform1f(u.velocityMode,mode);g.drawArrays(g.TRIANGLE_STRIP,0,4);pair.swap();}
 }
}
export class LivingInkBody extends HeroInkBody {
 reset(){super.reset();this.formBefore=undefined;this.previousAnchors=[];this.formSeeded=false;}
 splash(entity,strength=1){if(!this.fluid.livingForm)return super.splash(entity,strength);}
 update(entity,dt){
  const f=this.fluid,form=f.livingForm||null;if(this.formBefore!==form){if(this.formBefore!==undefined||form){f.clear();f.livingClearCount=(f.livingClearCount||0)+1;super.reset();}this.previousAnchors=[];this.formSeeded=false;this.formBefore=form;}
  if(!form){f.livingInkMetrics={form:null,emitters:0,clears:f.livingClearCount||0};return super.update(entity,dt);}this.canvas.hidden=true;this.time+=dt;
  if(form==='shrimp'){f.core=null;f.livingInkMetrics={form,emitters:0,anchors:[],activity:0,clears:f.livingClearCount||0};return;}
  const profile=LIVING_INK_PROFILES[form];if(!profile)return;const camera=f.livingCamera||{},viewW=camera.width||globalThis.innerWidth||1200,viewH=camera.height||globalThis.innerHeight||900,cam={x:camera.x||0,y:camera.y||0,scale:camera.scale||1,width:viewW,height:viewH},pose=f.livingPose||{},hasPose=(pose.spine||[]).length>=2,
   coreUV=f.solidCore?.radius||this.radius(entity)*.48,worldRadius=pose.worldRadius||pose.renderRadius||coreUV*viewH/cam.scale,velocity={x:entity.vx*viewW/cam.scale,y:entity.vy*viewH/cam.scale},speed=Math.hypot(velocity.x,velocity.y),ratio=Number.isFinite(f.sourceMotionRatio)?f.sourceMotionRatio:speed/110,activity=clamp((ratio-.015)/.15),center={x:cam.x+entity.x*viewW/cam.scale,y:cam.y+entity.y*viewH/cam.scale};
  let anchors=livingShapeEmitters(f.livingBody,center,pose,form,worldRadius);if(!anchors.length){const heading=Number.isFinite(pose.heading)?pose.heading:Math.atan2(velocity.y,velocity.x||.00001);anchors=livingEmitters([center,{x:center.x-Math.cos(heading)*worldRadius*2,y:center.y-Math.sin(heading)*worldRadius*2}],worldRadius,form);}
  // Display metadata only: no central circle feed, global spring or circular
  // containment. Each local source has its own body velocity and width.
  const root=anchors[Math.floor(anchors.length/2)]||center,uv=livingWorldToUV(root,cam);f.core={point:[uv.x,1-uv.y],radius:worldRadius*cam.scale/viewH,collisionRadius:coreUV,collisionPoint:f.solidCore?.point||[entity.x,1-entity.y],interactionRadius:0,speed:Math.hypot(entity.vx*f.aspect,entity.vy)};
  f.feedLivingShape(anchors,{camera:cam,velocity,dt:clamp(dt,0,.1),activity,previous:this.previousAnchors});
  // No coarse startup vortex impulses: distributed motion creates local shear.
  this.formSeeded=true;
  this.previousAnchors=anchors.map(a=>({x:a.x,y:a.y}));f.livingInkMetrics={form,emitters:activity>0?anchors.length:0,anchors:anchors.map(a=>({...a,uv:[livingWorldToUV(a,cam).x,1-livingWorldToUV(a,cam).y],intensity:a.rate*dt*activity})),activity,hasPose,wholeBody:!!f.livingBody?.sections?.length,swept:true,passes:2,worldRadius,clears:f.livingClearCount||0};
 }
}
