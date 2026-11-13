import * as THREE from 'three';
import { E } from '../core/context.js';
import { rnd, R, pick, hn, vnoise } from '../core/rng.js';
import { V, PI, B, uvB, CY, CO, SP, uvS } from '../core/geometry.js';
import { P, tm, ivyMaterial, vertexColorMaterial } from '../materials/factory.js';
import { TEX } from '../textures/library.js';

/**
 * Terreno: mesh suddivisa con colori per vertice (prato folto, erba secca, muschio, terra battuta)
 * da rumore a tre scale, e ondulazioni solo verso l'alto (così niente resta sospeso).
 * opts: { size: lato in metri, segments, center:[x,z], radius: (facoltativo) ritaglio circolare,
 *         flat(x,z)→bool: zone piatte (piazze, strade, acqua), dirt(x,z)→0..1, damp(x,z)→0..1 }
 * La mesh va nella scena e NON nell'unione statica (bake perde i colori per vertice).
 */
export function createTerrain(opts){
  const S=opts.size||92,N=opts.segments||150,cx=(opts.center||[0,0])[0],cz=(opts.center||[0,0])[1],RAD=opts.radius;
  const pg=new THREE.PlaneGeometry(S,S,N,N);pg.rotateX(-PI/2);pg.translate(cx,0,cz);const pa=pg.attributes.position,cols=new Float32Array(pa.count*3);
  const lush=[0.36,0.5,0.24],dry=[0.58,0.56,0.32],dirt=[0.5,0.41,0.3],moss=[0.24,0.36,0.2],mix=(p,q,t)=>p.map((v,i)=>v+(q[i]-v)*t);
  for(let i=0;i<pa.count;i++){let x=pa.getX(i),z=pa.getZ(i);
    if(RAD){const r=Math.hypot(x-cx,z-cz);if(r>RAD){x=cx+(x-cx)*RAD/r;z=cz+(z-cz)*RAD/r;pa.setX(i,x);pa.setZ(i,z);}}
    const n1=vnoise(x,z,7,101),n2=vnoise(x,z,2.2,102),n3=vnoise(x,z,0.9,103);let c=mix(lush,dry,Math.max(0,Math.min(1,(n1-0.55)*3)));
    c=mix(c,moss,Math.max(0,Math.min(1,(0.4-n2)*3))*0.8);
    if(opts.damp)c=mix(c,moss,Math.min(1,opts.damp(x,z))*0.6);
    if(opts.dirt){const d=opts.dirt(x,z);if(d>0)c=mix(c,dirt,Math.min(1,d)*(0.45+n3*0.4));}
    if(n3>0.8)c=mix(c,dirt,0.5);
    const k=0.9+n3*0.2;cols.set([c[0]*k,c[1]*k,c[2]*k],i*3);
    const flat=opts.flat?opts.flat(x,z):false;pa.setY(i,flat?0:Math.max(0,(n2-0.5)*0.16+(n1-0.5)*0.12));}
  pg.setAttribute('color',new THREE.BufferAttribute(cols,3));pg.computeVertexNormals();uvS(pg,S/2.55,S/2.55);
  const mesh=new THREE.Mesh(pg,vertexColorMaterial(TEX.grass2));mesh.receiveShadow=true;E.scene.add(mesh);return mesh;
}
