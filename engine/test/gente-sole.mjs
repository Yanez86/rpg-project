// Prova di fumo delle comparse di Valfiorita al sole (reference/gente-sole.js) con un finto VF e il finto three.
import * as THREE from 'three';
const canvas2d = () => new Proxy({}, { get: (t, k) => k === 'createImageData' ? ((w, h) => ({ data: new Uint8ClampedArray(w * h * 4) })) : k === 'getImageData' ? ((x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) })) : (typeof k === 'string' ? (() => ({ addColorStop() {} })) : undefined), set: () => true });
const obs = [[0, 0, 4.45], [7, 3, 1.75]], player = { x: -1, z: 10, y: 1.7 }; let eye = 0;
const collide = p => { for (const o of obs) { const dx = p.x - o[0], dz = p.z - o[1], d = Math.hypot(dx, dz), m = o[2] + 0.3; if (d < m && d > 1e-4) { p.x = o[0] + dx / d * m; p.z = o[1] + dz / d * m; } } };
Object.assign(globalThis, { window: globalThis, document: { createElement: () => ({ width: 0, height: 0, getContext: canvas2d }) },
  VF: { scene: new THREE.Scene(), camera: {}, renderer: {}, groundAt: (x, z) => Math.hypot(x, z) < 11.2 ? 0.25 : 0, collide, obs, player, PLAZA: 11.2, ISL: 46, setEye: h => { eye = h; }, onTick: null } });
process.on('uncaughtException', e => { console.error('ERRORE:', e); process.exit(1); });
await import('../../reference/gente-sole.js');
if (!VF.onTick) throw new Error('onTick non impostato');
for (let i = 0; i < 600; i++) { player.x = -1 + Math.sin(i * 0.01) * 3; VF.onTick(1 / 30); }
console.log('ok · gente-sole.js · ' + VF.onTick.length + ' · comparse aggiornate 600 volte');
