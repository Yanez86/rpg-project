// Gatto: marionetta a pezzi rigidi (corpo, testa con orecchie, quattro zampe a due segmenti, coda a sei anelli),
// pelo tigrato in pixel-art e quattro animazioni: 'fermo', 'cammina', 'trotta', 'seduto'.
// Guarda verso +z, le zampe toccano y=0. Ricetta: docs/oggetti.md › Gatto.
import * as THREE from 'three';
import { rnd, pick, hn } from '../core/rng.js';
import { PI } from '../core/geometry.js';
import { joint, piece, charMat, charTex, makeClip, animator } from './puppet.js';

const COATS = [ // [base, strisce, ventre]
  [[196, 120, 60], [120, 66, 30], [236, 214, 186]],   // rosso tigrato
  [[128, 124, 118], [64, 62, 60], [214, 210, 204]],   // grigio tigrato
  [[52, 48, 46], [30, 28, 28], [230, 226, 220]],      // nero con petto bianco
  [[214, 196, 168], [150, 120, 90], [244, 236, 222]], // crema
];
function furTex(coat, kind) {
  const [b, s, w] = coat;
  return charTex(16, 16, (u, v) => {
    const k = 0.9 + hn(u, v, 320) * 0.16; let c = b;
    if (kind !== 'belly' && Math.sin(u * 1.1 + hn(u >> 2, v >> 3, 321) * 2.5 + v * 0.15) > 0.55) c = s;
    if (kind === 'belly') c = w;
    return c.map(x => x * k);
  });
}
function catFace(coat, eye) {
  const [b, s, w] = coat;
  return charTex(16, 16, (u, v) => {
    let c = b.map(x => x * (0.92 + hn(u, v, 322) * 0.12));
    if (v <= 4 && (u === 5 || u === 7 || u === 9) ) c = s;                                     // la "M" sulla fronte
    if (v >= 10) c = w.map(x => x * (0.95 + hn(u, v, 323) * 0.08));                            // muso chiaro
    if (v >= 6 && v <= 8 && ((u >= 3 && u <= 5) || (u >= 10 && u <= 12))) c = eye;              // occhi
    if (v >= 6 && v <= 8 && (u === 4 || u === 11)) c = [20, 18, 16];                            // pupilla a fessura
    if (v === 6 && (u === 3 || u === 10)) c = [240, 240, 220];                                  // riflesso
    if (v === 11 && (u === 7 || u === 8)) c = [196, 120, 120];                                  // naso
    return c;
  });
}

/** crea un gatto. Restituisce { root, anim } */
export function cat() {
  const coat = pick(COATS), eye = pick([[150, 190, 70], [210, 170, 60], [120, 170, 190]]);
  const M = { fur: charMat(0xffffff, furTex(coat), 'fur' + rnd()), belly: charMat(0xffffff, furTex(coat, 'belly'), 'bel' + rnd()), face: charMat(0xffffff, catFace(coat, eye), 'cf' + rnd()),
    ear: charMat(0xc89090), white: charMat(0xe8e4dc) };
  const root = new THREE.Group(); root.name = 'gatto';
  const body = joint(root, 'corpo', 0, 0.29, 0);
  piece(body, 0.17, 0.15, 0.4, [M.fur, M.fur, M.fur, M.belly, M.fur, M.fur], 0, 0, 0);
  piece(body, 0.15, 0.14, 0.1, [M.fur, M.fur, M.fur, M.belly, M.belly, M.fur], 0, -0.01, 0.17);
  const head = joint(body, 'testa', 0, 0.07, 0.2);
  piece(head, 0.15, 0.12, 0.12, [M.fur, M.fur, M.fur, M.belly, M.face, M.fur], 0, 0.03, 0.05);
  piece(head, 0.07, 0.045, 0.04, M.belly, 0, 0.0, 0.12);
  for (const s of [1, -1]) {
    const e = joint(head, s > 0 ? 'orecchioS' : 'orecchioD', s * 0.045, 0.09, 0.04);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.065, 4), M.fur); cone.position.y = 0.03; cone.rotation.y = PI / 4; cone.castShadow = true; e.add(cone);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.045, 4), M.ear); inner.position.set(0, 0.024, 0.012); inner.rotation.y = PI / 4; e.add(inner);
    for (const dy of [-0.008, 0.008]) piece(head, 0.09, 0.003, 0.003, M.white, s * 0.07, 0.0 + dy, 0.13, [0, 0, s * dy * 8]);   // baffi
  }
  for (const [n, x, z] of [['AS', 0.055, 0.15], ['AD', -0.055, 0.15], ['PS', 0.055, -0.15], ['PD', -0.055, -0.15]]) {
    const up = joint(body, 'zampa' + n, x, -0.05, z);
    piece(up, 0.055, 0.13, 0.065, M.fur, 0, -0.06, 0);
    const lo = joint(up, 'gamba' + n, 0, -0.12, 0);
    piece(lo, 0.045, 0.1, 0.05, M.fur, 0, -0.05, 0); piece(lo, 0.055, 0.025, 0.07, M.belly, 0, -0.105, 0.01);
  }
  let p = joint(body, 'coda0', 0, 0.05, -0.2);
  for (let i = 0; i < 6; i++) { piece(p, 0.04 - i * 0.003, 0.04 - i * 0.003, 0.075, i === 5 && coat === COATS[2] ? M.fur : M.fur, 0, 0, -0.035); if (i < 5) p = joint(p, 'coda' + (i + 1), 0, 0, -0.07); }
  return { root, anim: animator(root, catClips()) };
}

