// Insegne fantasy appese: staffa di ferro battuto, catenelle, tavola sagomata dipinta con un simbolo (niente scritte).
// Ricetta: docs/oggetti.md › Insegna appesa.
// hangSign(parent, base, dir, len, kind[, bg]) — base: punto di attacco (locale a parent), dir: direzione del braccio.
// Il gruppo che oscilla viene staccato e messo nella scena; si anima con updateSwing() (fx/swing.js).
import * as THREE from 'three';
import { E } from '../core/context.js';
import { rnd, R, pick, hn } from '../core/rng.js';
import { V, PI, B, uvB, CY, CO, SP, TO, uvS, mergeGeometries } from '../core/geometry.js';
import { P, tm } from '../materials/factory.js';
import { mute } from '../materials/palette.js';
import { TEX } from '../textures/library.js';
import { pix, G } from '../textures/pix.js';

// simboli dipinti a pixel, senza scritte: ogni bottega si riconosce dal disegno
export function iconTex(kind,bg){const W=32,H=24,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const ic=document.createElement('canvas');ic.width=W;ic.height=H;const y=ic.getContext('2d');
  const F=(col,...r)=>{y.fillStyle=col;y.fillRect(...r);},C=(col,cx,cy,rx,ry)=>{y.fillStyle=col;y.beginPath();y.ellipse(cx,cy,rx,ry||rx,0,0,PI*2);y.fill();};
  const S=(col,cx,cy,r,w)=>{y.strokeStyle=col;y.lineWidth=w||1.5;y.beginPath();y.arc(cx,cy,r,0,PI*2);y.stroke();};
  ({apple:()=>{C('#a8302a',16,14,6.5,6);C('#c84a3a',14,12,2.5);F('#4a2e1a',15.5,4,1.5,4);C('#5a7a2e',19,6,2.8,1.4);},
    spool:()=>{F('#5a3a22',10,5,12,2);F('#5a3a22',10,17,12,2);F('#8a2a3a',12,7,8,10);for(let i=8;i<17;i+=2)F('#a84a5a',12,i,8,1);F('#c8bca0',21,10,6,1);},
    vase:()=>{C('#34507a',16,15,6,5.5);F('#34507a',14,6,4,5);F('#4a6a9a',12,5,8,1.5);F('#c8bca0',10,14,12,1.2);C('#5a7aaa',14,13,1.5);},
    potion:()=>{C('#2f6a5a',16,15,6.5);F('#9ab0a8',14,5,4,6);F('#6a4a2a',13.5,3,5,2.5);C('#5ab8a0',16,16,4.5);F('#d8f0e8',13,12,1.5,1.5);},
    bread:()=>{C('#9a6a32',16,13,10,5.5);C('#b88446',15,11.5,7.5,3.2);for(const bx of[11,15,19])F('#7a4a22',bx,10,1.5,4);},
    flower:()=>{F('#4a6a2e',15.4,12,1.4,9);C('#5a7a2e',19,17,2.6,1.2);for(let i=0;i<5;i++){const a=i/5*PI*2-PI/2;C('#b8607a',16+Math.cos(a)*3.6,10+Math.sin(a)*3.6,2.4);}C('#d8b040',16,10,1.8);},
    lantern:()=>{F('#2a2420',13,4,6,2);F('#2a2420',12,6,8,1.5);F('#e0a040',13,7.5,6,9);F('#f8d080',14.5,9,3,5);F('#2a2420',12,16.5,8,1.5);for(const lx of[13,18])F('#2a2420',lx,7.5,1,9);S('#2a2420',16,2.5,1.4,1);},
    tankard:()=>{F('#8a8478',10,8,10,11);F('#6a6458',10,10,10,1);F('#6a6458',10,15,10,1);C('#e8e0c8',15,8,5.5,2.4);C('#e8e0c8',12,6.5,2);S('#6a6458',21.5,13,3.2,2);},
    anvil:()=>{F('#3a3a3e',9,8,15,3.5);y.fillStyle='#3a3a3e';y.beginPath();y.moveTo(9,8);y.lineTo(4,9);y.lineTo(9,11.5);y.fill();F('#3a3a3e',13,11,7,4);F('#3a3a3e',10,15,13,3);F('#6a6a70',9,8,15,1);F('#7a4a22',19,3,1.5,6);F('#5a5a60',17,2,6,2.5);},
    key:()=>{S('#b08a48',10,12,3.4,2);F('#b08a48',13,11,13,2);F('#b08a48',22,13,1.5,3);F('#b08a48',24.5,13,1.5,2.5);},
    fish:()=>{C('#8a9aa0',15,12,8,3.8);y.fillStyle='#8a9aa0';y.beginPath();y.moveTo(22,12);y.lineTo(28,7);y.lineTo(28,17);y.fill();C('#1a1a1a',10,11,1);F('#aab8be',9,13,10,1);},
    shield:()=>{y.fillStyle='#7a2a24';y.beginPath();y.moveTo(9,4);y.lineTo(23,4);y.lineTo(23,12);y.quadraticCurveTo(23,18,16,21);y.quadraticCurveTo(9,18,9,12);y.fill();F('#b08a48',15,5,2,15);F('#b08a48',10,9,12,2);}
  })[kind]();
  const id=y.getImageData(0,0,W,H);for(let i=3;i<id.data.length;i+=4)id.data[i]=id.data[i]>110?255:0;y.putImageData(id,0,0);
  x.fillStyle=bg;x.fillRect(0,0,W,H);
  const bd=x.getImageData(0,0,W,H);for(let p=0;p<W*H;p++){const u=p%W,v=(p/W)|0,k=p*4,g=0.84+0.16*hn(u,v>>1,80)-(hn(u>>2,v,81)<.08?0.12:0);bd.data[k]*=g;bd.data[k+1]*=g;bd.data[k+2]*=g;}x.putImageData(bd,0,0);
  x.strokeStyle='rgba(176,138,72,0.9)';x.lineWidth=1;x.strokeRect(2.5,2.5,W-5,H-5);
  x.drawImage(ic,0,0);
  const id2=x.getImageData(0,0,W,H);for(let p=0;p<W*H;p++){const u=p%W,v=(p/W)|0,k=p*4;if(hn(u,v,82)<.06){id2.data[k]*=.8;id2.data[k+1]*=.8;id2.data[k+2]*=.8;}}x.putImageData(id2,0,0);
  const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;return t;}
