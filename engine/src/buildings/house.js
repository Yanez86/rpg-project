// Case del borgo: graticcio (timberHouse), torretta tonda (roundHouse), casa alta (tallHouse),
// finestre, porte, tetti a due falde in tegole d'ardesia, comignoli, dettagli davanti alla porta.
// Ricetta: docs/oggetti.md › Case.
import * as THREE from 'three';
import { E } from '../core/context.js';
import { rnd, R, pick } from '../core/rng.js';
import { V, PI, B, uvB, CY, CO, SP, TO, uvS } from '../core/geometry.js';
import { P, tm, ivyMaterial } from '../materials/factory.js';
import { WALLS, ROOFS, SHUT, DOORS, TIMBER, STONE } from '../materials/palette.js';
import { hangSign, HOUSE_ICONS } from '../props/sign.js';
import { wallLantern } from '../props/lantern.js';
import { flower, flowerBed, FLOWER_TYPES, FLOWER_COLS } from '../props/flowers.js';
import { crate, barrel } from '../props/containers.js';

const winPend=[];
/** finestra: telaio, vetro caldo, griglia 3×3 di listelli, architrave, davanzale, scuri (sh) e fioriera (box) */
export function win(g,x,y,zf,sh,box){winPend.push([g,x,y,zf]);
  P(g,B(1.06,1.3,0.08),0x3a2a20,x,y,zf+0.02,{cast:false});
  P(g,B(0.88,1.1,0.06),0x8fd3f5,x,y,zf+0.05,{cast:false});
  for(const fx of[-0.22,0,0.22])P(g,B(fx?0.035:0.05,1.1,0.08),0x2a1e16,x+fx,y,zf+0.07,{cast:false});
  for(const fy of[-0.28,0,0.28])P(g,B(0.88,fy?0.035:0.05,0.08),0x2a1e16,x,y+fy,zf+0.07,{cast:false});
  P(g,B(1.12,0.1,0.14),0x3a2a20,x,y+0.66,zf+0.08,{cast:false});
  if(sh!=null)for(const s of[-1,1]){P(g,B(0.42,1.22,0.05),sh,x+s*0.76,y,zf+0.04,{cast:false});
    for(const dy of[-0.32,0.32])P(g,B(0.38,0.04,0.02),0x2a1e16,x+s*0.76,y+dy,zf+0.075,{cast:false});}
  P(g,B(1.2,0.08,0.22),0xc8bca6,x,y-0.68,zf+0.08,{cast:false});
  if(box){P(g,B(1.0,0.22,0.26),0x7a4d2c,x,y-0.84,zf+0.17,{tex:'wood',cast:false});
    for(let i=0;i<5;i++)P(g,SP(R(0.1,0.15),1),pick([0x4f8a3a,0x3f7a34,0x5a9a42]),x-0.4+i*0.2,y-0.66,zf+0.18+R(-0.04,0.04),{tex:'leaf',cast:false});
    {const t=pick(FLOWER_TYPES),fc=pick(FLOWER_COLS[t]);for(let i=0;i<8;i++)flower(g,x-0.42+i*0.12,y-0.74,zf+0.17+R(-0.06,0.06),rnd()<0.8?t:pick(FLOWER_TYPES),fc,R(0.5,0.65));}
    for(let i=0;i<4;i++)P(g,B(0.05,R(0.2,0.4),0.05),0x3f7a34,x-0.36+i*0.24,y-1.0-R(0,0.15),zf+0.32,{cast:false});}
}
export function door(g,x,zf,col){
  P(g,uvB(1.3,2.2,0.1,1.2,2),STONE,x,1.1,zf+0.02,{tex:'stone',cast:false});
  P(g,uvB(0.95,1.9,0.08,1,2),col,x,0.95,zf+0.06,{tex:'wood',cast:false});
  P(g,SP(0.05,0),0xb08a48,x+0.32,0.95,zf+0.12,{cast:false});
  P(g,B(1.45,0.16,0.6),0xc9bfae,x,0.08,zf+0.3,{cast:false});
}
export function gable(g,w,d,y0,rh,roof,wall){
  const o=0.45,a=Math.atan2(rh,w/2),hs=w/2+o,L=hs/Math.cos(a)+0.12,t=0.22;
  for(const s of[-1,1])P(g,uvB(L,t,d+0.9,L*1.2,(d+0.9)*1.2),roof,s*hs/2+s*Math.sin(a)*t/2,y0+rh-hs*Math.tan(a)/2+Math.cos(a)*t/2,0,{tex:'tilesU',rot:[0,0,-s*a]});
  const sh=new THREE.Shape();sh.moveTo(-w/2,0);sh.lineTo(w/2,0);sh.lineTo(0,rh);sh.lineTo(-w/2,0);
  const tg=new THREE.ExtrudeGeometry(sh,{depth:d,bevelEnabled:false});tg.translate(0,0,-d/2);
  P(g,tg,wall,0,y0,0,{tex:'plaster'});
  P(g,CY(0.13,0.13,d+1,8),new THREE.Color(roof).multiplyScalar(0.75).getHex(),0,y0+rh+0.14,0,{rot:[PI/2,0,0]});
  return a;
}
export function chimney(g,x,yb,yt,z){P(g,uvB(0.62,yt-yb,0.62,1,(yt-yb)*1.5),0xc9a28a,x,(yb+yt)/2,z,{tex:'stone'});
  P(g,B(0.78,0.14,0.78),0x8a6a5a,x,yt+0.07,z,{});E.chimneys.push([g,new V(x,yt+0.3,z)]);}
