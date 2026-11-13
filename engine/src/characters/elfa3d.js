// Elfa modellata in Blender: la stessa elfa di villager.js con più dettaglio (pieghe dell'abito, corsetto con le stecche
// e i lacci veri, spallacci a tre lamelle bordate, maniche a campana con l'orlo che scende dietro, bracciali allacciati,
// mani con le dita accennate, stivali con il risvolto a punta, diadema che scende sulla fronte, orecchie a foglia).
// Il modello viene da engine/tools/blender/personaggi.py --modello elfa → engine/assets/elfa.glb. Pilastri che non cambiano:
//  - marionetta a pezzi rigidi con gli stessi giunti dell'elfa del motore: le clip di villagerClips() vanno senza modifiche;
//  - il file porta solo forme e NOMI dei materiali; colori (quattro palette), texture pixel-art e cel shading li mette
//    questo modulo con gli stessi materiali dell'elfa (humanMats), quindi setToon() funziona come per gli altri.
// Uso:  await loadElfa3d();  const e = elfa3d();  scene.add(e.root); e.anim.play('cammina'); setToon(e.root, true)
import { vesti, scegliVisibili, pezziDi, nodoModello } from './guardaroba.js';
import { hn } from '../core/rng.js';
import { animator, charTex } from './puppet.js';
import { elfLook, humanMats, villagerClips, ELF_SIZE } from './villager.js';

/** indirizzo del modello (accanto al motore, in engine/assets/) */
export const ELFA3D_URL = new URL('../../assets/elfa.glb', import.meta.url).href;
let TPL = null;
/** carica il modello una volta sola (fetch). Restituisce una Promise */
export async function loadElfa3d(url) {
  if (TPL) return TPL;
  const r = await fetch(url || ELFA3D_URL);
  if (!r.ok) throw new Error('loadElfa3d: ' + r.status + ' ' + (url || ELFA3D_URL));
  return setElfa3d(await r.arrayBuffer());
}
/** usa un .glb già letto (ArrayBuffer), per esempio in Node */
export function setElfa3d(buffer) { TPL = nodoModello(buffer, 'elfa'); return TPL; }
export { vesti, scegliVisibili };
export const elfa3dReady = () => !!TPL;

/**
 * Volto dell'elfa a 128×64 (il doppio di quello standard): stessa disposizione, così i tratti dipinti coincidono con
 * quelli scolpiti; resta pixel-art. Occhi a mandorla con l'iride, la pupilla e il riflesso, ciglia con la coda,
 * sopracciglia sottili e arcuate, naso e labbra appena segnati, un filo di rossore sulle guance.
 */
function faceTexHD(f) {
  const S = f.skin, H = [(f.hair >> 16) & 255, (f.hair >> 8) & 255, f.hair & 255], E = f.eye, mul = (a, k) => a.map(x => x * k);
  return charTex(128, 64, (x, y) => {
    const dx = x - 32, ax = Math.abs(dx), sd = Math.sign(dx);
    let c = mul(S, 0.94 + hn(x >> 1, y >> 1, 310) * 0.07);
    if (ax > 18) c = mul(c, 0.93);                                                                 // guance e lati in ombra
    if (ax >= 9 && ax <= 13 && y >= 37 && y <= 38) c = [c[0], c[1] * 0.95, c[2] * 0.95];          // rossore leggero
    const brow = ax >= 3 && ax <= 10 && y === 29 - (ax >= 5 && ax <= 8 ? 1 : 0);
    if (brow) c = mul(H, 0.68);
    if (y === 31 && ax >= 3 && ax <= 10) c = [34, 26, 30];                                         // ciglia sopra
    if (y === 30 && ax >= 10 && ax <= 11) c = [34, 26, 30];                                        // coda delle ciglia
    if ((y === 32 && ax >= 4 && ax <= 9) || (y === 33 && ax >= 4 && ax <= 8)) {                   // occhio a mandorla
      c = [236, 232, 224];
      if (ax >= 5 && ax <= 7) c = y === 32 ? mul(E, 0.78) : E;                                     // iride, più scura sotto la palpebra
      if (ax === 6 && y === 33) c = mul(E, 0.45);                                                  // pupilla
      if (y === 32 && dx === (sd < 0 ? -7 : 5)) c = [250, 248, 240];                               // riflesso (luce da sinistra)
    }
    if (y === 34 && ax >= 5 && ax <= 8) c = mul(S, 0.82);                                          // ciglia sotto, leggere
    if ((y === 38 && (dx === 0 || dx === -1)) || (y === 39 && dx === 1)) c = mul(S, 0.86);         // naso
    if (y === 42 && ax <= 2) c = [S[0] * 0.8, S[1] * 0.5, S[2] * 0.52];                            // labbro sopra
    if (y === 43 && ax <= 1) c = [S[0] * 0.88, S[1] * 0.64, S[2] * 0.64];                          // labbro sotto
    if (y === 43 && ax === 3) c = mul(S, 0.88);                                                    // angoli della bocca
    return c;
  });
}

/** nomi dei materiali che il modello può usare (quelli di engine/tools/blender/personaggi.py --modello elfa) */
export const ELFA3D_MATERIALS = ['abito', 'gonna', 'mantello', 'calze', 'cuoio', 'cintura', 'metallo', 'bordo', 'pelle', 'pelle_ombra', 'capelli', 'volto', 'gemma', 'lino'];

/** i capi del modello, per strato: { intimo: [...], abiti: [...], accessori: [...], capelli: [...] } */
export const pezziElfa3d = () => pezziDi(TPL);
/** tutti i capi: l'elfa vestita come prima della scomposizione */
export const tuttiIPezzi = () => Object.values(pezziElfa3d()).flat();

/**
 * Un'elfa con aspetto casuale (palette, carnagione, capelli, occhi). Restituisce { root, anim, pezzi } come elf().
 * opts.vesti: i capi indossati (di base tutti; [] = solo il corpo, ['fascia', 'culotte'] = in intimo).
 */
export function elfa3d(opts) {
  if (!TPL) throw new Error('elfa3d(): prima carica il modello con await loadElfa3d()');
  const look = elfLook(), M = humanMats(look, faceTexHD(look));
  const mats = { abito: M.top, gonna: M.skirt, mantello: M.cloak, calze: M.trous, cuoio: M.leather, cintura: M.belt, metallo: M.metal,
    bordo: M.trim, pelle: M.skin, pelle_ombra: M.skinShade, capelli: M.hair, volto: M.face, gemma: M.gem, lino: M.linen };
  const root = TPL.clone(true);
  root.traverse(o => { if (o.isMesh) { o.material = mats[o.userData.mat] || M.top; o.castShadow = true; o.receiveShadow = true; } });
  const misure = TPL.userData.misure || ELF_SIZE;                                  // le misure scritte dallo script di Blender
  const actor = { root, anim: animator(root, villagerClips({ hip: misure.hip, stride: 1.08, arm: 0.75 })), misure };
  return vesti(actor, (opts && opts.vesti) || tuttiIPezzi());
}
