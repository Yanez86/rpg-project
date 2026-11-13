// Panchina da parco: fianchi in ghisa con riccioli, 5 doghe di seduta separate, 3 di schienale, bulloni,
// braccioli, targhetta d'ottone, foglie bagnate. La seduta guarda verso +z locale. Ricetta: docs/oggetti.md › Panchina.
import * as THREE from 'three';
import { E } from '../core/context.js';
import { rnd, R, pick, hn } from '../core/rng.js';
import { V, PI, B, uvB, CY, CO, SP, TO, uvS, mergeGeometries } from '../core/geometry.js';
import { P, tm } from '../materials/factory.js';
import { mute } from '../materials/palette.js';
import { TEX } from '../textures/library.js';
import { pix, G } from '../textures/pix.js';

export function bench(parent,x,y,z,rotY){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=rotY||0;parent.add(g);
  const IRON=0x2a2a2c,WOODS=[0x6a4a32,0x5e4230,0x74523a,0x664632],L=1.8,o={};
  // segmento di ghisa tra due punti (y,z) sul fianco
  const bar=(sx,y0,z0,y1,z1,t)=>{const len=Math.hypot(y1-y0,z1-z0);P(g,B(t,len,t),IRON,sx,(y0+y1)/2,(z0+z1)/2,{rot:[Math.atan2(z1-z0,y1-y0),0,0]});};
  const curl=(sx,y,z,r,a0,arc)=>{const m=P(g,new THREE.TorusGeometry(r,0.011,4,14,arc),IRON,sx,y,z,o);m.rotation.set(0,PI/2,a0);};
  for(const sx of[-0.84,0,0.84]){const side=sx!==0;
    bar(sx,0.0,0.19,0.42,0.16,0.045);                 // gamba anteriore
    bar(sx,0.0,-0.2,0.42,-0.19,0.045);                // gamba posteriore
    bar(sx,0.42,-0.19,0.9,-0.33,0.04);                // montante dello schienale
    bar(sx,0.415,-0.21,0.415,0.2,0.045);              // traversa sotto le doghe
    bar(sx,0.12,0.18,0.12,-0.19,0.025);               // traversa bassa
    P(g,B(0.1,0.02,0.1),IRON,sx,0.01,0.19,o);P(g,B(0.1,0.02,0.1),IRON,sx,0.01,-0.2,o);
    curl(sx,0.2,0.0,0.07,0,PI*1.4);                    // ricciolo tra le gambe
    if(side){bar(sx,0.42,0.17,0.64,0.22,0.035);        // sostegno del bracciolo
      bar(sx,0.66,0.22,0.66,-0.27,0.035);              // bracciolo di ghisa
      curl(sx,0.62,0.27,0.05,PI*0.5,PI*1.6);curl(sx,0.33,0.2,0.045,-PI*0.4,PI*1.3);
      P(g,uvB(0.075,0.028,0.56,1,1),WOODS[0],sx,0.69,-0.02,{tex:'wood'});}
  }
  // doghe della seduta, ognuna con la sua tinta e una un po' imbarcata
  for(let i=0;i<5;i++){const zz=-0.17+i*0.088,m=P(g,uvB(L,0.034,0.07,3,0.2),pick(WOODS),0,0.455,zz,{tex:'wood'});
    if(i===3)m.rotation.z=0.006;
    for(const bx of[-0.84,0,0.84])P(g,B(0.016,0.008,0.016),0x1a1a1a,bx,0.474,zz,o);}
  // doghe dello schienale, inclinate come il montante
  const ba=Math.atan2(0.14,0.48);
  for(let i=0;i<3;i++){const t=0.3+i*0.26,yy=0.42+0.48*t+0.04,zz=-0.19-0.14*t-0.035;
    const m=P(g,uvB(L,0.085,0.03,3,0.3),pick(WOODS),0,yy,zz,{tex:'wood'});m.rotation.x=-ba;
    for(const bx of[-0.84,0,0.84])P(g,B(0.016,0.016,0.008),0x1a1a1a,bx,yy,zz+0.018,o);}
  // targhetta d'ottone al centro dello schienale
  P(g,B(0.16,0.045,0.006),0x8a7040,0,0.42+0.48*0.56+0.04,-0.19-0.14*0.56-0.017,{rot:[-ba,0,0],cast:false});
  // foglie cadute e bagnate sulla seduta e a terra
  for(let k=0;k<6;k++){const onSeat=k<3;P(g,B(0.055,0.004,0.035),pick([0x7a4a22,0x9a5a22,0x5a6a2a,0x6a3a1a]),R(-0.75,0.75),onSeat?0.475:0.004,onSeat?R(-0.15,0.18):R(-0.4,0.5),{rot:[0,rnd()*6,0],cast:false});}
  E.obstacles.push([x,z,0.8]);return g;}
