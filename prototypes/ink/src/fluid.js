import {QUALITY, INK} from './config.js';
const vertex=`#version 300 es
layout(location=0) in vec2 a; out vec2 uv; void main(){uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}`;
const common=`#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D field, velocity, pressure, curl, predictor, reverse;
uniform vec2 texel, point, force; uniform float dt, decay, radius, amount, aspect, time;
vec4 sampleLinear(sampler2D s,vec2 p){vec2 z=clamp(p,texel*.5,1.-texel*.5)/texel-.5;vec2 i=floor(z),f=fract(z);vec2 q=(i+.5)*texel;return mix(mix(texture(s,q),texture(s,q+vec2(texel.x,0.)),f.x),mix(texture(s,q+vec2(0.,texel.y)),texture(s,q+texel),f.x),f.y);}
`;
const shaders={
 contain:`
 vec4 ink=texture(field,uv);vec2 delta=uv-point;delta.x*=aspect;
 vec2 direction=vec2(force.x*aspect,force.y);float speed=length(direction);direction=normalize(direction+vec2(.00001,0.));
 float along=dot(delta,direction),side=abs(dot(delta,vec2(-direction.y,direction.x)));
 float tail=radius*(2.8+min(speed,1.)*4.);
 float lateral=smoothstep(radius*1.6,radius*2.7,side);
 float front=smoothstep(radius*1.7,radius*2.8,along);
 float rear=smoothstep(tail,tail*1.4,-along);
 ink.z*=exp(-dt*(lateral+front+rear)*2.4);o=ink;`,
 material:`
 vec2 v=texture(velocity,uv).xy;
 float d=max(0.,texture(field,uv).z);
 vec2 delta=point-uv;delta.x*=aspect;
 float distanceToInk=length(delta);
 float envelope=exp(-dot(delta,delta)/max(radius*radius,.0001));
 float wet=smoothstep(.025,.45,d);
 vec2 carry=force;
 vec2 spring=vec2(delta.x/aspect,delta.y)*vec2(1./texel.x,1./texel.y)*12.;
 vec2 tangent=vec2(-delta.y,delta.x/aspect)*vec2(1./texel.x,1./texel.y);
 float swirl=sin(time*1.7+distanceToInk*45.)*1.8;
 vec2 acceleration=(carry-v)*5.5+spring+tangent*swirl;
 v+=acceleration*dt*wet*mix(.30,1.,envelope);
 o=vec4(clamp(v,vec2(-650.),vec2(650.)),0.,1.);`,
 advect:`vec2 v=texture(velocity,uv).xy;vec2 back=uv-dt*v*texel;o=sampleLinear(field,back)*exp(-decay*dt);`,
 correct:`vec2 back=clamp(uv-dt*texture(velocity,uv).xy*texel,texel*.5,1.-texel*.5);vec2 base=(floor(back/texel-.5)+.5)*texel;vec4 a=texture(field,base),b=texture(field,base+vec2(texel.x,0.)),c=texture(field,base+vec2(0.,texel.y)),d=texture(field,base+texel);vec4 lo=min(min(a,b),min(c,d)),hi=max(max(a,b),max(c,d));vec4 value=texture(predictor,uv)+.5*(texture(field,uv)-texture(reverse,uv));o=clamp(value,lo,hi)*exp(-decay*dt);`,
 splat:`vec2 d=uv-point;d.x*=aspect;float w=exp(-dot(d,d)/radius);vec4 old=texture(field,uv);o=old+vec4(force*w,amount*w,0.);`,
 curl:`float l=texture(velocity,uv-vec2(texel.x,0.)).y,r=texture(velocity,uv+vec2(texel.x,0.)).y,b=texture(velocity,uv-vec2(0.,texel.y)).x,t=texture(velocity,uv+vec2(0.,texel.y)).x;o=vec4((r-l-t+b)*.5,0.,0.,1.);`,
 confine:`float l=abs(texture(curl,uv-vec2(texel.x,0.)).x),r=abs(texture(curl,uv+vec2(texel.x,0.)).x),b=abs(texture(curl,uv-vec2(0.,texel.y)).x),t=abs(texture(curl,uv+vec2(0.,texel.y)).x);float c=texture(curl,uv).x;vec2 n=vec2(t-b,l-r)*.5;n/=length(n)+.0001;vec2 v=texture(velocity,uv).xy+dt*amount*c*n;o=vec4(clamp(v,vec2(-650.),vec2(650.)),0.,1.);`,
 divergence:`vec2 v=texture(velocity,uv).xy;float l=uv.x<texel.x?-v.x:texture(velocity,uv-vec2(texel.x,0.)).x;float r=uv.x>1.-texel.x?-v.x:texture(velocity,uv+vec2(texel.x,0.)).x;float b=uv.y<texel.y?-v.y:texture(velocity,uv-vec2(0.,texel.y)).y;float t=uv.y>1.-texel.y?-v.y:texture(velocity,uv+vec2(0.,texel.y)).y;o=vec4((r-l+t-b)*.5,0.,0.,1.);`,
 jacobi:`float l=texture(pressure,uv-vec2(texel.x,0.)).x,r=texture(pressure,uv+vec2(texel.x,0.)).x,b=texture(pressure,uv-vec2(0.,texel.y)).x,t=texture(pressure,uv+vec2(0.,texel.y)).x;o=vec4((l+r+b+t-texture(field,uv).x)*.25,0.,0.,1.);`,
 gradient:`float l=texture(pressure,uv-vec2(texel.x,0.)).x,r=texture(pressure,uv+vec2(texel.x,0.)).x,b=texture(pressure,uv-vec2(0.,texel.y)).x,t=texture(pressure,uv+vec2(0.,texel.y)).x;vec2 v=texture(velocity,uv).xy-vec2(r-l,t-b)*.5;if(uv.x<texel.x||uv.x>1.-texel.x)v.x=0.;if(uv.y<texel.y||uv.y>1.-texel.y)v.y=0.;o=vec4(v,0.,1.);`,
 display:`vec2 renderUV=clamp(uv-texture(velocity,uv).xy*texel*dt,texel*.5,1.-texel*.5);float d=max(0.,sampleLinear(field,renderUV).z);vec2 e=texel*1.3;float edge=abs(texture(field,uv+vec2(e.x,0.)).z-texture(field,uv-vec2(e.x,0.)).z)+abs(texture(field,uv+vec2(0.,e.y)).z-texture(field,uv-vec2(0.,e.y)).z);float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);float a=1.-exp(-d*1.15);a=clamp(a+edge*.17,0.,.97);a*=.94+grain*.06;float tone=.075+exp(-d*2.)*.14;if(amount>.5){float film=smoothstep(.025,.17,d);float rim=exp(-pow((d-.48)*2.8,2.))*edge*.6;a=clamp((1.-exp(-d*1.65))*film+rim,0.,.985);tone=.045+exp(-d*2.5)*.14;}o=vec4(vec3(tone),a);`,
};
// Density is stored in Z. Velocity lives in XY. No float filtering extension needed:
// advection uses explicit bilinear interpolation on NEAREST float textures.
export class InkFluid {
 constructor(canvas,quality='high'){
  this.canvas=canvas;this.gl=canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:false,antialias:false,preserveDrawingBuffer:true});
  if(!this.gl||!this.gl.getExtension('EXT_color_buffer_float'))throw new Error('当前设备不支持所需的流体渲染，请用 Chrome 或 Edge 打开。 / この端末では流体描画を使用できません。Chrome / Edgeでお試しください。');
  const g=this.gl;this.programs={};this.uniforms={};this.targets=[];
  const compile=(type,src)=>{const s=g.createShader(type);g.shaderSource(s,src);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS)){const e=g.getShaderInfoLog(s);g.deleteShader(s);throw Error(e);}return s;};
  for(const [name,src] of Object.entries(shaders)){const p=g.createProgram(),v=compile(g.VERTEX_SHADER,vertex),f=compile(g.FRAGMENT_SHADER,common+'void main(){'+src+'}');g.attachShader(p,v);g.attachShader(p,f);g.linkProgram(p);g.deleteShader(v);g.deleteShader(f);if(!g.getProgramParameter(p,g.LINK_STATUS))throw Error(g.getProgramInfoLog(p));this.programs[name]=p;this.uniforms[name]={};}
  this.vao=g.createVertexArray();g.bindVertexArray(this.vao);this.buffer=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,this.buffer);g.bufferData(g.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),g.STATIC_DRAW);
  g.enableVertexAttribArray(0);g.vertexAttribPointer(0,2,g.FLOAT,false,0,0);this.quality=quality;this.resize();
 }
 target(){const g=this.gl,t=g.createTexture();g.bindTexture(g.TEXTURE_2D,t);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.NEAREST);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.NEAREST);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);g.texImage2D(g.TEXTURE_2D,0,g.RGBA16F,this.w,this.h,0,g.RGBA,g.HALF_FLOAT,null);const f=g.createFramebuffer();g.bindFramebuffer(g.FRAMEBUFFER,f);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,t,0);if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE){g.deleteFramebuffer(f);g.deleteTexture(t);throw Error('无法创建流体绘图区域。 / 流体の描画領域を作成できません。');}const obj={t,f};this.targets.push(obj);return obj;}
 pair(){const a=this.target(),b=this.target();return {read:a,write:b,swap(){[this.read,this.write]=[this.write,this.read];}};}
 resize(){const r=this.canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,2);this.canvas.width=Math.max(2,Math.round(r.width*dpr));this.canvas.height=Math.max(2,Math.round(r.height*dpr));this.aspect=r.width/r.height;const n=QUALITY[this.quality].grid;this.w=Math.round(n*Math.sqrt(this.aspect));this.h=Math.round(n/Math.sqrt(this.aspect));this.releaseTargets();this.v=this.pair();this.d=this.pair();this.p=this.pair();this.div=this.target();this.c=this.target();this.dAhead=this.target();this.dBack=this.target();this.clear();}
 releaseTargets(){for(const t of this.targets){this.gl.deleteTexture(t.t);this.gl.deleteFramebuffer(t.f);}this.targets=[];}
 clear(){const g=this.gl;g.clearColor(0,0,0,0);for(const t of this.targets){g.bindFramebuffer(g.FRAMEBUFFER,t.f);g.clear(g.COLOR_BUFFER_BIT);}g.bindFramebuffer(g.FRAMEBUFFER,null);g.clear(g.COLOR_BUFFER_BIT);}
 pass(name,target,params={}){const g=this.gl,p=this.programs[name];g.useProgram(p);g.bindVertexArray(this.vao);g.bindBuffer(g.ARRAY_BUFFER,this.buffer);g.bindFramebuffer(g.FRAMEBUFFER,target?.f||null);g.viewport(0,0,target?this.w:this.canvas.width,target?this.h:this.canvas.height);params={texel:[1/this.w,1/this.h],aspect:this.aspect,...params};let unit=0;for(const [key,val] of Object.entries(params)){const cache=this.uniforms[name];if(!(key in cache))cache[key]=g.getUniformLocation(p,key);const loc=cache[key];if(loc===null)continue;if(val?.t){g.activeTexture(g.TEXTURE0+unit);g.bindTexture(g.TEXTURE_2D,val.t);g.uniform1i(loc,unit++);}else if(Array.isArray(val))g.uniform2f(loc,...val);else g.uniform1f(loc,val);}g.drawArrays(g.TRIANGLE_STRIP,0,4);}
 inject({x,y,vx=0,vy=0,radius=INK.radius,intensity=.6}){const point=[x,1-y];this.pass('splat',this.v.write,{field:this.v.read,point,force:[vx,-vy],radius:radius*radius,amount:0});this.v.swap();this.pass('splat',this.d.write,{field:this.d.read,point,force:[0,0],radius:radius*radius,amount:intensity});this.d.swap();}
 stir({x,y,vx,vy,radius=.075}){this.pass('splat',this.v.write,{field:this.v.read,point:[x,1-y],force:[vx,-vy],radius:radius*radius,amount:0});this.v.swap();}
 step(dt){dt=Math.min(dt,1/30);this.pass('curl',this.c,{velocity:this.v.read});this.pass('confine',this.v.write,{velocity:this.v.read,curl:this.c,dt,amount:INK.vorticity*(this.materialMode?1:.55)});this.v.swap();this.pass('divergence',this.div,{velocity:this.v.read});for(let i=0;i<QUALITY[this.quality].iterations;i++){this.pass('jacobi',this.p.write,{pressure:this.p.read,field:this.div});this.p.swap();}this.pass('gradient',this.v.write,{velocity:this.v.read,pressure:this.p.read});this.v.swap();this.pass('advect',this.v.write,{field:this.v.read,velocity:this.v.read,dt,decay:INK.velocityDecay});this.v.swap();this.pass('advect',this.dAhead,{field:this.d.read,velocity:this.v.read,dt,decay:0});this.pass('advect',this.dBack,{field:this.dAhead,velocity:this.v.read,dt:-dt,decay:0});this.pass('correct',this.d.write,{field:this.d.read,velocity:this.v.read,predictor:this.dAhead,reverse:this.dBack,dt,decay:INK.densityDecay});this.d.swap();}
 draw(prediction=0){this.pass('display',null,{field:this.d.read,velocity:this.v.read,dt:prediction,amount:this.materialMode?1:0});}
 dispose(){this.releaseTargets();for(const p of Object.values(this.programs))this.gl.deleteProgram(p);this.gl.deleteBuffer(this.buffer);this.gl.deleteVertexArray(this.vao);}
}
