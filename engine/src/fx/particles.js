// Sistema di particelle a punti (THREE.Points) con dimensione, colore e alpha per particella.
import * as THREE from 'three';
import { E } from '../core/context.js';
import { rnd } from '../core/rng.js';
import { PI } from '../core/geometry.js';

function ptex(draw) { const c = document.createElement('canvas'); c.width = c.height = 64; draw(c.getContext('2d')); return new THREE.CanvasTexture(c); }
let PT = null;
/** texture delle particelle: dot, soft, star, petal */
export function particleTextures() {
  return PT || (PT = {
    dot: ptex(x => { x.fillStyle = '#fff'; x.beginPath(); x.arc(32, 32, 26, 0, 7); x.fill(); }),
    soft: ptex(x => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }),
    star: ptex(x => { x.fillStyle = '#fff'; x.beginPath(); for (let i = 0; i < 8; i++) { const a = i * PI / 4, r = i % 2 ? 7 : 31; x.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } x.closePath(); x.fill(); }),
    petal: ptex(x => { x.fillStyle = '#fff'; x.beginPath(); x.ellipse(32, 32, 28, 15, 0.6, 0, 7); x.fill(); }),
  });
}
/** scala della dimensione dei punti: aggiornarla al resize con setParticleScale() */
export const psScale = { value: 1 };
export function setParticleScale(pixelRatio) { const c = E.camera; psScale.value = innerHeight * pixelRatio / (2 * Math.tan(c.fov * PI / 360)); }

const VS = `attribute float size;attribute float alpha;attribute vec3 pcolor;uniform float uScale;varying float vA;varying vec3 vC;
void main(){vA=alpha;vC=pcolor;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=min(size*uScale/-mv.z,256.0);gl_Position=projectionMatrix*mv;}`;
const FS = `uniform sampler2D map;varying float vA;varying vec3 vC;
void main(){vec4 t=texture2D(map,gl_PointCoord);float a=t.a*vA;if(a<0.02)discard;gl_FragColor=vec4(vC*t.rgb,a);}`;

/** n particelle con la texture map; additive per scintille e luci */
export function PS(n, map, additive) {
  const g = new THREE.BufferGeometry();
  const o = { n, pos: new Float32Array(n * 3), col: new Float32Array(n * 3), size: new Float32Array(n), alpha: new Float32Array(n), vel: new Float32Array(n * 3), life: new Float32Array(n), ph: new Float32Array(n), g };
  g.setAttribute('position', new THREE.BufferAttribute(o.pos, 3)); g.setAttribute('pcolor', new THREE.BufferAttribute(o.col, 3));
  g.setAttribute('size', new THREE.BufferAttribute(o.size, 1)); g.setAttribute('alpha', new THREE.BufferAttribute(o.alpha, 1));
  const m = new THREE.ShaderMaterial({ uniforms: { map: { value: map }, uScale: psScale }, vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
  const p = new THREE.Points(g, m); p.frustumCulled = false; E.scene.add(p); o.pts = p;
  const c = new THREE.Color(); o.setCol = (i, hex) => { c.setHex(hex); o.col[i * 3] = c.r; o.col[i * 3 + 1] = c.g; o.col[i * 3 + 2] = c.b; };
  o.flush = () => { for (const k of ['position', 'pcolor', 'size', 'alpha']) g.attributes[k].needsUpdate = true; };
  for (let i = 0; i < n; i++) o.ph[i] = rnd() * 100;
  return o;
}
