// Alberi procedurali: ramificazione ricorsiva (L-system semplificato), foglie su card con trasparenza,
// vento nel vertex shader. Specie: quercia, betulla, salice, abete, albero fiorito, albero secco.
// Ricetta: docs/oggetti.md › Alberi.
import * as THREE from 'three';
import { E } from '../core/context.js';
import { rnd, R, pick, hn } from '../core/rng.js';
import { V, PI, B, uvB, CY, CO, SP, uvS, mergeGeometries } from '../core/geometry.js';
import { P, tm } from '../materials/factory.js';

export function leafTex(kind){const S=64,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d'),im=x.createImageData(S,S),d=im.data;
  let sd=({oak:11,birch:23,willow:37,fir:41,blossom:53})[kind];const lr=()=>(sd=(Math.imul(sd,1664525)+1013904223)>>>0)/4294967296;
  const put=(X,Y,r,g,b)=>{X|=0;Y|=0;if(X<0||Y<0||X>=S||Y>=S)return;const k=(Y*S+X)*4;d[k]=r;d[k+1]=g;d[k+2]=b;d[k+3]=255;};
  const leaf=(cx,cy,w,h,col)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++){const e=(i===0&&j===0)?1.18:(i===w-1&&j===h-1)?0.72:1;put(cx+i,cy+j,col[0]*e,col[1]*e,col[2]*e);}};
  if(kind==='willow'){for(let sx=1;sx<S;sx+=3){const len=30+lr()*33,ox=lr()*2;for(let y=0;y<len;y+=2){const t=lr(),col=[86+t*44,118+t*46,44+t*22];put(sx+ox+Math.sin(y*0.15)*1.2,y,...col);put(sx+ox+((y>>1)%2?1:-1)+Math.sin(y*0.15)*1.2,y+1,col[0]*.85,col[1]*.85,col[2]*.85);}}}
  else if(kind==='fir'){for(let u=0;u<62;u++){const v=32+u*u/420;put(u,v,52,40,30);if(u%2===0){const l=(1-u/64)*13+3;for(let k=1;k<l;k++){const t=lr(),col=[28+t*22,56+t*30,40+t*18],tip=k>l-3?1.25:1;put(u+k*0.55,v-k,col[0]*tip,col[1]*tip,col[2]*tip);put(u+k*0.55,v+k*0.9,col[0]*.8,col[1]*.8,col[2]*.8);}}}}
  else{const n=kind==='birch'?120:190,rad=kind==='birch'?26:28;
    for(let i=0;i<n;i++){const a=lr()*6.283,r=Math.sqrt(lr())*rad,cx=32+Math.cos(a)*r,cy=32+Math.sin(a)*r*0.9,t=lr();
      let col=kind==='birch'?[112+t*55,138+t*50,48+t*22]:[50+t*42,76+t*56,32+t*20];
      if(kind==='blossom'&&lr()<0.7)col=lr()<0.3?[226,214,206]:[196+t*36,146+t*34,156+t*34];
      const w=kind==='birch'?2:2+(lr()<.5),h=kind==='birch'?2:2+(lr()<.5);leaf(cx,cy,w,h,col);}
    for(let i=0;i<14;i++){let X=32,Y=32;const a=lr()*6.283;for(let k=0;k<12;k++){X+=Math.cos(a)*1.6;Y+=Math.sin(a)*1.6;if(lr()<.6)put(X,Y,48,36,28);}}}
  x.putImageData(im,0,0);const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;return t;}
let LEAF_T=null;
const leafMats={};
export function leafMat(kind,tint){const key=kind+tint;if(leafMats[key])return leafMats[key];
  if(!LEAF_T){LEAF_T={};['oak','birch','willow','fir','blossom'].forEach(k=>LEAF_T[k]=leafTex(k));}
  const m=new THREE.MeshLambertMaterial({map:LEAF_T[kind],alphaTest:0.42,side:THREE.DoubleSide,color:new THREE.Color(tint)});
  m.onBeforeCompile=s=>{s.uniforms.wT=E.time;s.vertexShader='uniform float wT;\n'+s.vertexShader.replace('#include <begin_vertex>',
    'vec3 transformed=vec3(position);float hk=smoothstep(0.8,5.0,position.y);float wv=sin(wT*1.5+position.x*0.45+position.z*0.31)*0.06+sin(wT*3.9+position.x*1.7+position.y*1.3)*0.018;transformed.x+=wv*hk;transformed.z+=wv*0.6*hk;transformed.y+=sin(wT*4.3+position.z*2.1)*0.012*hk;');s.fragmentShader=s.fragmentShader.replace('#include <alphatest_fragment>','#include <alphatest_fragment>\ndiffuseColor.a=1.0;');};
  m.customProgramCacheKey=()=>'leafw';return leafMats[key]=m;}
