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
  const fragment = shader(gl, gl.FRAGMENT_SHADER, 'precision mediump float; varying vec2 texCoord; uniform sampler2D pigment; void main(){gl_FragColor=texture2D(pigment,texCoord);}');
  const program = gl.createProgram(); gl.attachShader(program,vertex); gl.attachShader(program,fragment); gl.linkProgram(program);
  gl.deleteShader(vertex); gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
  shared = {canvas,gl,program,position:gl.getAttribLocation(program,'position'),uv:gl.getAttribLocation(program,'uv'),sampler:gl.getUniformLocation(program,'pigment'),resources:new WeakMap()};
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
      resource={texture,uvBuffer,indexBuffer,positionBuffer,count:indices.length,refs:0};s.resources.set(image,resource);
    }
    resource.refs++;this.resource=resource;this.image=image;
    this.positions=new Float32Array(mesh.vertices.length*2);
  }
  drawTo(ctx, vertices) {
    if(!this.resource) return;
    const s=this.surface,gl=s.gl,r=this.resource;
    if(gl.isContextLost())throw Error('Mesh WebGL context lost');
    const w=ctx.canvas.width,h=ctx.canvas.height;if(w<1||h<1)return;
    if(s.canvas.width!==w||s.canvas.height!==h){s.canvas.width=w;s.canvas.height=h;}
    const m=ctx.getTransform(),p=this.positions;
    vertices.forEach((v,i)=>{p[i*2]=((m.a*v.x+m.c*v.y+m.e)/w)*2-1;p[i*2+1]=1-((m.b*v.x+m.d*v.y+m.f)/h)*2;});
    gl.viewport(0,0,w,h);gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.disable(gl.SCISSOR_TEST);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(s.program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,r.texture);gl.uniform1i(s.sampler,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,r.positionBuffer);gl.bufferData(gl.ARRAY_BUFFER,p,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(s.position);gl.vertexAttribPointer(s.position,2,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,r.uvBuffer);gl.enableVertexAttribArray(s.uv);gl.vertexAttribPointer(s.uv,2,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,r.indexBuffer);gl.drawElements(gl.TRIANGLES,r.count,gl.UNSIGNED_SHORT,0);
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(s.canvas,0,0);ctx.restore();
  }
  dispose() {
    const r=this.resource;if(!r)return;
    if(--r.refs===0){const s=this.surface,gl=s.gl;gl.deleteTexture(r.texture);gl.deleteBuffer(r.uvBuffer);gl.deleteBuffer(r.indexBuffer);gl.deleteBuffer(r.positionBuffer);s.resources.delete(this.image);}
    this.resource=null;this.image=null;this.positions=null;
  }
}
