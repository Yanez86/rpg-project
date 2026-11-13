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

/**
 * Modella una sfera unitaria in forma di testa (z = avanti, y = alto): mascella e mento che si stringono,
 * nuca piena, tempie, viso più piatto, arcate sopraccigliari, orbite, zigomi, naso, labbra, mento.
 * Le posizioni dei tratti coincidono con quelle dipinte nel volto (occhi a y≈0,07, bocca a y≈−0,48).
 * inflate > 0 per i gusci dei capelli e della barba (senza naso e labbra).
 */
export function shapeHead(g, elf, inflate) {
  const pa = g.attributes.position, ex = Math.exp, sq = v => v * v;
  for (let i = 0; i < pa.count; i++) {
    let x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i); const f0 = Math.max(0, Math.min(1, (z - 0.05) / 0.75)), F = f0 * f0 * (3 - 2 * f0);   // peso del viso, raccordato
    if (y < 0) { const k = Math.pow(-y, 1.25); x *= 1 - (elf ? 0.42 : 0.28) * k; if (z < 0.2) z = z * (1 - 0.35 * k) + 0.2 * 0.35 * k * 0;   // mascella: stretta in basso, il collo arretra
      if (elf) y *= 1.06; }
    if (z < 0) z *= 1.03 + 0.05 * Math.max(0, y);                                                                                   // nuca
    x *= 1 - 0.08 * ex(-sq((y - 0.3) / 0.2)) * (1 - Math.abs(z));                                                                    // tempie
    if (z > 0.3) { const t = z - 0.3; z = 0.3 + t * (1 - 0.6 * Math.min(1, t / 0.45)); }                                         // piano del viso, raccordato morbido
    if (y < -0.1) z += 0.06 * Math.min(1, (-y - 0.1) / 0.4) * F;                                                          // il viso inferiore avanza verso il mento
    if (!inflate) {
      z += 0.09 * ex(-sq((y - 0.22) / 0.08)) * ex(-1.5 * sq(x / 0.6)) * F;                                                         // arcate sopraccigliari
      for (const sd of [-1, 1]) z -= 0.1 * ex(-sq((x - sd * 0.3) / 0.15) - sq((y - 0.07) / 0.1)) * F;                              // orbite
      z += 0.05 * ex(-sq((Math.abs(x) - 0.4) / 0.13) - sq((y + (elf ? 0.0 : 0.06)) / 0.11)) * F;                                    // zigomi
      z -= 0.035 * ex(-sq((Math.abs(x) - 0.38) / 0.12) - sq((y + 0.36) / 0.14)) * F;                                                // guance appena incavate
      const nb = ex(-sq(x / (elf ? 0.07 : 0.09))); let n = y > 0.14 || y < -0.32 ? 0 : (0.14 - y) / 0.44; if (y < -0.22) n *= Math.max(0, (y + 0.32) / 0.1);
      z += (elf ? 0.17 : 0.22) * n * nb * F;                                                                                          // naso
      z += 0.04 * ex(-sq((Math.abs(x) - 0.12) / 0.05) - sq((y + 0.25) / 0.05)) * F;                                                // ali del naso
      z += 0.04 * ex(-sq(x / 0.22) - sq((y + 0.43) / 0.05)) * F + 0.035 * ex(-sq(x / 0.18) - sq((y + 0.54) / 0.05)) * F;           // labbra
      z -= 0.02 * ex(-sq(x / 0.2) - sq((y + 0.64) / 0.05)) * F;                                                                      // solco sotto il labbro
      z += (elf ? 0.06 : 0.08) * ex(-sq(x / 0.24) - sq((y + 0.82) / 0.1)) * F;                                                       // mento
    }
    const k = 1 + (inflate || 0); pa.setXYZ(i, x * k, y * k, z * k);
  }
  g.computeVertexNormals(); return g;
}

