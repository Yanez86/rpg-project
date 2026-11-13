// Demo del motore: "Borgo del Ponte", una strada di case sotto la pioggia che scende verso un ruscello
// con un ponte di pietra. Aggiungi #notte all'indirizzo per la versione notturna.
import * as THREE from 'three';
import {
  E, initContext, rnd, R, pick, PI, createTextures, bake,
  house, bench, barrel, crate, hangSign, tree, grassField, undergrowth,
  createTerrain, path, stoneBridge, bridgeDeck, distantCliffs,
  Sim, waterSurface, puddle, smokeAndFog, createRain, createSky, updateSwing,
  setupAtmosphere, createPost, createNightLights, firstPerson, setParticleScale, V,
} from '../src/index.js';

const err = document.getElementById('err');
addEventListener('error', e => { err.hidden = false; err.textContent = 'Errore nella scena: ' + e.message + ' (riga ' + e.lineno + ')'; });

const night = /notte/.test(location.hash + location.search);
const canvas = document.getElementById('scene');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false }); } catch (e) { err.hidden = false; throw e; }
const PR = Math.min(window.devicePixelRatio || 1, 1.5);
renderer.setPixelRatio(PR); renderer.setSize(innerWidth, innerHeight, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(innerWidth < innerHeight ? 76 : 66, innerWidth / innerHeight, 0.05, 700);
camera.rotation.order = 'YXZ';
initContext({ renderer, scene, camera, mood: night ? 'night' : 'rain' });
const atmosphere = setupAtmosphere();
createTextures();

/* ---------- pianta ---------- */
const BZ = 12, RW = 3.6;                       // ruscello lungo x a z=BZ, largo RW; ponte sulla strada (x=0)
const onBridge = (x, z) => Math.abs(x) < 1.6 && Math.abs(z - BZ) < 3.5;
const inStream = (x, z, pad = 0) => Math.abs(z - BZ) < RW / 2 + pad;
const onStreet = (x, z, pad = 0) => Math.abs(x) < 1.5 + pad;
const groundAt = (x, z) => onBridge(x, z) ? bridgeDeck(z - BZ) + 0.1 : 0;
const world = new THREE.Group(); scene.add(world);

createTerrain({ size: 100, segments: 160,
  flat: (x, z) => onStreet(x, z, 2) || inStream(x, z, 2.5),
  dirt: (x, z) => onStreet(x, z, 1.2) ? 1 : 0,
  damp: (x, z) => Math.max(0, 1 - Math.abs(z - BZ) / 6) });
path(world, 0, -40, 0, BZ - 3.8, 2.8);
path(world, 0, BZ + 3.8, 0, 40, 2.8);
stoneBridge(world, 0, BZ, 0);

// case lungo la strada, con la facciata verso la strada
for (const side of [-1, 1]) for (let z = -30; z <= 4; z += 7.4) house(world, side * 6.6, z + R(-0.4, 0.4), { rotY: side < 0 ? PI / 2 : -PI / 2, front: true });
for (const side of [-1, 1]) for (let z = 22; z <= 34; z += 7.4) house(world, side * 6.6, z, { rotY: side < 0 ? PI / 2 : -PI / 2, front: true });
// arredo
bench(world, 2.5, 0, -9, -PI / 2); bench(world, -2.5, 0, 1.5, PI / 2);
barrel(world, 2.6, 0, -16); barrel(world, 3.1, 0, -15.3); crate(world, -2.7, 0, -20, 0.55, 0.3); crate(world, -2.7, 0.55, -20, 0.42, -0.2);
{ // un palo con insegna all'imbocco del ponte
  const x = 2.2, z = BZ - 4.6; const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.2, 8), new THREE.MeshLambertMaterial({ color: 0x3a2a20 }));
  pole.position.set(x, 1.6, z); world.add(pole); world.updateMatrixWorld(true); hangSign(world, new V(x, 2.9, z), new V(1, 0, 0), 0.95, 'tankard');
  E.obstacles.push([x, z, 0.2]);
}
// ruscello con l'acqua simulata e pozzanghere sulla strada
const stream = new Sim(320, 20, -45, BZ - RW / 2, 90, RW, (x, z) => Math.abs(z - BZ) < RW / 2 - 0.15, true);
waterSurface(scene, stream, 0.135, 220, 10, { kind: 1, flow: 1.2, amp: 0.04 });
for (let k = 0; k < 8; k++) puddle(scene, R(-1, 1), 0.045, R(-36, 36), R(0.4, 0.9), R(0.3, 0.7), rnd() * PI, k);
// alberi, prato, sottobosco
for (let n = 0, t = 0; n < 70 && t < 2000; t++) {
  const x = R(-46, 46), z = R(-46, 46);
  if (onStreet(x, z, 9) || inStream(x, z, 1.2) || E.obstacles.some(o => Math.hypot(x - o[0], z - o[1]) < o[2] + 1)) continue;
  tree(world, x, z, { nearWater: Math.abs(z - BZ) < 7 }); n++;
}
const okGround = (x, z, pad = 0) => !onStreet(x, z, 0.3 + pad) && !inStream(x, z, 0.3 + pad);
grassField({ count: 6000, radius: 48, ok: (x, z) => okGround(x, z) && !E.obstacles.some(o => Math.hypot(x - o[0], z - o[1]) < o[2] * 0.85), tall: (x, z) => inStream(x, z, 1.4) });
undergrowth(world, { area: { x0: -48, x1: 48, z0: -48, z1: 48 }, ok: okGround, nearPath: (x, z) => onStreet(x, z, 0.8),
  reeds: { count: 700, sample: () => { const x = R(-45, 45); if (Math.abs(x) < 2.6) return null; return [x, BZ + (rnd() < .5 ? -1 : 1) * (RW / 2 + R(-0.35, 0.7))]; } } });
