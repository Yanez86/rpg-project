// Lanterna di carta: corpo tornito (LatheGeometry) a spicchi, 5 nervature di bambù, tappi di legno con bordo dorato,
// gancio, nappa con perlina e sei fili. Ricetta: docs/oggetti.md › Lanterna di carta.
import * as THREE from 'three';
import { E } from '../core/context.js';
import { rnd, R, pick, hn } from '../core/rng.js';
import { V, PI, B, uvB, CY, CO, SP, TO, uvS, mergeGeometries } from '../core/geometry.js';
import { P, tm } from '../materials/factory.js';
import { mute } from '../materials/palette.js';
import { TEX } from '../textures/library.js';
import { pix, G } from '../textures/pix.js';

// lanterna di carta: corpo tornito a spicchi, nervature di bambù, tappi di legno, gancio, nappa con perlina
let LM=null;
function lanternMats(){if(LM)return LM;
const lanTex=pix(32,(u,v)=>{const glow=Math.sin(Math.PI*v/32);let r=170+glow*80,g=40+glow*55,b=24+glow*20;
  if(v%6===0){r*=.62;g*=.55;b*=.55;}if(u%4===0){r*=.86;g*=.84;b*=.84;}
  if(v>=24&&v<=27){r=200+glow*40;g=150+glow*40;b=60;if((u+v)%4===0){r*=.7;g*=.6;}}
  const cu=(u%16)-8,cv=v-13,d=Math.hypot(cu,cv*1.2);if(d>3&&d<4.4){r*=.5;g*=.4;b*=.4;}if(d<1.2){r*=.55;g*=.45;b*=.45;}
  return[r,g,b];});
lanTex.wrapS=THREE.RepeatWrapping;
const LANT_PAPER=new THREE.MeshBasicMaterial({map:lanTex,side:THREE.DoubleSide}),LANT_RIB=new THREE.MeshBasicMaterial({color:0x4a160e}),LANT_WOOD=tm(0x2a2420),LANT_GOLD=tm(0xc9a24a),LANT_TAS=new THREE.MeshBasicMaterial({color:0xd84a2a});
LM={LANT_PAPER,LANT_RIB,LANT_WOOD,LANT_GOLD,LANT_TAS};return LM;}
const lanProfile=[];for(let i=0;i<=14;i++){const t=i/14;lanProfile.push(new THREE.Vector2(0.055+0.135*Math.pow(Math.sin(Math.PI*(0.06+t*0.88)),0.8),-t*0.44));}
const lanGeo=new THREE.LatheGeometry(lanProfile,20);
export function paperLantern(){
  const {LANT_PAPER,LANT_RIB,LANT_WOOD,LANT_GOLD,LANT_TAS}=lanternMats();
  const pv=new THREE.Group(),add=(geo,mat,y,rx)=>{const m=new THREE.Mesh(geo,mat);m.position.y=y;if(rx)m.rotation.x=rx;pv.add(m);return m;};
  add(new THREE.CylinderGeometry(0.005,0.005,0.16,4),LANT_WOOD,-0.08);
  add(new THREE.TorusGeometry(0.02,0.005,4,10),LANT_GOLD,-0.165,0);
  add(new THREE.CylinderGeometry(0.075,0.085,0.04,14),LANT_WOOD,-0.2);add(new THREE.CylinderGeometry(0.06,0.06,0.015,14),LANT_GOLD,-0.177);
  add(lanGeo,LANT_PAPER,-0.215);
  for(let k=1;k<6;k++){const t=k/6,r=0.055+0.135*Math.pow(Math.sin(Math.PI*(0.06+t*0.88)),0.8);add(new THREE.TorusGeometry(r+0.003,0.004,4,24),LANT_RIB,-0.215-t*0.44,PI/2);}
  add(new THREE.CylinderGeometry(0.085,0.075,0.04,14),LANT_WOOD,-0.67);add(new THREE.CylinderGeometry(0.06,0.06,0.015,14),LANT_GOLD,-0.693);
  add(new THREE.SphereGeometry(0.022,8,6),LANT_GOLD,-0.72);
  for(let k=0;k<6;k++){const a=k/6*PI*2,m=add(new THREE.CylinderGeometry(0.005,0.003,0.2,4),LANT_TAS,-0.83);m.position.x=Math.cos(a)*0.012;m.position.z=Math.sin(a)*0.012;m.rotation.z=Math.cos(a)*0.08;m.rotation.x=Math.sin(a)*0.08;}
  return pv;
}
/** lanterna appesa a un braccio di ferro su un muro (coordinate locali di parent); oscilla e, di notte, è una sorgente di luce */
export function wallLantern(parent,x,y,z){
  P(parent,B(0.04,0.04,0.42),0x2f3550,x,y+0.32,z+0.2,{});
  P(parent,B(0.03,0.22,0.03),0x2f3550,x,y+0.2,z+0.03,{});P(parent,CY(0.012,0.012,0.36,5),0x2f3550,x,y+0.08,z+0.2,{rot:[PI/2-0.5,0,0]});
  const pv=paperLantern();pv.position.set(x,y+0.32,z+0.4);parent.add(pv);
  parent.updateMatrixWorld(true);E.scene.attach(pv);E.swing.push({pv,ph:rnd()*6,kind:'lantern'});
  const p=new V();pv.getWorldPosition(p);E.lights.push({x:p.x,y:p.y-0.42,z:p.z,nx:0,nz:0,k:0.9,kind:'p'});
  return pv;}
