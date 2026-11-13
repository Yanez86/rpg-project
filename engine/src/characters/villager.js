// Umanoidi a marionetta con forme morbide (loft): l'abitante del borgo e l'elfa.
// Stessi giunti e stesse animazioni ('fermo', 'cammina', 'corre', 'saluta'), proporzioni diverse.
// Guardano verso +z, i piedi sono a y=0. Ricette: docs/oggetti.md › Abitante, Elfa.
import * as THREE from 'three';
import { rnd, R, pick, hn } from '../core/rng.js';
import { PI } from '../core/geometry.js';
import { joint, charMat, charTex, makeClip, animator } from './puppet.js';
import { loft, taper } from './loft.js';

let T = null;
function textures() {
  if (T) return T;
  T = {
    cloth: charTex(16, 16, (u, v) => { let b = 200 + ((u + v) % 2 ? 10 : -10) + (hn(u, v, 300) - 0.5) * 30; if (hn(u >> 2, v, 301) < 0.08) b -= 35; return [b, b, b]; }),
    fine: charTex(16, 16, (u, v) => { let b = 214 + (hn(u, v, 306) - 0.5) * 16 + (v % 4 === 0 ? -14 : 0); return [b, b, b]; }),
    leather: charTex(16, 16, (u, v) => { let b = 170 + (hn(u, v, 302) - 0.5) * 40; if (hn(u, v >> 1, 303) < 0.06) b -= 50; if (v === 0) b += 30; return [b, b, b]; }),
    hair: charTex(16, 16, (u, v) => { const b = 190 + Math.sin(u * 1.7 + hn(u, 0, 304) * 4) * 28 + (hn(u, v, 305) - 0.5) * 18; return [b, b, b]; }),
  };
  return T;
}
/**
 * Volto dipinto per una testa sferica (64×32, avvolge tutta la sfera; il viso è centrato a u=0,25 cioè sul davanti).
 * f: { skin, hair, eye, beard, elf }
 */
function faceTex(f) {
  const hc = new THREE.Color(f.hair), H = [hc.r * 255, hc.g * 255, hc.b * 255], S = f.skin, mul = (a, k) => a.map(x => x * k);
  return charTex(64, 32, (x, y) => {
    const dx = x - 16; let c = mul(S, 0.94 + hn(x, y, 310) * 0.07);
    if (Math.abs(dx) > 9) c = mul(c, 0.93);                                                               // guance e lati in ombra
    if (f.elf) {
      if (y === 14 && (Math.abs(dx) >= 2 && Math.abs(dx) <= 5)) c = mul(H, 0.7);                         // sopracciglia sottili
      if (y === 15 && Math.abs(dx) >= 2 && Math.abs(dx) <= 5) c = [30, 26, 30];                           // ciglia
      if (y === 16 && Math.abs(dx) >= 2 && Math.abs(dx) <= 4) c = Math.abs(dx) === 3 ? f.eye : [236, 232, 224];   // occhio a mandorla
      if (y === 19 && dx === 0) c = mul(S, 0.86);
      if (y === 21 && Math.abs(dx) <= 1) c = [S[0] * 0.78, S[1] * 0.48, S[2] * 0.5];                     // labbra
      if (y === 22 && dx === 0) c = [S[0] * 0.86, S[1] * 0.62, S[2] * 0.62];
    } else {
      if (y <= 10 && Math.abs(dx) <= 10) c = mul(H, 0.9 + hn(x, y, 311) * 0.2);                           // frangia
      if (y === 13 && Math.abs(dx) >= 2 && Math.abs(dx) <= 5) c = mul(H, 0.8);                           // sopracciglia
      if ((y === 15 || y === 16) && (Math.abs(dx) === 3)) c = [40, 30, 26];                                // pupille
      if ((y === 15 || y === 16) && (Math.abs(dx) === 2)) c = [236, 232, 220];
      if (y === 18 && dx === 0) c = mul(S, 0.8);
      if (y === 21 && Math.abs(dx) <= 2) c = [S[0] * 0.7, S[1] * 0.5, S[2] * 0.5];                       // bocca
      if (f.beard && y >= 20 && Math.abs(dx) <= 7 && !(y === 21 && Math.abs(dx) <= 2)) c = mul(H, 0.85 + hn(x, y, 312) * 0.2);
    }
    return c;
  });
}

