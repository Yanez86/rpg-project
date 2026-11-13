// Fiori modellati: margherita, tulipano, campanula, papavero, lavanda.
// Ogni fiore = stelo curvo in 3 tratti + foglie + petali + bottone. Ricetta: docs/oggetti.md › Fiori.
import * as THREE from 'three';
import { E } from '../core/context.js';
import { rnd, R, pick, hn } from '../core/rng.js';
import { V, PI, B, uvB, CY, CO, SP, TO, uvS, mergeGeometries } from '../core/geometry.js';
import { P, tm } from '../materials/factory.js';
import { mute } from '../materials/palette.js';
import { TEX } from '../textures/library.js';
import { pix, G } from '../textures/pix.js';

export const FLOWER_TYPES=['daisy','tulip','bell','poppy','lavender'];
export const FLOWER_COLS={daisy:[0xf0ece0,0xf2e6b8,0xe8d8e8],tulip:[0xb8242e,0xd86a2a,0xd8b030,0xc85a7a],bell:[0x6a5ab8,0x8a7ac8,0x5a6ab0],poppy:[0xc8302a,0xd8402a],lavender:[0x7a5aa8,0x8a6ab8]};
let FG=null;
export function flowerGeometry(){return FG||(FG=(()=>{const NI=g=>{g=g.index?g.toNonIndexed():g;return g;},M=a=>mergeGeometries(a.map(NI));
  const stem=(h,bend)=>{const parts=[],n=3;let px=0,py=0;for(let i=0;i<n;i++){const c=CY(0.0055,0.007,h/n+0.004,4);c.rotateZ(-bend*(i+0.5)/n);c.translate(px+Math.sin(bend*(i+0.5)/n)*h/n/2,py+h/n/2,0);parts.push(c);px+=Math.sin(bend*(i+0.5)/n)*h/n;py+=Math.cos(bend*(i+0.5)/n)*h/n;}
    return {parts,top:[px,py]};};
  const leaf=(len,w,ang,ry,y)=>{const l=B(w,len,0.004);l.translate(0,len/2,0);l.rotateZ(ang);l.rotateY(ry);l.translate(0,y,0);return l;};
  const Gf={};
  {const s=stem(0.3,0.15),[tx,ty]=s.top,p=[];for(let i=0;i<12;i++){const b=B(0.016,0.004,0.06);b.translate(0,0,0.038);b.rotateX(-0.22);b.rotateY(i/12*PI*2+(i%2)*0.1);b.translate(tx,ty,0);p.push(b);}
   const c=SP(0.017,1);c.scale(1,0.55,1);c.translate(tx,ty+0.004,0);Gf.daisy={petal:M(p),stem:M([...s.parts,leaf(0.09,0.022,0.7,0,0.04),leaf(0.08,0.02,-0.6,2.2,0.07)]),center:M([c]),cc:0xc89a28};}
  {const s=stem(0.32,0.06),[tx,ty]=s.top,p=[];for(let i=0;i<6;i++){const r=i<3?0.024:0.018,b=B(0.032,0.072,0.005);b.translate(0,0.036,r);b.rotateX(i<3?0.2:0.08);b.rotateY(i/3*PI*2+(i<3?0:PI/3));b.translate(tx,ty-0.005,0);p.push(b);}
   const c=SP(0.008,0);c.translate(tx,ty+0.02,0);Gf.tulip={petal:M(p),stem:M([...s.parts,leaf(0.19,0.032,0.22,0,0.0),leaf(0.16,0.028,-0.28,2.6,0.02)]),center:M([c]),cc:0x2a2418};}
  {const s=stem(0.34,0.55),[tx,ty]=s.top,p=[],cs=[];for(let i=0;i<3;i++){const t=0.55+i*0.2,bx=tx*t,by=ty*t;const k=CO(0.022,0.04,6);k.rotateX(PI);k.translate(bx+0.01,by-0.03,0);p.push(k);
     const st=CY(0.003,0.003,0.03,3);st.translate(bx+0.01,by-0.012,0);cs.push(st);const cl=SP(0.006,0);cl.translate(bx+0.01,by-0.05,0);cs.push(cl);}
   Gf.bell={petal:M(p),stem:M([...s.parts,...cs.slice(0,0),leaf(0.08,0.02,0.6,1,0.03)]),center:M(cs),cc:0x4a6a2e};}
  {const s=stem(0.36,0.2),[tx,ty]=s.top,p=[];for(let i=0;i<4;i++){const b=SP(0.034,1);b.scale(1,0.18,0.85);b.rotateX(-0.55);b.translate(0,0.008,0.026);b.rotateY(i*PI/2+0.3);b.translate(tx,ty,0);p.push(b);}
   const c=SP(0.013,1);c.scale(1,0.7,1);c.translate(tx,ty+0.012,0);Gf.poppy={petal:M(p),stem:M([...s.parts,leaf(0.07,0.018,0.9,0.5,0.05),leaf(0.06,0.016,-0.8,3.3,0.03)]),center:M([c]),cc:0x1e2418};}
  {const s=stem(0.24,0.1),[tx,ty]=s.top,p=[];for(let i=0;i<11;i++){const b=SP(0.011,0);b.scale(1,1.3,1);const a=i*2.4;b.translate(tx+Math.cos(a)*0.008,ty+i*0.011,Math.sin(a)*0.008);p.push(b);}
   const c=SP(0.004,0);c.translate(tx,ty-0.004,0);Gf.lavender={petal:M(p),stem:M([...s.parts,leaf(0.1,0.008,0.25,0,0.0),leaf(0.1,0.008,-0.3,1.6,0.0),leaf(0.09,0.008,0.35,3.1,0.0)]),center:M([c]),cc:0x6a8a5a};}
  return Gf;})());}