const TAU = PI * 2, cp = x => Math.max(0, x);
const tailPose = (o, t, base, amp, speed) => { for (let i = 0; i < 6; i++) o['coda' + i] = [base[i], amp * (0.5 + i * 0.15) * Math.sin(TAU * speed * t + i * 0.7), 0]; return o; };
const TAIL_UP = [0.75, -0.1, -0.12, -0.12, -0.1, -0.1];
/** le clip del gatto */
export function catClips() {
  const legs = (o, T, t, A, phases, liftF, liftH) => {
    for (const [n, ph] of Object.entries(phases)) {
      const f = TAU * (t / T - ph), front = n[0] === 'A';
      o['zampa' + n] = [-A * Math.sin(f), 0, 0];
      o['gamba' + n] = [front ? liftF * cp(Math.cos(f)) : -liftH * cp(Math.cos(f)), 0, 0];
    }
    return o;
  };
  const idle = makeClip('fermo', 4, t => {
    const b = Math.sin(TAU * t / 4), tw = Math.pow(cp(Math.sin(TAU * t / 2)), 12);
    const o = { corpo: [0, 0, 0], testa: [0.05 * Math.sin(TAU * t / 4 * 2), 0.3 * Math.sin(TAU * t / 4 + 0.5), 0], orecchioS: [0, 0, 0.25 * tw], orecchioD: [0, 0, 0],
      $pos: { corpo: [0, 0.29 + 0.003 * b, 0] } };
    for (const n of ['AS', 'AD', 'PS', 'PD']) { o['zampa' + n] = [0, 0, 0]; o['gamba' + n] = [0, 0, 0]; }
    return tailPose(o, t, TAIL_UP, 0.28, 0.25);
  });
  const walk = makeClip('cammina', 0.9, t => {
    const p = TAU * t / 0.9;
    const o = { corpo: [0, 0.04 * Math.sin(p), 0], testa: [0.04 * Math.sin(2 * p), -0.04 * Math.sin(p), 0], orecchioS: [0, 0, 0], orecchioD: [0, 0, 0],
      $pos: { corpo: [0, 0.29 + 0.006 * Math.cos(2 * p), 0] } };
    legs(o, 0.9, t, 0.42, { PS: 0, AS: 0.25, PD: 0.5, AD: 0.75 }, 0.7, 0.5);
    return tailPose(o, t, TAIL_UP, 0.18, 1 / 0.9);
  });
  const trot = makeClip('trotta', 0.48, t => {
    const p = TAU * t / 0.48;
    const o = { corpo: [0.03 * Math.sin(2 * p), 0, 0], testa: [-0.05 * Math.sin(2 * p), 0, 0], orecchioS: [0, 0, -0.15], orecchioD: [0, 0, 0.15],
      $pos: { corpo: [0, 0.295 + 0.012 * Math.cos(2 * p), 0] } };
    legs(o, 0.48, t, 0.75, { AS: 0, PD: 0, AD: 0.5, PS: 0.5 }, 1.1, 0.8);
    return tailPose(o, t, [0.35, 0.05, 0.02, 0.0, 0.0, 0.0], 0.08, 2 / 0.48);
  });
  const sit = makeClip('seduto', 4, t => {
    const b = Math.sin(TAU * t / 4);
    const o = { corpo: [-0.62, 0, 0], testa: [0.5 + 0.03 * b, 0.25 * Math.sin(TAU * t / 4), 0], orecchioS: [0, 0, 0], orecchioD: [0, 0, 0],
      zampaAS: [0.62, 0, 0], zampaAD: [0.62, 0, 0], gambaAS: [0, 0, 0], gambaAD: [0, 0, 0],
      zampaPS: [-0.9, 0, 0.15], zampaPD: [-0.9, 0, -0.15], gambaPS: [2.1, 0, 0], gambaPD: [2.1, 0, 0],
      $pos: { corpo: [0, 0.25 + 0.003 * b, -0.04] } };
    o.coda0 = [-0.35, 0.9, 0]; for (let i = 1; i < 6; i++) o['coda' + i] = [0.05, 0.28 + (i === 5 ? 0.35 * Math.sin(TAU * t / 2) : 0), 0];
    return o;
  });
  return [idle, walk, trot, sit];
}
