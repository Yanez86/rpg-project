import * as THREE from 'three';
import { E } from '../core/context.js';
import { rnd, R, pick, hn, vnoise } from '../core/rng.js';
import { V, PI, B, uvB, CY, CO, SP, uvS } from '../core/geometry.js';
import { P, tm, ivyMaterial, vertexColorMaterial } from '../materials/factory.js';
import { TEX } from '../textures/library.js';

/** altezza del piano stradale del ponte rispetto al suo centro, lungo l'asse z locale (|z|≤3.5) */
export const bridgeDeck=z=>0.3+0.6*(1-(z/3.5)*(z/3.5));
/**
 * Ponte in pietra ad arco ribassato, lungo 7,2 m sull'asse z locale e largo 3 m:
 * corpo estruso, conci a raggiera con chiave di volta, cornice, parapetti con copertina, lastricato,
 * cordolo, pilastrini con sfera, muri d'ala, erba ed edera. Ricetta: docs/oggetti.md › Ponte in pietra.
 * La luce dell'arco è 4,6 m: il corso d'acqua deve essere largo al massimo ~4 m.
 */
export function stoneBridge(parent,x,z,rotY){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotY||0;parent.add(g);
  const bh=z=>0.3+0.6*(1-(z/3.5)*(z/3.5)),bhc=z=>bh(Math.max(-3.5,Math.min(3.5,z)));
  const BIVY=ivyMaterial();
  const ST=[0x9a968a,0x8a867c,0xa8a294,0x948e80],SPAN=2.3,RISE=0.5,arch=z=>0.02+RISE*(1-(z/SPAN)*(z/SPAN)),o={};
  { // corpo: profilo laterale (strada sopra, arco sotto) estruso su tutta la larghezza
    const s=new THREE.Shape();s.moveTo(-3.7,-0.25);for(let z=-3.7;z<=3.701;z+=0.25)s.lineTo(z,bhc(z)-0.07);s.lineTo(3.7,-0.25);s.lineTo(SPAN,-0.25);
    for(let i=0;i<=24;i++){const z=SPAN-i/24*2*SPAN;s.lineTo(z,arch(z));}s.lineTo(-SPAN,-0.25);s.lineTo(-3.7,-0.25);
    const eg=new THREE.ExtrudeGeometry(s,{depth:2.9,bevelEnabled:false});eg.rotateY(-PI/2);eg.translate(1.45,0,0);uvS(eg,1.3,1.3);
    P(g,eg,ST[0],0,0,0,{tex:'stone'});}
  // conci dell'arco su entrambe le facce, a raggiera, con la chiave di volta più grande
  const N=15;for(const fx of[-1.47,1.47])for(let i=0;i<N;i++){const z0=-SPAN+i/N*2*SPAN,z1=-SPAN+(i+1)/N*2*SPAN,zc=(z0+z1)/2,yc=arch(zc);
    const a=Math.atan(-2*RISE*zc/(SPAN*SPAN)),key=i===(N>>1),dep=key?0.44:(i%2?0.26:0.33),sl=Math.hypot(z1-z0,arch(z1)-arch(z0))*0.93;
    const m=P(g,uvB(key?0.12:0.07,dep,sl,0.3,0.6),key?0xb0aa9c:pick(ST),fx+Math.sign(fx)*(key?0.03:0.01),yc+Math.cos(a)*dep/2,zc-Math.sin(a)*dep/2,{tex:'stone'});m.rotation.x=-a;}
  // cornice sporgente sotto il parapetto e parapetti a corsi di pietra con copertina
  const NS=14;for(let i=0;i<NS;i++){const z0=-3.6+i/NS*7.2,z1=-3.6+(i+1)/NS*7.2,zc=(z0+z1)/2,a=Math.atan((bhc(z1)-bhc(z0))/(z1-z0)),sl=Math.hypot(z1-z0,bhc(z1)-bhc(z0))+0.01;
    for(const sx of[-1,1]){
      const c=P(g,B(0.14,0.09,sl),0x8a867c,sx*1.5,bhc(zc)-0.12,zc,{tex:'stone'});c.rotation.x=-a;
      const w=P(g,uvB(0.24,0.5,sl,0.3,0.6),pick(ST),sx*1.35,bhc(zc)+0.09+0.25,zc,{tex:'stone'});w.rotation.x=-a;
      const cp=P(g,uvB(0.32,0.08,sl-0.015,0.4,0.6),0xb0aa9c,sx*1.35,bhc(zc)+0.09+0.54,zc,{tex:'stone'});cp.rotation.x=-a;
      if(rnd()<0.5){const t=P(g,CO(0.05,R(0.1,0.2),4),0x4f7e36,sx*1.2,bhc(zc)+0.12,zc+R(-0.2,0.2),{cast:false});}
      if(rnd()<0.3){const iv=new THREE.Mesh(new THREE.PlaneGeometry(R(0.4,0.8),R(0.4,0.9)),BIVY);iv.position.set(sx*1.55,bhc(zc)-0.45,zc);iv.rotation.y=PI/2;g.add(iv);}}}
  // lastricato: file di lastre di larghezza diversa, ogni lastra con il suo tono
  for(let zc=-3.45;zc<3.46;zc+=0.42){const a=Math.atan(-1.2*zc/12.25*0.98);let x=-1.23;
    while(x<1.22){const w=Math.min(1.23-x,R(0.45,0.9));const m=P(g,uvB(w-0.025,0.1,0.395,w*0.7,0.3),pick(ST),x+w/2,bhc(zc)+0.04,zc,{tex:'stone',cast:false});m.rotation.x=a;x+=w;}}
  // cordolo lungo i parapetti
  for(const sx of[-1,1])for(let i=0;i<NS;i++){const z0=-3.6+i/NS*7.2,z1=z0+7.2/NS,zc=(z0+z1)/2,a=Math.atan((bhc(z1)-bhc(z0))/(z1-z0));const k=P(g,B(0.1,0.07,7.2/NS),0x7e7a70,sx*1.18,bhc(zc)+0.1,zc,{cast:false});k.rotation.x=-a;}
  // pilastrini alle testate con sfera di pietra e muri d'ala che si aprono verso le sponde
  for(const sz of[-1,1])for(const sx of[-1,1]){const z=sz*3.75,y0=bhc(z);
    P(g,uvB(0.42,1.0,0.42,0.5,1),0x948e80,sx*1.38,y0+0.4,z,{tex:'stone'});P(g,B(0.5,0.1,0.5),0xb0aa9c,sx*1.38,y0+0.95,z,o);P(g,SP(0.15,1),0xa8a294,sx*1.38,y0+1.15,z,{tex:'stone'});
    const ww=P(g,uvB(0.26,0.55,1.6,1.5,0.6),0x948e80,sx*1.95,0.22,sz*4.45,{tex:'stone'});ww.rotation.y=sx*sz*0.55;
    P(g,B(0.32,0.08,1.6),0xb0aa9c,sx*1.95,0.53,sz*4.45,{rot:[0,sx*sz*0.55,0]});}
  // sassi e muschio dove l'arco tocca l'acqua
  for(const sz of[-1,1])for(let i=0;i<6;i++)P(g,SP(R(0.15,0.32),0),pick([0x7e7a70,0x6a6a60]),R(-1.6,1.6),0.1,sz*R(2.0,2.4),{scale:[1,0.6,1],cast:false});
  return g;
}
