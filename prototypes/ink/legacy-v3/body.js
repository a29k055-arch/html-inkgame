// Elastic contour plus advected continuous membranes. Coordinates remain independent of gameplay.
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function noise(x) { const i = Math.floor(x), f = x - i, s = f * f * (3 - 2 * f); return hash(i) * (1 - s) + hash(i + 1) * s; }
function noise2(x,y){const i=Math.floor(y),f=y-i,k=f*f*(3-2*f);return noise(x+i*71)*(1-k)+noise(x+(i+1)*71)*k;}
export class InkBody {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.time = 0;
    this.ring = []; this.trail = []; this.drops = []; this.heading = 0; this.previous = null; this.deformation = {stretch:0,bend:0};
    this.resize();
  }
  resize() {
    const box = this.canvas.getBoundingClientRect(); this.w = box.width; this.h = box.height;
    const d = Math.min(devicePixelRatio, 2); this.canvas.width = Math.round(this.w * d); this.canvas.height = Math.round(this.h * d);
    this.ctx.setTransform(d, 0, 0, d, 0, 0); this.reset();
  }
  reset() { this.ring = []; this.trail = []; this.drops = []; this.previous = null; this.deformation={stretch:0,bend:0}; this.ctx.clearRect(0, 0, this.w, this.h); }
  radius(entity) { return Math.min(this.w, this.h) * entity.radius * 1.42; }
  splash(entity, strength = 1) {
    const r = this.radius(entity), x = entity.x * this.w, y = entity.y * this.h;
    for (let i = 0; i < 36; i++) {
      const a = hash(i + this.time * 10) * TAU, speed = r * (1.4 + hash(i * 5 + 91) * 5) * strength;
      this.drops.push({ x: x + Math.cos(a) * r * .5, y: y + Math.sin(a) * r * .5,
        vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, age: 0, life: 1.3 + hash(i * 3) * 1.8,
        r: r * (.015 + hash(i * 9) * .11), seed: i * 13.7 });
    }
    this.drops = this.drops.slice(-100);
  }
  update(entity, dt) {
    this.time += dt;
    const r = this.radius(entity), x = entity.x * this.w, y = entity.y * this.h;
    const vx = entity.vx * this.w, vy = entity.vy * this.h, speed = Math.hypot(vx, vy);
    const desired = speed > 3 ? Math.atan2(vy, vx) : this.heading;
    const turn = Math.atan2(Math.sin(desired - this.heading), Math.cos(desired - this.heading));
    this.heading += turn * (1 - Math.exp(-dt * 5));
    const acceleration = this.previous ? { x: (vx - this.previous.vx) / Math.max(dt, .008), y: (vy - this.previous.vy) / Math.max(dt, .008) } : {x:0,y:0};
    if (!this.ring.length) this.ring = Array.from({length:96}, (_, i) => ({x:x+Math.cos(i/96*TAU)*r,y:y+Math.sin(i/96*TAU)*r,vx:0,vy:0}));
    // A damped spring lets edges lag, recoil and recover; no framewise replacement of a polygon.
    const desiredStretch = clamp(speed / Math.max(70,r*3.2), 0, 1.15) + (entity.boost || 0) * .45;
    this.deformation.stretch += (desiredStretch-this.deformation.stretch)*(1-Math.exp(-dt*8));
    const sideAcceleration = -Math.sin(this.heading)*acceleration.x+Math.cos(this.heading)*acceleration.y;
    const desiredBend = clamp(sideAcceleration/Math.max(500,r*25),-1,1);
    this.deformation.bend += (desiredBend-this.deformation.bend)*(1-Math.exp(-dt*6));
    const stretch = this.deformation.stretch, bend = this.deformation.bend;
    for (let i = 0; i < this.ring.length; i++) {
      const a = i / this.ring.length * TAU, back = Math.pow(Math.max(0, -Math.cos(a)), 2);
      const irregular = (noise2(Math.cos(a)*3+this.time*.33,Math.sin(a)*3) - .5) * .32 + (noise2(Math.cos(a)*8-this.time*.25,Math.sin(a)*8) - .5) * .13;
      const radial = r * (1 + irregular + back * (.13 + noise2(Math.cos(a)*5+this.time*.2,Math.sin(a)*5) * .24));
      const localX = Math.cos(a)*radial*(1+stretch*.72)-r*stretch*.30;
      const localY = Math.sin(a)*radial/Math.sqrt(1+stretch*.8)*(1+stretch*.25*Math.cos(a))+bend*r*.55*Math.pow((1-Math.cos(a))*.5,1.5);
      const tx = x + localX * Math.cos(this.heading) - localY * Math.sin(this.heading) - clamp(acceleration.x * .008, -r*.18,r*.18);
      const ty = y + localX * Math.sin(this.heading) + localY * Math.cos(this.heading) - clamp(acceleration.y * .008, -r*.18,r*.18);
      const p = this.ring[i]; if(this.previous){p.x += x-this.previous.x;p.y += y-this.previous.y;} p.vx += (tx - p.x) * 95 * dt; p.vy += (ty - p.y) * 95 * dt;
      const damping = Math.exp(-dt * 13); p.vx *= damping; p.vy *= damping; p.x += p.vx * dt; p.y += p.vy * dt;
    }
    const last = this.trail.at(-1);
    if (!last || Math.hypot(x-last.x,y-last.y) > Math.max(2, r*.055)) {
      this.trail.push({x,y,age:0,heading:this.heading,r,width:.65+noise(this.time*1.2)*.55,seed:this.time*.83});
    }
    for (const p of this.trail) {
      p.age += dt;
      const old = clamp(p.age / 4.4, 0, 1), curl = (noise(p.seed * 5 + this.time * .32) - .5) * r;
      p.x += Math.cos(p.heading + Math.PI*.5) * curl * old * dt * .7;
      p.y += Math.sin(p.heading + Math.PI*.5) * curl * old * dt * .7;
    }
    this.trail = this.trail.filter(p=>p.age<4.4).slice(-190);
    if (Math.abs(turn) > .35 && speed > 90 && noise(this.time*37)>.6 && this.drops.length<65) {
      this.drops.push({x,y,vx:-vx*.4+acceleration.x*.09,vy:-vy*.4+acceleration.y*.09,age:0,life:1.6,r:r*.04,seed:this.time});
    }
    for (const p of this.drops) { p.age += dt; p.x += p.vx*dt; p.y += p.vy*dt; p.vx *= Math.exp(-dt*1.7); p.vy *= Math.exp(-dt*1.7); }
    this.drops=this.drops.filter(p=>p.age<p.life);
    this.previous={x,y,vx,vy};
  }
  path(points) {
    const c=this.ctx,n=points.length; if(n<3)return;
    c.beginPath(); c.moveTo(points[0].x,points[0].y);
    for(let i=0;i<n;i++) { const p=points[i],q=points[(i+1)%n],a=points[(i-1+n)%n],b=points[(i+2)%n];
      c.bezierCurveTo(p.x+(q.x-a.x)/6,p.y+(q.y-a.y)/6,q.x-(b.x-p.x)/6,q.y-(b.y-p.y)/6,q.x,q.y); }
    c.closePath();
  }
  membrane(entity, branch) {
    const c=this.ctx, left=[],right=[],r=this.radius(entity),angle=this.heading;
    for(let i=0;i<this.trail.length;i++) {
      const p=this.trail[i],prev=this.trail[Math.max(0,i-1)],next=this.trail[Math.min(this.trail.length-1,i+1)];
      const a=Math.atan2(next.y-prev.y,next.x-prev.x),f=clamp(1-p.age/4.4,0,1),old=1-f;
      const bend=(noise(p.seed*2+branch*8+this.time*.25)-.5)*r*old*1.6;
      const split=branch===0?0:(branch===1?-1:1)*r*Math.pow(old,.65)*(.45+noise(p.seed*4+branch)*.65);
      // Broad translucent wake and two asymmetric torn folds, tapered by age.
      const half=r*(branch===0?.46:.17)*p.width*Math.pow(f,.75)*(branch===0?1:.6+noise(p.seed*6+branch)*.7);
      const cx=p.x-Math.sin(a)*(bend+split),cy=p.y+Math.cos(a)*(bend+split);
      left.push({x:cx-Math.sin(a)*half,y:cy+Math.cos(a)*half});right.unshift({x:cx+Math.sin(a)*half,y:cy-Math.cos(a)*half});
    }
    if(left.length<3)return;
    const tip={x:entity.x*this.w-Math.cos(angle)*r*.25,y:entity.y*this.h-Math.sin(angle)*r*.25};
    this.path([...left,...right]);
    const start=this.trail[0],g=c.createLinearGradient(start.x,start.y,tip.x,tip.y);
    g.addColorStop(0,'rgba(45,46,44,0)');g.addColorStop(.22,'rgba(90,92,88,.07)');g.addColorStop(.60,branch===0?'rgba(79,82,76,.22)':'rgba(40,43,38,.13)');g.addColorStop(1,'rgba(17,20,17,.40)');
    c.fillStyle=g;c.fill();c.strokeStyle=branch===0?'rgba(37,42,34,.31)':'rgba(36,40,33,.24)';c.lineWidth=branch===0?1.1:.7;c.stroke();
    // A narrow dark rim follows the same distorted membrane rather than five identical ribbons.
    c.save();c.clip();c.translate(Math.sin(angle)*1.4,-Math.cos(angle)*1.4);c.strokeStyle='rgba(29,35,26,.14)';c.lineWidth=2.7;c.stroke();c.restore();
  }
  draw(entity) {
    const c=this.ctx;c.clearRect(0,0,this.w,this.h);if(!entity||!this.ring.length)return;
    const x=entity.x*this.w,y=entity.y*this.h,r=this.radius(entity),a=this.heading;
    for(let i=0;i<3;i++)this.membrane(entity,i);
    this.path(this.ring);
    const wash=c.createLinearGradient(x-Math.cos(a)*r,y-Math.sin(a)*r,x+Math.cos(a)*r,y+Math.sin(a)*r);
    wash.addColorStop(0,'rgba(91,95,87,.18)');wash.addColorStop(.48,'rgba(62,67,58,.52)');wash.addColorStop(1,'rgba(48,54,44,.71)');c.fillStyle=wash;c.fill();c.strokeStyle='rgba(28,37,24,.48)';c.lineWidth=1.1;c.stroke();
    c.save();c.clip();
    // Concentration deforms in the same moving frame as the skin. No stationary round core.
    const stretch=this.deformation.stretch;
    c.translate(x,y);c.rotate(a);c.scale(1+stretch*.62,1/Math.sqrt(1+stretch*.8));
    const coreX=r*(.07-stretch*.17),coreY=this.deformation.bend*r*.10;
    const ink=c.createRadialGradient(coreX+r*.10,coreY,r*.03,coreX,coreY,r*1.15);
    ink.addColorStop(0,'rgba(5,5,5,.98)');ink.addColorStop(.46,'rgba(10,10,10,.95)');ink.addColorStop(.76,'rgba(32,32,32,.69)');ink.addColorStop(1,'rgba(65,65,65,.05)');
    c.fillStyle=ink;c.fillRect(-r*3,-r*3,r*6,r*6);
    c.restore();
    for(const p of this.drops){const f=1-p.age/p.life,ang=Math.atan2(p.vy,p.vx),rr=p.r*(1+p.age*.3);c.save();c.translate(p.x,p.y);c.rotate(ang);const pts=[];for(let i=0;i<9;i++){const a=i/9*TAU,k=.7+noise(i*.8+p.seed)*.6;pts.push({x:Math.cos(a)*rr*k*(1+Math.min(1.8,Math.hypot(p.vx,p.vy)/200)),y:Math.sin(a)*rr*k});}this.path(pts);c.fillStyle=`rgba(35,42,30,${f*.47})`;c.fill();c.lineWidth=.5;c.strokeStyle=`rgba(25,34,22,${f*.55})`;c.stroke();c.restore();}
  }
}
