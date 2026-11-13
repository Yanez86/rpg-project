// Atmosfera: nebbia esponenziale e luci per il giorno di pioggia e per la notte di pioggia.
// Valori in docs/estetica.md §5.
import * as THREE from 'three';
import { E } from '../core/context.js';

const MOODS = {
  rain: { fog: 0x97a29a, dens: 0.03, hemi: [0xc8d0c8, 0x4a5044, 0.95], amb: [0xb8c4bc, 0.18], sun: [0xdfe4dc, 0.28], bg: 0x6f7a72 },
  night: { fog: 0x26343a, dens: 0.034, hemi: [0x5a6e88, 0x1a1c1a, 0.32], amb: [0x3a4658, 0.12], sun: [0x8aa4d0, 0.16], bg: 0x12181b },
};
/**
 * Imposta nebbia e luci per E.mood. Restituisce update(center) che fa seguire a chi cammina
 * il sole (o la luna) e la camera delle ombre.
 */
export function setupAtmosphere() {
  const M = MOODS[E.mood] || MOODS.rain, s = E.scene;
  E.fog.setHex(M.fog); E.fogDensity = M.dens;     // FogExp2 copia il colore: lo si imposta qui, prima di creare la nebbia
  s.fog = new THREE.FogExp2(E.fog, M.dens); s.background = new THREE.Color(M.bg);
  s.add(new THREE.HemisphereLight(M.hemi[0], M.hemi[1], M.hemi[2]));
  s.add(new THREE.AmbientLight(M.amb[0], M.amb[1]));
  const sun = new THREE.DirectionalLight(M.sun[0], M.sun[1]);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 160 });
  s.add(sun); s.add(sun.target);
  return function update(center) {
    const sx = Math.round(center.x / 2) * 2, sz = Math.round(center.z / 2) * 2, d = E.sunDir;
    sun.target.position.set(sx, 0, sz); sun.position.set(sx + d.x * 70, d.y * 70, sz + d.z * 70);
  };
}
