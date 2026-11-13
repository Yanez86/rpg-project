// Drago: marionetta a pezzi rigidi alta circa 8,7 m alla testa (cinque volte un abitante), apertura alare ~17 m.
// Collo a 6 anelli e coda a 10 anelli, testa con mascella mobile, corna ricurve, denti, creste dorsali,
// quattro zampe in tre segmenti con artigli, ali con dita mobili e membrana che le segue.
// Clip: 'fermo', 'cammina', 'ruggisce', 'vola'. Guarda verso +z, le zampe toccano y=0. Ricetta: docs/oggetti.md › Drago.
import * as THREE from 'three';
import { rnd, pick, hn } from '../core/rng.js';
import { PI } from '../core/geometry.js';
import { joint, piece, charMat, charTex, makeClip, animator } from './puppet.js';
import { loft, taper } from './loft.js';
import { mute } from '../materials/palette.js';

const HIDES = [ // scaglie, ventre, membrana, corna, riflesso (iridescenza sui bordi delle scaglie)
  { name: 'cremisi', sc: [122, 34, 30], be: [176, 140, 92], mem: [92, 30, 26], horn: [216, 204, 176], glint: [214, 150, 60] },
  { name: 'verde bronzo', sc: [58, 78, 44], be: [170, 154, 98], mem: [52, 60, 34], horn: [200, 188, 152], glint: [96, 168, 140] },
  { name: 'ardesia', sc: [46, 58, 76], be: [140, 146, 154], mem: [38, 44, 60], horn: [208, 208, 200], glint: [140, 110, 190] },
  { name: 'nero', sc: [38, 34, 34], be: [138, 106, 74], mem: [30, 26, 26], horn: [184, 168, 136], glint: [150, 40, 36] },
];
const FINGERS = [[0.12, 5.2], [0.5, 4.8], [0.92, 4.2], [1.35, 3.4]];   // [angolo indietro, lunghezza]
const mixc = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t), mul = (a, k) => a.map(v => v * k);
const texCache = {};
/**
 * Pelle dipinta a colori, pixel per pixel (64×64):
 *  - scaglie embricate a ventaglio: ogni fila copre la metà alta della successiva, bordo superiore in luce,
 *    ombra portata sulla fila sotto, carena centrale, riflesso iridescente sul bordo;
 *  - ogni scaglia ha la sua tinta; alcune sono scheggiate o rigate (cicatrici).
 */
