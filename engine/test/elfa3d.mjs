// Prova dell'elfa modellata in Blender (engine/assets/elfa.glb, da engine/tools/blender/elfa.py) e di characters/elfa3d.js.
// Controlla i pilastri che il modello deve tenere uguali all'elfa del motore:
//  1. ci sono tutti i giunti, con lo stesso genitore, nella stessa posizione e senza rotazioni né scale (le clip funzionano uguali);
//  2. in posa di riposo i piedi toccano y = 0 e l'altezza è quella dell'elfa del motore (1,84 m in cima ai capelli);
//  3. ogni materiale del file ha il suo materiale nel motore;
//  4. guardaroba: ogni oggetto ha strato e pezzo, il corpo ha tutte le regioni, i capi coprono regioni che esistono,
//     e vestendo o spogliando si vede la cosa giusta (scegliVisibili);
//  5. elfa3d() si costruisce, prende il cel shading e suona le clip (con il finto three).
import fs from 'fs';
const canvas2d = () => new Proxy({}, { get: (t, k) => k === 'createImageData' ? ((w, h) => ({ data: new Uint8ClampedArray(w * h * 4) })) : (() => ({})) });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: canvas2d }) };
process.on('uncaughtException', e => { console.error('ERRORE:', e); process.exit(1); });
const fail = m => { console.error('ERRORE: ' + m); process.exit(1); };
const { ELF_SIZE } = await import('../src/characters/villager.js');
const { setElfa3d, elfa3d, ELFA3D_MATERIALS, scegliVisibili, vesti } = await import('../src/characters/elfa3d.js');
const { setToon } = await import('../src/characters/toon.js');

const file = fs.readFileSync(new URL('../assets/elfa.glb', import.meta.url));
const ab = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
const json = JSON.parse(new TextDecoder().decode(new Uint8Array(ab, 20, new DataView(ab).getUint32(12, true))));
const byName = {}, parent = {};
json.nodes.forEach((n, i) => { byName[n.name] = n; for (const c of n.children || []) parent[json.nodes[c].name] = n.name; });

// 1. giunti
const S = ELF_SIZE, cx = (0.088 + 0.02 * S.bust) * S.W;
const J = { anca: ['elfa', 0, S.hip, 0], busto: ['anca', 0, 0.05, 0], mantello: ['busto', 0, S.torso, -0.04], collo: ['busto', 0, S.torso - 0.005, 0], testa: ['collo', 0, S.neck, 0] };
for (const [L, s] of [['S', 1], ['D', -1]]) Object.assign(J, { ['spalla' + L]: ['busto', s * S.shoulder, S.torso - 0.035, 0], ['gomito' + L]: ['spalla' + L, 0, -S.upper, 0],
  ['coscia' + L]: ['anca', s * cx, -0.06, 0], ['ginocchio' + L]: ['coscia' + L, 0, -S.thigh, 0] });
for (const [name, [par, x, y, z]] of Object.entries(J)) {
  const n = byName[name]; if (!n) fail('manca il giunto ' + name);
  if (parent[name] !== par) fail(`${name}: il genitore è ${parent[name]}, deve essere ${par}`);
  const t = n.translation || [0, 0, 0];
  if (Math.hypot(t[0] - x, t[1] - y, t[2] - z) > 1e-4) fail(`${name}: posizione ${t.map(v => v.toFixed(4))}, deve essere ${[x, y, z].map(v => v.toFixed(4))}`);
}
for (const n of json.nodes) if (n.rotation || n.scale || n.matrix) fail(n.name + ': in posa di riposo i nodi non devono essere ruotati né scalati');

// 2. piedi a terra e altezza
const world = name => { let p = [0, 0, 0], k = name; while (k) { const t = byName[k].translation || [0, 0, 0]; p = p.map((v, i) => v + t[i]); k = parent[k]; } return p; };
let lo = Infinity, hi = -Infinity;
for (const n of json.nodes) if (n.mesh !== undefined) for (const pr of json.meshes[n.mesh].primitives) {
  const a = json.accessors[pr.attributes.POSITION], w = world(n.name); lo = Math.min(lo, w[1] + a.min[1]); hi = Math.max(hi, w[1] + a.max[1]); }
