// Texture in pixel-art dipinte un pixel alla volta, con variazione di tinta (hue shifting) automatica.
import * as THREE from 'three';
import { E } from '../core/context.js';
import { hn } from '../core/rng.js';

/** grigio limitato a 0..255 */
export const G = v => { v = Math.max(0, Math.min(255, v | 0)); return [v, v, v]; };
function aniso(n) { return E.renderer ? Math.min(n, E.renderer.capabilities.getMaxAnisotropy()) : 1; }

/**
 * Crea una texture S×S chiamando fn(u, v, S) per ogni pixel: deve restituire [r,g,b].
 * Se il pixel è grigio, riceve l'hue shift: blocchi di 4 px più caldi o freddi, verde a blocchi di 8 px, grana per pixel.
 * Filtro Nearest in ingrandimento (pixel netti), mipmap in riduzione.
 */
export function pix(S, fn, rot) {
  const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), im = x.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let X = 0; X < S; X++) {
    const [u, v] = rot ? [y, S - 1 - X] : [X, y]; const p = fn(u, v, S);
    if (p[0] === p[1] && p[1] === p[2]) { const t = (hn(X >> 2, y >> 2, 91) - 0.5) * 0.24 + (hn(X, y, 92) - 0.5) * 0.08, gq = (hn(X >> 3, y >> 3, 93) - 0.5) * 0.12; p[0] *= 1 + t; p[1] *= 1 + gq; p[2] *= 1 - t; }
    const k = (y * S + X) * 4; im.data[k] = p[0]; im.data[k + 1] = p[1]; im.data[k + 2] = p[2]; im.data[k + 3] = 255;
  }
  x.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = aniso(4); return t;
}