function hideTextures(H) {
  if (texCache[H.name]) return texCache[H.name];
  const W = 64, RW = 16, RH = 11, rad = 9.6, hi = mixc(H.sc, [255, 236, 190], 0.4), lo = mixc(H.sc, [16, 14, 36], 0.6);
  const scales = charTex(W, W, (x, y) => {
    let owner = null;
    for (let r = Math.floor(y / RH) + 1; r >= Math.floor(y / RH) - 1 && !owner; r--) {
      const off = (r & 1) * RW / 2; for (const c of [-1, 0, 1, 2]) { const col = Math.floor((x - off) / RW) + c, cx = col * RW + off + RW / 2, cy = r * RH;
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy; if (dx * dx / (rad * rad * 0.7) + dy * dy / (rad * rad) <= 1 && dy <= 0.55 * rad) { owner = { col, r, dx, dy }; break; } }
    }
    if (!owner) return mul(lo, 0.7);
    const { col, r, dx, dy } = owner, id = hn(((col % 4) + 4) % 4, ((r % 6) + 6) % 6, 340);
    const d = Math.sqrt(dx * dx / (rad * rad * 0.7) + dy * dy / (rad * rad)), top = Math.max(0, Math.min(1, (dy + rad) / (1.55 * rad)));
    let c = mixc(H.sc, id < 0.5 ? hi : lo, Math.abs(id - 0.5) * 0.45);                        // tinta propria della scaglia
    c = mixc(mixc(c, hi, 0.45), mul(c, 0.62), top);                                            // luce in alto, ombra verso il basso
    if (Math.abs(dx) < 1.0 && dy < 0.25 * rad) c = mixc(c, hi, 0.3);                            // carena centrale
    if (d > 0.74 && dy < 0.2 * rad) c = mixc(c, H.glint, 0.55 * (d - 0.74) / 0.26);             // riflesso iridescente sul bordo alto
    if (d > 0.92) c = mul(lo, 0.85);                                                            // contorno netto
    if (dy > 0.3 * rad) c = mul(c, 0.6);                                                        // ombra portata sulla fila sotto
    if (id > 0.95 && d < 0.6 && hn(x >> 1, y >> 1, 341) < 0.35) c = mul(c, 0.7);                            // scaglia scheggiata
    if (id < 0.08 && Math.abs(dx * 0.8 + dy * 0.6) < 0.7 && d < 0.8) c = mixc(c, [235, 225, 205], 0.5);   // graffio (cicatrice)
    return c.map(v => v * (0.95 + hn(x, y, 342) * 0.08));
  });
  // ventre: placche larghe e leggermente arcuate, solco scuro, bordo lucido, rughe sottili
  const belly = charTex(32, 32, (x, y) => { const yy = y, k = yy % 8, row = yy >> 3;
    let c = mul(H.be, (0.88 + hn(row, 0, 343) * 0.16 - k * 0.025) * (0.94 + 0.08 * Math.sin((x + 0.5) / 32 * Math.PI * 2) ));
    if (k === 7) c = mul(c, 0.42); else if (k === 6) c = mul(c, 0.7); else if (k <= 1) c = mixc(c, [255, 245, 220], 0.3 - k * 0.12);
    if (k > 2 && k < 6 && hn(x, row, 344) < 0.1) c = mul(c, 0.85); return c.map(v => v * (0.96 + hn(x, y, 345) * 0.06)); });
  // corna: anelli di crescita ondulati e striature lungo la lunghezza, punta più chiara
  const horn = charTex(16, 32, (x, y) => { let c = mixc(mul(H.horn, 0.55), H.horn, y / 31); const ring = (y + Math.round(Math.sin(x * 0.8) * 0.8)) % 5;
    if (ring === 0) c = mul(c, 0.7); else if (ring === 1) c = mixc(c, [255, 250, 235], 0.15); if (hn(x, 0, 346) < 0.3) c = mul(c, 0.9); return c.map(v => v * (0.96 + hn(x, y, 347) * 0.06)); });
  // membrana: ossa delle dita, venature che si diramano verso il bordo, chiazze traslucide, bordo scuro
  const mem = charTex(64, 64, (x, y) => { const u = (x + 0.5) / 64, v = (y + 0.5) / 64;
    let c = mixc(H.mem, mixc(H.mem, [255, 196, 150], 0.3), Math.pow(u, 1.3) * 0.9);
    c = mul(c, 0.92 + 0.12 * Math.sin(u * 9 + Math.sin(v * 23) * 1.5) * Math.sin(v * 31));
    const fv = (v * 4) % 1, panel = Math.floor(v * 4);
    if (Math.min(fv, 1 - fv) < 0.018 + 0.015 * (1 - u)) return mul(H.mem, 0.55);
    for (let j = 0; j < 3; j++) { const vc = (panel + 0.25 + 0.25 * j + 0.06 * u * u * (j - 1) + 0.025 * Math.sin(u * 7 + j * 2)) / 4, th = (0.012 - 0.007 * u);
      if (u > 0.08 && Math.abs(v - vc) < th) c = mul(c, 0.62);
      const br = vc + 0.03 * (u - 0.55) * 4 * (j % 2 ? 1 : -1); if (u > 0.55 && Math.abs(v - br) < 0.006) c = mul(c, 0.75); }
    if (u > 0.94) c = mul(c, 0.55); if (hn(x, y, 348) < 0.002 && u > 0.7) c = mul(c, 0.3);
    return c; });
  for (const t of [scales, belly, mem]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true; }
  return texCache[H.name] = { scales, belly, horn, mem };
}
function hideMats(H) {
  const T = hideTextures(H), vc = (map, side) => new THREE.MeshLambertMaterial({ map, vertexColors: true, side: side || THREE.FrontSide });
  return {
    sc: vc(T.scales), be: vc(T.belly), dark: new THREE.MeshLambertMaterial({ map: T.scales, color: 0x7a7470 }),
    horn: new THREE.MeshLambertMaterial({ map: T.horn }), mem: new THREE.MeshLambertMaterial({ map: T.mem, side: THREE.DoubleSide }),
  };
}