/**
 * Capelli in un unico pezzo: una sfera che avvolge la testa con la stessa forma (shapeHead), il viso "rientra"
 * sotto l'attaccatura, ciocche in rilievo che scendono dalla scriminatura, volume morbido sulla calotta,
 * punte irregolari. Per l'elfa i capelli dietro e ai lati scendono lunghi sulla schiena e si allontanano un poco dal corpo.
 * Coordinate della testa unitaria (z avanti, y alto): la scala viene applicata dalla mesh.
 */
export function hairGeometry(elf) {
  const g = new THREE.SphereGeometry(1, 72, 60, 0, PI * 2, 0, PI * 0.98), pa = g.attributes.position;
  const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // 1) l'attaccatura: dove c'è il viso la superficie rientra dentro la testa
  for (let i = 0; i < pa.count; i++) { let x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
    const face = sm(0.12, 0.42, z) * sm(elf ? 0.4 : 0.46, elf ? 0.3 : 0.36, y + 0.12 * x * x);   // bordo netto: l'attaccatura è una linea pulita      // finestra del viso, con l'attaccatura che sale ai lati
    const ear = sm(0.6, 0.85, Math.abs(x)) * sm(0.25, -0.05, y) * sm(-0.35, 0.05, z) * (elf ? 1 : 0.6);          // dietro le orecchie
    const chin = sm(-0.4, -0.7, y) * sm(-0.35, 0.05, z);                                                          // sotto il mento e sul collo davanti
    const k = 1 - 0.45 * Math.max(face, ear * 0.3, chin * 0.65); pa.setXYZ(i, x * k, y * k, z * k); }
  shapeHead(g, elf, 0.075);
  for (let i = 0; i < pa.count; i++) { let x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
    const phi = Math.atan2(z, -x), top = sm(0.2, 0.95, y), r = Math.hypot(x, z) || 1;
    // ciocche: solchi morbidi che scendono, più marcati in basso; volume sulla calotta; un po' di disordine
    const strands = 0.035 * Math.sin(phi * 22 + Math.sin(phi * 5) * 1.5) * (1 - top * 0.7) + 0.02 * Math.sin(phi * 9 + y * 3);
    const puff = 0.05 * top + 0.03 * sm(0.4, 0.9, y) * Math.sin(phi * 3 + 1);
    let nx = x / r, nz = z / r, out = strands + puff;
    if (elf) { // capelli lunghi: dietro e ai lati si allungano verso il basso; le punte sono irregolari
      const back = sm(0.35, -0.6, z), side = sm(0.6, 0.95, Math.abs(x)) * sm(0.3, -0.3, z) * 0.6, w = Math.max(back, side);
      const below = sm(0.15, -0.95, y), len = (elf ? 3.9 : 0) * (1 + 0.12 * Math.sin(phi * 7) + 0.07 * Math.sin(phi * 17));
      y -= len * below * below * w;
      out += 0.18 * below * w + 0.04 * Math.sin(phi * 26) * below * w;                                           // si allargano e restano ciocche
      z -= 0.32 * below * w;                                                                                     // scendono un po' staccati dalla schiena
    } else { // corti: punte che si aprono appena sotto la nuca
      const below = sm(0.0, -0.6, y); y -= 0.12 * below * (1 + 0.5 * Math.sin(phi * 11)); out += 0.04 * below; }
    pa.setXYZ(i, x + nx * out, y, z + nz * out);
  }
  g.computeVertexNormals(); return g;
}

const VILLAGER = {
  hip: 0.93, thigh: 0.42, shin: 0.30, W: 1, chest: 0.19, waist: 0.17, hips: 0.18, torso: 0.46, shoulder: 0.24, upper: 0.27, fore: 0.24,
  skirt: 0.26, flare: 1.15, neck: 0.035, head: 1, armW: 1, legW: 1, bust: 0,
};
const ELF = {
  hip: 1.0, thigh: 0.47, shin: 0.37, W: 0.84, chest: 0.172, waist: 0.11, hips: 0.21, torso: 0.5, shoulder: 0.2, upper: 0.3, fore: 0.27,
  skirt: 0.5, flare: 1.38, neck: 0.05, head: 0.94, armW: 0.8, legW: 0.86, bust: 1,
};

