// Palette dei materiali veri (docs/estetica.md §2). Il colore saturo è solo negli accenti.
import * as THREE from 'three';

export const WALLS = [0xd9cdb6, 0xcbbd9f, 0xbfb3a0, 0xd4c4a4, 0xc2b8a8, 0xb8a890];
export const ROOFS = [0x585e66, 0x4c535a, 0x666b70, 0x5e5048, 0x50565c, 0x6a5a4e];
export const SHUT = [0x3e3028, 0x34444c, 0x4e2e24, 0x3c4634, 0x46383e, 0x5a4028];
export const DOORS = [0x4a3424, 0x3a2a1e, 0x34404a, 0x5a2e24, 0x2e2620];
export const TIMBER = 0x3a2a20, STONE = 0xa8a294, IRON = 0x242426, BRASS = 0xb08a48;
export const BANNERS = [0xc8302a, 0xb22a34, 0xd0402a, 0x2a58a8];
export const BUNTING = [0x8a2a24, 0xa8843a, 0x2f5a5a, 0x34507a, 0x6a2a48, 0xc8bca0, 0x4a3a5a];
export const GRASS = [0x5a8a3c, 0x6a9444, 0x4f7e36, 0x76a04c];
export const FOLIAGE = [0x4a7e36, 0x5a8c3e, 0x3f7034, 0x66963f];
/** colore "segnaposto" del vetro: tm() lo trasforma in luce calda con la texture d'interno */
export const GLASS = 0x8fd3f5;
/** colori che diventano sorgenti di luce (MeshBasic) */
export const LIT = { [GLASS]: 0xffc070, 0x9fdcff: 0xffb45a, 0xffeaa6: 0xffd38a, 0xffe9a0: 0xffd38a };

/** desatura del 20% e scurisce un poco: tutti i colori dei materiali passano da qui */
export function mute(h) { const c = new THREE.Color(h), l = c.r * .3 + c.g * .59 + c.b * .11; c.r = (c.r * .8 + l * .2) * .9; c.g = (c.g * .8 + l * .2) * .92; c.b = (c.b * .8 + l * .2) * .88; return c; }