/** crea un drago. Restituisce { root, anim, update() } — update() va chiamato dopo anim.update(dt) (membrana delle ali) */
export function dragon() {
  const H = pick(HIDES), HM = hideMats(H);
  const M = { sc: HM.sc, be: HM.be, dark: HM.dark, horn: HM.horn, claw: charMat(0x2a2622), tooth: charMat(0xe8e0cc), tongue: charMat(0x7a2a2a), eye: new THREE.MeshBasicMaterial({ color: 0xffb040 }) };
  const SB = [M.sc, M.be], NOB = { belly: [2, 2] };
  // disegno ampio della pelle (colori per vertice): dorso più scuro, fianchi, chiaro verso il ventre, bande scure a "V" sul dorso, macchie
  const skin = (t, a) => { const dors = Math.cos(a * PI * 2), k = 0.78 + 0.32 * (1 - (dors + 1) / 2);
    const band = dors > 0.35 && Math.sin(t * 2.4 + Math.abs(Math.sin(a * PI * 2)) * 2.2) > 0.55 ? 0.68 : 1, spot = hn(Math.round(t * 3), Math.round(a * 16), 350) < 0.06 ? 0.8 : 1;
    const v = k * band * spot; return [v, v * 0.98, v * 0.96]; };
  const LO = (parent, sections, opts, mats, x, y, z) => { opts = Object.assign({ color: skin, tile: [1.6, 1.6] }, opts); delete opts.vRep; delete opts.uRep; const m = new THREE.Mesh(loft(sections, opts), mats || SB); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const root = new THREE.Group(); root.name = 'drago';
  const corpo = joint(root, 'corpo', 0, 3.7, 0);
  // corpo: fianchi stretti, ventre, petto profondo, spalle che salgono verso il collo
  LO(corpo, [
    { t: -3.75, w: 0.62, h: 0.62, oy: 0.25 }, { t: -3.2, w: 0.95, h: 0.95, oy: 0.18 }, { t: -2.5, w: 1.18, h: 1.12, oy: 0.12 }, { t: -1.6, w: 1.16, h: 1.1, oy: 0.02 },
    { t: -0.5, w: 1.12, h: 1.18, oy: -0.08 }, { t: 0.6, w: 1.2, h: 1.26, oy: -0.08 }, { t: 1.7, w: 1.32, h: 1.34, oy: 0.0 }, { t: 2.7, w: 1.26, h: 1.3, oy: 0.14 },
    { t: 3.4, w: 1.0, h: 1.05, oy: 0.36 }, { t: 3.95, w: 0.66, h: 0.66, oy: 0.58 }], { radial: 16, round: 0.85, vRep: 14 });
  // muscoli delle spalle e delle cosce che si attaccano al corpo
  for (const s of [-1, 1]) { LO(corpo, taper(-0.6, 0.7, 0.5, 0.55, 0.42, 0.45, 0.25, 5), { radial: 10 }, null, s * 1.05, -0.15, 2.3); LO(corpo, taper(-0.9, 0.8, 0.6, 0.7, 0.5, 0.55, 0.3, 5), { radial: 10 }, null, s * 1.05, -0.1, -2.35); }
  const spike = (p, x, y, z, h, r, rx) => { const g = new THREE.ConeGeometry(r, h, 6); g.translate(0, h / 2, 0); const c = new THREE.Mesh(g, M.dark); c.position.set(x, y, z); c.rotation.set(rx ?? -0.55, 0, 0); c.castShadow = true; p.add(c); return c; };
  for (let z = -3.4; z <= 3.6; z += 0.55) { const k = 1 - Math.abs(z - 0.6) / 4.6; spike(corpo, 0, 1.1 + 0.15 * k, z, 0.45 + 0.4 * k, 0.16 + 0.06 * k); }
  // collo: sei anelli affusolati che si sovrappongono, ognuno con la sua spina
  let p = joint(corpo, 'collo0', 0, 0.6, 3.5);
  for (let i = 0; i < 6; i++) { const w0 = (1.36 - i * 0.1) / 2, w1 = (1.26 - i * 0.1) / 2;
    LO(p, taper(-0.18, 1.12, w0 * 1.05, w0, w1 * 1.05, w1, 0.06, 5), { radial: 12, vRep: 3 });
    spike(p, 0, w0 * 0.9, 0.45, 0.42 - i * 0.03, 0.12);
    p = joint(p, i < 5 ? 'collo' + (i + 1) : 'testa', 0, 0, 0.95); }
  const head = p;
  // testa: cranio, fronte, muso che si assottiglia; la mascella è a parte
  LO(head, [
    { t: -0.15, w: 0.36, h: 0.36, oy: 0.12 }, { t: 0.2, w: 0.5, h: 0.46, oy: 0.18 }, { t: 0.7, w: 0.52, h: 0.44, oy: 0.2 }, { t: 1.1, w: 0.44, h: 0.36, oy: 0.12 },
    { t: 1.55, w: 0.36, h: 0.28, oy: 0.05 }, { t: 2.0, w: 0.31, h: 0.23, oy: 0.02 }, { t: 2.3, w: 0.24, h: 0.17, oy: 0.0 }, { t: 2.42, w: 0.12, h: 0.09, oy: -0.02 }], { radial: 14, round: 0.8, vRep: 5 });
  for (const s of [-1, 1]) {
    LO(head, taper(0.35, 1.25, 0.1, 0.09, 0.07, 0.06, 0.3, 4), { radial: 6 }, [M.dark, M.dark], s * 0.36, 0.55, 0);           // arcata sopraccigliare
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), M.eye); eye.scale.set(0.5, 0.8, 1.4); eye.position.set(s * 0.43, 0.38, 1.0); head.add(eye);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.22), M.dark); lid.position.set(s * 0.45, 0.45, 1.0); lid.rotation.z = s * 0.3; head.add(lid);
    const nos = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), M.claw); nos.scale.set(1, 0.5, 1.4); nos.position.set(s * 0.15, 0.2, 2.25); head.add(nos);
    for (let k = 0; k < 6; k++) { const g = new THREE.ConeGeometry(0.035 + (k === 1 ? 0.02 : 0), 0.14 + (k === 1 ? 0.1 : 0), 5); g.translate(0, -0.07, 0); const t = new THREE.Mesh(g, M.tooth); t.position.set(s * (0.28 - k * 0.025), -0.15, 1.35 + k * 0.17); head.add(t); }
    // corna: quattro coni che si piegano all'indietro e verso il basso, più un corno minore
    for (const [hx, hy, hz, sc, rz] of [[0.32, 0.55, 0.2, 1, 0.35], [0.4, 0.35, -0.05, 0.55, 0.9]]) {
      let hp = joint(head, '', s * hx, hy, hz); hp.rotation.set(-1.85, s * rz, 0);
      for (let k = 0; k < 4; k++) { const Lh = (0.6 - k * 0.1) * sc, g = new THREE.ConeGeometry((0.16 - k * 0.035) * sc, Lh, 7, 1, k < 3); g.translate(0, Lh / 2, 0);
        const c = new THREE.Mesh(g, M.horn); c.castShadow = true; hp.add(c); const n = joint(hp, '', 0, Lh * 0.95, 0); n.rotation.x = 0.38; hp = n; }
    }
    for (let k = 0; k < 4; k++) spike(head, s * (0.42 + k * 0.03), 0.05 - k * 0.1, 0.05 - k * 0.12, 0.38 - k * 0.05, 0.06, -1.75).rotation.z = s * 0.5;   // frangia di spine sulle guance
  }
  const jaw = joint(head, 'mascella', 0, -0.2, 0.3);
  LO(jaw, [{ t: -0.2, w: 0.32, h: 0.16, oy: 0 }, { t: 0.4, w: 0.34, h: 0.15, oy: -0.06 }, { t: 1.1, w: 0.27, h: 0.12, oy: -0.05 }, { t: 1.7, w: 0.2, h: 0.09, oy: -0.02 }, { t: 1.95, w: 0.1, h: 0.05, oy: 0 }],
    { radial: 12, round: 0.8, belly: [0.3, 0.7], vRep: 3 }, [M.sc, M.be]);
  { const tg = new THREE.Mesh(loft(taper(0.1, 1.4, 0.13, 0.04, 0.06, 0.02, 0.1, 4), { radial: 8, belly: [2, 2] }), M.tongue); tg.position.y = 0.11; jaw.add(tg); }
  for (const s of [-1, 1]) for (let k = 0; k < 6; k++) { const g = new THREE.ConeGeometry(0.03, 0.12, 5); g.translate(0, 0.06, 0); const t = new THREE.Mesh(g, M.tooth); t.position.set(s * (0.25 - k * 0.022), 0.1, 0.55 + k * 0.2); jaw.add(t); }
  // coda: dieci anelli che si assottigliano, ognuno con la spina, punta a foglia
  p = joint(corpo, 'coda0', 0, 0.2, -3.4);
  for (let i = 0; i < 10; i++) { const w0 = (1.3 - i * 0.1) / 2, w1 = (1.2 - i * 0.1) / 2;
    LO(p, taper(0.18, -1.12, w0 * 1.05, w0, w1 * 1.05, w1, 0.05, 5), { radial: 12, vRep: 3 });
    spike(p, 0, w0 * 0.9, -0.5, 0.4 - i * 0.025, 0.11, -2.4 + 0.15 * 0);
    if (i < 9) p = joint(p, 'coda' + (i + 1), 0, 0, -0.98); }
  { const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(0.55, -0.3, 0.1, -1.3); s.lineTo(0, -1.45); s.lineTo(-0.1, -1.3); s.quadraticCurveTo(-0.55, -0.3, 0, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 }); g.rotateX(PI / 2); g.translate(0, 0.03, -0.9);
    const tip = new THREE.Mesh(g, M.dark); tip.castShadow = true; p.add(tip); }
  // zampe: coscia muscolosa, stinco, piede con tre dita e artigli e uno sperone dietro
  for (const [n, x, y, z, front] of [['AS', 1.25, -0.35, 2.4, 1], ['AD', -1.25, -0.35, 2.4, 1], ['PS', 1.3, -0.4, -2.4, 0], ['PD', -1.3, -0.4, -2.4, 0]]) {
    const up = joint(corpo, 'zampa' + n, x, y, z);
    LO(up, front ? taper(-0.2, 1.85, 0.38, 0.42, 0.24, 0.27, 0.22, 6) : taper(-0.25, 1.9, 0.5, 0.62, 0.27, 0.32, 0.25, 6), { axis: 'y', radial: 12, belly: [2, 2], vRep: 4 });
    const lo = joint(up, 'gamba' + n, 0, front ? -1.7 : -1.75, 0);
    LO(lo, taper(-0.12, 1.55, front ? 0.26 : 0.3, front ? 0.28 : 0.32, 0.19, 0.2, 0.12, 5), { axis: 'y', radial: 10, belly: [2, 2], vRep: 3 });
    const ft = joint(lo, 'piede' + n, 0, front ? -1.45 : -1.4, 0);
    LO(ft, [{ t: -0.3, w: 0.26, h: 0.16, oy: -0.12 }, { t: 0.1, w: 0.36, h: 0.17, oy: -0.15 }, { t: 0.45, w: 0.36, h: 0.13, oy: -0.18 }], { radial: 10, belly: [0.3, 0.7] });
    for (const [dx, a, ln] of [[-0.24, -0.35, 0.55], [0, 0, 0.65], [0.24, 0.35, 0.55], [0, PI, 0.3]]) {
      const toe = joint(ft, '', dx * 0.8, -0.2, 0.42 * (a === PI ? -0.7 : 1)); toe.rotation.y = a;
      LO(toe, taper(-0.05, ln, 0.09, 0.08, 0.06, 0.05, 0.15, 4), { radial: 8 });
      const g = new THREE.ConeGeometry(0.06, 0.32, 5); g.translate(0, 0.16, 0); const c = new THREE.Mesh(g, M.claw); c.position.set(0, 0, ln); c.rotation.x = PI / 2 + 0.55; c.castShadow = true; toe.add(c);
    }
  }
  // ali: omero, avambraccio, mano e quattro dita; la membrana è una mesh che segue le ossa
  const wings = [];
  for (const s of [1, -1]) { const L = s > 0 ? 'S' : 'D';
    const sh = joint(corpo, 'ala' + L, s * 1.0, 1.0, 1.3);
    { const g = new THREE.CylinderGeometry(0.15, 0.24, 2.7, 8); g.rotateZ(-s * PI / 2); const m = new THREE.Mesh(g, M.sc); m.position.x = s * 1.3; m.castShadow = true; sh.add(m);
      LO(sh, taper(-0.3, 0.9, 0.42, 0.4, 0.25, 0.2, 0.2, 4), { radial: 10 }, null, s * 0.25, -0.05, 0).rotation.y = s * PI / 2; }
    const fa = joint(sh, 'avambraccio' + L, s * 2.6, 0, 0); { const g = new THREE.CylinderGeometry(0.1, 0.16, 3.05, 8); g.rotateZ(-s * PI / 2); const m = new THREE.Mesh(g, M.sc); m.position.x = s * 1.5; m.castShadow = true; fa.add(m);
      const k = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 6), M.sc); fa.add(k); const w2 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), M.sc); w2.position.x = s * 3.0; fa.add(w2); }
    const hand = joint(fa, 'mano' + L, s * 3.0, 0, 0);
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 6), M.claw); c.position.set(s * 0.1, 0.22, 0.12); c.rotation.x = -0.6; hand.add(c);
    const tips = FINGERS.map(([a, len], i) => { const f = joint(hand, 'dito' + L + (i + 1), 0, 0, 0); f.rotation.y = s * a;
      { const g = new THREE.CylinderGeometry(0.025, 0.075 - i * 0.01, len, 6); g.rotateZ(-s * PI / 2); const m = new THREE.Mesh(g, M.dark); m.position.x = s * len / 2; m.castShadow = true; f.add(m); } return joint(f, '', s * len, 0, 0); });
    const back = joint(corpo, '', s * 0.95, 0.75, -1.9);
    wings.push({ sh, fa, hand, tips, back });
  }
  const mem = new THREE.Mesh(new THREE.BufferGeometry(), HM.mem);
  const NV = 2 * 33;   // 11 triangoli per ala mem.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NV * 3), 3));
  { // UV fisse a ventaglio: u = distanza dal polso (0) alla punta (1), v = quale dito (0..1)
    const uvs = [], U = (u, v) => uvs.push(u, v);
    for (let w = 0; w < 2; w++) {
      for (let i = 0; i < 3; i++) { const v0 = i / 4, v1 = (i + 1) / 4, vm = (v0 + v1) / 2; U(0, v0); U(1, v0); U(0.8, vm); U(0, v1); U(0.8, vm); U(1, v1); }
      U(0, 0.75); U(1, 0.75); U(0.75, 0.87); U(0, 0.9); U(0.75, 0.87); U(1, 1);
      U(0, 0.95); U(1, 1); U(0.35, 1); U(0.35, 1); U(1, 1); U(0.6, 1); U(0.6, 1); U(0.35, 1); U(0, 0.98);
    }
    mem.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); } mem.castShadow = true; mem.receiveShadow = true; mem.frustumCulled = false;
  root.add(mem);
  const tmp = new THREE.Vector3(), P = n => { n.getWorldPosition(tmp); return root.worldToLocal(tmp.clone()); };
  function update() {
    root.updateMatrixWorld(true); const a = mem.geometry.attributes.position; let k = 0;
    const tri = (A, B, C) => { for (const v of [A, B, C]) { a.array[k++] = v.x; a.array[k++] = v.y; a.array[k++] = v.z; } };
    for (const w of wings) {
      const S = P(w.sh), E = P(w.fa), W = P(w.hand), T = w.tips.map(P), Bk = P(w.back);
      for (let i = 0; i < 3; i++) { const M2 = W.clone().lerp(T[i].clone().add(T[i + 1]).multiplyScalar(0.5), 0.8); tri(W, T[i], M2); tri(W, M2, T[i + 1]); }   // bordo a festone
      const M3 = W.clone().lerp(T[3].clone().add(Bk).multiplyScalar(0.5), 0.75); tri(W, T[3], M3); tri(W, M3, Bk);
      tri(W, Bk, E); tri(E, Bk, S); tri(S, E, W);
    }
    a.needsUpdate = true; mem.geometry.computeVertexNormals(); mem.geometry.computeBoundingSphere();
  }
  const anim = animator(root, dragonClips());
  return { root, anim, update };
}

