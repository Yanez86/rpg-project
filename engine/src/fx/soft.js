// Particelle morbide a billboard (soft particles) istanziate, con texture fbm: fumo, banchi di nebbia, nebbiolina.
// Si sfumano vicino alla camera e nella nebbia. Il canale alpha non tocca la maschera dei riflessi.
import * as THREE from 'three';
import { E } from '../core/context.js';
import { rnd, R, hn } from '../core/rng.js';
import { PI } from '../core/geometry.js';

let ST = null;
function softTex() {
  if (ST) return ST;
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), im = x.createImageData(S, S);
  const vn = (X, Y, o) => { const xi = Math.floor(X), yi = Math.floor(Y), xf = X - xi, yf = Y - yi, sm = t => t * t * (3 - 2 * t), a = hn(xi, yi, o), b = hn(xi + 1, yi, o), c2 = hn(xi, yi + 1, o), d = hn(xi + 1, yi + 1, o), u = sm(xf), v = sm(yf); return a + (b - a) * u + (c2 - a) * v + (a - b - c2 + d) * u * v; };
  for (let y = 0; y < S; y++) for (let X = 0; X < S; X++) {
    const dx = (X + .5) / S * 2 - 1, dy = (y + .5) / S * 2 - 1, r = Math.hypot(dx, dy), n = vn(X / 16, y / 16, 50) * .55 + vn(X / 8, y / 8, 51) * .3 + vn(X / 4, y / 4, 52) * .15;
    const a = Math.max(0, Math.min(1, (1 - r * 1.05 - (0.5 - n) * 0.9) * 1.6)); const k = (y * S + X) * 4; im.data[k] = im.data[k + 1] = im.data[k + 2] = 255; im.data[k + 3] = a * a * 255;
  }
  x.putImageData(im, 0, 0); return ST = new THREE.CanvasTexture(c);
}
/** n billboard morbidi: set(i,x,y,z,dimensione,alpha,rotazione,tinta[r,g,b]) poi flush() */
export function softSys(n) {
  const g = new THREE.InstancedBufferGeometry(), base = new THREE.PlaneGeometry(1, 1); g.index = base.index; g.setAttribute('position', base.attributes.position); g.setAttribute('uv', base.attributes.uv);
  const o = { n, off: new Float32Array(n * 3), sz: new Float32Array(n), al: new Float32Array(n), rot: new Float32Array(n), tint: new Float32Array(n * 3), life: new Float32Array(n), ph: new Float32Array(n), g };
  g.setAttribute('ioff', new THREE.InstancedBufferAttribute(o.off, 3)); g.setAttribute('isz', new THREE.InstancedBufferAttribute(o.sz, 1)); g.setAttribute('ial', new THREE.InstancedBufferAttribute(o.al, 1));
  g.setAttribute('irot', new THREE.InstancedBufferAttribute(o.rot, 1)); g.setAttribute('itint', new THREE.InstancedBufferAttribute(o.tint, 3)); g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: softTex() }, fogC: { value: E.fog }, dens: { value: E.fogDensity } }, transparent: true, depthWrite: false,
    vertexShader: `attribute vec3 ioff;attribute float isz,ial,irot;attribute vec3 itint;varying vec2 vUv;varying float vA,vD;varying vec3 vT;
      void main(){vec4 mv=viewMatrix*vec4(ioff,1.0);float c=cos(irot),s=sin(irot);mv.xy+=mat2(c,s,-s,c)*position.xy*isz;vUv=uv;vA=ial;vT=itint;vD=-mv.z;gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `uniform sampler2D map;uniform vec3 fogC;uniform float dens;varying vec2 vUv;varying float vA,vD;varying vec3 vT;
      void main(){float a=texture2D(map,vUv).a*vA*smoothstep(0.2,1.8,vD);if(a<0.004)discard;vec3 col=vT*(0.86+0.24*vUv.y);col=mix(col,fogC,1.0-exp(-dens*dens*vD*vD));gl_FragColor=vec4(col,a);}`
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 5; E.scene.add(m); o.mesh = m;
  for (let i = 0; i < n; i++) o.ph[i] = rnd() * 100;
  o.set = (i, x, y, z, size, a, r, t) => { o.off[i * 3] = x; o.off[i * 3 + 1] = y; o.off[i * 3 + 2] = z; o.sz[i] = size; o.al[i] = a; o.rot[i] = r; o.tint[i * 3] = t[0]; o.tint[i * 3 + 1] = t[1]; o.tint[i * 3 + 2] = t[2]; };
  o.flush = () => { for (const k of ['ioff', 'isz', 'ial', 'irot', 'itint']) g.attributes[k].needsUpdate = true; };
  return o;
}
const wrap = (v, c, h) => c + ((((v - c + h) % (2 * h)) + 2 * h) % (2 * h)) - h;
/**
 * Fumo dei comignoli (12 sbuffi per camino, da E.chimneys) e banchi di nebbia che derivano attorno a chi guarda.
 * Restituisce update(dt, T, center{x,z}).
 */
export function smokeAndFog(opts) {
  opts = opts || {}; const night = E.mood === 'night';
  const SMK = night ? [0.2, 0.21, 0.22] : [0.74, 0.75, 0.73], FOGT = night ? [0.14, 0.17, 0.19] : [0.7, 0.76, 0.72];
  E.scene.updateMatrixWorld(true);
  const bases = E.chimneys.map(([g, l]) => g.localToWorld(l.clone()));
  const smoke = softSys(Math.max(1, bases.length * 12));
  const banks = softSys(opts.banks ?? 40); for (let i = 0; i < banks.n; i++) { banks.off[i * 3] = R(-35, 35); banks.off[i * 3 + 1] = R(0.5, 2.4); banks.off[i * 3 + 2] = R(-35, 35); banks.sz[i] = R(6, 13); }
  return function update(dt, T, center) {
    { const s = smoke; for (let i = 0; i < s.n; i++) { const b = bases[Math.floor(i / 12)]; if (!b) { s.al[i] = 0; continue; } const L = 7, t = ((T + s.ph[i] * L) % L) / L, ph = s.ph[i];
      const up = 0.6 * L * t * (1 - t * 0.25), dr = t * L * 0.45;
      s.set(i, b.x + dr * 0.8 + Math.sin(t * 5 + ph) * 0.25 * t, b.y + up, b.z + dr * 0.6 + Math.cos(t * 4 + ph) * 0.25 * t, 0.45 + t * 2.8, 0.5 * Math.pow(Math.sin(PI * Math.min(1, t * 1.15)), 0.8) * (1 - t * 0.3), ph + t * 1.3, SMK); } s.flush(); }
    { const s = banks; for (let i = 0; i < s.n; i++) { const ph = s.ph[i]; s.off[i * 3] = wrap(s.off[i * 3] + 0.35 * dt, center.x, 35); s.off[i * 3 + 2] = wrap(s.off[i * 3 + 2] + 0.22 * dt, center.z, 35);
      const ex = s.off[i * 3] - center.x, ez = s.off[i * 3 + 2] - center.z, edge = 1 - Math.min(1, Math.max(Math.abs(ex), Math.abs(ez)) / 35);
      s.al[i] = (0.14 + 0.06 * Math.sin(T * 0.3 + ph)) * Math.min(1, edge * 3); s.rot[i] = ph + T * 0.02;
      let L = 0; if (night && opts.litBy) for (const q of opts.litBy()) { const dx = s.off[i * 3] - q.x, dz = s.off[i * 3 + 2] - q.z; L += q.k / (1 + (dx * dx + dz * dz) * 0.06); }
      L = Math.min(1.2, L); s.tint[i * 3] = FOGT[0] + L * 0.5; s.tint[i * 3 + 1] = FOGT[1] + L * 0.33; s.tint[i * 3 + 2] = FOGT[2] + L * 0.14; if (night) s.al[i] *= 1.4; } s.flush(); }
  };
}