const VILLAGER = {
  hip: 0.93, thigh: 0.42, shin: 0.30, W: 1, chest: 0.19, waist: 0.17, hips: 0.18, torso: 0.46, shoulder: 0.24, upper: 0.27, fore: 0.24,
  skirt: 0.26, flare: 1.15, neck: 0.06, head: 1, armW: 1, legW: 1,
};
const ELF = {
  hip: 1.0, thigh: 0.47, shin: 0.37, W: 0.84, chest: 0.175, waist: 0.135, hips: 0.17, torso: 0.5, shoulder: 0.205, upper: 0.3, fore: 0.27,
  skirt: 0.5, flare: 1.45, neck: 0.09, head: 0.94, armW: 0.82, legW: 0.84,
};

function humanoid(S, look) {
  const tx = textures(), skinHex = new THREE.Color(look.skin[0] / 255, look.skin[1] / 255, look.skin[2] / 255).getHex();
  const M = {
    top: charMat(look.top, look.fine ? tx.fine : tx.cloth), skirt: charMat(look.skirt ?? look.top, look.fine ? tx.fine : tx.cloth), cloak: charMat(look.cloak, tx.cloth),
    trous: charMat(look.trous, tx.cloth), leather: charMat(look.boots ?? 0x4a3424, tx.leather), belt: charMat(0x2e2218, tx.leather),
    metal: charMat(look.metal ?? 0xb08a48), skin: charMat(skinHex), hair: charMat(look.hair, tx.hair),
    face: charMat(0xffffff, faceTex({ skin: look.skin, hair: look.hair, eye: look.eye || [70, 60, 50], beard: look.beard, elf: look.elf }), 'face' + rnd()),
  };
  const DS = m => { const c = m.clone(); c.side = THREE.DoubleSide; return c; };
  const add = (p, geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; m.receiveShadow = true; p.add(m); return m; };
  const LO = (p, secs, mats, opts, x, y, z) => add(p, loft(secs, Object.assign({ axis: 'y', belly: [2, 2], radial: 12 }, opts)), mats, x, y, z);
  const W = S.W, drop = S.hip - (0.06 + S.thigh + S.shin);
  const root = new THREE.Group(); root.name = look.elf ? 'elfa' : 'abitante';
  const hips = joint(root, 'anca', 0, S.hip, 0);
  // bacino e gonna (si allarga verso il basso)
  LO(hips, [{ t: -0.06, w: S.waist * W, h: 0.115 * W }, { t: 0.04, w: S.hips * W, h: 0.13 * W }, { t: S.skirt * 0.55, w: S.hips * W * (1 + (S.flare - 1) * 0.6), h: 0.14 * W * (1 + (S.flare - 1) * 0.6) },
    { t: S.skirt, w: S.hips * W * S.flare, h: 0.15 * W * S.flare }], [M.skirt, M.skirt], { radial: 16 });
  const torso = joint(hips, 'busto', 0, 0.05, 0);
  // busto: vita, petto, spalle, attacco del collo (sale verso l'alto: t negativi)
  LO(torso, [{ t: 0.02, w: S.waist * W, h: 0.11 * W }, { t: -0.14, w: S.waist * W * 1.02, h: 0.115 * W }, { t: -0.3, w: S.chest * W, h: 0.13 * W, oy: 0.01 },
    { t: -S.torso * 0.88, w: (S.chest + 0.02) * W, h: 0.115 * W }, { t: -S.torso, w: 0.13 * W, h: 0.08 * W }, { t: -S.torso - 0.03, w: 0.06, h: 0.05 }], [M.top, M.top], { radial: 16 });
  LO(torso, taper(-0.005, -0.06, S.waist * W + 0.012, 0.118 * W + 0.012, S.waist * W + 0.012, 0.118 * W + 0.012, 0, 2), [M.belt, M.belt], { radial: 16 });
  add(torso, new THREE.BoxGeometry(0.05, 0.045, 0.02), M.metal, 0, -0.03, 0.125 * W);
  if (look.strap) { const st = add(torso, new THREE.BoxGeometry(0.035, 0.6, 0.012), M.leather, 0.02, 0.24, 0.13 * W); st.rotation.z = 0.62;
    add(torso, new THREE.SphereGeometry(0.075, 8, 6), M.leather, -0.2 * W, 0.0, 0.07).scale.set(1, 0.85, 0.6); }
  // mantellina sulle spalle e mantello curvo che scende dietro
  add(torso, new THREE.CylinderGeometry(0.12 * W, 0.27 * W, 0.13, 16, 1, true), DS(M.cloak), 0, S.torso - 0.05, 0);
  const cape = joint(torso, 'mantello', 0, S.torso, -0.04);
  { const L = look.capeLen, g = new THREE.CylinderGeometry(0.2 * W, 0.3 * W + L * 0.08, L, 14, 4, true, PI * 0.58, PI * 0.84); g.translate(0, -L / 2, 0); add(cape, g, DS(M.cloak)); }
  // collo e testa
  const neck = joint(torso, 'collo', 0, S.torso + 0.01, 0);
  LO(neck, taper(-0.0, -S.neck - 0.03, 0.045, 0.048, 0.043, 0.046, 0, 3), [M.skin, M.skin], { radial: 10 });
  const head = joint(neck, 'testa', 0, S.neck, 0), hs = S.head;
  { const g = new THREE.SphereGeometry(1, 24, 16); const m = add(head, g, M.face, 0, 0.125 * hs, 0.005); m.scale.set(0.108 * hs, 0.13 * hs, 0.118 * hs); }
  { const g = new THREE.ConeGeometry(0.018 * hs, 0.05 * hs, 5); g.rotateX(PI / 2 + 0.35); add(head, g, M.skin, 0, 0.11 * hs, 0.125 * hs); }   // naso
  // capelli: calotta e parte posteriore (il davanti resta scoperto per il viso)
  { const cap = add(head, new THREE.SphereGeometry(1, 18, 8, 0, PI * 2, 0, PI * (look.elf ? 0.36 : 0.4)), M.hair, 0, 0.13 * hs, -0.004); cap.scale.set(0.116 * hs, 0.138 * hs, 0.126 * hs);
    const back = add(head, new THREE.SphereGeometry(1, 18, 10, PI / 2 + 0.95, PI * 2 - 1.9, 0, PI * 0.72), M.hair, 0, 0.13 * hs, -0.006); back.scale.set(0.116 * hs, 0.14 * hs, 0.128 * hs); }
  if (look.elf) {
    // capelli lunghi che scendono sulla schiena, orecchie a punta, diadema
    LO(head, [{ t: 0.0, w: 0.1, h: 0.05, oy: -0.08 }, { t: 0.2, w: 0.115, h: 0.045, oy: -0.1 }, { t: 0.45, w: 0.11, h: 0.035, oy: -0.115 }, { t: 0.62, w: 0.06, h: 0.02, oy: -0.12 }], [M.hair, M.hair], { radial: 12 }, 0, 0.06, 0);
    for (const s of [-1, 1]) { const g = new THREE.ConeGeometry(0.022, 0.15, 5); g.translate(0, 0.075, 0); const e = add(head, g, M.skin, s * 0.1 * hs, 0.12 * hs, -0.01); e.rotation.set(-0.55, 0, -s * 1.15); }
    const ring = add(head, new THREE.TorusGeometry(0.118 * hs, 0.006, 4, 28), M.metal, 0, 0.19 * hs, 0); ring.rotation.x = PI / 2 - 0.25;
    add(head, new THREE.OctahedronGeometry(0.014, 0), charMat(look.gem || 0x6ac8b0), 0, 0.17 * hs, 0.122 * hs);
  } else {
    for (const s of [-1, 1]) add(head, new THREE.SphereGeometry(0.022, 6, 5), M.skin, s * 0.108, 0.12, 0.0).scale.set(0.6, 1.2, 0.9);
    if (look.hat === 'cappuccio') { const h = add(head, new THREE.SphereGeometry(1, 16, 10, PI / 2 + 0.75, PI * 2 - 1.5, 0, PI * 0.75), DS(M.cloak), 0, 0.13, -0.01); h.scale.set(0.15, 0.17, 0.155); }
    if (look.hat === 'cappello') { add(head, new THREE.CylinderGeometry(0.24, 0.25, 0.022, 16), M.leather, 0, 0.255, 0); add(head, new THREE.CylinderGeometry(0.105, 0.13, 0.12, 12), M.leather, 0, 0.32, 0); }
  }
  // braccia: manica che si allarga al polso, mano a muffola con il pollice
  for (const s of [1, -1]) { const L = s > 0 ? 'S' : 'D';
    const sh = joint(torso, 'spalla' + L, s * S.shoulder, S.torso - 0.04, 0);
    LO(sh, taper(-0.03, S.upper + 0.02, 0.058 * S.armW, 0.062 * S.armW, 0.048 * S.armW, 0.052 * S.armW, 0.12, 5), [M.top, M.top]);
    const el = joint(sh, 'gomito' + L, 0, -S.upper, 0);
    LO(el, taper(-0.02, S.fore * 0.72, 0.047 * S.armW, 0.05 * S.armW, 0.052 * S.armW, 0.054 * S.armW, 0.05, 4), [M.top, M.top]);
    LO(el, taper(S.fore * 0.62, S.fore + 0.01, 0.034 * S.armW, 0.036 * S.armW, 0.03 * S.armW, 0.032 * S.armW, 0, 3), [M.skin, M.skin], { radial: 8 });
    add(el, new THREE.SphereGeometry(1, 10, 8), M.skin, 0, -S.fore - 0.04, 0.005).scale.set(0.034 * S.armW, 0.055, 0.045);
    { const th = add(el, new THREE.SphereGeometry(1, 6, 5), M.skin, -s * 0.03 * S.armW, -S.fore - 0.025, 0.03); th.scale.set(0.014, 0.03, 0.014); }
    if (look.elf) LO(el, taper(S.fore * 0.45, S.fore * 0.7, 0.05 * S.armW, 0.054 * S.armW, 0.05 * S.armW, 0.054 * S.armW, 0, 2), [M.leather, M.leather]);   // bracciale
    // gambe: coscia, stinco, stivale col gambale e piede
    const hp = joint(hips, 'coscia' + L, s * 0.092 * W, -0.06, 0);
    LO(hp, taper(-0.04, S.thigh + 0.02, 0.072 * S.legW, 0.078 * S.legW, 0.054 * S.legW, 0.058 * S.legW, 0.1, 5), [M.trous, M.trous]);
    const kn = joint(hp, 'ginocchio' + L, 0, -S.thigh, 0);
    LO(kn, taper(-0.03, S.shin * 0.55, 0.054 * S.legW, 0.06 * S.legW, 0.046 * S.legW, 0.052 * S.legW, 0.08, 4), [M.trous, M.trous]);
    const bootTop = look.elf ? 0.05 : S.shin * 0.45;
    LO(kn, [{ t: bootTop, w: 0.062 * S.legW, h: 0.068 * S.legW }, { t: S.shin * 0.8, w: 0.052 * S.legW, h: 0.058 * S.legW }, { t: S.shin + 0.02, w: 0.05 * S.legW, h: 0.056 * S.legW }], [M.leather, M.leather]);
    LO(kn, taper(bootTop - 0.02, bootTop + 0.02, 0.068 * S.legW, 0.074 * S.legW, 0.068 * S.legW, 0.074 * S.legW, 0, 2), [M.leather, M.leather]);   // risvolto
    add(kn, loft([{ t: -0.08, w: 0.05, h: 0.045, oy: 0 }, { t: 0.0, w: 0.058 * S.legW, h: 0.05, oy: 0 }, { t: 0.12, w: 0.055 * S.legW, h: 0.04, oy: -0.01 }, { t: 0.17 * (look.elf ? 1.05 : 1), w: 0.035, h: 0.028, oy: -0.02 }], { radial: 10, belly: [2, 2] }),
      [M.leather, M.leather], 0, -S.shin - drop + 0.05, 0.03);
  }
  return { root, anim: animator(root, villagerClips({ hip: S.hip, stride: look.elf ? 1.08 : 1, arm: look.elf ? 0.75 : 1 })) };
}

