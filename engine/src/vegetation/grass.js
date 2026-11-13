import * as THREE from 'three';
import { E } from '../core/context.js';
import { rnd, R, pick, hn } from '../core/rng.js';
import { V, PI, B, uvB, CY, CO, SP, uvS, mergeGeometries } from '../core/geometry.js';
import { P, tm } from '../materials/factory.js';
import { GRASS } from '../materials/palette.js';
import { flowerField } from '../props/flowers.js';

/**
 * Ciuffi d'erba istanziati (tre lame a cono) e prato fiorito.
 * opts: { count, radius, center:[x,z], ok(x,z)→bool, tall(x,z)→bool (sponde: erba alta), flowers: probabilità di un fiore per ciuffo }
 */
export function grassField(opts){
  const N=opts.count||5200,rad=opts.radius||40,cx=(opts.center||[0,0])[0],cz=(opts.center||[0,0])[1];
  const parts=[];for(let i=0;i<3;i++){const c=CO(0.05,0.42,3);c.translate(0,0.21,0);c.rotateZ((i-1)*0.32);c.rotateY(i*2.1);c.translate((i-1)*0.06,0,0);parts.push(c);}
  const tuft=mergeGeometries(parts);
  const grass=new THREE.InstancedMesh(tuft,tm(0xffffff),N);grass.receiveShadow=true;grass.frustumCulled=false;
  const spots=[],d=new THREE.Object3D(),c=new THREE.Color();let n=0;
  for(let t=0;t<N*3&&n<N;t++){const a=rnd()*PI*2,r=Math.sqrt(R(0.02,1))*rad,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;if(opts.ok&&!opts.ok(x,z))continue;
    const bank=opts.tall?opts.tall(x,z):false;
    d.position.set(x,0,z);d.rotation.set(0,rnd()*6,0);const s=R(0.7,1.3);d.scale.set(s,s*(bank?2.4:1),s);d.updateMatrix();grass.setMatrixAt(n,d.matrix);
    c.setHex(bank?pick([0x4f9a3f,0x5aa847]):pick(GRASS));grass.setColorAt(n,c);n++;
    if(!bank&&rnd()<(opts.flowers==null?0.3:opts.flowers))spots.push([x+R(-0.15,0.15),z+R(-0.15,0.15),R(0.8,1.35)]);}
  grass.count=n;E.scene.add(grass);
  const fl=spots.length?flowerField(spots):[];
  return {grass,flowers:fl};
}
