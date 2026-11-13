// Luci della notte: le finestre "buttano" luce fuori. Sorgenti in E.lights {x,y,z,nx,nz,k,kind}
// kind: 'w' finestra (nx,nz = normale verso l'esterno) · 'l' lampione · 'p' lanterna di carta · 'c' cristallo/magia.
//  1) light culling: poche PointLight vere spostate ogni frame sulle sorgenti più vicine (quante ne regge la GPU)
//  2) light decal / pozze di luce: macchie additive a terra davanti a ogni sorgente
//  3) coni volumetrici finti che escono dalle finestre
//  4) halo: aloni morbidi additivi attorno alle sorgenti
import * as THREE from 'three';
import { E } from '../core/context.js';
import { rnd } from '../core/rng.js';
import { PI } from '../core/geometry.js';
import { pix, G } from '../textures/pix.js';
import { softSys } from '../fx/soft.js';

// somma additiva che lascia intatto il canale alpha (maschera dei riflessi)
const ADD = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor };

/**
 * opts: { groundAt(x,z)→y }. Da chiamare dopo aver costruito il mondo (E.lights pieno).
 * Restituisce { update(T), active() } — active() sono le sorgenti più vicine (per tingere pioggia e nebbia).
 */
export function createNightLights(opts) {
  opts = opts || {}; const groundAt = opts.groundAt || (() => 0), LIGHTS = E.lights;
  const gl = E.renderer.getContext(), FUV = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) || 64;
  const NL = FUV >= 1000 ? 8 : FUV >= 200 ? 6 : FUV >= 120 ? 4 : 2, plights = [];
  for (let i = 0; i < NL; i++) { const L = new THREE.PointLight(0xffa458, 0, 7.5, 2); E.scene.add(L); plights.push(L); }
  let active = [], checks = 0;
  function checkPrograms() { // se uno shader non compila (limite di uniform), via le luci vere e si ricompila
    const bad = (E.renderer.info.programs || []).some(p => p.diagnostics && !p.diagnostics.runnable);
    if (bad && plights.length) { plights.splice(0).forEach(L => E.scene.remove(L)); E.scene.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.needsUpdate = true); }); }
  }
  // pozze di luce
  const poolTex = pix(32, (u, v) => { const d = Math.hypot((u + .5) / 16 - 1, (v + .5) / 16 - 1); const a = Math.max(0, 1 - d); const q = Math.round(a * a * 6) / 6; return G(q * 255); });
  const poolMat = new THREE.ShaderMaterial(Object.assign({ uniforms: { map: { value: poolTex }, dens: { value: E.fogDensity } },
    vertexShader: 'varying vec2 vUv;varying vec3 vC;varying float vD;void main(){vUv=uv;vC=instanceColor;vec4 mv=viewMatrix*modelMatrix*instanceMatrix*vec4(position,1.0);vD=-mv.z;gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'uniform sampler2D map;uniform float dens;varying vec2 vUv;varying vec3 vC;varying float vD;void main(){float a=texture2D(map,vUv).r*exp(-dens*dens*vD*vD);gl_FragColor=vec4(vC*a,1.0);}' }, ADD));
  { const n = Math.max(1, LIGHTS.length), pg = new THREE.PlaneGeometry(1, 1); pg.rotateX(-PI / 2); const m = new THREE.InstancedMesh(pg, poolMat, n), d = new THREE.Object3D(), c = new THREE.Color();
    LIGHTS.forEach((q, i) => { const h = Math.max(0.5, q.y - groundAt(q.x, q.z)), out = q.kind === 'w' ? 0.9 + h * 0.35 : 0; const x = q.x + q.nx * out, z = q.z + q.nz * out;
      const s = q.kind === 'w' ? 2.2 + h * 0.45 : q.kind === 'l' ? 5.5 : q.kind === 'c' ? 6 : 2.6; d.position.set(x, groundAt(x, z) + 0.03, z); d.rotation.set(0, Math.atan2(q.nx, q.nz), 0); d.scale.set(s, 1, s * (q.kind === 'w' ? 1.3 : 1)); d.updateMatrix(); m.setMatrixAt(i, d.matrix);
      const k = (q.kind === 'w' ? 0.55 / (1 + h * 0.25) : q.kind === 'l' ? 0.6 : q.kind === 'c' ? 0.3 : 0.4); c.setRGB(1.0 * k, (q.kind === 'c' ? 0.95 : 0.6) * k, (q.kind === 'c' ? 1.0 : 0.3) * k); m.setColorAt(i, c); });
    m.count = LIGHTS.length; m.frustumCulled = false; m.renderOrder = 3; E.scene.add(m); }
  // coni di luce dalle finestre: tronchi di piramide che si allargano verso il basso e sfumano
  { const pos = [], fad = [], idx = []; let v0 = 0;
    LIGHTS.filter(q => q.kind === 'w').forEach(q => { const nx = q.nx, nz = q.nz, tx = -nz, tz = nx, len = 2.6, dn = Math.min(q.y - groundAt(q.x, q.z) - 0.1, 1.6);
      const near = [[-0.32, -0.42], [0.32, -0.42], [0.32, 0.42], [-0.32, 0.42]], far = [[-1.0, -1.0], [1.0, -1.0], [1.0, 0.7], [-1.0, 0.7]];
      const P0 = near.map(([a, b]) => [q.x + tx * a, q.y + b, q.z + tz * a]), P1 = far.map(([a, b]) => [q.x + tx * a + nx * len, q.y + b - dn, q.z + tz * a + nz * len]);
      for (let e = 0; e < 4; e++) { const e2 = (e + 1) % 4;[P0[e], P0[e2], P1[e2], P1[e]].forEach((p, k) => { pos.push(...p); fad.push(k < 2 ? 0 : 1, (k === 0 || k === 3) ? 0 : 1); }); idx.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3); v0 += 4; } });
    if (pos.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('fade', new THREE.Float32BufferAttribute(fad, 2)); g.setIndex(idx);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial(Object.assign({ uniforms: { dens: { value: E.fogDensity }, t: E.time }, side: THREE.DoubleSide,
        vertexShader: 'attribute vec2 fade;varying vec2 vF;varying float vD;varying vec3 vW;void main(){vF=fade;vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;vec4 mv=viewMatrix*w;vD=-mv.z;gl_Position=projectionMatrix*mv;}',
        fragmentShader: 'uniform float dens,t;varying vec2 vF;varying float vD;varying vec3 vW;void main(){float a=pow(1.0-vF.x,1.6)*(0.55+0.45*sin(vF.y*3.14159))*0.13;a*=0.85+0.15*sin(vW.y*9.0+t*6.0+vW.x*3.0);a*=exp(-dens*dens*vD*vD)*smoothstep(0.3,2.0,vD);gl_FragColor=vec4(vec3(1.0,0.66,0.34)*a,1.0);}' }, ADD)));
      m.frustumCulled = false; m.renderOrder = 6; E.scene.add(m); } }
  // aloni
  const halo = softSys(Math.max(1, LIGHTS.length)); Object.assign(halo.mesh.material, ADD); halo.mesh.material.needsUpdate = true; halo.mesh.renderOrder = 7;
  LIGHTS.forEach((q, i) => { const s = q.kind === 'w' ? 1.5 : q.kind === 'l' ? 2.2 : q.kind === 'c' ? 3 : 1.3; const t = q.kind === 'c' ? [0.3, 0.75, 0.8] : q.kind === 'l' ? [0.85, 0.68, 0.42] : q.kind === 'p' ? [0.9, 0.4, 0.22] : [0.85, 0.52, 0.26];
    halo.set(i, q.x + q.nx * 0.25, q.y, q.z + q.nz * 0.25, s, 0.55, rnd() * 6, t); }); halo.flush();

  return {
    active: () => active,
    update(T) {
      if (checks < 3 && ++checks > 1) checkPrograms();
      const cx = E.camera.position.x, cz = E.camera.position.z;
      active = LIGHTS.map(q => ({ q, d: (q.x - cx) ** 2 + (q.z - cz) ** 2 })).sort((a, b) => a.d - b.d).slice(0, Math.max(NL, 8)).map(o => o.q);
      plights.forEach((L, i) => { const q = active[i]; if (!q) { L.intensity = 0; return; } const out = q.kind === 'w' ? 0.55 : 0; L.position.set(q.x + q.nx * out, q.y, q.z + q.nz * out);
        L.color.setHex(q.kind === 'l' ? 0xffcf8a : q.kind === 'c' ? 0x8ff0ff : q.kind === 'p' ? 0xff7a48 : 0xffa458);
        const fl = q.kind === 'p' ? 0.85 + 0.15 * Math.sin(T * 9 + q.x) + 0.08 * Math.sin(T * 23 + q.z) : 0.97 + 0.03 * Math.sin(T * 3 + q.x);
        L.intensity = (q.kind === 'w' ? 1.25 : q.kind === 'l' ? 1.6 : 1.1) * q.k * fl; L.distance = q.kind === 'w' ? 7 : 8.5; });
      const a = halo.al; LIGHTS.forEach((q, i) => { a[i] = (q.kind === 'p' ? 0.5 + 0.12 * Math.sin(T * 9 + q.x) : 0.5) * (q.kind === 'w' ? 0.85 : 1); }); halo.g.attributes.ial.needsUpdate = true;
    }
  };
}
