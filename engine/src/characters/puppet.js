// Marionette: personaggi fatti di pezzi rigidi appesi a "snodi" (giunti), animati con clip di keyframe.
// Niente pelle da deformare: ogni pezzo segue il suo giunto. Le clip sono AnimationClip di three,
// quindi si esportano in glTF e in Godot diventano animazioni dell'AnimationPlayer.
import * as THREE from 'three';
import { E } from '../core/context.js';
import { mute } from '../materials/palette.js';

/** giunto: un gruppo vuoto con un nome univoco, il punto attorno a cui ruota un pezzo */
export function joint(parent, name, x, y, z) { const g = new THREE.Group(); g.name = name; g.position.set(x || 0, y || 0, z || 0); parent.add(g); return g; }
/** pezzo: un parallelepipedo attaccato a un giunto (mat può essere un array di 6 materiali, ordine +x −x +y −y +z −z) */
export function piece(parent, w, h, d, mat, x, y, z, rot) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x || 0, y || 0, z || 0); if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
const cache = {};
/** materiale per personaggi: niente usura (che è legata al mondo), colore smorzato come il resto */
export function charMat(color, map, key) {
  const k = color + '|' + (key || (map ? map.uuid : ''));
  if (!cache[k]) { const p = { color: mute(color), map: map || null };
    cache[k] = E.mood === 'night' ? new THREE.MeshPhongMaterial({ ...p, shininess: 6, specular: new THREE.Color(0x101010) }) : new THREE.MeshLambertMaterial(p); }
  return cache[k];
}
/** texture pixel-art per personaggi con alpha completo (rgb) */
export function charTex(W, H, fn) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), im = x.createImageData(W, H);
  for (let v = 0; v < H; v++) for (let u = 0; u < W; u++) { const p = fn(u, v), k = (v * W + u) * 4; im.data[k] = p[0]; im.data[k + 1] = p[1]; im.data[k + 2] = p[2]; im.data[k + 3] = 255; }
  x.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

/**
 * Crea una clip campionando delle funzioni nel tempo.
 * poses(t) → { nomeGiunto: [rx, ry, rz], ... , $pos: { nomeGiunto: [x,y,z] } } con t in [0, durata)
 * Le rotazioni diventano tracce di quaternioni, le posizioni tracce di vettori. La clip è ciclica (ultimo campione = primo).
 */
export function makeClip(name, duration, poses, samples) {
  const N = samples || Math.max(12, Math.round(duration * 30)), times = [], rot = {}, pos = {};
  const q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i <= N; i++) {
    const t = i / N * duration; times.push(t); const P = poses(i === N ? 0 : t);
    for (const k in P) { if (k === '$pos') continue; const r = P[k]; e.set(r[0], r[1], r[2], 'XYZ'); q.setFromEuler(e); (rot[k] = rot[k] || []).push(q.x, q.y, q.z, q.w); }
    for (const k in (P.$pos || {})) (pos[k] = pos[k] || []).push(...P.$pos[k]);
  }
  const tracks = [];
  for (const k in rot) tracks.push(new THREE.QuaternionKeyframeTrack(k + '.quaternion', times, rot[k]));
  for (const k in pos) tracks.push(new THREE.VectorKeyframeTrack(k + '.position', times, pos[k]));
  return new THREE.AnimationClip(name, duration, tracks);
}

/**
 * Animatore: suona le clip di un personaggio con dissolvenza tra una e l'altra.
 * play('cammina') — i nomi delle clip sono in italiano e restano gli stessi in Godot.
 */
export function animator(root, clips) {
  const mixer = new THREE.AnimationMixer(root), actions = {}; let cur = null;
  for (const c of clips) actions[c.name] = mixer.clipAction(c);
  return {
    clips, mixer,
    play(name, fade) { const a = actions[name]; if (!a || a === cur) return; a.reset().setEffectiveWeight(1).play(); if (cur) cur.crossFadeTo(a, fade ?? 0.25, false); cur = a; },
    current: () => cur && cur.getClip().name,
    update(dt) { mixer.update(dt); },
  };
}