const TAU = PI * 2, cp = x => Math.max(0, x);
const NECK = [-0.62, 0.1, 0.1, 0.12, 0.12, 0.14], HEAD = 0.55, TAIL = [-0.28, 0.02, 0.03, 0.04, 0.05, 0.05, 0.06, 0.06, 0.07, 0.08];
const LEG_REST = { AS: [0.3, -0.45, 0.15], AD: [0.3, -0.45, 0.15], PS: [-0.25, 0.45, -0.2], PD: [-0.25, 0.45, -0.2] };
function setWing(o, part, v) { o[part + 'S'] = v; o[part + 'D'] = [v[0], -v[1], -v[2]]; }
function folded(o, b) {
  setWing(o, 'ala', [0, 0.35, 0.8 + 0.02 * b]); setWing(o, 'avambraccio', [0, -2.35, -0.25]); setWing(o, 'mano', [0, 2.25, 0]);
  return spread(o, 0.18);
}
function spread(o, k) { for (let i = 0; i < 4; i++) { o['ditoS' + (i + 1)] = [0, FINGERS[i][0] * k, 0]; o['ditoD' + (i + 1)] = [0, -FINGERS[i][0] * k, 0]; } return o; }
function neckTail(o, t, neckAmp, neckSp, tailAmp, tailSp, neckLift, tailLift) {
  NECK.forEach((b, i) => o['collo' + i] = [b - (neckLift || 0) * (i < 3 ? 1 : 0.4), neckAmp * Math.sin(TAU * neckSp * t - i * 0.4), 0]);
  TAIL.forEach((b, i) => o['coda' + i] = [b + (tailLift || 0), tailAmp * (0.4 + i * 0.12) * Math.sin(TAU * tailSp * t - i * 0.55), 0]);
  return o;
}
function legsRest(o) { for (const n in LEG_REST) { const [a, b, c] = LEG_REST[n]; o['zampa' + n] = [a, 0, 0]; o['gamba' + n] = [b, 0, 0]; o['piede' + n] = [c, 0, 0]; } return o; }

