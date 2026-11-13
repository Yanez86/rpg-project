// Abitante del borgo: marionetta a pezzi rigidi (anca, busto, testa, braccia e gambe a due segmenti, mantello),
// con varianti casuali (carnagione, capelli, tunica, cappuccio/cappello, barba) e quattro animazioni:
// 'fermo', 'cammina', 'corre', 'saluta'. Guarda verso +z, i piedi sono a y=0. Ricetta: docs/oggetti.md › Abitante.
import * as THREE from 'three';
import { rnd, R, pick, hn } from '../core/rng.js';
import { PI } from '../core/geometry.js';
import { joint, piece, charMat, charTex, makeClip, animator } from './puppet.js';

const SKINS = [[226, 186, 152], [205, 158, 120], [168, 118, 84], [120, 82, 58], [240, 206, 176]];
const HAIRS = [0x2a1e16, 0x4a3020, 0x7a5030, 0xa88850, 0x8a8a84, 0x5a2a1a];
const TUNICS = [0x5a6a3a, 0x6a4a32, 0x3e5060, 0x7a3a2c, 0x6a5a3a, 0x4a4a5a, 0x5a3a4a];
const CLOAKS = [0x3a3a32, 0x2e3a3a, 0x4a3a2a, 0x3a2e2a, 0x2a3040];
const TROUSERS = [0x4a3e32, 0x3a3a36, 0x5a4a3a, 0x3e3428];

let T = null;
function textures() {
  if (T) return T;
  const n = (u, v, s) => hn(u, v, s);
  T = {
    cloth: charTex(16, 16, (u, v) => { let b = 200 + ((u + v) % 2 ? 10 : -10) + (n(u, v, 300) - 0.5) * 30; if (n(u >> 2, v, 301) < 0.08) b -= 35; return [b, b, b]; }),
    leather: charTex(16, 16, (u, v) => { let b = 170 + (n(u, v, 302) - 0.5) * 40; if (n(u, v >> 1, 303) < 0.06) b -= 50; if (v === 0) b += 30; return [b, b, b]; }),
    hair: charTex(16, 16, (u, v) => { let b = 190 + Math.sin(u * 1.7 + n(u, 0, 304) * 4) * 25 + (n(u, v, 305) - 0.5) * 20; return [b, b, b]; }),
  };
  return T;
}
function faceTex(skin, hair, beard) {
  const hc = new THREE.Color(hair), h = [hc.r * 255, hc.g * 255, hc.b * 255];
  return charTex(16, 16, (u, v) => {
    const k = 0.94 + hn(u, v, 310) * 0.08; let c = skin.map(x => x * k);
    if (v <= 2) c = h.map(x => x * (0.9 + hn(u, v, 311) * 0.2));                         // frangia
    if (v === 5 && (u >= 3 && u <= 6 || u >= 9 && u <= 12)) c = h.map(x => x * 0.8);      // sopracciglia
    if (v >= 7 && v <= 8 && (u === 4 || u === 11)) c = [40, 30, 26];                       // pupille
    if (v >= 7 && v <= 8 && (u === 5 || u === 10)) c = [236, 232, 220];                    // bianco degli occhi
    if (v === 10 && (u === 7 || u === 8)) c = skin.map(x => x * 0.8);                       // ombra del naso
    if (v === 12 && u >= 6 && u <= 9) c = [skin[0] * 0.7, skin[1] * 0.5, skin[2] * 0.5];    // bocca
    if (v >= 13 && (u <= 1 || u >= 14)) c = skin.map(x => x * 0.88);
    if (beard && v >= 11 && (u <= 4 || u >= 11 || v >= 13) && !(v === 12 && u >= 6 && u <= 9)) c = h.map(x => x * (0.85 + hn(u, v, 312) * 0.2));
    return c;
  });
}

