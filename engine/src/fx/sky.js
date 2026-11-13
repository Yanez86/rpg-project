// Cielo coperto a cupola con nuvole basse che scorrono (stesso colore della nebbia).
// Di notte le nuvole sono illuminate da sotto dal bagliore arancio del borgo.
import * as THREE from 'three';
import { E } from '../core/context.js';

export function createSky() {
  const night = E.mood === 'night';
  const body = night
    ? 'vec3 col=mix(fogc*1.15+vec3(0.06,0.035,0.01)*(1.0-smoothstep(0.0,0.35,y)),vec3(0.035,0.045,0.07),smoothstep(0.0,0.7,y));col=mix(col,col*1.5+vec3(0.02,0.012,0.0),smoothstep(0.45,0.75,c)*smoothstep(0.05,0.5,y)*(1.0-y*0.6));'
    : 'vec3 col=mix(fogc*1.05,fogc*0.8,smoothstep(0.0,0.7,y));col=mix(col,col*0.84,smoothstep(0.45,0.75,c)*smoothstep(0.05,0.4,y));';
  const dome = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), new THREE.ShaderMaterial({
    uniforms: { t: E.time, fogc: { value: E.fog } }, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader: `uniform float t;uniform vec3 fogc;varying vec3 vW;
      float hh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hh(i),hh(i+vec2(1,0)),f.x),mix(hh(i+vec2(0,1)),hh(i+vec2(1,1)),f.x),f.y);}
      void main(){vec3 d=normalize(vW-cameraPosition);float y=d.y;vec2 uv=d.xz/(abs(y)+0.25);
        float c=vn(uv*1.2+vec2(t*0.012,0.0))*0.6+vn(uv*2.6+vec2(t*0.02,3.0))*0.4;
        ${body}
        gl_FragColor=vec4(col,1.0);}`
  }));
  dome.renderOrder = -10; dome.frustumCulled = false; E.scene.add(dome);
  return function update() { dome.position.copy(E.camera.position); };
}
