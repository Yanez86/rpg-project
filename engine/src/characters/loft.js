// Loft: un solido costruito facendo scorrere una sezione ellittica lungo un asse, con larghezza, altezza
// e spostamento verticale che cambiano lungo il percorso. Serve a dare forme organiche (corpo, collo, coda,
// muscoli delle zampe, testa) ai personaggi a marionetta senza modellazione a mano.
import * as THREE from 'three';

/**
 * sections: [{ t, w, h, oy }] — t: posizione lungo l'asse, w/h: semiassi della sezione, oy: spostamento "verso l'alto" della sezione.
 * opts: { axis: 'z' (default, l'alto è +y) | 'y' (l'asse va verso −y, l'alto della sezione è +z, per le zampe),
 *         radial: lati della sezione (12), round: esponente della superellisse (1 = ellisse, <1 più squadrata),
 *         belly: [a0, a1] arco (in giri, 0 = alto) che usa il secondo materiale (ventre), uRep, vRep: ripetizioni della texture,
 *         color(t, a, f) → [r,g,b]: colore per vertice (t posizione, a angolo in giri, f frazione del percorso) — per disegni ampi come controombreggiatura e bande }
 * Restituisce una BufferGeometry con due gruppi: 0 = dorso/fianchi, 1 = ventre.
 */
export function loft(sections, opts) {
  opts = opts || {}; const N = opts.radial || 12, R = opts.round ?? 0.9, axis = opts.axis || 'z';
  const belly = opts.belly || [0.32, 0.68], len = Math.abs(sections[sections.length - 1].t - sections[0].t) || 1;
  // ripetizioni della texture: da opts.tile = [metri per piastrella attorno, metri lungo] (scaglie della stessa misura su tutto il corpo)
  const per = sections.reduce((a, s) => a + Math.PI * (s.w + s.h), 0) / sections.length;
  const uRep = opts.tile ? Math.max(1, Math.round(per / opts.tile[0])) : (opts.uRep || 3), vRep = opts.tile ? len / opts.tile[1] : (opts.vRep || len / 0.55);
  const pos = [], uv = [], col = [], top = [], bot = [], C = opts.color || (() => [1, 1, 1]);
  const P = (s, a) => { const sx = Math.sin(a * Math.PI * 2), cy = Math.cos(a * Math.PI * 2);
    const x = Math.sign(sx) * Math.pow(Math.abs(sx), R) * s.w, u = Math.sign(cy) * Math.pow(Math.abs(cy), R) * s.h + (s.oy || 0);
    return axis === 'z' ? [x, u, s.t] : [x, -s.t, u]; };
  sections.forEach((s, j) => { const f = j / (sections.length - 1); for (let i = 0; i <= N; i++) { pos.push(...P(s, i / N)); uv.push(i / N * uRep, Math.abs(s.t - sections[0].t) / len * vRep); col.push(...C(s.t, i / N, f)); } });
  const row = N + 1, rev = sections[sections.length - 1].t < sections[0].t;   // percorso al contrario: si inverte l'avvolgimento
  for (let j = 0; j < sections.length - 1; j++) for (let i = 0; i < N; i++) {
    const a = j * row + i, b = a + 1, c = a + row, d = c + 1, mid = (i + 0.5) / N, list = mid > belly[0] && mid < belly[1] ? bot : top;
    if (!rev) list.push(a, c, b, b, c, d); else list.push(a, b, c, b, d, c);
  }
  // tappi alle due estremità
  for (const [j, flip] of [[0, true], [sections.length - 1, false]]) {
    const s = sections[j], ci = pos.length / 3; pos.push(...(axis === 'z' ? [0, s.oy || 0, s.t] : [0, -s.t, s.oy || 0])); uv.push(0.5, 0.5); col.push(...C(s.t, 0.5, j ? 1 : 0));
    for (let i = 0; i < N; i++) { const a = j * row + i, b = a + 1; const f = flip !== rev; top.push(...(f ? [ci, a, b] : [ci, b, a])); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex([...top, ...bot]); g.addGroup(0, top.length, 0); g.addGroup(top.length, bot.length, 1);
  g.computeVertexNormals(); return g;
}
/** sezioni lisce tra due estremi con un rigonfiamento a metà (muscolo); n sezioni */
export function taper(t0, t1, w0, h0, w1, h1, bulge, n, oy0, oy1) {
  const out = []; n = n || 6;
  for (let k = 0; k < n; k++) { const f = k / (n - 1), b = 1 + (bulge || 0) * Math.sin(Math.PI * f), e = f === 0 || f === 1 ? 0.82 : 1;
    out.push({ t: t0 + (t1 - t0) * f, w: (w0 + (w1 - w0) * f) * b * e, h: (h0 + (h1 - h0) * f) * b * e, oy: (oy0 || 0) + ((oy1 || 0) - (oy0 || 0)) * f }); }
  return out;
}