/** le clip del drago */
export function dragonClips() {
  const idle = makeClip('fermo', 6, t => {
    const b = Math.sin(TAU * t / 6);
    const o = { corpo: [0.01 * b, 0, 0], testa: [HEAD + 0.06 * Math.sin(TAU * t / 3), 0.25 * Math.sin(TAU * t / 6 + 1), 0], mascella: [0.04 + 0.04 * cp(Math.sin(TAU * t / 3)), 0, 0],
      $pos: { corpo: [0, 3.7 + 0.05 * b, 0] } };
    neckTail(o, t, 0.06, 1 / 6, 0.12, 1 / 6); legsRest(o); return folded(o, b);
  }, 120);
  const walk = makeClip('cammina', 2.4, t => {
    const T = 2.4, p = TAU * t / T;
    const o = { corpo: [0, 0.05 * Math.sin(p), 0.03 * Math.sin(p)], testa: [HEAD - 0.05 * Math.sin(2 * p), -0.06 * Math.sin(p), 0], mascella: [0.03, 0, 0], $pos: { corpo: [0, 3.7 + 0.08 * Math.cos(2 * p), 0] } };
    neckTail(o, t, 0.08, 1 / T, 0.16, 1 / T);
    for (const [n, ph] of Object.entries({ PS: 0, AS: 0.25, PD: 0.5, AD: 0.75 })) { const f = TAU * (t / T - ph), front = n[0] === 'A', [a, b, c] = LEG_REST[n];
      o['zampa' + n] = [a - 0.34 * Math.sin(f), 0, 0]; o['gamba' + n] = [b + (front ? -0.5 : 0.55) * cp(Math.cos(f)), 0, 0]; o['piede' + n] = [c + 0.3 * cp(Math.cos(f)) * (front ? 1 : -1), 0, 0]; }
    return folded(o, 0);
  }, 72);
  const roar = makeClip('ruggisce', 3, t => {
    const u = t / 3, e = Math.sin(PI * Math.min(1, u * 1.6)), shake = Math.sin(TAU * 7 * t) * 0.02 * e;
    const o = { corpo: [-0.22 * e, 0, 0], testa: [HEAD - 0.5 * e + shake, 0, shake], mascella: [0.05 + 0.85 * e, 0, 0], $pos: { corpo: [0, 3.7 + 0.7 * e, -0.3 * e] } };
    neckTail(o, t, 0.03 * e, 2, 0.3, 0.7, 0.45 * e, 0.12 * e); legsRest(o);
    o.zampaAS = [0.3 - 0.5 * e, 0, 0.15 * e]; o.zampaAD = [0.3 - 0.5 * e, 0, -0.15 * e]; o.gambaAS = o.gambaAD = [-0.45 - 0.4 * e, 0, 0];
    o.zampaPS = o.zampaPD = [-0.25 + 0.25 * e, 0, 0];
    folded(o, 0);
    const k = e; setWing(o, 'ala', [0, 0.35 * (1 - k) + 0.1 * k, 0.8 * (1 - k) + 0.5 * k + 0.08 * Math.sin(TAU * 2 * t) * k]); setWing(o, 'avambraccio', [0, -2.35 * (1 - k) - 0.35 * k, -0.25 * (1 - k) + 0.25 * k]);
    setWing(o, 'mano', [0, 2.25 * (1 - k) + 0.3 * k, 0]); spread(o, 0.18 * (1 - k) + 0.9 * k);
    return o;
  }, 90);
  const fly = makeClip('vola', 1.4, t => {
    const p = TAU * t / 1.4;
    const o = { corpo: [0.08, 0, 0.04 * Math.sin(p)], testa: [HEAD - 0.1, 0.05 * Math.sin(p), 0], mascella: [0.06, 0, 0], $pos: { corpo: [0, 7.5 - 0.35 * Math.sin(p - 0.8), 0] } };
    NECK.forEach((b, i) => o['collo' + i] = [b * 0.4 + 0.06, 0.03 * Math.sin(p - i * 0.4), 0]);
    TAIL.forEach((b, i) => o['coda' + i] = [b * 0.3 + 0.03 * Math.sin(p - i * 0.5), 0.05 * (0.4 + i * 0.12) * Math.sin(p * 0.5 - i * 0.5), 0]);
    for (const n of ['AS', 'AD']) { o['zampa' + n] = [1.0, 0, 0]; o['gamba' + n] = [-1.4, 0, 0]; o['piede' + n] = [0.9, 0, 0]; }
    for (const n of ['PS', 'PD']) { o['zampa' + n] = [0.9, 0, 0]; o['gamba' + n] = [0.6, 0, 0]; o['piede' + n] = [0.7, 0, 0]; }
    setWing(o, 'ala', [0, -0.1 * Math.cos(p), 0.15 + 0.75 * Math.sin(p)]); setWing(o, 'avambraccio', [0, 0.05, -0.35 * Math.sin(p - 0.6)]);
    setWing(o, 'mano', [0, 0.15, -0.25 * Math.sin(p - 1.1)]); spread(o, 1);
    return o;
  }, 56);
  return [idle, walk, roar, fly];
}
