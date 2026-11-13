// Cel shading (toon shading) per i personaggi, attivabile e disattivabile:
//  - materiali MeshToonMaterial con una rampa di luce a 3 gradini (ombra, mezzatinta, luce), che tengono texture e colori;
//  - contorno "a scafo invertito" (inverted hull): una copia della mesh vista dal retro, gonfiata lungo le normali
//    di una quantità proporzionale alla distanza, così lo spessore della linea resta costante sullo schermo.
// NB: lo stile del mondo (docs/estetica.md) non è cel; questo è un interruttore per provare il look sui personaggi.
import * as THREE from 'three';

let RAMP = null;
function ramp() {
  if (RAMP) return RAMP;
  RAMP = new THREE.DataTexture(new Uint8Array([90, 90, 90, 255, 170, 170, 170, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
  RAMP.minFilter = RAMP.magFilter = THREE.NearestFilter; RAMP.generateMipmaps = false; RAMP.needsUpdate = true; return RAMP;
}
const toonCache = new WeakMap();
function toonOf(m) {
  if (!m || m.isMeshBasicMaterial) return m;                       // occhi luminosi e simili restano come sono
  if (toonCache.has(m)) return toonCache.get(m);
  const t = new THREE.MeshToonMaterial({ color: m.color ? m.color.clone() : 0xffffff, map: m.map || null, vertexColors: !!m.vertexColors, side: m.side ?? THREE.FrontSide, gradientMap: ramp(), alphaTest: m.alphaTest || 0 });
  toonCache.set(m, t); return t;
}
let OUT = null;
/** materiale del contorno: lato posteriore, gonfiato lungo la normale in spazio vista (spessore costante a schermo) */
function outlineMat(thick, color) {
  if (OUT) return OUT;
  OUT = new THREE.MeshBasicMaterial({ color: color ?? 0x16110d, side: THREE.BackSide });
  OUT.onBeforeCompile = s => { s.uniforms.uThick = { value: thick ?? 0.0035 }; s.vertexShader = 'uniform float uThick;\n' + s.vertexShader.replace('#include <project_vertex>',
    'vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );\nvec3 nV = normalize( normalMatrix * normal );\nmvPosition.xyz += nV * uThick * max( -mvPosition.z, 0.5 );\ngl_Position = projectionMatrix * mvPosition;'); };
  OUT.customProgramCacheKey = () => 'outline'; return OUT;
}
/** attiva/disattiva il cel shading su un personaggio (root). opts: { outline: true, thickness, color } */
export function setToon(root, on, opts) {
  opts = opts || {}; const list = []; root.traverse(o => { if (o.isMesh && !o.userData.isOutline) list.push(o); });
  for (const o of list) {
    if (on) {
      if (!o.userData.mat0) o.userData.mat0 = o.material;
      o.material = Array.isArray(o.userData.mat0) ? o.userData.mat0.map(toonOf) : toonOf(o.userData.mat0);
      if (opts.outline !== false && !(Array.isArray(o.material) ? o.material[0] : o.material)?.isMeshBasicMaterial) {
        if (!o.userData.ol) { const ol = new THREE.Mesh(o.geometry, outlineMat(opts.thickness, opts.color)); ol.userData.isOutline = true; ol.castShadow = false; ol.frustumCulled = false; o.add(ol); o.userData.ol = ol; }
        o.userData.ol.visible = true;
      }
    } else {
      if (o.userData.mat0) o.material = o.userData.mat0;
      if (o.userData.ol) o.userData.ol.visible = false;
    }
  }
}