/** crea un abitante; opts: { seed } (varianti). Restituisce { root, anim } — anim.play('cammina') */
export function villager(opts) {
  opts = opts || {}; const tx = textures();
  const skin = pick(SKINS), hair = pick(HAIRS), tunic = pick(TUNICS), cloak = pick(CLOAKS), trous = pick(TROUSERS), beard = rnd() < 0.4, hat = pick(['cappuccio', 'cappello', 'nessuno', 'nessuno']);
  const M = {
    tunic: charMat(tunic, tx.cloth), cloak: charMat(cloak, tx.cloth), trous: charMat(trous, tx.cloth),
    leather: charMat(0x4a3424, tx.leather), belt: charMat(0x2e2218, tx.leather), brass: charMat(0xb08a48),
    skin: charMat(new THREE.Color(skin[0] / 255, skin[1] / 255, skin[2] / 255).getHex()), hair: charMat(hair, tx.hair),
    face: charMat(0xffffff, faceTex(skin, hair, beard), 'face' + rnd()),
  };
  const root = new THREE.Group(); root.name = 'abitante';
  const hips = joint(root, 'anca', 0, 0.93, 0);
  piece(hips, 0.34, 0.16, 0.2, M.trous, 0, -0.02, 0);
  piece(hips, 0.4, 0.24, 0.25, M.tunic, 0, -0.1, 0);                                     // gonnella della tunica
  const torso = joint(hips, 'busto', 0, 0.05, 0);
  piece(torso, 0.38, 0.46, 0.22, M.tunic, 0, 0.23, 0);
  piece(torso, 0.4, 0.06, 0.24, M.belt, 0, 0.02, 0); piece(torso, 0.06, 0.05, 0.02, M.brass, 0, 0.02, 0.125);
  piece(torso, 0.04, 0.56, 0.012, M.leather, 0.02, 0.24, 0.116, [0, 0, 0.62]);                // tracolla
  piece(torso, 0.14, 0.12, 0.08, M.leather, -0.2, 0.0, 0.06);                                 // bisaccia
  piece(torso, 0.44, 0.09, 0.27, M.cloak, 0, 0.44, 0);                                        // mantellina sulle spalle
  const cape = joint(torso, 'mantello', 0, 0.46, -0.12); piece(cape, 0.42, 0.84, 0.03, M.cloak, 0, -0.42, 0);
  const neck = joint(torso, 'collo', 0, 0.47, 0); piece(neck, 0.1, 0.07, 0.1, M.skin, 0, 0.03, 0);
  const head = joint(neck, 'testa', 0, 0.06, 0);
  piece(head, 0.24, 0.26, 0.24, [M.skin, M.skin, M.hair, M.skin, M.face, M.hair], 0, 0.13, 0);
  piece(head, 0.04, 0.05, 0.04, M.skin, 0, 0.11, 0.13);                                       // naso
  piece(head, 0.26, 0.06, 0.26, M.hair, 0, 0.27, 0); piece(head, 0.26, 0.2, 0.04, M.hair, 0, 0.18, -0.12);
  for (const s of [-1, 1]) piece(head, 0.03, 0.1, 0.03, M.skin, s * 0.13, 0.12, 0.01);        // orecchie
  if (hat === 'cappuccio') { piece(head, 0.3, 0.05, 0.3, M.cloak, 0, 0.3, -0.01); piece(head, 0.3, 0.3, 0.05, M.cloak, 0, 0.16, -0.145); for (const s of [-1, 1]) piece(head, 0.04, 0.28, 0.27, M.cloak, s * 0.15, 0.16, -0.01); }
  if (hat === 'cappello') { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.25, 0.025, 10), M.leather); b.position.y = 0.28; b.castShadow = true; head.add(b);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.12, 8), M.leather); c.position.y = 0.35; c.castShadow = true; head.add(c); }
  for (const s of [1, -1]) { const L = s > 0 ? 'S' : 'D';
    const sh = joint(torso, 'spalla' + L, s * 0.24, 0.42, 0);
    piece(sh, 0.11, 0.29, 0.12, M.tunic, 0, -0.12, 0);
    const el = joint(sh, 'gomito' + L, 0, -0.27, 0);
    piece(el, 0.1, 0.17, 0.11, M.tunic, 0, -0.07, 0); piece(el, 0.085, 0.08, 0.095, M.skin, 0, -0.19, 0); piece(el, 0.09, 0.08, 0.1, M.skin, 0, -0.27, 0.005);
    const hp = joint(hips, 'coscia' + L, s * 0.095, -0.06, 0);
    piece(hp, 0.13, 0.42, 0.14, M.trous, 0, -0.2, 0);
    const kn = joint(hp, 'ginocchio' + L, 0, -0.42, 0);
    piece(kn, 0.12, 0.3, 0.13, M.trous, 0, -0.15, 0); piece(kn, 0.15, 0.05, 0.15, M.leather, 0, -0.27, 0); piece(kn, 0.14, 0.15, 0.21, M.leather, 0, -0.37, 0.03);
  }
  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { root, anim: animator(root, villagerClips()) };
}