const SKINS = [[226, 186, 152], [205, 158, 120], [168, 118, 84], [120, 82, 58], [240, 206, 176]];
/** abitante del borgo con varianti casuali. Restituisce { root, anim } */
export function villager() {
  return humanoid(VILLAGER, {
    skin: pick(SKINS), hair: pick([0x2a1e16, 0x4a3020, 0x7a5030, 0xa88850, 0x8a8a84, 0x5a2a1a]),
    top: pick([0x5a6a3a, 0x6a4a32, 0x3e5060, 0x7a3a2c, 0x6a5a3a, 0x4a4a5a, 0x5a3a4a]), cloak: pick([0x3a3a32, 0x2e3a3a, 0x4a3a2a, 0x3a2e2a, 0x2a3040]),
    trous: pick([0x4a3e32, 0x3a3a36, 0x5a4a3a, 0x3e3428]), beard: rnd() < 0.4, hat: pick(['cappuccio', 'cappello', 'nessuno', 'nessuno']), strap: true, capeLen: 0.84,
  });
}
/** elfa: più alta (circa 1,9 m) e snella, capelli lunghi, orecchie a punta, diadema, abito lungo. Restituisce { root, anim } */
export function elf() {
  const pal = pick([[0x3e5a46, 0x2e4436, 0x6ac8b0], [0xd8d0b8, 0x3a4a3a, 0x7ab0e0], [0x4a3e5a, 0x2e2a40, 0xc890e0], [0x6a3a30, 0x3a2a28, 0xe0b060]]);
  return humanoid(ELF, {
    elf: true, fine: true, skin: pick([[236, 214, 196], [214, 184, 156], [150, 110, 86], [244, 226, 212]]), hair: pick([0xe8dcb0, 0xc8c8c4, 0x8a3a20, 0x1e1a1a, 0xd8b070]),
    eye: pick([[90, 150, 90], [110, 90, 170], [70, 130, 170], [170, 130, 60]]), top: pal[0], skirt: pal[0], cloak: pal[1], gem: pal[2],
    trous: 0x3a3430, boots: 0x5a4632, metal: 0xc8c8c0, capeLen: 1.15,
  });
}