/**
 * Materiali di un umanoide dal suo aspetto (look): li usano anche i modelli fatti in Blender (characters/elfa3d.js).
 * face: opzionale, una texture del volto al posto di quella standard 64×32.
 */
export function humanMats(look, face) {
  const tx = textures(), skinHex = new THREE.Color(look.skin[0] / 255, look.skin[1] / 255, look.skin[2] / 255).getHex();
  return {
    top: charMat(look.top, look.fine ? tx.fine : tx.cloth), skirt: charMat(look.skirt ?? look.top, look.fine ? tx.fine : tx.cloth), cloak: charMat(look.cloak, tx.cloth),
    trous: charMat(look.trous, tx.cloth), leather: charMat(look.boots ?? 0x4a3424, tx.leather), belt: charMat(0x2e2218, tx.leather),
    metal: charMat(look.metal ?? 0xb08a48), skin: charMat(skinHex), hair: charMat(look.hair, tx.hair), trim: charMat(look.trim ?? 0x2e2218, look.trim ? tx.fine : tx.leather),
    face: charMat(0xffffff, face || faceTex({ skin: look.skin, hair: look.hair, eye: look.eye || [70, 60, 50], beard: look.beard, elf: look.elf }), 'face' + rnd()),
    skinShade: charMat(new THREE.Color(skinHex).multiplyScalar(look.elf ? 0.82 : 0.8).getHex()), gem: charMat(look.gem || 0x6ac8b0),
  };
}