export function timberHouse(g,ring){
  const w=R(3.7,4.6),d=R(3.4,4.2),h1=R(2.6,2.9),h2=R(2.2,2.5),rh=R(2.1,2.8);
  const wall=pick(WALLS),roof=pick(ROOFS),sh=pick(SHUT),dc=pick(DOORS);
  P(g,uvB(w,h1,d,w*1.1,h1*1.1),STONE,0,h1/2,0,{tex:'stone'});
  const y2=h1+h2/2,W2=w+0.3,D2=d+0.3,bay=(W2-0.16)*0.335;
  P(g,uvB(W2,h2,D2,W2/1.6,h2/1.6),wall,0,y2,0,{tex:'plaster'});
  for(const s of[1,-1]){const zf=s*(D2/2+0.03);
    for(const fx of[-0.5,-0.17,0.17,0.5])P(g,B(0.16,h2,0.06),TIMBER,fx*(W2-0.16),y2,zf,{cast:false});
    P(g,B(W2,0.16,0.07),TIMBER,0,h1+0.08,zf,{cast:false});P(g,B(W2,0.14,0.06),TIMBER,0,h1+h2-0.07,zf,{cast:false});
    const bl=Math.hypot(bay,h2-0.3),ba=Math.atan2(h2-0.3,bay);
    for(const sx of[-1,1])P(g,B(bl,0.12,0.05),TIMBER,0,y2,zf,{rot:[0,0,sx*ba],cast:false});
  }
  for(const s of[1,-1]){P(g,B(0.07,0.16,D2),TIMBER,s*(W2/2+0.03),h1+0.08,0,{cast:false});
    for(const fz of[-0.5,0.5])P(g,B(0.06,h2,0.16),TIMBER,s*(W2/2+0.03),y2,fz*(D2-0.16),{cast:false});}
  door(g,0,d/2,dc);
  win(g,-w*0.38,1.45,d/2,null,rnd()<0.7);win(g,w*0.38,1.45,d/2,null,rnd()<0.7);
  win(g,-bay,y2+0.05,D2/2+0.03,sh,rnd()<0.5);win(g,bay,y2+0.05,D2/2+0.03,sh,rnd()<0.5);
  {const bk=new THREE.Group();bk.rotation.y=PI;g.add(bk);win(bk,0,1.45,d/2,null,false);
   win(bk,-bay,y2+0.05,D2/2+0.03,null,false);win(bk,bay,y2+0.05,D2/2+0.03,null,false);}
  for(const s of[1,-1]){const sg=new THREE.Group();sg.rotation.y=s*PI/2;g.add(sg);win(sg,0,y2+0.05,W2/2+0.03,sh,false);}
  const a=gable(g,W2,D2,h1+h2,rh,roof,wall);
  if(rnd()<0.8){const cx=W2*0.26,ry=h1+h2+rh*(1-cx/(W2/2));chimney(g,cx,ry-0.3,h1+h2+rh+0.7,-D2*0.18);}
  if(ring&&rnd()<0.55){const sx=w/2-0.25,col=pick(ROOFS);
    P(g,B(0.06,0.06,1.0),0x2f3550,sx,h1-0.1,d/2+0.5,{});
    P(g,B(0.06,0.6,0.7),col,sx,h1-0.5,d/2+0.62,{});
    P(g,SP(0.14,0),0xc8bca6,sx,h1-0.5,d/2+0.62,{scale:[0.6,1,1],cast:false});}
  if(rnd()<0.5){const s=rnd()<.5?-1:1;barrel(g,s*(w/2+0.55),0,d/2-0.4);}
  const eaves=[];for(const s of[-1,1])for(let k=0;k<8;k++)eaves.push(new V(s*(W2/2+0.45),h1+h2-0.45*rh/(W2/2)-0.06,-(D2+0.9)/2+(k+.5)/8*(D2+0.9)));
  return {rad:Math.max(W2,D2)*0.72+0.3,hook:new V(0,h1+h2*0.55,D2/2+0.1),eaves,front:d/2};
}
export function roundHouse(g){
  const r=R(2.0,2.5),h=R(2.9,3.6),rh=R(3,4),wall=pick(WALLS),roof=pick(ROOFS),sh=pick(SHUT);
  P(g,CY(r+0.12,r+0.18,0.7,20),STONE,0,0.35,0,{tex:'stone',uv:[9,0.6]});
  P(g,uvS(CY(r,r,h,20),r*4,h/1.6),wall,0,h/2,0,{tex:'plaster'});
  P(g,TO(r+0.03,0.08,28),TIMBER,0,h-0.1,0,{rot:[PI/2,0,0]});
  for(let i=0;i<8;i++){const t=i/8*PI*2+PI/8;P(g,B(0.12,h-0.7,0.06),TIMBER,Math.sin(t)*(r+0.02),0.7+(h-0.7)/2,Math.cos(t)*(r+0.02),{rot:[0,t,0],cast:false});}
  P(g,CO(r+0.8,rh,20),roof,0,h+rh/2,0,{tex:'tilesV',uv:[10,4]});
  P(g,CY(0.05,0.05,0.6,6),0xb08a48,0,h+rh+0.25,0,{});P(g,SP(0.16,1),0xb08a48,0,h+rh+0.6,0,{});
  door(g,0,r-0.05,pick(DOORS));
  for(const t of[-0.95,0.95,PI]){const sg=new THREE.Group();sg.rotation.y=t;g.add(sg);win(sg,0,h*0.62,r-0.02,sh,rnd()<0.5);}
  if(rnd()<0.5)chimney(g,r*0.45,h+rh*0.4,h+rh*0.8,-r*0.3);
  const eaves=[];for(let k=0;k<12;k++){const a=k/12*PI*2;eaves.push(new V(Math.cos(a)*(r+0.75),h-0.05,Math.sin(a)*(r+0.75)));}
  return {rad:r+1.0,hook:new V(0,h*0.85,r),eaves,front:r-0.05};
}
export function tallHouse(g){
  const w=R(2.9,3.3),h=R(6.2,7.2),wall=pick(WALLS),roof=pick(ROOFS),sh=pick(SHUT);
  P(g,uvB(w,h,w,w/1.6,h/1.6),wall,0,h/2,0,{tex:'plaster'});
  for(let i=0;i<Math.floor(h/0.5);i++){const big=i%2;for(const sx of[-1,1])for(const sz of[-1,1])
    P(g,B(big?0.42:0.3,0.44,big?0.3:0.42),STONE,sx*(w/2-0.12+(big?0.06:0)),0.25+i*0.5,sz*(w/2-0.12+(big?0:0.06)),{cast:false});}
  P(g,CO(w*0.95,R(3.6,4.4),4),roof,0,h+2,0,{rot:[0,PI/4,0],tex:'tilesV',uv:[4,4]});
  P(g,SP(0.16,1),0xb08a48,0,h+4.3,0,{});
  door(g,0,w/2,pick(DOORS));
  win(g,0,h*0.48,w/2,sh,true);win(g,0,h*0.78,w/2,sh,false);
  for(const t of[-PI/2,PI/2,PI]){const sg=new THREE.Group();sg.rotation.y=t;g.add(sg);win(sg,0,h*0.62,w/2,null,false);}
  const eaves=[];for(let k=0;k<8;k++){const a=k/8*PI*2+PI/8;eaves.push(new V(Math.cos(a)*w*0.72,h-0.05,Math.sin(a)*w*0.72));}
  return {rad:w*0.75+0.5,hook:new V(0,h*0.55,w/2),eaves,front:w/2};
}
export function houseDetails(g,info,ring){
  const fz=info.hook.z,fr=info.front;
  // stendardi di stoffa ai lati della porta: l'accento rosso che fa vibrare il grigio
  if(rnd()<(ring?0.75:0.45)){const c=pick([0xc8302a,0xb22a34,0xd0402a,0x2a58a8]),gold=0xe0b048;
    for(const s of[-1,1]){const x=s*0.79;P(g,B(0.06,0.06,0.3),0x2a1e16,x,2.08,fr+0.12,{cast:false});P(g,B(0.3,0.05,0.05),0x2a1e16,x,2.08,fr+0.26,{cast:false});
      P(g,B(0.24,1.5,0.025),c,x,1.32,fr+0.26,{cast:false});P(g,B(0.16,0.16,0.03),gold,x,1.72,fr+0.27,{rot:[0,0,PI/4],cast:false});
      P(g,B(0.08,0.08,0.035),c,x,1.72,fr+0.28,{rot:[0,0,PI/4],cast:false});P(g,B(0.22,0.05,0.03),gold,x,1.2,fr+0.27,{cast:false});
      for(let k=0;k<4;k++)P(g,B(0.03,0.12,0.02),gold,x-0.09+k*0.06,0.52,fr+0.26,{cast:false});}}
  if(ring&&rnd()<0.55){const s=rnd()<.5?-1:1;g.updateMatrixWorld(true);hangSign(g,new V(s*1.6,2.45,fr),new V(0,0,1),0.95,pick(HOUSE_ICONS));}
  if(rnd()<(ring?0.8:0.5)){
    const side=rnd()<.5?-1:1,lx=side*0.95,ly=2.35;
    wallLantern(g,lx,ly,fz);
  }
  for(const s of[-1,1])if(rnd()<.7){const px=s*R(0.95,1.6),pz=fz+R(0.25,0.5);P(g,CY(0.18,0.13,0.3,10),0xa0583a,px,0.15,pz,{});P(g,SP(R(0.24,0.34),1),pick([0x4f8a3a,0x5a9a42,0x3f7a34]),px,0.45,pz,{tex:'leaf'});
    if(rnd()<.5)flowerBed(g,px,0.3,pz,4,0.1,0.75);}
  if(rnd()<.35){const sx=(rnd()<.5?-1:1)*R(1.7,2.2);crate(g,sx,0,fz+0.5,0.5,R(-.3,.3));if(rnd()<.6)crate(g,sx+0.05,0.5,fz+0.5,0.4,R(-.3,.3));}
  if(rnd()<.5){const w=R(0.8,1.5),h=R(1.8,3.0),px=(rnd()<.5?-1:1)*R(0.5,1.3);const gi=new THREE.PlaneGeometry(w,h);uvS(gi,w/0.8,h/0.8);const m=new THREE.Mesh(gi,ivyMaterial());m.position.set(px,h/2,fz+0.07);m.receiveShadow=true;g.add(m);}
}
/**
 * Casa completa con dettagli. opts: { rotY, front:true se affaccia su una strada importante (più stendardi, insegne, lanterne), type:'timber'|'round'|'tall' }
 * Registra ostacolo, punti di gronda (gocce), comignoli (fumo) e finestre come sorgenti di luce per la notte.
 */
export function house(parent,x,z,opts){opts=opts||{};const ring=!!opts.front;
  const g=new THREE.Group();g.position.set(x,opts.y||0,z);g.rotation.y=opts.rotY||0;parent.add(g);
  const t=opts.type?{timber:0,round:0.7,tall:0.9}[opts.type]:rnd(),info=t<0.6?timberHouse(g,ring):t<0.82?roundHouse(g):tallHouse(g);
  houseDetails(g,info,ring);
  for(let k=0;k<2;k++)flowerBed(g,R(-1.8,1.8),0.0,info.hook.z+R(0.9,1.6),9,0.3,1.1);
  g.updateMatrixWorld(true);
  E.obstacles.push([x,z,info.rad]);
  info.eaves.forEach(p=>E.dripPoints.push(g.localToWorld(p.clone())));
  winPend.splice(0).forEach(([sg,wx,wy,zf])=>{sg.updateMatrixWorld(true);const p=sg.localToWorld(new V(wx,wy,zf+0.12)),q=sg.localToWorld(new V(wx,wy,zf+1.12)).sub(p);E.lights.push({x:p.x,y:p.y,z:p.z,nx:q.x,nz:q.z,k:1,kind:'w'});});
  return {group:g,info};
}
