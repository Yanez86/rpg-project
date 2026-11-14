// Wuxia: una donna adulta da romanzo wuxia modellata in Blender (engine/tools/blender/personaggi.py --modello wuxia →
// engine/assets/wuxia.glb). Personaggio originale: proporzioni prese da una foto di riferimento, tratti femminili accentuati
// un poco (figura a clessidra: vita sottile, fianchi pieni, seno e glutei più pronunciati), senza dettagli espliciti.
// Strati: corpo base liscio, intimo (dudou e brasiliana di seta), capelli raccolti in due chignon, fermagli a fiore.
// Stessi giunti e stesse clip dell'elfa (villagerClips), materiali dal motore (humanMats), cel shading con setToon().
// Uso:  await loadWuxia3d();  const w = wuxia3d();  scene.add(w.root); w.anim.play('cammina'); setToon(w.root, true)
import { hn, pick } from '../core/rng.js';
import { animator, charTex } from './puppet.js';
import { humanMats, villagerClips } from './villager.js';
import { vesti, pezziDi, nodoModello } from './guardaroba.js';

/** indirizzo del modello (accanto al motore, in engine/assets/) */
export const WUXIA3D_URL = new URL('../../assets/wuxia.glb', import.meta.url).href;
let TPL = null;
/** carica il modello una volta sola (fetch). Restituisce una Promise */
export async function loadWuxia3d(url) {
  if (TPL) return TPL;
  const r = await fetch(url || WUXIA3D_URL);
  if (!r.ok) throw new Error('loadWuxia3d: ' + r.status + ' ' + (url || WUXIA3D_URL));
  return setWuxia3d(await r.arrayBuffer());
}
/** usa un .glb già letto (ArrayBuffer), per esempio in Node */
export function setWuxia3d(buffer) { TPL = nodoModello(buffer, 'wuxia'); return TPL; }
export const wuxia3dReady = () => !!TPL;
/** nomi dei materiali che il modello può usare */
export const WUXIA3D_MATERIALS = ['pelle', 'pelle_ombra', 'volto', 'capelli', 'lino', 'seta', 'petalo', 'bordo', 'metallo', 'gemma'];
/** i capi del modello, per strato */
export const pezziWuxia3d = () => pezziDi(TPL);
/** tutti i capi del modello */
export const tuttiIPezziWuxia = () => Object.values(pezziWuxia3d()).flat();

/** aspetto casuale: carnagione, capelli scuri, occhi, seta del dudou con il suo ricamo, fiori, rossetto */
export function wuxiaLook() {
  const pal = pick([[0xb02a2a, 0xe0b048], [0x2e7a62, 0xe0c890], [0x2a3e7a, 0xd0a850], [0x7a2a5a, 0xe8c080]]);   // seta, ricamo
  return {
    skin: pick([[244, 222, 202], [236, 208, 182], [226, 194, 166], [250, 230, 214]]), hair: pick([0x14100e, 0x1c1410, 0x2a1a12, 0x101418]),
    eye: pick([[58, 38, 28], [40, 28, 24], [78, 52, 34]]), lips: pick([[196, 40, 48], [176, 46, 60], [204, 70, 70]]),
    silk: pal[0], trim: pal[1], linen: 0xf0e8da, petal: pick([0xf6eedc, 0xf2c4cc, 0xfaf6ee]), metal: 0xd0a850, gem: pick([0xc83a3a, 0x3aa880, 0xe0c060]),
    fine: true, top: pal[0], cloak: 0x2a2a2a, trous: 0x2a2a2a,
  };
}

/**
 * Volto a 128×64 con la stessa disposizione del volto dell'elfa (i tratti dipinti coincidono con quelli scolpiti), pixel-art.
 * Trucco da film wuxia: sopracciglia sottili e lunghe "a foglia di salice", riga scura sulla palpebra che sale verso la tempia,
 * ombretto rosato, occhi a mandorla scuri con il riflesso, labbra rosse con il labbro di sotto più pieno, rossore sulle guance.
 */
