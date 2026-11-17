// Gameplay's projected collision core is the solid ink reservoir. Advected density is
// the surrounding wet ink, never the authority for the body's size. No extra FBO/solver.
const vertex=`#version 300 es
layout(location=0) in vec2 a;out vec2 uv;void main(){uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}`;
const fragment=`#version 300 es
precision highp float;in vec2 uv;out vec4 o;
uniform sampler2D field,velocity;uniform vec2 texel,solidPoint;uniform float aspect,dt,solidRadius,solidLarge;
vec4 linearField(vec2 p){vec2 q=p/texel-.5,b=floor(q),f=fract(q);return mix(mix(texture(field,(b+.5)*texel),texture(field,(b+vec2(1.5,.5))*texel),f.x),mix(texture(field,(b+vec2(.5,1.5))*texel),texture(field,(b+1.5)*texel),f.x),f.y);}
void main(){
 vec2 flow=texture(velocity,uv).xy,at=clamp(uv-flow*texel*dt,texel*.5,1.-texel*.5);
 float d=max(0.,linearField(at).z);
 // The radius is coreRadius * camera.scale / viewport.height, with no artistic multiplier.
 vec2 q=uv-solidPoint;q.x*=aspect;float rho=length(q)/max(solidRadius,.000001);
 // Old dense wake may survive briefly, but outside a large solid core it reads as
 // translucent wet ink instead of another black body. Small-body optics stay intact.
 float outer=smoothstep(.98,1.035,rho)*solidLarge;
 // Compress continuously rather than clamp: a hard density cap turns a textured
 // wake into a flat gray sheet. Distance only fades optics; it never rotates ink.
 float wetDensity=log(1.+d)*.30*exp(-max(0.,rho-1.)*.24);
 d=mix(d,wetDensity,outer);
 float angle=atan(q.y,q.x),paperEdge=.0035*sin(angle*11.)+.0025*sin(angle*19.+.7);
 float reservoir=solidRadius>0.?1.-smoothstep(.95,1.055,rho+paperEdge):0.;
 vec2 local=q/max(solidRadius,.000001);
 float fibre=.10*sin(local.x*19.+sin(local.y*13.))+.07*sin(local.y*31.+local.x*7.);
 // A soft wet edge and low-contrast paper fibres keep the solid body ink-like.
 // Its size is fixed by the logical radius; only density varies inside that body.
 d=max(d,reservoir*(1.95+1.15*(1.-min(1.,rho*rho))+fibre));
 float film=smoothstep(.025,.17,d),alpha=clamp((1.-exp(-d*1.65))*film,0.,.985);
 float tone=.045+exp(-d*2.5)*.14;
 o=vec4(vec3(tone),alpha);
}`;
export function solidDisplayProgram(fluid){
 if(fluid.solidDisplay)return fluid.solidDisplay;
 const gl=fluid.gl,compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(error);}return s;};
 let v,f,p;try{v=compile(gl.VERTEX_SHADER,vertex);f=compile(gl.FRAGMENT_SHADER,fragment);p=gl.createProgram();gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));fluid.solidDisplay=p;return p;}catch(error){if(p)gl.deleteProgram(p);throw error;}finally{if(v)gl.deleteShader(v);if(f)gl.deleteShader(f);}
}
