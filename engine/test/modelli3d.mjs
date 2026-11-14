// Prova dei personaggi modellati in Blender (engine/tools/blender/personaggi.py → engine/assets/*.glb) e dei loro moduli.
// Per ogni modello (elfa, wuxia) controlla:
//  1. ci sono tutti i giunti della marionetta, con lo stesso genitore, nella posizione data dalle misure del modello
//     (userData.misure della radice) e senza rotazioni né scale: le clip di villagerClips() funzionano uguali;
//  2. in posa di riposo i piedi toccano y = 0 e l'altezza è quella giusta per il personaggio;
//  3. ogni materiale del file ha il suo materiale nel motore;
//  4. guardaroba: ogni oggetto ha strato e pezzo, il corpo ha tutte le regioni, i capi coprono regioni che esistono,
//     richiedono capi che esistono, e vestendo o spogliando si vede la cosa giusta (scegliVisibili);
//  5. il modulo crea il personaggio, che prende il cel shading, si veste e suona le clip (con il finto three).
import fs from 'fs';
const canvas2d = () => new Proxy({}, { get: (t, k) => k === 'createImageData' ? ((w, h) => ({ data: new Uint8ClampedArray(w * h * 4) })) : (() => ({})) });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: canvas2d }) };
process.on('uncaughtException', e => { console.error('ERRORE:', e); process.exit(1); });
let nome = '';
const fail = m => { console.error(`ERRORE (${nome}): ${m}`); process.exit(1); };
const { setElfa3d, elfa3d, ELFA3D_MATERIALS } = await import('../src/characters/elfa3d.js');
const { setWuxia3d, wuxia3d, WUXIA3D_MATERIALS } = await import('../src/characters/wuxia3d.js');
const { scegliVisibili, vesti } = await import('../src/characters/guardaroba.js');
const { setToon } = await import('../src/characters/toon.js');

const REGIONI = ['testa', 'orecchie', 'collo', 'busto', 'bacino', 'braccio', 'avambraccio', 'mano', 'coscia', 'gamba', 'piede'];
const MODELLI = [
  { nome: 'elfa', set: setElfa3d, crea: elfa3d, materiali: ELFA3D_MATERIALS, altezza: [1.8, 1.95],
    capi: ['fascia', 'culotte', 'calze', 'abito', 'corsetto', 'cintura', 'bracciali', 'stivali', 'spallacci', 'mantello', 'orecchini', 'diadema', 'borsello', 'spilla', 'bracciali_alti', 'capelli'],
    prove: vede => {
      const capi = MODELLI[0].capi;
      if (vede(capi, t => t.strato === 'corpo' && ['busto', 'bacino', 'braccio', 'coscia', 'gamba', 'piede'].includes(t.regione))) fail('vestita, il corpo coperto deve essere nascosto');
      if (vede(capi, t => t.pezzo === 'fascia' || t.pezzo === 'culotte')) fail("vestita, l'intimo sotto l'abito deve essere nascosto");
      if (vede(capi, t => t.pezzo === 'calze' && t.regione === 'gamba')) fail('le calze sotto gli stivali devono essere nascoste');
      if (vede(['borsello'], t => t.pezzo === 'borsello')) fail('il borsello senza cintura non deve vedersi');
    } },
  { nome: 'wuxia', set: setWuxia3d, crea: wuxia3d, materiali: WUXIA3D_MATERIALS, altezza: [1.65, 1.8],
    capi: ['dudou', 'brasiliana', 'capelli', 'fermagli', 'veste', 'gonna', 'fusciacca', 'pantaloni', 'stivali', 'pendaglio'],
    prove: vede => {
      const capi = MODELLI[1].capi;
      if (vede(['fermagli'], t => t.pezzo === 'fermagli')) fail('i fermagli senza capelli non devono vedersi');
      if (vede(['pendaglio'], t => t.pezzo === 'pendaglio')) fail('il pendaglio senza fusciacca non deve vedersi');
      if (vede(capi, t => t.pezzo === 'dudou' || t.pezzo === 'brasiliana')) fail("vestita, l'intimo sotto la veste deve essere nascosto");
      if (vede(capi, t => t.strato === 'corpo' && ['busto', 'bacino', 'braccio', 'coscia', 'gamba', 'piede'].includes(t.regione))) fail('vestita, il corpo coperto deve essere nascosto');
      if (!vede(['dudou', 'brasiliana'], t => t.pezzo === 'dudou') || !vede(['dudou', 'brasiliana'], t => t.pezzo === 'brasiliana')) fail('dudou e brasiliana devono vedersi');
    } },
];

