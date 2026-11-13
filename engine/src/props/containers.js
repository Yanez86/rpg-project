// Botti, casse, sacchi, cesti.
import * as THREE from 'three';
import { E } from '../core/context.js';
import { rnd, R, pick, hn } from '../core/rng.js';
import { V, PI, B, uvB, CY, CO, SP, TO, uvS, mergeGeometries } from '../core/geometry.js';
import { P, tm } from '../materials/factory.js';
import { mute } from '../materials/palette.js';
import { TEX } from '../textures/library.js';
import { pix, G } from '../textures/pix.js';

export function barrel(p,x,y,z){P(p,CY(0.34,0.34,0.85,14),0xa8774c,x,y+0.425,z,{tex:'wood',uv:[3,1]});
  for(const dy of[-0.27,0.27])P(p,TO(0.35,0.03,16),0x4a4f66,x,y+0.425+dy,z,{rot:[PI/2,0,0]});
  P(p,CY(0.3,0.3,0.02,14),0x8a5d3c,x,y+0.86,z,{cast:false});}
export function crate(p,x,y,z,s,ry){P(p,uvB(s,s,s,1,1),0xc29262,x,y+s/2,z,{tex:'wood',rot:[0,ry||0,0]});
  P(p,B(s+0.02,0.07,s+0.02),0x8a5d3c,x,y+s*0.5,z,{rot:[0,ry||0,0],cast:false});}
export function sack(p,x,y,z){P(p,SP(0.28,1),0xe8d6a8,x,y+0.3,z,{scale:[1,1.25,0.9]});P(p,CY(0.06,0.1,0.14,6),0xc8b07a,x,y+0.68,z,{});}
export function basket(p,x,y,z,fruit){P(p,CY(0.2,0.14,0.22,12),0xc8955a,x,y+0.11,z,{});
  for(let i=0;i<5;i++)P(p,SP(0.07,0),fruit,x+R(-0.1,0.1),y+0.24,z+R(-0.1,0.1),{cast:false});}