// tavola con gli angoli superiori scavati a quarto di cerchio, come le insegne delle locande
export function boardGeo(W,H){const s=new THREE.Shape(),c=W*0.13;s.moveTo(-W/2,-H/2);s.lineTo(W/2,-H/2);s.lineTo(W/2,H/2-c);s.absarc(W/2,H/2,c,-PI/2,-PI,true);s.lineTo(-W/2+c,H/2);s.absarc(-W/2,H/2,c,0,-PI/2,true);s.lineTo(-W/2,-H/2);
  const g=new THREE.ExtrudeGeometry(s,{depth:0.045,bevelEnabled:true,bevelThickness:0.008,bevelSize:0.008,bevelSegments:1});g.translate(0,0,-0.0225);
  const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/W+0.5,p.getY(i)/H+0.5);return g;}
export function hangSign(parent,base,dir,len,kind,bg){
  const IRON=0x242426,g=new THREE.Group();g.position.copy(base);g.rotation.y=Math.atan2(-dir.z,dir.x);parent.add(g);const o={};
  P(g,B(0.03,0.32,0.12),IRON,0.015,-0.06,0,o);
  P(g,B(len,0.035,0.035),IRON,len/2,0,0,o);
  {const a=new V(0.02,-0.25,0),b=new V(len*0.62,0,0),d=b.clone().sub(a),m=P(g,B(d.length(),0.025,0.025),IRON,(a.x+b.x)/2,(a.y+b.y)/2,0,o);m.rotation.z=Math.atan2(d.y,d.x);}
  for(const [cx,cy,r,a0,arc] of[[len*0.2,-0.09,0.07,0.3,PI*1.5],[len*0.42,0.07,0.05,PI*1.1,PI*1.4],[len+0.035,0.0,0.04,-PI*0.6,PI*1.5]])
    {const m=P(g,new THREE.TorusGeometry(r,0.009,4,14,arc),IRON,cx,cy,0,o);m.rotation.z=a0;}
  P(g,new THREE.ConeGeometry(0.02,0.08,5),IRON,len*0.42,0.12,0,o);
  const W=len*0.72,H=W*0.74,pv=new THREE.Group();pv.position.set(len*0.58,-0.02,0);g.add(pv);
  for(const cx of[-W*0.36,W*0.36]){for(let k=0;k<5;k++){const m=new THREE.Mesh(new THREE.TorusGeometry(0.016,0.0045,4,8),tm(IRON));m.position.set(cx,-0.02-k*0.03,0);m.rotation.y=k%2?PI/2:0;m.scale.y=1.4;pv.add(m);}
    const hk=new THREE.Mesh(B(0.02,0.03,0.02),tm(IRON));hk.position.set(cx,-0.175,0);pv.add(hk);}
  const board=new THREE.Mesh(boardGeo(W,H),[new THREE.MeshLambertMaterial({map:iconTex(kind,bg||pick(['#3a2a20','#2e3a3a','#3a2a2e','#2a3020']))}),tm(0x3a2a20,{tex:'wood'})]);
  board.position.set(0,-0.19-H/2,0);board.castShadow=true;board.receiveShadow=true;pv.add(board);
  {const tr=new THREE.Mesh(B(W+0.04,0.035,0.06),tm(0x2a1e16));tr.position.set(0,-0.185,0);pv.add(tr);}
  parent.updateMatrixWorld(true);E.scene.attach(pv);pv.rotation.reorder('YXZ');E.swing.push({pv,ph:rnd()*6,x0:pv.rotation.x,kind:'sign'});
  return g;}
export const HOUSE_ICONS=['tankard','anvil','key','fish','shield','bread','potion','spool'];
export const ICONS=['apple','spool','vase','potion','bread','flower','lantern','tankard','anvil','key','fish','shield'];
