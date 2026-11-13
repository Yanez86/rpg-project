// Cel shading "anime" per i personaggi (stile JRPG alla Atelier), attivabile e disattivabile.
// Non usa le luci della scena e non ne aggiunge: ogni personaggio ha la SUA luce, fissata rispetto alla camera
// (in alto a sinistra, un po' davanti), così il resto del mondo non cambia.
//  - due toni: luce piena e ombra colorata (tinta lilla, mai nera), con un bordo netto ma non scalettato;
//  - un piccolo riflesso chiaro dove la luce è più forte e una luce di contorno (rim) sui bordi illuminati;
//  - colori un po' più saturi e chiari dell'originale usurato;
//  - contorno a scafo invertito, sottile e di spessore costante sullo schermo, color inchiostro caldo.
// La nebbia della scena resta (i personaggi lontani sfumano come il resto); di notte la luminosità scende.
// NB: lo stile del mondo (docs/estetica.md) non è cel; questo vale solo per i personaggi.
import * as THREE from 'three';
import { E } from '../core/context.js';

/** parametri del look: si possono cambiare prima di chiamare setToon */
export const TOON = {
  light: [-0.5, 0.62, 0.6],        // direzione della luce in spazio camera (x destra, y su, z verso chi guarda)
  shadow: [0.66, 0.6, 0.78],       // tinta dell'ombra (moltiplica il colore): lilla freddo
  edge: [-0.02, 0.07],             // ampiezza del passaggio luce/ombra (più stretto = più netto)
  rim: 0.32, glint: 0.1, saturate: 1.18, lift: 1.06,
  outline: 0x2b1d18, thickness: 0.0026,
};
const brightness = () => (E.mood === 'night' ? 0.5 : E.mood === 'sun' ? 1.0 : 0.95);

const toonCache = new WeakMap();
function toonOf(m) {
  if (!m || m.isMeshBasicMaterial) return m;                       // occhi luminosi e simili restano come sono
  if (toonCache.has(m)) return toonCache.get(m);
  const t = new THREE.MeshBasicMaterial({ color: m.color ? m.color.clone() : 0xffffff, map: m.map || null, vertexColors: !!m.vertexColors, side: m.side ?? THREE.FrontSide, alphaTest: m.alphaTest || 0, transparent: !!m.transparent, opacity: m.opacity ?? 1 });
  const night = E.mood === 'night';
  t.onBeforeCompile = s => {
    s.uniforms.uLight = { value: new THREE.Vector3(...TOON.light).normalize() };
    s.uniforms.uShadow = { value: new THREE.Vector3(...(night ? [0.5, 0.52, 0.72] : TOON.shadow)) };
    s.uniforms.uEdge = { value: new THREE.Vector2(...TOON.edge) };
    s.uniforms.uLook = { value: new THREE.Vector4(TOON.rim, TOON.glint, TOON.saturate, TOON.lift * brightness()) };
    s.vertexShader = 'varying vec3 vToonN;\nvarying vec3 vToonV;\n' + s.vertexShader.replace('#include <project_vertex>',
      '#include <project_vertex>\nvToonN = normalize( normalMatrix * normal );\nvToonV = -mvPosition.xyz;');
    s.fragmentShader = 'uniform vec3 uLight;\nuniform vec3 uShadow;\nuniform vec2 uEdge;\nuniform vec4 uLook;\nvarying vec3 vToonN;\nvarying vec3 vToonV;\n' +
      s.fragmentShader.replace('#include <tonemapping_fragment>', [
        'vec3 tN = normalize( vToonN );',
        'if ( !gl_FrontFacing ) tN = -tN;',
        'vec3 tV = normalize( vToonV );',
        'float tD = dot( tN, uLight );',
        'float tLit = smoothstep( uEdge.x, uEdge.y, tD );',
        'vec3 tBase = gl_FragColor.rgb;',
        'float tL = dot( tBase, vec3( 0.299, 0.587, 0.114 ) );',
        'tBase = max( mix( vec3( tL ), tBase, uLook.z ), 0.0 );',
        'vec3 tCol = mix( tBase * uShadow, tBase, tLit );',
        'tCol += tBase * uLook.y * smoothstep( 0.82, 0.9, tD );',
        'float tRim = pow( 1.0 - max( dot( tN, tV ), 0.0 ), 3.0 ) * smoothstep( -0.3, 0.2, tD );',
        'tCol += vec3( 1.0, 0.95, 0.88 ) * uLook.x * smoothstep( 0.35, 0.6, tRim );',
        'gl_FragColor.rgb = tCol * uLook.w;',
        '#include <tonemapping_fragment>'].join('\n'));
  };
  t.customProgramCacheKey = () => 'toon-anime';
  toonCache.set(m, t); return t;
}
let OUT = null;
/** materiale del contorno: lato posteriore, gonfiato lungo la normale in spazio vista (spessore costante a schermo) */
function outlineMat() {
  if (OUT) return OUT;
  OUT = new THREE.MeshBasicMaterial({ color: E.mood === 'night' ? 0x0d0a10 : TOON.outline, side: THREE.BackSide });
  OUT.onBeforeCompile = s => { s.uniforms.uThick = { value: TOON.thickness }; s.vertexShader = 'uniform float uThick;\n' + s.vertexShader.replace('#include <project_vertex>',
    'vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );\nvec3 nV = normalize( normalMatrix * normal );\nmvPosition.xyz += nV * uThick * max( -mvPosition.z, 0.5 );\ngl_Position = projectionMatrix * mvPosition;'); };
  OUT.customProgramCacheKey = () => 'toon-outline'; return OUT;
}
/** attiva/disattiva il cel shading su un personaggio (root). opts: { outline: true }. Le mesh con userData.noOutline (dettagli piccoli) restano senza contorno */
export function setToon(root, on, opts) {
  opts = opts || {}; const list = []; root.traverse(o => { if (o.isMesh && !o.userData.isOutline) list.push(o); });
  for (const o of list) {
    if (on) {
      if (!o.userData.mat0) o.userData.mat0 = o.material;
      o.material = Array.isArray(o.userData.mat0) ? o.userData.mat0.map(toonOf) : toonOf(o.userData.mat0);
      const first = Array.isArray(o.userData.mat0) ? o.userData.mat0[0] : o.userData.mat0;
      if (opts.outline !== false && !o.userData.noOutline && !first?.isMeshBasicMaterial && !first?.transparent) {
        if (!o.userData.ol) { const ol = new THREE.Mesh(o.geometry, outlineMat()); ol.userData.isOutline = true; ol.castShadow = false; ol.frustumCulled = false; o.add(ol); o.userData.ol = ol; }
        o.userData.ol.visible = true;
      }
    } else {
      if (o.userData.mat0) o.material = o.userData.mat0;
      if (o.userData.ol) o.userData.ol.visible = false;
    }
  }
}
