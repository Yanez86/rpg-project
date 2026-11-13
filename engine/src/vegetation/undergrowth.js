import * as THREE from 'three';
import { E } from '../core/context.js';
import { rnd, R, pick, hn } from '../core/rng.js';
import { V, PI, B, uvB, CY, CO, SP, uvS, mergeGeometries } from '../core/geometry.js';
import { P, tm } from '../materials/factory.js';
import { leafMat } from './trees.js';

/**
 * Sottobosco e dettagli del terreno attorno agli alberi già piantati (E.crowns):
 * felci, funghi, massi muschiati, foglie cadute, sassolini, canne lungo una sponda.
 * opts: { area:{x0,x1,z0,z1}, ok(x,z,pad)→bool, groundY(x,z), nearPath(x,z)→bool, reeds:{count, sample()→[x,z]|null}, counts:{ferns,mushrooms,boulders,leaves,pebbles} }
 */
export function undergrowth(parent,opts){
  const A=opts.area,randomIn=()=>[R(A.x0,A.x1),R(A.z0,A.z1)],groundY=opts.groundY||(()=>0);
  const okAt=(x,z,pad)=>{if(x<A.x0||x>A.x1||z<A.z0||z>A.z1)return false;if(opts.ok&&!opts.ok(x,z,pad))return false;
    for(const o of E.obstacles)if(Math.hypot(x-o[0],z-o[1])<o[2]*0.75+pad)return false;return true;};
  if(!E.crowns.length)E.crowns.push([(A.x0+A.x1)/2,3,(A.z0+A.z1)/2,0]);
  const C=opts.counts||{};
  const treesAt=E.crowns.map(c=>[c[0],c[2]]);
  const near=(spread)=>{const t=pick(treesAt);const a=rnd()*PI*2,r=R(0.8,spread);return[t[0]+Math.cos(a)*r,t[1]+Math.sin(a)*r];};
  // felci: ciuffi di fronde che si aprono a raggiera
  const fm=[leafMat('fir',0x9ab878),leafMat('fir',0x7a9a60)];
  for(let n=0,tr=0;n<(C.ferns??170)&&tr<900;tr++){const[x,z]=near(3.2);if(!okAt(x,z,0.2))continue;n++;const k=6+Math.floor(rnd()*4),s=R(0.5,0.9),a0=rnd()*6;
    for(let i=0;i<k;i++){const fg=new THREE.PlaneGeometry(s,s*0.42);fg.translate(s/2,0,0);const m=new THREE.Mesh(fg,pick(fm));m.position.set(x,0.05,z);m.rotation.order='YZX';m.rotation.set(R(-0.4,0.4),a0+i/k*PI*2,R(0.35,0.8));m.castShadow=false;m.receiveShadow=true;parent.add(m);}}
  // funghi a gruppetti ai piedi degli alberi
  for(let n=0,tr=0;n<(C.mushrooms??45)&&tr<400;tr++){const[x,z]=near(1.6);if(!okAt(x,z,0.05))continue;n++;const cap=pick([0x8a3a2c,0x9a7048,0xc8b89a,0x6a4a32]);
    for(let i=0;i<3+Math.floor(rnd()*4);i++){const px=x+R(-0.25,0.25),pz=z+R(-0.25,0.25),h=R(0.05,0.14),r=R(0.035,0.08);
      P(parent,CY(r*0.35,r*0.45,h,5),0xd8d0bc,px,h/2,pz,{cast:false});P(parent,SP(r,1),cap,px,h,pz,{scale:[1,0.55,1],cast:false});}}
  // massi con il cappello di muschio
  for(let n=0,tr=0;n<(C.boulders??26)&&tr<500;tr++){const[x,z]=randomIn();if(!okAt(x,z,0.8))continue;n++;const s=R(0.35,0.95);
    P(parent,SP(s,0),pick([0x8a867c,0x7e7a70,0x948e80]),x,s*0.3,z,{tex:'stone',scale:[1,R(0.55,0.8),R(0.8,1.2)],rot:[0,rnd()*6,0]});
    P(parent,SP(s*0.82,0),0x3f5a2e,x+R(-.1,.1),s*0.48,z+R(-.1,.1),{tex:'leaf',scale:[1,0.35,1],cast:false});E.obstacles.push([x,z,s*0.8]);}
  // istanze: foglie cadute, sassolini, canne
  const inst=(geo,n,place)=>{const m=new THREE.InstancedMesh(geo,tm(0xffffff),n),d=new THREE.Object3D(),c=new THREE.Color();let k=0;
    for(let t=0;t<n*6&&k<n;t++){if(!place(d,c))continue;d.updateMatrix();m.setMatrixAt(k,d.matrix);m.setColorAt(k,c);k++;}
    m.count=k;m.receiveShadow=true;m.frustumCulled=false;E.scene.add(m);};
  inst(B(0.07,0.006,0.045),C.leaves??2600,(d,c)=>{const[x,z]=rnd()<0.8?near(3.5):randomIn();if(!okAt(x,z,0))return false;
    d.position.set(x,groundY(x,z)+0.03+rnd()*0.01,z);d.rotation.set(R(-0.2,0.2),rnd()*6,R(-0.2,0.2));d.scale.setScalar(R(0.7,1.3));c.setHex(pick([0x7a4a22,0x9a5a22,0x6a3a1a,0x8a6a2a,0x5a6a2a]));return true;});
  inst(SP(0.05,0),C.pebbles??1800,(d,c)=>{const[x,z]=randomIn();if(!okAt(x,z,0))return false;if(!(opts.nearPath&&opts.nearPath(x,z))&&rnd()<0.6)return false;
    d.position.set(x,0.02,z);d.rotation.set(0,rnd()*6,0);d.scale.set(R(0.5,1.5),R(0.3,0.7),R(0.5,1.5));c.setHex(pick([0x8a867c,0x7e7a70,0x9a968a,0x6a665e]));return true;});
  if(opts.reeds){const rg=B(0.022,1,0.022);rg.translate(0,0.5,0);const bank=opts.reeds;
   inst(rg,bank.count||900,(d,c)=>{const p=bank.sample();if(!p)return false;
     d.position.set(p[0],0.05,p[1]);d.rotation.set(R(-0.18,0.18),rnd()*6,R(-0.18,0.18));const h=R(0.6,1.5);d.scale.set(1,h,1);c.setHex(pick([0x5a6a32,0x6a7a3a,0x7a6a3a,0x4a5a2a]));return true;});
   const ct=CY(0.03,0.03,0.16,5);ct.translate(0,0.08,0);
   inst(ct,Math.round((bank.count||900)/6),(d,c)=>{const p=bank.sample();if(!p)return false;d.position.set(p[0],R(0.9,1.4),p[1]);d.rotation.set(R(-0.15,0.15),0,R(-0.15,0.15));d.scale.set(1,1,1);c.setHex(0x5a3a22);return true;});}

}
