// Lettore minimo di file .glb (glTF 2.0 binario) per i modelli fatti in Blender (engine/tools/blender/).
// Legge la gerarchia dei nodi (posizione, rotazione, scala) e le mesh con posizioni, normali, uv e indici.
// Le proprietà personalizzate degli oggetti di Blender (extras) finiscono in userData (es. noOutline).
// Dei materiali tiene solo il NOME (in mesh.userData.mat): colori, texture pixel-art e cel shading li mette
// il modulo che usa il modello, così un oggetto fatto in Blender resta nello stile del gioco.
// Niente texture, pelle (skinning) o animazioni dentro il file: le clip restano quelle del motore.
import * as THREE from 'three';

const TYPES = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
let GREY = null;

/**
 * buffer: ArrayBuffer del file .glb. Restituisce un THREE.Group con i nodi della scena.
 * Le uv vengono riportate alla convenzione delle texture del motore (CanvasTexture con flipY): v → 1 − v.
 * Le geometrie sono condivise fra i cloni (root.clone(true)).
 */
export function parseGlb(buffer) {
  const dv = new DataView(buffer);
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('parseGlb: il file non è un .glb');
  let off = 12, json = null, bin = null;
  while (off + 8 <= buffer.byteLength) {
    const len = dv.getUint32(off, true), type = dv.getUint32(off + 4, true);
    if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, off + 8, len)));
    else if (type === 0x004e4942) bin = buffer.slice(off + 8, off + 8 + len);
    off += 8 + len;
  }
  if (!json || !bin) throw new Error('parseGlb: mancano il JSON o i dati binari');
  const read = i => {
    const a = json.accessors[i], bv = json.bufferViews[a.bufferView], T = TYPES[a.componentType], n = SIZE[a.type];
    const start = (bv.byteOffset || 0) + (a.byteOffset || 0), el = n * T.BYTES_PER_ELEMENT, stride = bv.byteStride || el;
    if (stride === el) return { array: new T(bin.slice(start, start + a.count * el)), n };
    const out = new T(a.count * n), src = new T(bin, 0);                    // dati interlacciati (Blender non li scrive, ma si sa mai)
    for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) out[k * n + c] = src[(start + k * stride) / T.BYTES_PER_ELEMENT + c];
    return { array: out, n };
  };
  const geos = {};
  const primitives = mi => json.meshes[mi].primitives.map((p, k) => {
    const key = mi + '/' + k;
    if (!geos[key]) {
      const g = new THREE.BufferGeometry(), A = p.attributes;
      for (const [name, attr] of [['POSITION', 'position'], ['NORMAL', 'normal'], ['TEXCOORD_0', 'uv']]) {
        if (A[name] === undefined) continue;
        const { array, n } = read(A[name]);
        if (attr === 'uv') for (let v = 1; v < array.length; v += 2) array[v] = 1 - array[v];
        g.setAttribute(attr, new THREE.BufferAttribute(array, n));
      }
      if (p.indices !== undefined) g.setIndex(new THREE.BufferAttribute(read(p.indices).array, 1));
      if (A.NORMAL === undefined) g.computeVertexNormals();
      g.computeBoundingSphere(); geos[key] = g;
    }
    return { geometry: geos[key], mat: p.material !== undefined ? json.materials[p.material].name || '' : '' };
  });
  GREY = GREY || new THREE.MeshLambertMaterial({ color: 0x9a9a9a });
  const mesh = (geo, name) => { const m = new THREE.Mesh(geo.geometry, GREY); m.userData.mat = geo.mat; m.name = name; m.castShadow = true; m.receiveShadow = true; return m; };
  const node = i => {
    const n = json.nodes[i], prims = n.mesh !== undefined ? primitives(n.mesh) : [];
    let o;
    if (prims.length === 1) o = mesh(prims[0], n.name || '');
    else { o = new THREE.Group(); prims.forEach(p => o.add(mesh(p, (n.name || 'mesh') + '_' + p.mat))); }
    o.name = n.name || '';
    if (n.extras) { Object.assign(o.userData, n.extras); for (const c of o.children) Object.assign(c.userData, n.extras); }   // proprietà degli oggetti di Blender
    if (n.matrix) { o.matrix.fromArray(n.matrix); o.matrix.decompose(o.position, o.quaternion, o.scale); }
    if (n.translation) o.position.fromArray(n.translation);
    if (n.rotation) o.quaternion.fromArray(n.rotation);
    if (n.scale) o.scale.fromArray(n.scale);
    for (const c of n.children || []) o.add(node(c));
    return o;
  };
  const scene = new THREE.Group(); scene.name = 'glb';
  for (const i of json.scenes[json.scene || 0].nodes) scene.add(node(i));
  return scene;
}
