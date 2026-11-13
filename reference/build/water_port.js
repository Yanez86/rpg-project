class Sim {
  constructor(nx, nz, x0, z0, wd, dd, inside, wrap) {
    Object.assign(this, { nx, nz, x0, z0, wd, dd, wrap, off: 0 });
    this.a = new Float32Array(nx * nz); this.b = new Float32Array(nx * nz); this.m = new Uint8Array(nx * nz);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) this.m[j * nx + i] = inside(x0 + (i + .5) * wd / nx, z0 + (j + .5) * dd / nz) ? 1 : 0;
    this.data = new Uint8Array(nx * nz * 4).fill(128);
    this.tex = new THREE.DataTexture(this.data, nx, nz, THREE.RGBAFormat);
    this.tex.magFilter = this.tex.minFilter = THREE.LinearFilter;
    if (wrap) this.tex.wrapS = THREE.RepeatWrapping;
    this.tex.needsUpdate = true;
  }
  drop(x, z, s, r) {
    let u = (x - this.x0) / this.wd - this.off; if (this.wrap) u -= Math.floor(u);
    const ci = Math.floor(u * this.nx), cj = Math.floor((z - this.z0) / this.dd * this.nz);
    for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      const d = Math.hypot(di, dj); if (d > r) continue;
      let i = ci + di; const j = cj + dj; if (this.wrap) i = ((i % this.nx) + this.nx) % this.nx;
      if (i < 0 || j < 0 || i >= this.nx || j >= this.nz) continue;
      const k = j * this.nx + i; if (this.m[k]) this.a[k] -= s * (1 - d / (r + 1));
    }
  }
  step(damp) {
    const { a, b, m, nx, nz, wrap } = this;
    for (let j = 1; j < nz - 1; j++) for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      if (!m[k]) { b[k] = 0; continue; }
      const l = i > 0 ? k - 1 : (wrap ? k + nx - 1 : k), r = i < nx - 1 ? k + 1 : (wrap ? k - nx + 1 : k);
      b[k] = ((a[l] + a[r] + a[k - nx] + a[k + nx]) * 0.5 - b[k]) * damp;
    }
    this.a = b; this.b = a;
  }
  upload() { const a = this.a, d = this.data; for (let k = 0; k < a.length; k++) d[k * 4] = Math.max(0, Math.min(255, a[k] * 63.5 + 128)); this.tex.needsUpdate = true; }
}
const SURF_VS = `uniform sampler2D hm;uniform vec4 rect;uniform float off,amp;varying vec3 vW;varying float vD;
  float H(vec2 uv){return (texture2D(hm,uv).r*255.0-128.0)/63.5;}
  void main(){vec4 w=modelMatrix*vec4(position,1.0);vec2 uv=(w.xz-rect.xy)/rect.zw;uv.x-=off;w.y+=H(uv)*amp;vW=w.xyz;vec4 mv=viewMatrix*w;vD=-mv.z;gl_Position=projectionMatrix*mv;}`;
const SURF_FS = `uniform sampler2D hm;uniform vec4 rect;uniform vec2 tx,ctr;uniform float off,amp,cell,t,flow,kind,rad,ringR,fN,fF;
  uniform vec3 sunD,deep,base,lite,foam,fogC;varying vec3 vW;varying float vD;
  float H(vec2 uv){return (texture2D(hm,uv).r*255.0-128.0)/63.5;}
  float hh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  void main(){
    if(kind<0.5&&length(vW.xz-ctr)>rad)discard;
    vec2 q=(floor(vW.xz*16.0)+0.5)/16.0;
    vec2 uv=(q-rect.xy)/rect.zw;uv.x-=off;
    float h=H(uv);
    float dx=H(uv+vec2(tx.x,0.0))-H(uv-vec2(tx.x,0.0)),dz=H(uv+vec2(0.0,tx.y))-H(uv-vec2(0.0,tx.y));
    vec3 n=normalize(vec3(-dx*amp/(2.0*cell),1.0,-dz*amp/(2.0*cell)));
    vec2 f=q+vec2(-t*flow,0.0);
    float pat=sin(f.x*3.1+sin(f.y*2.3+t*0.8)*1.7+t*0.6)*sin(f.y*2.7-t*0.5+sin(f.x*1.9)*1.3);
    float tone=dot(n,sunD)*0.75+pat*0.14+h*0.22;
    vec3 col=tone<0.5?deep:(tone<0.72?base:lite);
    vec3 V=normalize(cameraPosition-vW);float sp=pow(max(dot(reflect(-sunD,n),V),0.0),48.0);
    col=mix(col,vec3(1.0),step(0.55,sp));
    col=mix(col,foam,step(0.75,h)*0.9);
    float e=kind<0.5?rad-length(q-ctr):rect.w*0.5-abs(q.y-(rect.y+rect.w*0.5));
    float fe=step(e,0.1+0.07*hh(floor(f*16.0)+floor(t*6.0)));
    if(ringR>0.0){float dr=abs(length(q-ctr)-ringR);fe=max(fe,step(dr,0.07+0.08*hh(q*16.0+floor(t*8.0))));}
    col=mix(col,foam,fe);
    col=mix(col,fogC,smoothstep(fN,fF,vD));
    gl_FragColor=vec4(col,0.5);}`;