function humanoid(S, look) {
  const skinHex = new THREE.Color(look.skin[0] / 255, look.skin[1] / 255, look.skin[2] / 255).getHex();
  const M = humanMats(look);
  const DS = m => { const c = m.clone(); c.side = THREE.DoubleSide; return c; };
  const add = (p, geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; m.receiveShadow = true; p.add(m); return m; };
  const LO = (p, secs, mats, opts, x, y, z) => add(p, loft(secs, Object.assign({ axis: 'y', belly: [2, 2], radial: 12 }, opts)), mats, x, y, z);
  const W = S.W, drop = S.hip - (0.06 + S.thigh + S.shin);
  const root = new THREE.Group(); root.name = look.elf ? 'elfa' : 'abitante';
  const hips = joint(root, 'anca', 0, S.hip, 0);
  // bacino e gonna: dalla vita i fianchi si allargano, poi la gonna scende e si apre; orlo con una fascia
  const hipW = S.hips * W;
  LO(hips, [{ t: -0.06, w: S.waist * W, h: 0.105 * W }, { t: -0.01, w: (S.waist + S.hips) / 2 * W, h: 0.115 * W }, { t: 0.05, w: hipW, h: 0.13 * W, oy: -0.008 },
    { t: S.skirt * 0.55, w: hipW * (1 + (S.flare - 1) * 0.6), h: 0.14 * W * (1 + (S.flare - 1) * 0.6) }, { t: S.skirt, w: hipW * S.flare, h: 0.15 * W * S.flare }], [M.skirt, M.skirt], { radial: 18 });
  LO(hips, taper(S.skirt - 0.045, S.skirt + 0.005, hipW * S.flare * 0.985 + 0.006, 0.15 * W * S.flare * 0.985 + 0.006, hipW * S.flare + 0.006, 0.15 * W * S.flare + 0.006, 0, 2), [M.trim, M.trim], { radial: 18 });
  const torso = joint(hips, 'busto', 0, 0.05, 0);
  // busto: vita, schiena con la curva lombare, costato, petto, spalle, attacco del collo (sale verso l'alto: t negativi)
  const ch = S.chest * W;
  const bp = (k) => S.bust ? [[0.085, 0.25 * k, 0.062], [-0.085, 0.25 * k, 0.062]] : [];           // petto: due rigonfiamenti nella stessa sezione
  LO(torso, [{ t: 0.02, w: S.waist * W, h: 0.102 * W }, { t: -0.08, w: S.waist * W * 0.98, h: 0.098 * W, oy: -0.006 }, { t: -0.18, w: (S.waist + S.chest) / 2 * W, h: 0.11 * W, oy: 0.002 },
    { t: -0.24, w: ch * 0.97, h: 0.116 * W, oy: 0.008, bumps: bp(0.15) }, { t: -0.28, w: ch, h: 0.12 * W, oy: 0.012, bumps: bp(0.75) }, { t: -0.315, w: ch * 1.02, h: 0.124 * W, oy: 0.016, bumps: bp(1) },
    { t: -0.35, w: ch * 1.03, h: 0.126 * W, oy: 0.018, bumps: bp(0.8) }, { t: -0.39, w: ch * 1.03, h: 0.122 * W, oy: 0.012, bumps: bp(0.35) },
    { t: -S.torso * 0.86, w: ch + 0.024 * W, h: 0.112 * W, oy: -0.004 }, { t: -S.torso * 0.95, w: ch + 0.022 * W, h: 0.1 * W, oy: -0.008 },          // spalle larghe e quasi orizzontali
    { t: -S.torso * 0.995, w: ch * 0.74, h: 0.085 * W, oy: -0.01 }, { t: -S.torso - 0.012, w: 0.085 * W, h: 0.07 * W, oy: -0.008 }, { t: -S.torso - 0.02, w: 0.055, h: 0.05 }], [M.top, M.top], { radial: 32 });
  if (S.bust) { // corsetto di cuoio allacciato sul davanti, che segue la base del petto
    LO(torso, [{ t: 0.0, w: S.waist * W + 0.008, h: 0.106 * W + 0.006 }, { t: -0.1, w: S.waist * W * 0.98 + 0.008, h: 0.1 * W + 0.006, oy: -0.004 }, { t: -0.2, w: (S.waist + S.chest) / 2 * W + 0.008, h: 0.112 * W + 0.006 },
      { t: -0.245, w: ch * 0.97 + 0.006, h: 0.116 * W + 0.006, oy: 0.008, bumps: bp(0.2) }], [M.leather, M.leather], { radial: 32 });
    for (let k = 0; k < 4; k++) for (const sd of [-1, 1]) { const l = add(torso, new THREE.BoxGeometry(0.045, 0.005, 0.004), M.trim, 0, 0.04 + k * 0.05, 0.106 * W + 0.012); l.rotation.z = sd * 0.6; }
  } else { // collo a V allacciato e bottoni della tunica
    { const g = new THREE.ConeGeometry(0.05, 0.12, 3); g.rotateZ(PI); const v = add(torso, g, M.skin, 0, S.torso - 0.08, 0.118 * W); v.scale.set(1, 1, 0.12); }
    for (let k = 0; k < 3; k++) add(torso, new THREE.SphereGeometry(0.008, 6, 4), M.metal, 0, 0.12 + k * 0.07, 0.132 * W + (k > 1 ? 0.006 : 0));
  }
  LO(torso, taper(-0.005, -0.06, S.waist * W + 0.014, 0.106 * W + 0.014, S.waist * W + 0.014, 0.104 * W + 0.014, 0, 2), [M.belt, M.belt], { radial: 18 });
  add(torso, new THREE.BoxGeometry(0.05, 0.045, 0.02), M.metal, 0, -0.03, 0.106 * W + 0.022);
  { const pouch = add(torso, new THREE.BoxGeometry(0.07, 0.08, 0.04), M.leather, 0.11 * W, -0.075, 0.07 * W); pouch.rotation.y = 0.5; add(pouch, new THREE.BoxGeometry(0.074, 0.03, 0.044), M.belt, 0, 0.03, 0.002); }
  if (look.strap) { const st = add(torso, new THREE.BoxGeometry(0.035, 0.6, 0.012), M.leather, 0.02, 0.24, 0.13 * W); st.rotation.z = 0.62;
    add(torso, new THREE.SphereGeometry(0.075, 8, 6), M.leather, -0.2 * W, 0.0, 0.07).scale.set(1, 0.85, 0.6); }
  // mantellina sulle spalle e mantello curvo che scende dietro
  if (look.elf) LO(torso, taper(-S.torso + 0.005, -S.torso - 0.045, 0.068, 0.064, 0.058, 0.055, 0, 2), [M.top, M.top], { radial: 14 });        // colletto
  else add(torso, new THREE.CylinderGeometry(0.075 * W, 0.235 * W, 0.075, 16, 1, true), DS(M.cloak), 0, S.torso - 0.025, 0);              // mantellina sulle spalle, piatta
  const cape = joint(torso, 'mantello', 0, S.torso, -0.04);
  { const L = look.capeLen, g = new THREE.CylinderGeometry(0.15 * W, 0.2 * W + L * 0.07, L, 14, 4, true, PI * 0.55, PI * 0.9); g.translate(0, -L / 2, 0); add(cape, g, DS(M.cloak)); }
  // collo e testa
  const neck = joint(torso, 'collo', 0, S.torso - 0.005, 0);
  LO(neck, taper(-0.0, -S.neck - 0.03, 0.045, 0.048, 0.043, 0.046, 0, 3), [M.skin, M.skin], { radial: 10 });
  const head = joint(neck, 'testa', 0, S.neck, 0), hs = S.head;
  const HS = [0.1 * hs, 0.128 * hs, 0.118 * hs], hy = 0.125 * hs;
  const shell = (geo, mat, inflate) => { shapeHead(geo, look.elf, inflate); const m = add(head, geo, mat, 0, hy, 0.005); m.scale.set(...HS); return m; };
  shell(new THREE.SphereGeometry(1, 36, 28), M.face, 0);                                                                     // testa modellata con il volto
  // capelli: un unico pezzo che segue la testa, con l'attaccatura, le ciocche e le punte irregolari
  { const hg = hairGeometry(look.elf); const hm = add(head, hg, M.hair, 0, hy, 0.005); hm.scale.set(...HS); }
  // orecchie: conca a forma di guscio con il lobo; quelle dell'elfa sono lame a punta
  for (const s of [-1, 1]) {
    if (look.elf) { const g = new THREE.ConeGeometry(0.028, 0.16, 8); g.translate(0, 0.08, 0); g.scale(1, 1, 0.38);
      const e = add(head, g, M.skin, s * 0.098 * hs, 0.115 * hs, -0.005); e.rotation.set(-0.55, s * 0.35, -s * 1.15);
      const ig = new THREE.ConeGeometry(0.016, 0.12, 6); ig.translate(0, 0.06, 0.004); ig.scale(1, 1, 0.3); const ie = add(e, ig, charMat(new THREE.Color(skinHex).multiplyScalar(0.82).getHex()), 0, 0.015, 0.006); ie.rotation.set(0, 0, 0);
      add(head, new THREE.TorusGeometry(0.008, 0.002, 4, 10), M.metal, s * 0.104 * hs, 0.085 * hs, 0.0);                          // orecchino
    } else { const e = add(head, new THREE.SphereGeometry(1, 10, 8), M.skin, s * 0.104 * hs, 0.11 * hs, -0.008); e.scale.set(0.013, 0.033, 0.023); e.rotation.y = s * 0.35;
      const ie = add(head, new THREE.SphereGeometry(1, 8, 6), charMat(new THREE.Color(skinHex).multiplyScalar(0.8).getHex()), s * 0.112 * hs, 0.112 * hs, -0.006); ie.scale.set(0.006, 0.022, 0.014); }
  }
  if (look.elf) {
    // orecchie a punta, diadema
    const ring = add(head, new THREE.TorusGeometry(0.104 * hs, 0.005, 4, 28), M.metal, 0, 0.2 * hs, -0.004); ring.rotation.x = PI / 2 + 0.22; ring.scale.set(1, 1.17, 1);
    add(head, new THREE.OctahedronGeometry(0.013, 0), charMat(look.gem || 0x6ac8b0), 0, 0.17 * hs, 0.123 * hs);
  } else {
    if (look.hat === 'cappuccio') { const h = add(head, new THREE.SphereGeometry(1, 16, 10, PI / 2 + 0.75, PI * 2 - 1.5, 0, PI * 0.75), DS(M.cloak), 0, 0.13, -0.01); h.scale.set(0.15, 0.17, 0.155); }
    if (look.hat === 'cappello') { add(head, new THREE.CylinderGeometry(0.24, 0.25, 0.022, 16), M.leather, 0, 0.255, 0); add(head, new THREE.CylinderGeometry(0.105, 0.13, 0.12, 12), M.leather, 0, 0.32, 0); }
  }
  // braccia: spalla tonda, bicipite, avambraccio che si assottiglia al polso, polsino, mano a muffola con il pollice
  for (const s of [1, -1]) { const L = s > 0 ? 'S' : 'D', aw = S.armW;
    const sh = joint(torso, 'spalla' + L, s * S.shoulder, S.torso - 0.035, 0);
    add(sh, new THREE.SphereGeometry(1, 12, 10), M.top, -s * 0.008, -0.004, 0).scale.set(0.062 * aw, 0.058 * aw, 0.062 * aw);                                     // deltoide
    if (look.elf) for (let k = 0; k < 2; k++) { const d = add(sh, new THREE.SphereGeometry(0.075 - k * 0.012, 12, 6, 0, PI * 2, 0, PI * 0.45), M.metal, s * 0.005, 0.012 - k * 0.04, 0); d.scale.set(1, 0.55, 1.12); d.rotation.z = -s * (0.25 + k * 0.2); }   // spallaccio a lamelle
    LO(sh, [{ t: -0.03, w: 0.058 * aw, h: 0.06 * aw }, { t: 0.1, w: 0.056 * aw, h: 0.066 * aw, oy: 0.008 }, { t: S.upper * 0.8, w: 0.05 * aw, h: 0.054 * aw }, { t: S.upper + 0.02, w: 0.047 * aw, h: 0.05 * aw }], [M.top, M.top]);
    const el = joint(sh, 'gomito' + L, 0, -S.upper, 0);
    LO(el, [{ t: -0.025, w: 0.048 * aw, h: 0.05 * aw }, { t: 0.06, w: 0.052 * aw, h: 0.054 * aw, oy: 0.004 }, { t: S.fore * 0.72, w: 0.043 * aw, h: 0.045 * aw }], [M.top, M.top]);
    if (look.elf) { const g = new THREE.CylinderGeometry(0.046 * aw, 0.085 * aw, 0.15, 14, 1, true); g.translate(0, -S.fore * 0.66, 0); add(el, g, DS(M.top));                    // manica a campana
      LO(el, taper(S.fore * 0.38, S.fore * 0.58, 0.046 * aw, 0.049 * aw, 0.043 * aw, 0.046 * aw, 0, 2), [M.leather, M.leather]); }                                      // bracciale
    else LO(el, taper(S.fore * 0.64, S.fore * 0.74, 0.048 * aw, 0.05 * aw, 0.048 * aw, 0.05 * aw, 0, 2), [M.trim, M.trim]);                                         // polsino
    LO(el, taper(S.fore * 0.66, S.fore + 0.01, 0.033 * aw, 0.035 * aw, 0.028 * aw, 0.031 * aw, 0, 3), [M.skin, M.skin], { radial: 8 });
    add(el, new THREE.SphereGeometry(1, 10, 8), M.skin, 0, -S.fore - 0.04, 0.005).scale.set(0.032 * aw, 0.055, 0.045);                               // mano
    { const th = add(el, new THREE.SphereGeometry(1, 6, 5), M.skin, -s * 0.026 * aw, -S.fore - 0.025, 0.03); th.scale.set(0.014, 0.03, 0.014); }      // pollice
    // gambe: coscia con il quadricipite, rotula, polpaccio, stivale con gambale, lacci e suola
    const lw = S.legW, hp = joint(hips, 'coscia' + L, s * (0.088 + 0.02 * S.bust) * W, -0.06, 0);
    LO(hp, [{ t: -0.05, w: (0.074 + 0.012 * S.bust) * lw, h: 0.08 * lw }, { t: 0.1, w: (0.074 + 0.006 * S.bust) * lw, h: 0.084 * lw, oy: 0.01 }, { t: S.thigh * 0.62, w: 0.064 * lw, h: 0.07 * lw, oy: 0.006 },
      { t: S.thigh * 0.9, w: 0.056 * lw, h: 0.06 * lw }, { t: S.thigh + 0.02, w: 0.054 * lw, h: 0.058 * lw }], [M.trous, M.trous], { radial: 14 });
    const kn = joint(hp, 'ginocchio' + L, 0, -S.thigh, 0);
    add(kn, new THREE.SphereGeometry(1, 8, 6), M.trous, 0, 0.0, 0.045 * lw).scale.set(0.034 * lw, 0.038, 0.022);                                          // rotula
    LO(kn, [{ t: -0.03, w: 0.052 * lw, h: 0.058 * lw }, { t: 0.1, w: 0.054 * lw, h: 0.066 * lw, oy: -0.012 }, { t: S.shin * 0.6, w: 0.045 * lw, h: 0.05 * lw }], [M.trous, M.trous], { radial: 14 });
    const bootTop = look.elf ? 0.04 : S.shin * 0.45;
    LO(kn, [{ t: bootTop, w: 0.062 * lw, h: 0.068 * lw }, { t: S.shin * 0.8, w: 0.052 * lw, h: 0.058 * lw, oy: -0.004 }, { t: S.shin + 0.02, w: 0.05 * lw, h: 0.056 * lw }], [M.leather, M.leather], { radial: 14 });
    LO(kn, taper(bootTop - 0.02, bootTop + 0.02, 0.068 * lw, 0.074 * lw, 0.068 * lw, 0.074 * lw, 0, 2), [M.leather, M.leather]);   // risvolto
    for (let k = 0; k < 3; k++) for (const sd of [-1, 1]) { const l = add(kn, new THREE.BoxGeometry(0.05 * lw, 0.004, 0.004), M.trim, 0, -(bootTop + 0.05 + k * (S.shin - bootTop - 0.05) / 3), 0.06 * lw); l.rotation.z = sd * 0.55; }   // lacci
    const fy = -S.shin - drop + 0.05;
    add(kn, loft([{ t: -0.08, w: 0.05, h: 0.045, oy: 0 }, { t: 0.0, w: 0.058 * lw, h: 0.05, oy: 0 }, { t: 0.12, w: 0.055 * lw, h: 0.04, oy: -0.01 }, { t: 0.17 * (look.elf ? 1.05 : 1), w: 0.035, h: 0.028, oy: -0.02 }], { radial: 10, belly: [2, 2] }),
      [M.leather, M.leather], 0, fy, 0.03);
    { const sole = add(kn, new THREE.BoxGeometry(0.105 * lw, 0.018, 0.25), M.belt, 0, fy - 0.045, 0.045); sole.scale.x = 1; }                                // suola
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
export function elf() { return humanoid(ELF, elfLook()); }
/** aspetto casuale dell'elfa (una delle quattro palette, carnagione, capelli, occhi): lo usa anche elfa3d() */
export function elfLook() {
  const pal = pick([[0x3e5a46, 0x2e4436, 0x6ac8b0], [0xd8d0b8, 0x3a4a3a, 0x7ab0e0], [0x4a3e5a, 0x2e2a40, 0xc890e0], [0x6a3a30, 0x3a2a28, 0xe0b060]]);
  return {
    elf: true, fine: true, skin: pick([[236, 214, 196], [214, 184, 156], [150, 110, 86], [244, 226, 212]]), hair: pick([0xe8dcb0, 0xc8c8c4, 0x8a3a20, 0x1e1a1a, 0xd8b070]),
    eye: pick([[90, 150, 90], [110, 90, 170], [70, 130, 170], [170, 130, 60]]), top: pal[0], skirt: pal[0], cloak: pal[1], gem: pal[2],
    trous: 0x3a3430, boots: 0x5a4632, metal: 0xc8c8c0, trim: 0xc8a050, capeLen: 1.15,
  };
}
/** misure dell'elfa (anca, gambe, busto…): le stesse del modello di Blender (engine/tools/blender/elfa.py) */
export const ELF_SIZE = ELF;

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
