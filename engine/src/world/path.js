import * as THREE from 'three';
import { E } from '../core/context.js';
import { rnd, R, pick, hn, vnoise } from '../core/rng.js';
import { V, PI, B, uvB, CY, CO, SP, uvS } from '../core/geometry.js';
import { P, tm, ivyMaterial, vertexColorMaterial } from '../materials/factory.js';
import { TEX } from '../textures/library.js';

/**
 * Sentiero di terra battuta da (ax,az) a (bx,bz), largo w: piano di terra (riflesso leggero, opacity 0.8),
 * due solchi delle ruote bagnati (opacity 0.62 = riflettono come pozzanghere) e sassi lungo i bordi.
 */
export function path(parent,ax,az,bx,bz,w){const len=Math.hypot(bx-ax,bz-az);const g=new THREE.PlaneGeometry(w,len);g.rotateX(-PI/2);uvS(g,w/2.5,len/2.5);
  const m=P(parent,g,0xb8a888,(ax+bx)/2,0.03,(az+bz)/2,{tex:'dirt',cast:false});m.material.opacity=0.8;m.rotation.y=Math.atan2(bx-ax,bz-az);
  const dx=(bx-ax)/len,dz=(bz-az)/len,ang=Math.atan2(bx-ax,bz-az);
  for(const off of[-0.42,0.42]){const rg=new THREE.PlaneGeometry(0.22,len*0.96);rg.rotateX(-PI/2);uvS(rg,0.2,len/2);const r=P(parent,rg,0x5a4a3a,(ax+bx)/2+dz*off,0.036,(az+bz)/2-dx*off,{tex:'dirt',cast:false});r.material.opacity=0.62;r.rotation.y=ang;}
  for(let t=0.3;t<len;t+=R(0.3,0.7))for(const s of[-1,1])if(rnd()<0.55){const e=w/2+R(-0.12,0.15);P(parent,SP(R(0.07,0.16),0),pick([0x8a867c,0x7e7a70,0x9a968a]),ax+dx*t+dz*s*e,0.03,az+dz*t-dx*s*e,{scale:[1,0.5,1],cast:false});}}