const UP=new V(0,1,0);
export function limb(g,a,b,r0,r1,col,tex){const d=b.clone().sub(a),len=d.length();const m=P(g,uvS(CY(r1,r0,len,6),1,len*1.4),col,(a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2,{tex});m.quaternion.setFromUnitVectors(UP,d.normalize());return m;}
export function leafCard(g,mat,p,w,h,rx,ry,rz,ord){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.position.copy(p);if(ord)m.rotation.order=ord;m.rotation.set(rx,ry,rz);m.castShadow=false;m.receiveShadow=true;g.add(m);return m;}
export function cluster(g,sp,p,r){const mats=[leafMat(sp.leaf,sp.tints[0]),leafMat(sp.leaf,sp.tints[1])];
  if(sp.leaf==='willow'){for(let i=0;i<7;i++){const q=p.clone().add(new V(R(-r,r)*0.6,R(-0.1,0.2),R(-r,r)*0.6)),hh=R(1.4,2.4);const pg=new THREE.PlaneGeometry(R(0.5,0.8),hh);pg.translate(0,-hh/2,0);
      const m=new THREE.Mesh(pg,pick(mats));m.position.copy(q);m.rotation.set(R(-0.15,0.15),rnd()*PI,R(-0.1,0.1));m.castShadow=false;m.receiveShadow=true;g.add(m);}return;}
  P(g,SP(r*0.5,1),sp.fill,p.x,p.y,p.z,{tex:'leaf',cast:false});
  for(let i=0;i<sp.cards;i++){const q=p.clone().add(new V(R(-1,1),R(-0.6,0.8),R(-1,1)).multiplyScalar(r*0.45));const s=r*R(1.6,2.3);
    leafCard(g,pick(mats),q,s,s,R(-1.3,1.3),rnd()*PI,rnd()*PI);}}
export function branch(g,sp,a,dir,len,rad,depth,tips){
  const side=new V(rnd()-.5,0,rnd()-.5).cross(dir).normalize();
  const mid=a.clone().addScaledVector(dir,len*0.5).addScaledVector(side,len*sp.gnarl*R(-1,1));
  const b=a.clone().addScaledVector(dir,len);if(sp.droop)b.y-=len*sp.droop*(1-depth/sp.depth);
  const r1=rad*sp.taper;limb(g,a,mid,rad,(rad+r1)/2,sp.bark,sp.btex);limb(g,mid,b,(rad+r1)/2,r1,sp.bark,sp.btex);
  if(depth===0){tips.push(b);return;}
  const n=sp.kids[0]+(rnd()<sp.kids[1]?1:0);
  for(let i=0;i<n;i++){const ax=new V(rnd()-.5,rnd()-.5,rnd()-.5).cross(dir).normalize();
    const nd=dir.clone().applyAxisAngle(ax,sp.spread*R(0.6,1.25));nd.y+=sp.up;nd.normalize();
    branch(g,sp,b,nd,len*sp.decay*R(0.85,1.15),r1*R(0.8,1),depth-1,tips);}
  if(depth<sp.depth&&rnd()<0.5)tips.push(b.clone().lerp(a,0.3));}
export const SPECIES={
  oak:{leaf:'oak',tints:[0xffffff,0xd8e0c0],fill:0x2f4a26,bark:0x5a4c40,btex:'bark',trunk:[1.5,2.3],rad:[0.26,0.38],depth:3,kids:[2,0.6],spread:0.75,up:0.18,decay:0.7,taper:0.62,gnarl:0.14,cards:6,cl:[0.85,1.15]},
  birch:{leaf:'birch',tints:[0xffffff,0xe8f0c8],fill:0x4a6a2a,bark:0xdad6cc,btex:'birch',trunk:[3.0,4.4],rad:[0.11,0.15],depth:2,kids:[3,0.5],spread:0.5,up:0.45,decay:0.62,taper:0.7,gnarl:0.05,cards:5,cl:[0.55,0.75]},
  willow:{leaf:'willow',tints:[0xffffff,0xd0d8b0],fill:0x3f5a2a,bark:0x4a4038,btex:'bark',trunk:[1.4,2.0],rad:[0.3,0.4],depth:2,kids:[3,0.7],spread:0.85,up:0.3,decay:0.72,taper:0.6,gnarl:0.16,cards:0,cl:[0.9,1.2],droop:0.15},
  blossom:{leaf:'blossom',tints:[0xffffff,0xf0e0e0],fill:0x6a4a4a,bark:0x4a3a34,btex:'bark',trunk:[1.0,1.5],rad:[0.16,0.22],depth:3,kids:[2,0.5],spread:0.85,up:0.12,decay:0.68,taper:0.6,gnarl:0.18,cards:5,cl:[0.6,0.85]},
  dead:{leaf:'oak',tints:[0xb8a070,0x9a8a60],fill:0x3a3a28,bark:0x4a4642,btex:'bark',trunk:[1.6,2.4],rad:[0.2,0.3],depth:3,kids:[2,0.5],spread:0.8,up:0.1,decay:0.72,taper:0.55,gnarl:0.22,cards:2,cl:[0.35,0.5]}};
export function fir(g,x,z){const h=R(6,9.5),r0=R(0.18,0.26),mats=[leafMat('fir',0xffffff),leafMat('fir',0xc8d4c0)];
  limb(g,new V(0,0,0),new V(R(-.1,.1),h,R(-.1,.1)),r0,0.03,0x4a3a30,'bark');
  for(let y=1.1;y<h-0.3;y+=R(0.32,0.46)){const t=(y-1.1)/(h-1.4),L=(1-t)*2.5+0.45,n=5+Math.floor(rnd()*3),a0=rnd()*6;
    for(let i=0;i<n;i++){const az=a0+i/n*PI*2+R(-0.25,0.25);const fg=new THREE.PlaneGeometry(L,0.75*(0.6+0.4*(1-t)));fg.translate(L/2,0,0);
      const m=new THREE.Mesh(fg,pick(mats));m.position.set(0,y+R(-0.08,0.08),0);m.rotation.order='YZX';m.rotation.set(R(-0.5,0.5)+PI/2*(i%2),az,-R(0.15,0.45));m.castShadow=false;m.receiveShadow=true;g.add(m);}}
  for(let i=0;i<3;i++){const fg=new THREE.PlaneGeometry(0.5,0.9);fg.translate(0,0.45,0);const m=new THREE.Mesh(fg,mats[0]);m.position.set(0,h-0.4,0);m.rotation.y=i*PI/3;g.add(m);}
  return h;}

/** specie disponibili */
export const TREE_KINDS=['oak','birch','willow','fir','blossom','dead'];
/** sceglie una specie con le proporzioni della scena di riferimento; vicino all'acqua più salici */
export function randomTreeKind(nearWater){const k=rnd();return nearWater&&k<0.45?'willow':k<0.26?'fir':k<0.56?'oak':k<0.74?'birch':k<0.88?'blossom':k<0.95?'willow':'dead';}
/**
 * Albero procedurale: scheletro di rami ricorsivo + chiome su card. opts: { kind, nearWater, y }
 * Registra la chioma (E.crowns, per i petali) e un ostacolo.
 */
export function tree(parent,x,z,opts){opts=opts||{};
  const g=new THREE.Group();g.position.set(x,opts.y||0,z);g.rotation.y=rnd()*6;parent.add(g);
  const kind=opts.kind||randomTreeKind(opts.nearWater);
  if(kind==='fir'){const h=fir(g,x,z);E.crowns.push([x,h*0.6,z,0]);E.obstacles.push([x,z,0.6]);return g;}
  const sp=SPECIES[kind],th=R(sp.trunk[0],sp.trunk[1]),rad=R(sp.rad[0],sp.rad[1]);
  // radici che affiorano
  for(let i=0;i<4;i++){const a=i/4*PI*2+R(-.3,.3);limb(g,new V(Math.cos(a)*rad*2.2,-0.05,Math.sin(a)*rad*2.2),new V(0,0.45,0),rad*0.35,rad*0.7,sp.bark,sp.btex);}
  const lean=new V(R(-.12,.12),1,R(-.12,.12)).normalize();const tips=[];
  branch(g,sp,new V(0,0,0),lean,th,rad,sp.depth,tips);
  tips.forEach(p=>cluster(g,sp,p,R(sp.cl[0],sp.cl[1])));
  const top=tips.reduce((m,p)=>Math.max(m,p.y),0);
  E.crowns.push([x,top,z,kind==='blossom'?1:0]);E.obstacles.push([x,z,0.6]);return g;}