function faceTexWuxia(f) {
  const S = f.skin, H = [(f.hair >> 16) & 255, (f.hair >> 8) & 255, f.hair & 255], E = f.eye, Lp = f.lips, mul = (a, k) => a.map(x => x * k);
  const mix = (a, b, k) => a.map((x, i) => x + (b[i] - x) * k);
  return charTex(128, 64, (x, y) => {
    const dx = x - 32, ax = Math.abs(dx), sd = Math.sign(dx);
    let c = mul(S, 0.95 + hn(x >> 1, y >> 1, 320) * 0.06);
    if (ax > 18) c = mul(c, 0.93);                                                                   // guance e lati in ombra
    if (ax >= 9 && ax <= 13 && y >= 37 && y <= 38) c = [c[0], c[1] * 0.93, c[2] * 0.93];             // rossore
    if (y === 30 && ax >= 4 && ax <= 10) c = mix(c, [230, 150, 160], 0.25);                          // ombretto rosato
    if (ax >= 3 && ax <= 11 && y === (ax >= 5 && ax <= 8 ? 28 : 29)) c = mul(H, 0.9);                 // sopracciglia a foglia di salice
    if (y === 31 && ax >= 3 && ax <= 10) c = [22, 16, 18];                                           // riga sulla palpebra
    if ((y === 30 && ax === 11) || (y === 29 && ax === 12)) c = [22, 16, 18];                        // la riga sale verso la tempia
    if ((y === 32 && ax >= 4 && ax <= 9) || (y === 33 && ax >= 4 && ax <= 8)) {                     // occhio a mandorla
      c = [238, 234, 228];
      if (ax >= 5 && ax <= 7) c = y === 32 ? mul(E, 0.75) : E;
      if (ax === 6 && y === 33) c = mul(E, 0.4);
      if (y === 32 && dx === (sd < 0 ? -7 : 5)) c = [250, 248, 242];
    }
    if (y === 34 && ax >= 5 && ax <= 8) c = mul(S, 0.84);
    if ((y === 38 && (dx === 0 || dx === -1)) || (y === 39 && dx === 1)) c = mul(S, 0.88);            // naso
    if (y === 42 && ax <= 2) c = mul(Lp, 0.85);                                                       // labbro di sopra
    if (y === 43 && ax <= 2) c = ax === 1 && dx > 0 ? mix(Lp, [255, 220, 220], 0.3) : Lp;             // labbro di sotto, con un riflesso
    if (y === 44 && ax <= 1) c = mul(Lp, 0.92);
    if (y === 43 && ax === 3) c = mul(S, 0.86);                                                       // angoli della bocca
    return c;
  });
}

/** una wuxia con aspetto casuale. opts.vesti: i capi indossati (di base tutti; [] = solo il corpo). Restituisce { root, anim, pezzi, misure } */
export function wuxia3d(opts) {
  if (!TPL) throw new Error('wuxia3d(): prima carica il modello con await loadWuxia3d()');
  const look = wuxiaLook(), M = humanMats(look, faceTexWuxia(look));
  const mats = { pelle: M.skin, pelle_ombra: M.skinShade, volto: M.face, capelli: M.hair, lino: M.linen, seta: M.silk, petalo: M.petal,
    bordo: M.trim, metallo: M.metal, gemma: M.gem };
  const root = TPL.clone(true);
  root.traverse(o => { if (o.isMesh) { o.material = mats[o.userData.mat] || M.skin; o.castShadow = true; o.receiveShadow = true; } });
  const misure = TPL.userData.misure;
  const actor = { root, anim: animator(root, villagerClips({ hip: misure.hip, stride: 0.95, arm: 0.85 })), misure };
  return vesti(actor, (opts && opts.vesti) || tuttiIPezziWuxia());
}
