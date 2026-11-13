// Fabbrica dei materiali e helper P() per creare e appendere mesh.
import * as THREE from 'three';
import { E } from '../core/context.js';
import { uvS } from '../core/geometry.js';
import { TEX } from '../textures/library.js';
import { mute, LIT, GLASS } from './palette.js';
import { wear } from './wear.js';

const mats = {};
/**
 * Materiale condiviso per colore e opzioni.
 * o.tex: nome della texture in TEX · o.emi: colore emissivo · o.side: doppia faccia.
 * I colori in LIT diventano luce calda (MeshBasic). Le tegole hanno opacity 0.86 = riflesso leggero (maschera SSR).
 * Di notte (E.mood==='night') i materiali sono Phong, così le luci puntiformi sono calcolate per pixel.
 */
export function tm(color, o) {
  o = o || {}; const k = color + '|' + (o.tex || '') + '|' + (o.emi || 0) + '|' + (o.side || 0);
  if (!mats[k]) {
    if (LIT[color] != null) mats[k] = new THREE.MeshBasicMaterial({ color: LIT[color], map: color === GLASS ? TEX.window : null });
    else {
      const p = { color: mute(color) }; if (o.tex) p.map = TEX[o.tex]; if (o.tex && o.tex.indexOf('tiles') === 0) p.opacity = 0.86;
      if (o.emi) p.emissive = mute(o.emi).multiplyScalar(.6); if (o.side) p.side = THREE.DoubleSide;
      if (E.mood === 'night') { p.shininess = 10; p.specular = new THREE.Color(0x181818); mats[k] = wear(new THREE.MeshPhongMaterial(p)); }
      else mats[k] = wear(new THREE.MeshLambertMaterial(p));
    }
  }
  return mats[k];
}
/** materiale con colori per vertice (terreno), con usura */
export function vertexColorMaterial(map) {
  const p = { map, vertexColors: true };
  return wear(E.mood === 'night' ? new THREE.MeshPhongMaterial({ ...p, shininess: 4, specular: new THREE.Color(0x080808) }) : new THREE.MeshLambertMaterial(p));
}
/**
 * Crea una mesh e la appende a parent.
 * o: { scale:[x,y,z], uv:[su,sv], rot:[x,y,z], cast:false, mat, tex, emi, side }
 */
export function P(parent, geo, color, x, y, z, o) {
  o = o || {};
  if (o.scale) geo.scale(o.scale[0], o.scale[1], o.scale[2]);
  if (o.uv) uvS(geo, o.uv[0], o.uv[1]);
  const m = new THREE.Mesh(geo, o.mat || tm(color, o));
  m.position.set(x || 0, y || 0, z || 0); if (o.rot) m.rotation.set(o.rot[0], o.rot[1], o.rot[2]);
  m.castShadow = o.cast !== false; m.receiveShadow = true;
  parent.add(m); return m;
}
let ivy = null;
/** edera su piano con trasparenza */
export function ivyMaterial() { return ivy || (ivy = new THREE.MeshLambertMaterial({ map: TEX.ivy, alphaTest: 0.5, side: THREE.DoubleSide, color: 0xb8c4a8 })); }