if (Math.abs(lo) > 0.01) fail('i piedi devono toccare y = 0, il punto più basso è a ' + lo.toFixed(3));
if (Math.abs(hi - 1.842) > 0.03) fail('altezza fuori misura: ' + hi.toFixed(3) + ' m (l\'elfa del motore è alta 1,842 m)');

// 3. materiali
for (const m of json.materials) if (!ELFA3D_MATERIALS.includes(m.name)) fail('materiale senza corrispondenza nel motore: ' + m.name);

// 4. guardaroba
const tags = json.nodes.filter(n => n.mesh !== undefined).map(n => ({ name: n.name, ...(n.extras || {}) }));
for (const t of tags) if (!t.strato || !t.pezzo) fail(t.name + ': manca lo strato o il pezzo');
const regioni = new Set(tags.filter(t => t.strato === 'corpo').map(t => t.regione));
for (const r of ['testa', 'orecchie', 'collo', 'busto', 'bacino', 'braccio', 'avambraccio', 'mano', 'coscia', 'gamba', 'piede']) if (!regioni.has(r)) fail('al corpo manca la regione ' + r);
const pezzi = [...new Set(tags.filter(t => t.strato !== 'corpo').map(t => t.pezzo))];
for (const p of ['fascia', 'culotte', 'calze', 'abito', 'corsetto', 'cintura', 'bracciali', 'stivali', 'spallacci', 'mantello', 'orecchini', 'diadema', 'borsello', 'spilla', 'bracciali_alti', 'capelli'])
  if (!pezzi.includes(p)) fail('manca il capo ' + p);
for (const t of tags) {
  for (const r of (t.nasconde || '').split(',').filter(Boolean)) if (!regioni.has(r)) fail(`${t.name}: nasconde la regione ${r}, che non esiste`);
  if (t.richiede && !pezzi.includes(t.richiede)) fail(`${t.name}: richiede ${t.richiede}, che non esiste`);
}
const vede = (lista, f) => { const v = scegliVisibili(tags, lista); return tags.filter((t, i) => v[i] && f(t)).length; };
const corpoNudo = vede([], t => t.strato === 'corpo'), corpoTot = tags.filter(t => t.strato === 'corpo').length;
if (corpoNudo !== corpoTot || vede([], t => t.strato !== 'corpo')) fail('senza capi deve vedersi tutto il corpo e nient\'altro');
if (vede(pezzi, t => t.strato === 'corpo' && ['busto', 'bacino', 'braccio', 'coscia', 'gamba', 'piede'].includes(t.regione))) fail('vestita, il corpo coperto deve essere nascosto');
if (vede(pezzi, t => t.pezzo === 'fascia' || t.pezzo === 'culotte')) fail("vestita, l'intimo sotto l'abito deve essere nascosto");
if (vede(pezzi, t => t.pezzo === 'calze' && t.regione === 'gamba')) fail('le calze sotto gli stivali devono essere nascoste');
if (!vede(['fascia', 'culotte'], t => t.pezzo === 'fascia') || vede(['fascia', 'culotte'], t => t.strato === 'corpo') !== corpoTot) fail("in intimo si vedono fascia, culotte e tutto il corpo");
if (vede(['borsello'], t => t.pezzo === 'borsello')) fail('il borsello senza cintura non deve vedersi');

// 5. modulo
setElfa3d(ab);
const e = elfa3d(); setToon(e.root, true); vesti(e, ['fascia', 'culotte']); vesti(e, []); elfa3d({ vesti: ['abito'] });
for (const c of ['fermo', 'cammina', 'corre', 'saluta']) { e.anim.play(c); e.anim.update(0.1); }
const tri = json.meshes.reduce((a, m) => a + m.primitives.reduce((b, p) => b + json.accessors[p.indices].count / 3, 0), 0);
console.log(`ok · elfa3d · ${Object.keys(J).length} giunti al loro posto · piedi a ${lo.toFixed(3)} m · altezza ${hi.toFixed(2)} m · ${json.materials.length} materiali · ${regioni.size} regioni del corpo · ${pezzi.length} capi · ${tri} triangoli nel file`);
