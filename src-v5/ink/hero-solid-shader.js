// Gameplay's projected collision core is the solid ink reservoir. Advected density is
// the surrounding wet ink, never the authority for the body's size. No extra FBO/solver.
const vertex=`#version 300 es
layout(location=0) in vec2 a;out vec2 uv;void main(){uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}`;
const fragment=`#version 300 es
precision highp float;in vec2 uv;out vec4 o;
uniform sampler2D field,velocity;uniform vec2 texel,solidPoint;uniform float aspect,dt,solidRadius,solidLarge,bodyTime;
float hash(vec2 p){vec3 a=fract(vec3(p.xyx)*.1031);a+=dot(a,a.yzx+33.33);return fract((a.x+a.y)*a.z);}
float noise(vec2 p){vec2 b=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(b),hash(b+vec2(1.,0.)),f.x),mix(hash(b+vec2(0.,1.)),hash(b+1.),f.x),f.y);}
vec4 linearField(vec2 p){vec2 q=p/texel-.5,b=floor(q),f=fract(q);return mix(mix(texture(field,(b+.5)*texel),texture(field,(b+vec2(1.5,.5))*texel),f.x),mix(texture(field,(b+vec2(.5,1.5))*texel),texture(field,(b+1.5)*texel),f.x),f.y);}
vec2 linearVelocity(vec2 p){vec2 q=p/texel-.5,b=floor(q),f=fract(q);return mix(mix(texture(velocity,(b+.5)*texel).xy,texture(velocity,(b+vec2(1.5,.5))*texel).xy,f.x),mix(texture(velocity,(b+vec2(.5,1.5))*texel).xy,texture(velocity,(b+1.5)*texel).xy,f.x),f.y);}
void main(){
 vec2 flow=texture(velocity,uv).xy,at=clamp(uv-flow*texel*dt,texel*.5,1.-texel*.5);
 float sourceDensity=max(0.,linearField(at).z),d=sourceDensity;
 // The radius is coreRadius * camera.scale / viewport.height, with no artistic multiplier.
 vec2 q=uv-solidPoint;q.x*=aspect;float rho=length(q)/max(solidRadius,.000001);
 // Old dense wake may survive briefly, but outside a large solid core it reads as
 // translucent wet ink instead of another black body. Small-body optics stay intact.
 float outer=smoothstep(.98,1.035,rho)*solidLarge;
 // Compress continuously rather than clamp: a hard density cap turns a textured
 // wake into a flat gray sheet. Distance only fades optics; it never rotates ink.
 float wetDensity=log(1.+d)*.30*exp(-max(0.,rho-1.)*.24);
 d=mix(d,wetDensity,outer);
 vec2 local=q/max(solidRadius,.000001);
 // Slow domain-warped wash follows the live velocity/density field. Time keeps
 // capillary mixing alive at rest; it never moves the core or historical wake.
 vec2 drift=vec2(bodyTime*.13,-bodyTime*.09),flowOffset=clamp(linearVelocity(uv)*texel/max(solidRadius,.000001),vec2(-.35),vec2(.35));
 vec2 warp=vec2(noise(local*2.1+drift),noise(local*2.1-drift+7.3))-.5;
 float wash=noise(local*2.6+warp*.85-drift-flowOffset*.10);
 float detail=noise(local*7.5+warp+drift*.6);
 float live=sourceDensity/(1.+sourceDensity);
 float wet=clamp(.68*wash+.18*detail+.14*live,0.,1.);
 float paperEdge=(noise(normalize(local+vec2(.0001))*5.+drift*.55)-.5)*.028;
 float reservoir=solidRadius>0.?1.-smoothstep(.95,1.055,rho+paperEdge):0.;
 // Coverage and optical tone are independent. A bounded dense wash secures the
 // true-sized body without max(high density) flattening every internal variation.
 float bodyDensity=2.05+.85*wet+.20*(1.-min(1.,rho*rho));
 float bodyMix=reservoir;
 d=mix(d,bodyDensity*reservoir,bodyMix);
 float film=smoothstep(.025,.17,d),alpha=clamp((1.-exp(-d*1.65))*film,0.,.985);
 float tone=.045+exp(-d*2.5)*.14;
 // Ink stays dark but translucent-looking wash has a visible 12–53 gray range.
 // Only the physical body changes: outside the bounded wet edge, old tail optics
 // remain identical, including their world-space inertia and fade.
 float bodyTone=.045+.16*pow(wet,1.45)+.018*(1.-min(1.,rho));
 tone=mix(tone,bodyTone,bodyMix);
 o=vec4(vec3(tone),alpha);
}`;
export function solidDisplayProgram(fluid){
 if(fluid.solidDisplay)return fluid.solidDisplay;
 const gl=fluid.gl,compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(error);}return s;};
 let v,f,p;try{v=compile(gl.VERTEX_SHADER,vertex);f=compile(gl.FRAGMENT_SHADER,fragment);p=gl.createProgram();gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));fluid.solidDisplay=p;return p;}catch(error){if(p)gl.deleteProgram(p);throw error;}finally{if(v)gl.deleteShader(v);if(f)gl.deleteShader(f);}
}