const TAU = PI * 2, cp = (x, k) => Math.pow(Math.max(0, x), k || 1);
/** le quattro clip dell'abitante (servono solo i nomi dei giunti: valgono per ogni variante) */
export function villagerClips() {
  const walk = (name, T, A, kneeA, armA, elbow, lean, bob, capeA) => makeClip(name, T, t => {
    const p = TAU * t / T, s = Math.sin(p);
    return {
      cosciaS: [-A * s, 0, 0], cosciaD: [A * s, 0, 0],
      ginocchioS: [0.08 + kneeA * cp(Math.cos(p), 1.4), 0, 0], ginocchioD: [0.08 + kneeA * cp(-Math.cos(p), 1.4), 0, 0],
      spallaS: [armA * s, 0, 0.06], spallaD: [-armA * s, 0, -0.06],
      gomitoS: [elbow - 0.25 * cp(-s), 0, 0], gomitoD: [elbow - 0.25 * cp(s), 0, 0],
      busto: [lean, 0.07 * s, 0], testa: [-lean * 0.6, -0.05 * s, 0], collo: [0, 0, 0],
      mantello: [capeA + 0.06 * Math.sin(2 * p), 0, 0.03 * s],
      $pos: { anca: [0, 0.93 + bob * Math.cos(2 * p), 0] },
    };
  });
  const idle = makeClip('fermo', 4, t => {
    const b = Math.sin(TAU * t / 4);
    return {
      cosciaS: [0, 0, 0.03], cosciaD: [0, 0, -0.03], ginocchioS: [0.04, 0, 0], ginocchioD: [0.04, 0, 0],
      spallaS: [0.03 * b, 0, 0.07], spallaD: [-0.03 * b, 0, -0.07], gomitoS: [-0.12, 0, 0], gomitoD: [-0.12, 0, 0],
      busto: [0.015 * b, 0, 0], collo: [0, 0, 0], testa: [0.05 * Math.sin(TAU * t / 2), 0.25 * Math.sin(TAU * t / 4 + 1), 0],
      mantello: [0.04 + 0.02 * b, 0, 0], $pos: { anca: [0, 0.925 + 0.004 * b, 0] },
    };
  });
  const wave = makeClip('saluta', 1.6, t => {
    const w = Math.sin(TAU * 2 * t / 1.6), b = Math.sin(TAU * t / 1.6);
    return {
      cosciaS: [0, 0, 0.03], cosciaD: [0, 0, -0.03], ginocchioS: [0.04, 0, 0], ginocchioD: [0.04, 0, 0],
      spallaS: [0.02 * b, 0, 0.07], gomitoS: [-0.12, 0, 0],
      spallaD: [-0.15, 0, -2.55], gomitoD: [0, 0, -0.45 + 0.45 * w],
      busto: [0, -0.06, -0.03], collo: [0, 0, 0], testa: [0.05, -0.12, 0.05], mantello: [0.05, 0, 0],
      $pos: { anca: [0, 0.925, 0] },
    };
  });
  return [idle, walk('cammina', 1.0, 0.45, 0.65, 0.38, -0.22, 0.04, 0.012, 0.12), walk('corre', 0.62, 0.85, 1.25, 0.75, -1.25, 0.18, 0.03, 0.4), wave];
}