export const FLOWER_STEM=0x4a6a2e;
export function flower(parent,x,y,z,type,col,s){const f=flowerGeometry()[type],g=new THREE.Group();g.position.set(x,y,z);g.rotation.set(R(-0.15,0.15),rnd()*6,R(-0.15,0.15));g.scale.setScalar(s||1);parent.add(g);
  const o={cast:false};P(g,f.petal,col,0,0,0,o);P(g,f.stem,FLOWER_STEM,0,0,0,o);P(g,f.center,f.cc,0,0,0,o);return g;}
export function flowerBed(parent,x,y,z,n,spread,s){const t=pick(FLOWER_TYPES),c=pick(FLOWER_COLS[t]);for(let i=0;i<n;i++)flower(parent,x+R(-spread,spread),y,z+R(-spread,spread),t,c,(s||1)*R(0.8,1.15));}
/**
 * Prato fiorito istanziato: spots = [[x,z,scala],...]. I fiori crescono a chiazze della stessa specie (85%).
 * Due InstancedMesh per specie con le stesse matrici: petali (tinta per istanza) e stelo+bottone (colori per vertice).
 */
export function flowerField(spots){
  const FGm=flowerGeometry(),byType={};FLOWER_TYPES.forEach(t=>byType[t]=[]);
  spots.forEach(([x,z,s])=>{const q=hn(Math.floor(x/3.5),Math.floor(z/3.5),140),t=FLOWER_TYPES[Math.floor(q*5)%5];byType[rnd()<0.85?t:pick(FLOWER_TYPES)].push([x,z,s]);});
  const vc=(geo,hex)=>{const c=new THREE.Color(hex),a=new Float32Array(geo.attributes.position.count*3);for(let i=0;i<a.length;i+=3){a[i]=c.r;a[i+1]=c.g;a[i+2]=c.b;}geo.setAttribute('color',new THREE.BufferAttribute(a,3));return geo;};
  const greenMat=new THREE.MeshLambertMaterial({vertexColors:true}),petMat=new THREE.MeshLambertMaterial({color:0xffffff});
  const out=[];
  FLOWER_TYPES.forEach(t=>{const L=byType[t];if(!L.length)return;const f=FGm[t];
    const gg=mergeGeometries([vc(f.stem.clone(),mute(FLOWER_STEM).getHex()),vc(f.center.clone(),mute(f.cc).getHex())]);
    const A=new THREE.InstancedMesh(f.petal,petMat,L.length),Bm=new THREE.InstancedMesh(gg,greenMat,L.length),d=new THREE.Object3D(),c=new THREE.Color();
    const pal=FLOWER_COLS[t],base=pick(pal);
    L.forEach(([x,z,s],i)=>{d.position.set(x,0,z);d.rotation.set(R(-0.2,0.2),rnd()*6,R(-0.2,0.2));d.scale.setScalar(s);d.updateMatrix();A.setMatrixAt(i,d.matrix);Bm.setMatrixAt(i,d.matrix);
      c.copy(mute(rnd()<0.75?base:pick(pal)));A.setColorAt(i,c);});
    for(const m of[A,Bm]){m.receiveShadow=true;m.frustumCulled=false;E.scene.add(m);out.push(m);}});
  return out;}