distantCliffs();
bake(world);

/* ---------- effetti ---------- */
const nightLights = night ? createNightLights({ groundAt }) : null;
const litBy = () => nightLights ? nightLights.active() : [];
const sky = createSky();
const smoke = smokeAndFog({ litBy });
const rain = createRain({ groundAt, litBy });
const post = createPost({ pixelRatio: PR });
setParticleScale(PR);

/* ---------- camminare ---------- */
const collide = p => {
  for (const o of E.obstacles) { const dx = p.x - o[0], dz = p.z - o[1], d = Math.hypot(dx, dz), m = o[2] + 0.3; if (d < m && d > 1e-4) { p.x = o[0] + dx / d * m; p.z = o[1] + dz / d * m; } }
  const dz = p.z - BZ;
  if (Math.abs(dz) < 3.6 && Math.abs(p.x) < 1.7) { if (Math.abs(dz) < 3.0) p.x = Math.max(-1.15, Math.min(1.15, p.x)); }
  else if (Math.abs(dz) < RW / 2 + 0.5) p.z = dz < 0 ? BZ - RW / 2 - 0.5 : BZ + RW / 2 + 0.5;
  p.x = Math.max(-47, Math.min(47, p.x)); p.z = Math.max(-47, Math.min(47, p.z));
};
const START = { x: 0.4, z: -14, yaw: PI + 0.12, pitch: 0.05 };
const walker = firstPerson({ canvas, start: START, groundAt, collide, stick: document.getElementById('stick'), knob: document.getElementById('knob') });
document.getElementById('home').addEventListener('click', () => walker.reset());
for (const [id, name] of [['scan', 'scanlines'], ['refl', 'reflections']]) {
  const b = document.getElementById(id); let on = true;
  b.addEventListener('click', () => { on = !on; b.setAttribute('aria-pressed', String(on)); post.set(name, on); });
}

/* ---------- ciclo ---------- */
const clock = new THREE.Clock(); let T = 0, simAcc = 0;
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05); T += dt; E.time.value = T;
  walker.update(dt);
  const c = walker.player;
  atmosphere(c); sky(); smoke(dt, T, c); rain(dt, c); updateSwing(T);
  if (nightLights) nightLights.update(T);
  for (let n = 0; n < 6; n++) stream.drop(R(-45, 45), BZ + R(-1.6, 1.6), 0.16, 1);
  stream.off = (T * 1.2 / 90) % 1; stream.mat.uniforms.off.value = stream.off;
  simAcc = Math.min(simAcc + dt, 0.06); while (simAcc >= 1 / 60) { stream.step(0.985); simAcc -= 1 / 60; } stream.upload();
  post.render(); requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.fov = innerWidth < innerHeight ? 76 : 66; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight, false); setParticleScale(PR); post.resize(); });
