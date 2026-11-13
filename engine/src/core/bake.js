// Unione statica (static batching): tutte le mesh statiche di un gruppo vengono fuse per materiale.
// ATTENZIONE: conserva solo position/normal/uv. Le mesh con colori per vertice vanno nella scena a parte.
import * as THREE from 'three';
import { E } from './context.js';
import { mergeGeometries } from './geometry.js';

export function bake(root) {
  root.updateMatrixWorld(true); const buckets = new Map(), other = [];
  root.traverse(o => {
    if (!o.isMesh) return;
    if (o.material.isShaderMaterial || Array.isArray(o.material)) { other.push(o); return; }
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
    const p = new THREE.BufferGeometry(); p.setAttribute('position', g.attributes.position);
    p.setAttribute('normal', g.attributes.normal);
    p.setAttribute('uv', g.attributes.uv || new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    const k = o.material.uuid + (o.castShadow ? 'c' : 'n'); if (!buckets.has(k)) buckets.set(k, { mat: o.material, cast: o.castShadow, geos: [] }); buckets.get(k).geos.push(p);
  });
  other.forEach(o => { o.updateMatrixWorld(true); const m = o.matrixWorld.clone(); o.parent.remove(o); o.matrix.copy(m); o.matrix.decompose(o.position, o.quaternion, o.scale); E.scene.add(o); });
  if (root.parent) root.parent.remove(root);
  for (const b of buckets.values()) { const g = mergeGeometries(b.geos); const m = new THREE.Mesh(g, b.mat); m.castShadow = b.cast; m.receiveShadow = true; m.matrixAutoUpdate = false; E.scene.add(m); }
}
