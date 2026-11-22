// One shared GPU surface: contiguous indexed triangles avoid Canvas clip-edge alpha seams.
let shared = null;
function shader(gl, type, source) {
  const value = gl.createShader(type);
  gl.shaderSource(value, source); gl.compileShader(value);
  if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(value); gl.deleteShader(value); throw Error(error);
  }
  return value;
}
function surface() {
  if (shared && !shared.gl.isContextLost()) return shared;
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', {alpha:true, premultipliedAlpha:true, antialias:true, depth:false, stencil:false});
  if (!gl) throw Error('WebGL unavailable; use the Canvas fallback');
  const vertex = shader(gl, gl.VERTEX_SHADER, 'attribute vec2 position; attribute vec2 uv; varying vec2 texCoord; void main(){gl_Position=vec4(position,0.0,1.0);texCoord=uv;}');
  const fragment = shader(gl, gl.FRAGMENT_SHADER, 'precision mediump float; varying vec2 texCoord; uniform sampler2D pigment; uniform float opacity; void main(){gl_FragColor=texture2D(pigment,texCoord)*opacity;}');
  const program = gl.createProgram(); gl.attachShader(program,vertex); gl.attachShader(program,fragment); gl.linkProgram(program);
  gl.deleteShader(vertex); gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
  shared = {canvas,gl,program,position:gl.getAttribLocation(program,'position'),uv:gl.getAttribLocation(program,'uv'),sampler:gl.getUniformLocation(program,'pigment'),opacity:gl.getUniformLocation(program,'opacity'),resources:new WeakMap()};
  return shared;
}

