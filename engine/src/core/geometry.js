// Scorciatoie per le geometrie e unione di geometrie (senza dipendere dagli esempi di three).
import * as THREE from 'three';

export const V = THREE.Vector3, PI = Math.PI, D2R = PI / 180;
export function uvS(g, su, sv) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return g; }
export const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export const uvB = (w, h, d, su, sv) => uvS(B(w, h, d), su, sv);
export const CY = (a, b, h, s) => new THREE.CylinderGeometry(a, b, h, s || 16);
export const CO = (r, h, s) => new THREE.ConeGeometry(r, h, s || 16);
export const SP = (r, d) => new THREE.IcosahedronGeometry(r, d == null ? 1 : d);
export const TO = (r, t, s) => new THREE.TorusGeometry(r, t, 6, s || 20);

/** Unisce geometrie (convertite a non indicizzate) che hanno gli stessi attributi. */
export function mergeGeometries(list) {
  const geos = list.map(g => g.index ? g.toNonIndexed() : g);
  const names = Object.keys(geos[0].attributes).filter(n => geos.every(g => g.attributes[n]));
  const out = new THREE.BufferGeometry();
  for (const n of names) {
    const size = geos[0].attributes[n].itemSize, total = geos.reduce((s, g) => s + g.attributes[n].count * size, 0);
    const arr = new Float32Array(total); let off = 0;
    for (const g of geos) { const src = g.attributes[n].array; arr.set(src.length > g.attributes[n].count * size ? src.subarray(0, g.attributes[n].count * size) : src, off); off += g.attributes[n].count * size; }
    out.setAttribute(n, new THREE.BufferAttribute(arr, size));
  }
  return out;
}
