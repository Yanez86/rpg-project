// Libreria delle texture del mondo. Ricette descritte in docs/estetica.md §3.
import * as THREE from 'three';
import { hn } from '../core/rng.js';
import { pix, G } from './pix.js';

/** texture condivise, riempite da createTextures() */
export const TEX = {};

const tilePix=(u,v,S)=>{const row=v>>3,off=(row&1)*4,col=((u+off)>>3),lu=(u+off)&7,lv=v&7;
  const b=135+hn(col,row,1)*100,q=hn(u,v,2);if(lv===7)return G(b*0.2);if(lv===6)return G(b*0.48);if(lu===0&&lv>1)return G(b*0.5);
  if(lv===0)return G(Math.min(255,b*1.3));if(q<.035&&lv>2)return[78,110,66];const L=b*(0.9+q*.16)-(lv-1)*8+(lu<2?12:0),th=hn(col,row,95)-0.5,tg=hn(col,row,96)-0.5;return[L*(1+th*0.3),L*(1+tg*0.18),L*(1-th*0.3)];};

export function createTextures() {
  Object.assign(TEX,{
  tilesV:pix(64,tilePix,false),tilesU:pix(64,tilePix,true),
  stone:pix(64,(u,v)=>{const row=v>>4,off=(row&1)*12,col=Math.floor((u+off)/24),lu=(u+off)%24,lv=v&15;if(lv===15||lu===0)return G(85);const b=185+hn(col,row,3)*55,q=hn(u,v,4),m=hn(u>>2,v>>2,30);if(lv>11&&m<.3)return[130+q*30,150+q*25,105];return G(b*(0.88+q*.16)+(lv<2?14:0)-(lu>21?14:0));}),
  cobble:pix(128,(u,v)=>{const row=Math.floor(v/12),off=(row&1)*9,col=Math.floor((u+off)/18),lu=(u+off)%18,lv=v%12;if(lv===11||lu===17||(lv<1&&lu<1))return G(70);const b=195+hn(col,row,5)*55,q=hn(u,v,6);if((lu===0||lv===10)&&q<.6)return G(b*.7);return G(b*(0.86+q*.18)+(lv<2?16:0));}),
  grass2:pix(128,(u,v)=>{const q=hn(u,v,107),o=(hn(u,0,108)*8)|0,bl=hn(u,(v+o)>>2,109);let b=128+bl*78+q*26;if(bl>0.88&&((v+o)&3)===0)b+=45;if(q<.05)b=72;if(hn(u>>2,v>>2,110)<.035)b=212;if(hn(u>>1,v>>1,111)<.012)b=95;return G(b);}),
  grass:pix(64,(u,v)=>{const q=hn(u,v,7),p=hn(u>>3,v>>3,8);return G(150+p*60+q*45-(q<.12?40:0)+((v+(u>>1))%5===0&&q>.7?20:0));}),
  dirt:pix(64,(u,v)=>{const q=hn(u,v,9),p=hn(u>>3,v>>3,10);return G(170+p*45+q*30-(q<.1?50:0));}),
  wood:pix(128,(u,v)=>{
    const edges=[0,22,38,61,80,104,128];let pl=0;while(u>=edges[pl+1])pl++;const x0=edges[pl],w=edges[pl+1]-x0,lu=u-x0;
    const joint=(hn(pl,9,120)*128)|0,seg=((v-joint+128)%128)<64?0:1,id=pl*2+seg;
    if(lu===0||((v-joint+128)%64)===0)return G(48);
    if(lu===1||lu===w-1)return G(118+hn(u,v,121)*20);
    let b=150+hn(id,0,122)*55;const grey=hn(id,1,123)<0.3;
    const kx=x0+2+hn(id,2,124)*(w-4),ky=hn(id,3,125)*128,dx=u-kx,dy=(v-ky+192)%128-64,kd=Math.hypot(dx*1.6,dy);
    const warp=12/(1+kd*0.12);
    const gr=Math.sin((lu+Math.sin(v*0.07+id)*2.2+warp*Math.sign(dx||1))*1.25+hn(id,4,126)*6);
    b+=gr*14+Math.sin(v*0.9+lu*2.1+id)*3+(hn(u,v,127)-0.5)*18;
    if(kd<2.6&&hn(id,5,128)<0.75)b=kd<1.3?52:90;
    if(hn(id,6,129)<0.35&&Math.abs(lu-(w*0.45|0))<1&&((v+id*13)%128)<40)b-=55;
    if((lu===2||lu===w-3)&&((v-joint+128)%64===4))b=40;
    if(hn(u>>1,v>>2,130)<.05)b-=28;
    b-=Math.max(0,8-Math.abs(((v-joint+128)%64)-32))*0;
    return grey?[b*0.92,b*0.92,b*0.9]:G(b);}),
  plaster:pix(64,(u,v)=>{const q=hn(u,v,15),p=hn(u>>4,v>>4,16);let b=218+p*24+q*12;if(v>50)b-=(v-50)*4*(0.6+q*.6);if(hn(u>>1,v>>3,17)<.03)b-=45;if(hn(u>>2,v,18)<.012)b-=30;return G(b);}),
  bark:pix(32,(u,v)=>{const f=Math.sin(u*0.9+Math.sin(v*0.21)*2.2+hn(u>>2,0,70)*3);let b=150+f*38+hn(u,v,71)*28;if(hn(u>>1,v>>3,72)<.08)b-=60;return G(b);}),
  birch:pix(32,(u,v)=>{let b=232+hn(u,v,73)*18;if(hn(u>>3,v,74)<.1&&(v%3===0))b=70;if(hn(u>>2,v>>2,75)<.07)b=60+hn(u,v,76)*40;if(hn(u>>1,v>>1,77)<.05)b-=50;return G(b);}),
  leaf:pix(32,(u,v)=>{const q=hn(u>>1,v>>1,50),p=hn(u,v,51);if(q<.2)return G(60+p*30);if(q>.88)return G(255);return G(140+q*100+p*25);}),
  ivy:(()=>{const S=32,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d'),im=x.createImageData(S,S);for(let y=0;y<S;y++)for(let X=0;X<S;X++){const q=hn(X>>1,y>>1,40),k=(y*S+X)*4,on=q<.62;const g=on?70+hn(X,y,41)*90:0;im.data[k]=g*.55;im.data[k+1]=g;im.data[k+2]=g*.45;im.data[k+3]=on?255:0;}x.putImageData(im,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.NearestFilter;return t;})()
});
  // vetro delle finestre: interno caldo, tende ai lati, centro più acceso
  TEX.window = pix(16, (u, v) => { const cx = Math.abs(u - 7.5) / 8, cy = Math.abs(v - 8.5) / 8; let b = 255 - cx * cx * 90 - cy * 60; if (u < 3 || u > 12) b -= 70 + hn(u, v >> 1, 60) * 30; if (v < 2) b -= 40; if (hn(u >> 2, v >> 2, 61) < .12) b -= 50; return G(b); });
  return TEX;
}
