// Pioggia: segmenti sottili quasi verticali attorno a chi guarda, schizzi dove toccano terra,
// gocce che cadono dai punti di gronda (E.dripPoints). Di notte le gocce si colorano vicino alle luci.
import * as THREE from 'three';
import { E } from '../core/context.js';
import { rnd, R } from '../core/rng.js';
import { PS, particleTextures } from './particles.js';

const wrap = (v, c, h) => c + ((((v - c + h) % (2 * h)) + 2 * h) % (2 * h)) - h;

/**
 * opts: { count (1700), groundAt(x,z)→y, litBy()→[{x,y,z,k}] (solo notte) }
 * Restituisce update(dt, center{x,z}).
 */
export function createRain(opts) {
  opts = opts || {}; const N = opts.count || 1700, groundAt = opts.groundAt || (() => 0), night = E.mood === 'night';
  const pos = new Float32Array(N * 6), vel = new Float32Array(N), len = new Float32Array(N);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  let col = null; if (night) { col = new Float32Array(N * 6); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
  const mat = night ? new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.7, depthWrite: false })
    : new THREE.LineBasicMaterial({ color: 0xc4ccc8, transparent: true, opacity: 0.55, depthWrite: false });
  const lines = new THREE.LineSegments(geo, mat); lines.frustumCulled = false; E.scene.add(lines);
  for (let i = 0; i < N; i++) { vel[i] = R(8, 11); len[i] = R(0.25, 0.5); pos[i * 6] = R(-20, 20); pos[i * 6 + 1] = R(0, 15); pos[i * 6 + 2] = R(-20, 20); }
  const splash = PS(320, particleTextures().dot, false); let si = 0;
  const emit = (x, y, z) => { const k = si++ % splash.n, a = rnd() * 7; splash.pos[k * 3] = x; splash.pos[k * 3 + 1] = y; splash.pos[k * 3 + 2] = z; splash.vel[k * 3] = Math.cos(a) * R(.2, .5); splash.vel[k * 3 + 1] = R(.6, 1.1); splash.vel[k * 3 + 2] = Math.sin(a) * R(.2, .5); splash.life[k] = .25; splash.size[k] = R(.03, .06); splash.setCol(k, 0xd0d8d4); };
  // gocce dalle grondaie
  const DN = opts.drips ?? 320, dpos = new Float32Array(DN * 6), dvel = new Float32Array(DN);
  const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dl = new THREE.LineSegments(dgeo, new THREE.LineBasicMaterial({ color: 0xd0d8d4, transparent: true, opacity: 0.7, depthWrite: false })); dl.frustumCulled = false; E.scene.add(dl);
  for (let i = 0; i < DN; i++) dpos[i * 6 + 1] = -99;

  return function update(dt, center) {
    const lights = night && opts.litBy ? opts.litBy() : null;
    for (let i = 0; i < N; i++) {
      let x = pos[i * 6], y = pos[i * 6 + 1], z = pos[i * 6 + 2];
      y -= vel[i] * dt; x = wrap(x + 0.9 * dt, center.x, 20); z = wrap(z + 0.6 * dt, center.z, 20);
      const gy = groundAt(x, z);
      if (y < gy) { if (rnd() < .3) emit(x, gy + .02, z); y = gy + R(12, 15); }
      pos[i * 6] = x; pos[i * 6 + 1] = y; pos[i * 6 + 2] = z; pos[i * 6 + 3] = x - 0.04; pos[i * 6 + 4] = y + len[i]; pos[i * 6 + 5] = z - 0.03;
      if (col) { let L = 0; for (const q of lights || []) { const dx = x - q.x, dy = y - q.y, dz = z - q.z; L += q.k / (1 + (dx * dx + dy * dy + dz * dz) * 0.5); } L = Math.min(1.6, L);
        const r = 0.16 + L * 0.95, g = 0.19 + L * 0.68, b = 0.23 + L * 0.4; col.set([r, g, b, r * .7, g * .7, b * .7], i * 6); }
    }
    geo.attributes.position.needsUpdate = true; if (col) geo.attributes.color.needsUpdate = true;
    const D = E.dripPoints;
    for (let i = 0; i < DN; i++) {
      let y = dpos[i * 6 + 1];
      if (y < -50) { if (D.length && rnd() < 0.08) { const p = D[(rnd() * D.length) | 0]; if (Math.hypot(p.x - center.x, p.z - center.z) < 28) { dpos[i * 6] = p.x + R(-.2, .2); dpos[i * 6 + 2] = p.z + R(-.2, .2); dpos[i * 6 + 1] = p.y; dvel[i] = R(0, 1); } } continue; }
      dvel[i] += 9.8 * dt; y -= dvel[i] * dt; const x = dpos[i * 6], z = dpos[i * 6 + 2];
      if (y < groundAt(x, z)) { emit(x, groundAt(x, z) + .02, z); dpos[i * 6 + 1] = -99; dpos[i * 6 + 4] = -99; continue; }
      dpos[i * 6 + 1] = y; dpos[i * 6 + 3] = x; dpos[i * 6 + 4] = y + 0.12 + dvel[i] * 0.02; dpos[i * 6 + 5] = z;
    }
    dgeo.attributes.position.needsUpdate = true;
    { const p = splash.pos, v = splash.vel; for (let i = 0; i < splash.n; i++) { splash.life[i] -= dt; if (splash.life[i] <= 0) { splash.alpha[i] = 0; continue; } v[i * 3 + 1] -= 9.8 * dt; p[i * 3] += v[i * 3] * dt; p[i * 3 + 1] += v[i * 3 + 1] * dt; p[i * 3 + 2] += v[i * 3 + 2] * dt; splash.alpha[i] = splash.life[i] * 3; } splash.flush(); }
  };
}
