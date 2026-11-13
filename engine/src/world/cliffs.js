import * as THREE from 'three';
import { E } from '../core/context.js';
import { rnd, R, pick, hn, vnoise } from '../core/rng.js';
import { V, PI, B, uvB, CY, CO, SP, uvS } from '../core/geometry.js';
import { P, tm, ivyMaterial, vertexColorMaterial } from '../materials/factory.js';
import { TEX } from '../textures/library.js';

/**
 * Pareti di roccia boscose lontane, in tre anelli: ogni anello è già mescolato al colore della nebbia
 * (prospettiva aerea a strati) e sfuma in una foschia di valle alla base.
 * opts: { center:[x,z], layers:[[raggio, mix nebbia, verde, roccia],...], brightness }
 */
export function distantCliffs(opts){opts=opts||{};const CLIFF_K=opts.brightness??(E.mood==='night'?0.3:1.0),cx=(opts.center||[0,0])[0],cz=(opts.center||[0,0])[1];
  const cliffMat=(col,fogMix)=>new THREE.ShaderMaterial({fog:false,uniforms:{map:{value:TEX.leaf},col:{value:new THREE.Color(col).multiplyScalar(CLIFF_K)},fogc:{value:E.fog},mixK:{value:fogMix}},
    vertexShader:'varying vec2 vUv;varying float vY;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.0);vY=w.y;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:'uniform sampler2D map;uniform vec3 col,fogc;uniform float mixK;varying vec2 vUv;varying float vY;void main(){vec3 c=col*texture2D(map,vUv).rgb;float m=mixK+(1.0-smoothstep(-14.0,22.0,vY))*(1.0-mixK)*0.75;gl_FragColor=vec4(mix(c,fogc,clamp(m,0.0,1.0)),1.0);}'});
  const layers=opts.layers||[[56,0.42,0x3e5a3a,0x6a7466],[74,0.6,0x46604a,0x7a8478],[96,0.76,0x50685a,0x86908a]];
  layers.forEach(([rad,fm,green,rock],li)=>{const gm=cliffMat(green,fm),rm=cliffMat(rock,fm+0.05);
    const n=li===0?11:li===1?14:16;
    for(let i=0;i<n;i++){const a=(i+R(-0.3,0.3))/n*PI*2+li*0.4,r=rad+R(-6,6),x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r,h=R(26,48)*(1+li*0.25),w=R(7,12)*(1+li*0.3);
      const col=new THREE.Mesh(new THREE.CylinderGeometry(w*0.75,w,h,7,4),rm);uvS(col.geometry,4,h/8);col.position.set(x,h/2-26,z);col.rotation.y=rnd()*3;E.scene.add(col);
      for(let k=0;k<6;k++){const t=rnd()*PI*2,yy=R(-0.2,0.5)*h,s=w*R(0.45,0.75);const b=new THREE.Mesh(SP(s,1),gm);uvS(b.geometry,3,3);
        b.position.set(x+Math.cos(t)*w*0.6,yy-26+h/2*0.6,z+Math.sin(t)*w*0.6);b.scale.y=R(0.7,1.1);E.scene.add(b);}
      const top=new THREE.Mesh(SP(w*0.95,1),gm);uvS(top.geometry,4,4);top.scale.y=0.55;top.position.set(x,h-26,z);E.scene.add(top);
      if(li===0&&rnd()<0.35){const fall=new THREE.Mesh(new THREE.PlaneGeometry(1.4,h*0.7),new THREE.MeshBasicMaterial({color:new THREE.Color(0xc8d4d0).multiplyScalar(CLIFF_K).lerp(E.fog,0.45),fog:false}));
        fall.position.set(x-Math.cos(a)*w*0.8,h*0.35-26+h*0.15,z-Math.sin(a)*w*0.8);fall.lookAt(cx,fall.position.y,cz);E.scene.add(fall);}}
  });
}