export class WebGLMeshSurface {
  constructor(image, mesh) {
    this.surface = surface();
    const s=this.surface,gl=s.gl;
    if (image.width>gl.getParameter(gl.MAX_TEXTURE_SIZE)||image.height>gl.getParameter(gl.MAX_TEXTURE_SIZE)) throw Error('Mesh texture exceeds device limit');
    let resource=s.resources.get(image);
    if (!resource) {
      const uv=new Float32Array(mesh.vertices.length*2);
      mesh.vertices.forEach((v,i)=>{uv[i*2]=v.x/image.width;uv[i*2+1]=v.y/image.height;});
      const indices=new Uint16Array(mesh.triangles.flat());
      if(mesh.vertices.length>65535)throw Error('Mesh exceeds 16-bit vertex limit');
      const texture=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
      const uvBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,uvBuffer);gl.bufferData(gl.ARRAY_BUFFER,uv,gl.STATIC_DRAW);
      const indexBuffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
      const positionBuffer=gl.createBuffer();
      resource={texture,uvBuffer,indexBuffer,positionBuffer,count:indices.length,activeIndices:mesh.activeIndices||[...new Set(indices)],refs:0};s.resources.set(image,resource);
    }
    resource.refs++;this.resource=resource;this.image=image;
    this.positions=new Float32Array(mesh.vertices.length*2);
  }
  drawTo(ctx, vertices) {
    return WebGLMeshSurface.drawBatchTo(ctx,[{surface:this,vertices}]);
  }
  static drawBatchTo(ctx,commands) {
    const entries=commands.filter(c=>c.surface?.resource&&c.opacity!==0);
    const stats={gpuBatches:0,meshDrawCalls:0,compositePixels:0,surfacePixels:0,viewportPixels:0,vertexCount:0,triangleCount:0};
    if(!entries.length)return stats;
    // Nonstandard Canvas effects must retain the original per-layer compositing semantics.
    if(entries.length>1&&(ctx.globalAlpha!==1||ctx.globalCompositeOperation!=='source-over'||ctx.filter&&ctx.filter!=='none'||ctx.shadowColor!=='rgba(0, 0, 0, 0)')){
      for(const entry of entries){ctx.save();ctx.globalAlpha*=entry.opacity??1;const value=entry.surface.drawTo(ctx,entry.vertices);ctx.restore();if(value)for(const key in stats)stats[key]+=value[key];}return stats;
    }
    const s=entries[0].surface.surface,gl=s.gl;
    if(gl.isContextLost())throw Error('Mesh WebGL context lost');
    const w=ctx.canvas.width,h=ctx.canvas.height;if(w<1||h<1)return stats;
    const m=ctx.getTransform();let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
    for(const entry of entries){if(entry.surface.surface!==s)throw Error('Mesh batch mixes WebGL contexts');const p=entry.surface.positions,vertices=entry.vertices;
      for(const i of entry.surface.resource.activeIndices){const v=vertices[i],x=m.a*v.x+m.c*v.y+m.e,y=m.b*v.x+m.d*v.y+m.f;p[i*2]=x;p[i*2+1]=y;left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
    }
    // Keep exact device-pixel density, but do not clear/read back empty viewport pixels.
    const full=ctx.globalCompositeOperation!=='source-over',x0=full?0:Math.max(0,Math.floor(left)-2),y0=full?0:Math.max(0,Math.floor(top)-2),x1=full?w:Math.min(w,Math.ceil(right)+2),y1=full?h:Math.min(h,Math.ceil(bottom)+2),visibleW=x1-x0,visibleH=y1-y0;
    if(visibleW<=0||visibleH<=0)return stats;
    const neededW=Math.min(w,Math.ceil(visibleW/64)*64),neededH=Math.min(h,Math.ceil(visibleH/64)*64),viewportChanged=s.targetWidth!==w||s.targetHeight!==h;
    s.smallFrames=neededW*neededH<s.canvas.width*s.canvas.height*.4?(s.smallFrames||0)+1:0;
    const shrink=viewportChanged||s.smallFrames>=12,cw=shrink?neededW:Math.min(w,Math.max(s.canvas.width,neededW)),ch=shrink?neededH:Math.min(h,Math.max(s.canvas.height,neededH));
    if(shrink)s.smallFrames=0;s.targetWidth=w;s.targetHeight=h;
    if(s.canvas.width!==cw||s.canvas.height!==ch){s.canvas.width=cw;s.canvas.height=ch;}
    gl.viewport(0,0,cw,ch);gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.disable(gl.SCISSOR_TEST);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(s.program);gl.activeTexture(gl.TEXTURE0);gl.uniform1i(s.sampler,0);
    for(const entry of entries){const r=entry.surface.resource,p=entry.surface.positions;
      for(const i of r.activeIndices){p[i*2]=(p[i*2]-x0)/cw*2-1;p[i*2+1]=1-(p[i*2+1]-y0)/ch*2;}
      gl.bindTexture(gl.TEXTURE_2D,r.texture);gl.uniform1f(s.opacity,entry.opacity??1);
      gl.bindBuffer(gl.ARRAY_BUFFER,r.positionBuffer);gl.bufferData(gl.ARRAY_BUFFER,p,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(s.position);gl.vertexAttribPointer(s.position,2,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER,r.uvBuffer);gl.enableVertexAttribArray(s.uv);gl.vertexAttribPointer(s.uv,2,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,r.indexBuffer);gl.drawElements(gl.TRIANGLES,r.count,gl.UNSIGNED_SHORT,0);
      stats.meshDrawCalls++;stats.vertexCount+=r.activeIndices.length;stats.triangleCount+=r.count/3;
    }
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(s.canvas,0,0,visibleW,visibleH,x0,y0,visibleW,visibleH);ctx.restore();
    stats.gpuBatches=1;stats.compositePixels=visibleW*visibleH;stats.surfacePixels=cw*ch;stats.viewportPixels=w*h;return stats;
  }
  dispose() {
    const r=this.resource;if(!r)return;
    if(--r.refs===0){const s=this.surface,gl=s.gl;gl.deleteTexture(r.texture);gl.deleteBuffer(r.uvBuffer);gl.deleteBuffer(r.indexBuffer);gl.deleteBuffer(r.positionBuffer);s.resources.delete(this.image);}
    this.resource=null;this.image=null;this.positions=null;
  }
}
