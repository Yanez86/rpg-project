// Prova del drago: alto cinque volte un abitante, in un prato fuori dal borgo. Tu sei l'abitante:
// WASD/frecce o joystick per camminare, Shift per correre, E per salutare, trascina per girare la camera.
// Trascina per girare attorno, rotellina o pulsanti per avvicinarti. #notte per la notte.
import * as THREE from 'three';
import {
  E, initContext, rnd, R, PI, createTextures, bake, P, tm, uvS,
  house, bench, tree, flowerBed, wallLantern, createTerrain, distantCliffs, puddle,
  smokeAndFog, createRain, createSky, updateSwing, setupAtmosphere, createPost, createNightLights,
  setParticleScale, villager, dragon, thirdPerson, setToon, TEX, wear, mute,
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
const camera = new THREE.PerspectiveCamera(innerWidth < innerHeight ? 66 : 52, innerWidth / innerHeight, 0.1, 900);
initContext({ renderer, scene, camera, mood: night ? 'night' : 'rain' });
const atmosphere = setupAtmosphere();
createTextures();

/* ---------- il prato fuori dal borgo ---------- */
const world = new THREE.Group(); scene.add(world);
createTerrain({ size: 140, segments: 140, flat: (x, z) => Math.hypot(x, z) < 15, dirt: (x, z) => Math.max(0, 1 - Math.abs(Math.hypot(x, z) - 11) / 2.5) * 0.8 });
house(world, -9, -24, { rotY: 0.3, front: true, type: 'timber' }); house(world, 2, -26, { rotY: 0, front: true, type: 'round' }); house(world, 12, -23, { rotY: -0.35, front: true, type: 'tall' });
for (const [x, z, k] of [[-20, -6, 'oak'], [-24, 8, 'fir'], [21, 4, 'oak'], [25, -10, 'fir'], [-17, 20, 'birch'], [18, 21, 'blossom'], [-30, -18, 'fir'], [30, 16, 'dead']]) tree(world, x, z, { kind: k });
flowerBed(world, 5.5, 0, 7, 12, 0.7, 1.1); flowerBed(world, -7, 0, 9, 10, 0.6, 1.1);
for (let k = 0; k < 5; k++) puddle(scene, R(-9, 9), 0.03, R(-9, 9), R(0.5, 1.1), R(0.4, 0.8), rnd() * PI, k);
distantCliffs();
bake(world);

/* ---------- il drago e un abitante per la scala ---------- */
const D = { r: 11, speed: 2.1, ang: 0, home: [0, 0, -1.5], face: 0.25 };
let drago = null;
let toonOn = true;   // cel shading: è lo stile di base dei personaggi
function spawnDragon() { const prev = drago && drago.anim.current(); if (drago) scene.remove(drago.root); drago = dragon(); scene.add(drago.root); drago.anim.play(prev || 'fermo', 0); drago.root.position.set(...D.home); drago.root.rotation.y = D.face; if (toonOn) setToon(drago.root, true); }
spawnDragon();
const person = villager(); person.root.position.set(4.2, 0, 9); person.root.rotation.y = PI + 0.4; scene.add(person.root); person.anim.play('fermo', 0); if (toonOn) setToon(person.root, true);
// il drago è un ostacolo che si sposta: non gli si passa attraverso
const collide = p => {
  for (const o of E.obstacles) { const dx = p.x - o[0], dz = p.z - o[1], d = Math.hypot(dx, dz), m = o[2] + 0.35; if (d < m && d > 1e-4) { p.x = o[0] + dx / d * m; p.z = o[1] + dz / d * m; } }
  if (drago.anim.current() !== 'vola') { const r = drago.root, f = new THREE.Vector3(Math.sin(r.rotation.y), 0, Math.cos(r.rotation.y));
    for (const k of [-2.6, 0, 2.6]) { const cx = r.position.x + f.x * k, cz = r.position.z + f.z * k, dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz), m = 2.1; if (d < m && d > 1e-4) { p.x = cx + dx / d * m; p.z = cz + dz / d * m; } } }
  const R0 = Math.hypot(p.x, p.z); if (R0 > 60) { p.x *= 60 / R0; p.z *= 60 / R0; }
};
{ const b = document.getElementById('toon'); b.addEventListener('click', () => { toonOn = !toonOn; b.setAttribute('aria-pressed', String(toonOn)); setToon(drago.root, toonOn); setToon(person.root, toonOn); }); }
const player = thirdPerson({ canvas, actor: person, collide, stick: document.getElementById('stick'), knob: document.getElementById('knob'), dist: 7.5, pitch: 0.32, actions: { KeyE: 'saluta' } });
for (const b of document.querySelectorAll('[data-clip]')) b.addEventListener('click', () => {
  if (b.dataset.clip === 'nuovo') { spawnDragon(); return; }
  if (b.dataset.clip === 'saluta') { player.play('saluta'); return; }
  drago.anim.play(b.dataset.clip, 0.6);
  for (const o of document.querySelectorAll('[data-actor="drago"][data-clip]')) if (o.dataset.clip !== 'nuovo') o.setAttribute('aria-pressed', String(o === b));
});

/* ---------- effetti ---------- */
const nightLights = night ? createNightLights({}) : null;
const litBy = () => nightLights ? nightLights.active() : [];
const sky = createSky(), smoke = smokeAndFog({ litBy, banks: 24 }), rain = createRain({ litBy });
const post = createPost({ pixelRatio: PR }); setParticleScale(PR);
for (const [id, name] of [['scan', 'scanlines'], ['refl', 'reflections']]) { const b = document.getElementById(id); let on = true;
  b.addEventListener('click', () => { on = !on; b.setAttribute('aria-pressed', String(on)); post.set(name, on); }); }

/* ---------- camera: segue l'abitante ---------- */
document.getElementById('zin').addEventListener('click', () => player.zoom(0.8));
document.getElementById('zout').addEventListener('click', () => player.zoom(1.25));

const clock = new THREE.Clock(); let T = 0; const center = { x: 0, z: 0 };
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05); T += dt; E.time.value = T;
  { const clip = drago.anim.current(), root = drago.root;
    if (clip === 'cammina') { D.ang += D.speed / D.r * dt; root.position.set(Math.cos(D.ang) * D.r, 0, Math.sin(D.ang) * D.r); root.rotation.y = -D.ang; }
    else { root.position.lerp(new THREE.Vector3(...D.home), Math.min(1, dt * 0.8)); root.rotation.y += (D.face - root.rotation.y) * Math.min(1, dt); }
    drago.anim.update(dt); drago.update(); }
  player.update(dt);
  center.x = person.root.position.x; center.z = person.root.position.z;
  atmosphere(center); sky(); smoke(dt, T, center); rain(dt, center); updateSwing(T); if (nightLights) nightLights.update(T);
  post.render(); requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.fov = innerWidth < innerHeight ? 66 : 52; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight, false); setParticleScale(PR); post.resize(); });