function surface(sim, y, segX, segZ, o) {
  const g = new THREE.PlaneGeometry(sim.wd, sim.dd, segX, segZ); g.rotateX(-PI / 2); g.translate(sim.x0 + sim.wd / 2, 0, sim.z0 + sim.dd / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: { hm: { value: sim.tex }, rect: { value: new THREE.Vector4(sim.x0, sim.z0, sim.wd, sim.dd) }, tx: { value: new THREE.Vector2(1 / sim.nx, 1 / sim.nz) },
      off: { value: 0 }, amp: { value: o.amp }, cell: { value: sim.wd / sim.nx }, t: waterT, flow: { value: o.flow || 0 }, kind: { value: o.kind },
      ctr: { value: new THREE.Vector2(0, 0) }, rad: { value: o.rad || 0 }, ringR: { value: o.ringR || 0 },
      sunD: { value: sunDir }, deep: { value: new THREE.Color(0x2f86c9) }, base: { value: new THREE.Color(0x46ade6) }, lite: { value: new THREE.Color(0x9fdcff) },
      foam: { value: new THREE.Color(0xf4fbff) }, fogC: { value: FOG }, fN: { value: scene.fog.near }, fF: { value: scene.fog.far } },
    vertexShader: SURF_VS, fragmentShader: SURF_FS
  });
  const m = new THREE.Mesh(g, mat); m.position.y = y; newWater.add(m); sim.mat = mat; return m;
}
// nastri: cascata, trabocchi delle vasche e zampillo, con strisce che scorrono
const RIB_VS = 'varying vec2 vUv;varying float vD;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.0);vD=-mv.z;gl_Position=projectionMatrix*mv;}';
const RIB_FS = `uniform float t,NU,NV,speed,gap,fadeA,fN,fF;uniform vec3 deep,base,lite,fogC;varying vec2 vUv;varying float vD;
  float hh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  void main(){
    float cu=floor(vUv.x*NU),ph=hh(vec2(cu,3.1));
    if(ph<gap)discard;
    float cv=floor(vUv.y*NV-t*speed*(0.8+0.4*ph));
    float s=fract(cv/9.0+ph);
    vec3 col=s<0.22?lite:(s<0.7?base:deep);
    if(hh(vec2(cu,cv))>0.93)col=vec3(1.0);
    if(fadeA<1.0&&hh(vec2(cu*1.7,cv))<smoothstep(fadeA,1.0,vUv.y))discard;
    col=mix(col,fogC,smoothstep(fN,fF,vD));
    gl_FragColor=vec4(col,1.0);}`;
function ribbon(nu, nv, fn, o) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const u = i / nu, v = j / nv, p = fn(u, v); pos.push(p[0], p[1], p[2]); uv.push(u, v); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeBoundingSphere();
  const mat = new THREE.ShaderMaterial({
    uniforms: { t: waterT, NU: { value: o.NU }, NV: { value: o.NV }, speed: { value: o.speed }, gap: { value: o.gap }, fadeA: { value: o.fadeA == null ? 2 : o.fadeA },
      deep: { value: new THREE.Color(0x4aa8e0) }, base: { value: new THREE.Color(0x9fdcff) }, lite: { value: new THREE.Color(0xeaf8ff) }, fogC: { value: FOG }, fN: { value: scene.fog.near }, fF: { value: scene.fog.far } },
    vertexShader: RIB_VS, fragmentShader: RIB_FS, side: THREE.DoubleSide
  });
  newWater.add(new THREE.Mesh(g, mat));
}