const TAU = PI * 2, cp = (x, k) => Math.pow(Math.max(0, x), k || 1);
/** le quattro clip degli umanoidi; opts: { hip: altezza dell'anca, stride, arm } */
export function villagerClips(opts) {
  opts = opts || {}; const H = opts.hip ?? 0.93, st = opts.stride ?? 1, am = opts.arm ?? 1;
  const walk = (name, T, A, kneeA, armA, elbow, lean, bob, capeA) => makeClip(name, T, t => {
    const p = TAU * t / T, s = Math.sin(p);
    return {
      cosciaS: [-A * st * s, 0, 0], cosciaD: [A * st * s, 0, 0],
      ginocchioS: [0.08 + kneeA * cp(Math.cos(p), 1.4), 0, 0], ginocchioD: [0.08 + kneeA * cp(-Math.cos(p), 1.4), 0, 0],
      spallaS: [armA * am * s, 0, 0.06], spallaD: [-armA * am * s, 0, -0.06],
      gomitoS: [elbow - 0.25 * cp(-s), 0, 0], gomitoD: [elbow - 0.25 * cp(s), 0, 0],
      busto: [lean, 0.07 * s, 0], testa: [-lean * 0.6, -0.05 * s, 0], collo: [0, 0, 0],
      mantello: [capeA + 0.06 * Math.sin(2 * p), 0, 0.03 * s],
      $pos: { anca: [0, H + bob * Math.cos(2 * p), 0] },
    };
  });
  const idle = makeClip('fermo', 4, t => {
    const b = Math.sin(TAU * t / 4);
    return {
      cosciaS: [0, 0, 0.03], cosciaD: [0, 0, -0.03], ginocchioS: [0.04, 0, 0], ginocchioD: [0.04, 0, 0],
      spallaS: [0.03 * b, 0, 0.07], spallaD: [-0.03 * b, 0, -0.07], gomitoS: [-0.12, 0, 0], gomitoD: [-0.12, 0, 0],
      busto: [0.015 * b, 0, 0], collo: [0, 0, 0], testa: [0.05 * Math.sin(TAU * t / 2), 0.25 * Math.sin(TAU * t / 4 + 1), 0],
      mantello: [0.04 + 0.02 * b, 0, 0], $pos: { anca: [0, H - 0.005 + 0.004 * b, 0] },
    };
  });
  const wave = makeClip('saluta', 1.6, t => {
    const w = Math.sin(TAU * 2 * t / 1.6), b = Math.sin(TAU * t / 1.6);
    return {
      cosciaS: [0, 0, 0.03], cosciaD: [0, 0, -0.03], ginocchioS: [0.04, 0, 0], ginocchioD: [0.04, 0, 0],
      spallaS: [0.02 * b, 0, 0.07], gomitoS: [-0.12, 0, 0],
      spallaD: [-0.15, 0, -2.55], gomitoD: [0, 0, -0.45 + 0.45 * w],
      busto: [0, -0.06, -0.03], collo: [0, 0, 0], testa: [0.05, -0.12, 0.05], mantello: [0.05, 0, 0],
      $pos: { anca: [0, H - 0.005, 0] },
    };
  });
  return [idle, walk('cammina', 1.0 * st, 0.45, 0.65, 0.38, -0.22, 0.04, 0.012, 0.12), walk('corre', 0.62 * st, 0.85, 1.25, 0.75, -1.25, 0.18, 0.03, 0.4), wave];
}
