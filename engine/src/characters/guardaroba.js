// Guardaroba dei personaggi modellati in Blender (engine/tools/blender/personaggi.py): corpo base e capi a strati.
// Ogni oggetto del modello ha in userData (dalle proprietà degli oggetti di Blender, "extras" nel glTF):
//   strato: corpo | intimo | abiti | accessori | capelli;  pezzo: il capo ("corpo" per il corpo);
//   regione: la parte del corpo che occupa (busto, braccio, bacino, coscia, gamba, piede…), sul corpo e sull'intimo;
//   nasconde: regioni che il capo copre del tutto (separate da virgole): negli strati più bassi si nascondono;
//   richiede: il capo su cui il pezzo si appoggia (senza quello non si vede).
// Ricetta: docs/oggetti.md › Corpo base e capi.

const LIVELLO = { corpo: 0, intimo: 1, abiti: 2, accessori: 3, capelli: 3 };
/**
 * Quali oggetti si vedono con certi capi addosso. tags: array di userData; pezzi: i capi indossati.
 * Il corpo si vede sempre, tranne le regioni coperte da un capo di uno strato più alto. Funzione pura (si prova senza three).
 */
export function scegliVisibili(tags, pezzi) {
  const su = new Set(pezzi), ok = t => su.has(t.pezzo) && (!t.richiede || su.has(t.richiede)), coperte = [];
  for (const t of tags) if (t.nasconde && t.strato !== 'corpo' && ok(t)) for (const r of t.nasconde.split(',')) coperte.push([r, LIVELLO[t.strato]]);
  return tags.map(t => {
    if (!t.strato) return true;
    if (t.strato !== 'corpo' && !ok(t)) return false;
    return !(t.regione && coperte.some(([r, l]) => r === t.regione && l > LIVELLO[t.strato]));
  });
}
/** i capi di un modello, per strato: { intimo: [...], abiti: [...], accessori: [...], capelli: [...] } */
export function pezziDi(tpl) {
  const out = {};
  if (tpl) tpl.traverse(o => { const u = o.userData; if (u.strato && u.strato !== 'corpo') { const l = out[u.strato] = out[u.strato] || []; if (!l.includes(u.pezzo)) l.push(u.pezzo); } });
  return out;
}
/** veste un personaggio (o lo spoglia): pezzi = elenco dei capi indossati. Restituisce l'attore, con attore.pezzi aggiornato */
export function vesti(actor, pezzi) {
  const list = [];
  actor.root.traverse(o => { if (o.isMesh && o.userData.strato) list.push(o); });
  const vis = scegliVisibili(list.map(o => o.userData), pezzi);
  list.forEach((o, i) => { o.visible = vis[i]; });
  actor.pezzi = [...pezzi]; return actor;
}
/** carica un modello .glb e restituisce il nodo radice con quel nome (la radice si chiama come il modello) */
export async function caricaModello(url, nome) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('caricaModello: ' + r.status + ' ' + url);
  return nodoModello(await r.arrayBuffer(), nome);
}
import { parseGlb } from '../core/glb.js';
/** come caricaModello, da un .glb già letto (ArrayBuffer), per esempio in Node */
export function nodoModello(buffer, nome) {
  const n = parseGlb(buffer).getObjectByName(nome);
  if (!n) throw new Error('nel file manca il nodo "' + nome + '"'); return n;
}