const righe = [];
for (const M of MODELLI) {
  nome = M.nome;
  const file = fs.readFileSync(new URL(`../assets/${M.nome}.glb`, import.meta.url));
  const ab = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(ab, 20, new DataView(ab).getUint32(12, true))));
  const byName = {}, parent = {};
  json.nodes.forEach(n => { byName[n.name] = n; for (const c of n.children || []) parent[json.nodes[c].name] = n.name; });
  if (!byName[M.nome]) fail('manca il nodo radice ' + M.nome);

  // 1. giunti
  const S = (byName[M.nome].extras || {}).misure; if (!S) fail('mancano le misure nella radice');
  const cx = (0.088 + 0.02 * (S.bust ?? 1)) * S.W;
  const J = { anca: [M.nome, 0, S.hip, 0], busto: ['anca', 0, 0.05, 0], mantello: ['busto', 0, S.torso, -0.04], collo: ['busto', 0, S.torso - 0.005, 0], testa: ['collo', 0, S.neck, 0] };
  for (const [L, s] of [['S', 1], ['D', -1]]) Object.assign(J, { ['spalla' + L]: ['busto', s * S.shoulder, S.torso - S.shoulderDrop, 0], ['gomito' + L]: ['spalla' + L, 0, -S.upper, 0],
    ['coscia' + L]: ['anca', s * cx, -0.06, 0], ['ginocchio' + L]: ['coscia' + L, 0, -S.thigh, 0] });
  for (const [n, [par, x, y, z]] of Object.entries(J)) {
    const nd = byName[n]; if (!nd) fail('manca il giunto ' + n);
    if (parent[n] !== par) fail(`${n}: il genitore è ${parent[n]}, deve essere ${par}`);
    const t = nd.translation || [0, 0, 0];
    if (Math.hypot(t[0] - x, t[1] - y, t[2] - z) > 1e-4) fail(`${n}: posizione ${t.map(v => v.toFixed(4))}, deve essere ${[x, y, z].map(v => v.toFixed(4))}`);
  }
  for (const n of json.nodes) if (n.rotation || n.scale || n.matrix) fail(n.name + ': in posa di riposo i nodi non devono essere ruotati né scalati');

  // 2. piedi a terra e altezza
  const world = n => { let p = [0, 0, 0], k = n; while (k) { const t = byName[k].translation || [0, 0, 0]; p = p.map((v, i) => v + t[i]); k = parent[k]; } return p; };
  let lo = Infinity, hi = -Infinity;
  for (const n of json.nodes) if (n.mesh !== undefined) for (const pr of json.meshes[n.mesh].primitives) {
    const a = json.accessors[pr.attributes.POSITION], w = world(n.name); lo = Math.min(lo, w[1] + a.min[1]); hi = Math.max(hi, w[1] + a.max[1]); }
  if (Math.abs(lo) > 0.01) fail('i piedi devono toccare y = 0, il punto più basso è a ' + lo.toFixed(3));
  if (hi < M.altezza[0] || hi > M.altezza[1]) fail(`altezza fuori misura: ${hi.toFixed(3)} m (attesa fra ${M.altezza[0]} e ${M.altezza[1]})`);

  // 3. materiali
  for (const m of json.materials) if (!M.materiali.includes(m.name)) fail('materiale senza corrispondenza nel motore: ' + m.name);

  // 4. guardaroba
  const tags = json.nodes.filter(n => n.mesh !== undefined).map(n => ({ name: n.name, ...(n.extras || {}) }));
  for (const t of tags) if (!t.strato || !t.pezzo) fail(t.name + ': manca lo strato o il pezzo');
  const regioni = new Set(tags.filter(t => t.strato === 'corpo').map(t => t.regione));
  for (const r of REGIONI) if (!regioni.has(r)) fail('al corpo manca la regione ' + r);
  const pezzi = [...new Set(tags.filter(t => t.strato !== 'corpo').map(t => t.pezzo))];
  for (const p of M.capi) if (!pezzi.includes(p)) fail('manca il capo ' + p);
  for (const t of tags) {
    for (const r of (t.nasconde || '').split(',').filter(Boolean)) if (!regioni.has(r)) fail(`${t.name}: nasconde la regione ${r}, che non esiste`);
    if (t.richiede && !pezzi.includes(t.richiede)) fail(`${t.name}: richiede ${t.richiede}, che non esiste`);
  }
  const vede = (lista, f) => { const v = scegliVisibili(tags, lista); return tags.filter((t, i) => v[i] && f(t)).length; };
  const corpoTot = tags.filter(t => t.strato === 'corpo').length;
  if (vede([], t => t.strato === 'corpo') !== corpoTot || vede([], t => t.strato !== 'corpo')) fail("senza capi deve vedersi tutto il corpo e nient'altro");
  M.prove(vede);

  // 5. modulo
  M.set(ab);
  const e = M.crea(); setToon(e.root, true); vesti(e, []); M.crea({ vesti: [pezzi[0]] });
  for (const c of ['fermo', 'cammina', 'corre', 'saluta']) { e.anim.play(c); e.anim.update(0.1); }
  const tri = json.meshes.reduce((a, m) => a + m.primitives.reduce((b, p) => b + json.accessors[p.indices].count / 3, 0), 0);
  righe.push(`${M.nome}: giunti al loro posto, piedi a ${Math.abs(lo).toFixed(3)} m, altezza ${hi.toFixed(2)} m, ${regioni.size} regioni, ${pezzi.length} capi, ${tri} triangoli`);
}
console.log('ok · modelli 3d · ' + righe.join(' · '));
