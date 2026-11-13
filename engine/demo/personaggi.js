// Prova dei personaggi: un abitante, l'elfa del motore, l'elfa modellata in Blender e un gatto in un angolo di piazza sotto la pioggia.
// Trascina per girare attorno, rotellina o pulsanti per avvicinarti. #notte per la notte.
import * as THREE from 'three';
import {
  E, initContext, rnd, R, PI, createTextures, bake, P, tm, uvS,
  house, bench, tree, flowerBed, wallLantern, createTerrain, distantCliffs, puddle,
  smokeAndFog, createRain, createSky, updateSwing, setupAtmosphere, createPost, createNightLights,
  setParticleScale, villager, elf, cat, setToon, TEX, wear, mute, elfa3d, loadElfa3d,
} from '../src/index.js';

const err = document.getElementById('err');
addEventListener('error', e => { err.hidden = false; err.textContent = 'Errore nella scena: ' + e.message + ' (riga ' + e.lineno + ')'; });
const night = /notte/.test(location.hash + location.search);
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
const PR = Math.min(window.devicePixelRatio || 1, 1.5);
renderer.setPixelRatio(PR); renderer.setSize(innerWidth, innerHeight, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(innerWidth < innerHeight ? 62 : 50, innerWidth / innerHeight, 0.05, 700);
initContext({ renderer, scene, camera, mood: night ? 'night' : 'rain' });
const atmosphere = setupAtmosphere();
createTextures();

/* ---------- l'angolo di piazza ---------- */
const world = new THREE.Group(); scene.add(world);
createTerrain({ size: 80, segments: 100, flat: (x, z) => Math.hypot(x, z) < 8, dirt: (x, z) => Math.max(0, 1 - Math.abs(Math.hypot(x, z) - 6.5) / 1.5) });
{ // selciato bagnato: opacity 0.68 = riflesso medio nella maschera SSR
  const g = new THREE.CircleGeometry(6, 48); g.rotateX(-PI / 2); uvS(g, 5, 5);
  P(world, g, 0, 0, 0.02, 0, { cast: false, mat: wear(new THREE.MeshLambertMaterial({ map: TEX.cobble, color: mute(0xd8d0c0), opacity: 0.68 })) }); }
house(world, -3.2, -7.5, { rotY: 0.25, front: true, type: 'timber' });
house(world, 4.2, -7.2, { rotY: -0.35, front: true, type: 'tall' });
bench(world, -4.4, 0, -1.2, PI / 2 - 0.3);
flowerBed(world, 4.6, 0, -2.5, 10, 0.5, 1.1); flowerBed(world, -5.2, 0, 2.5, 9, 0.5, 1.1);
tree(world, 7.5, 1.5, { kind: 'oak' }); tree(world, -8, -3, { kind: 'birch' }); tree(world, 9, -9, { kind: 'fir' }); tree(world, -10, 6, { kind: 'blossom' });
for (let k = 0; k < 4; k++) puddle(scene, R(-3, 3), 0.03, R(-3, 3), R(0.4, 0.8), R(0.3, 0.6), rnd() * PI, k);
distantCliffs();
bake(world);

/* ---------- i personaggi ---------- */
const actors = {
  abitante: { make: villager, r: 2.4, speed: { cammina: 1.35, corre: 3.4 }, dir: 1, ang: 0, home: [-0.9, 0, 0.4], face: 0.35 },
  elfa: { make: elf, r: 3.3, speed: { cammina: 1.45, corre: 3.6 }, dir: -1, ang: PI * 0.5, home: [0.2, 0, -0.6], face: 0.05 },
  gatto: { make: cat, r: 1.6, speed: { cammina: 0.5, trotta: 1.25 }, dir: -1, ang: PI, home: [1.0, 0, 0.9], face: -0.5 },
};
// l'elfa modellata in Blender (engine/assets/elfa.glb): se il file non si carica la pagina va avanti senza
try { await loadElfa3d(); actors.elfa3d = { make: elfa3d, r: 4.0, speed: { cammina: 1.45, corre: 3.6 }, dir: 1, ang: PI * 1.5, home: [1.3, 0, -0.9], face: -0.3 }; }
catch (e) { console.warn('Elfa di Blender non caricata:', e.message); document.getElementById('row-elfa3d').hidden = true; }
// cel shading: solo i personaggi cambiano aspetto (hanno una luce loro), la scena resta com'è
let toonOn = true;   // cel shading: è lo stile di base dei personaggi
function spawn(key) {
  const a = actors[key]; const prev = a.c && a.c.anim.current();
  if (a.c) scene.remove(a.c.root);
  a.c = a.make(); scene.add(a.c.root); a.c.anim.play(prev || 'fermo', 0); if (toonOn) setToon(a.c.root, true);
}
spawn('abitante'); spawn('elfa'); spawn('gatto'); if (actors.elfa3d) spawn('elfa3d');
{ const b = document.getElementById('toon'); b.addEventListener('click', () => { toonOn = !toonOn; b.setAttribute('aria-pressed', String(toonOn));
  for (const a of Object.values(actors)) setToon(a.c.root, toonOn); }); }
for (const b of document.querySelectorAll('[data-actor]')) b.addEventListener('click', () => {
  const a = actors[b.dataset.actor];
  if (b.dataset.clip === 'nuovo') { spawn(b.dataset.actor); return; }
  a.c.anim.play(b.dataset.clip);
  for (const o of document.querySelectorAll(`[data-actor="${b.dataset.actor}"][data-clip]`)) if (o.dataset.clip !== 'nuovo') o.setAttribute('aria-pressed', String(o === b));
});

/* ---------- effetti ---------- */
const nightLights = night ? createNightLights({}) : null;
const litBy = () => nightLights ? nightLights.active() : [];
const sky = createSky(), smoke = smokeAndFog({ litBy, banks: 24 }), rain = createRain({ litBy });
const post = createPost({ pixelRatio: PR }); setParticleScale(PR);
for (const [id, name] of [['scan', 'scanlines'], ['refl', 'reflections']]) { const b = document.getElementById(id); let on = true;
  b.addEventListener('click', () => { on = !on; b.setAttribute('aria-pressed', String(on)); post.set(name, on); }); }

/* ---------- camera che gira attorno ---------- */
let yaw = 0.35, pitch = 0.22, dist = 5.2, dragId = null, lx = 0, ly = 0;
canvas.addEventListener('pointerdown', e => { if (dragId !== null) return; dragId = e.pointerId; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => { if (e.pointerId !== dragId) return; yaw -= (e.clientX - lx) * 0.006; pitch = Math.max(0.02, Math.min(1.1, pitch + (e.clientY - ly) * 0.004)); lx = e.clientX; ly = e.clientY; });
const up = e => { if (e.pointerId === dragId) dragId = null; }; canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
canvas.addEventListener('wheel', e => { dist = Math.max(1.6, Math.min(12, dist * (1 + e.deltaY * 0.001))); e.preventDefault(); }, { passive: false });
document.getElementById('zin').addEventListener('click', () => dist = Math.max(1.6, dist * 0.8));
document.getElementById('zout').addEventListener('click', () => dist = Math.min(12, dist * 1.25));

const clock = new THREE.Clock(); let T = 0; const center = { x: 0, z: 0 };
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05); T += dt; E.time.value = T;
  for (const a of Object.values(actors)) {
    const clip = a.c.anim.current(), v = a.speed[clip], root = a.c.root;
    if (v) { a.ang += a.dir * v / a.r * dt; root.position.set(Math.cos(a.ang) * a.r, 0, Math.sin(a.ang) * a.r); root.rotation.y = -a.ang + (a.dir > 0 ? 0 : PI); }
    else { root.position.lerp(new THREE.Vector3(...a.home), Math.min(1, dt * 2)); root.rotation.y += (a.face - root.rotation.y) * Math.min(1, dt * 3); }
    a.c.anim.update(dt);
  }
  camera.position.set(Math.sin(yaw) * Math.cos(pitch) * dist, 0.9 + Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist);
  camera.lookAt(0, 0.7, 0);
  atmosphere(center); sky(); smoke(dt, T, center); rain(dt, center); updateSwing(T); if (nightLights) nightLights.update(T);
  post.render(); requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.fov = innerWidth < innerHeight ? 62 : 50; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight, false); setParticleScale(PR); post.resize(); });
