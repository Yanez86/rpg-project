// Esporta in JSON i triangoli (coordinate mondo + colore) di un personaggio in posa di riposo.
// Uso: node --import ./register.mjs personaggio.mjs villager|elf|cat|dragon out.json
import fs from 'fs';
const ctx = () => new Proxy({}, { get: (t, k) => k === 'createImageData' ? ((w, h) => ({ data: new Uint8ClampedArray(w * h * 4) })) : (() => ({})) });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: ctx }) };
const THREE = await import('three');
const [which, out] = process.argv.slice(2);
const mod = await import('../../src/characters/' + ({ villager: 'villager', elf: 'villager', cat: 'cat', dragon: 'dragon' })[which] + '.js');
const { setSeed } = await import('../../src/core/rng.js'); setSeed(Number(process.env.SEED || 7));
const c = mod[which](); const root = c.root; root.updateMatrixWorld();
const tris = [];
root.traverse(o => { if (!o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
  const P = o.geometry.attributes.position, I = o.geometry.index || [...Array(P.count).keys()], M = o.matrixWorld;
  const mats = Array.isArray(o.material) ? o.material : [o.material], groups = o.geometry.groups && o.geometry.groups.length ? o.geometry.groups : [{ start: 0, count: I.length, materialIndex: 0 }];
  for (const g of groups) { const m = mats[g.materialIndex] || mats[0], col = m && m.color ? [m.color.r, m.color.g, m.color.b] : [1, 1, 1];
    for (let k = g.start; k < g.start + g.count; k += 3) { const v = [I[k], I[k + 1], I[k + 2]].map(i => new THREE.Vector3(P.getX(i), P.getY(i), P.getZ(i)).applyMatrix4(M)); tris.push([v.map(p => [p.x, p.y, p.z]), col]); } } });
fs.writeFileSync(out, JSON.stringify(tris)); console.log(which, 'triangoli', tris.length);
