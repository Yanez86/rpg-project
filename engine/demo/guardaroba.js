// Guardaroba dell'elfa: il corpo base modellato in Blender e i capi che si mettono e si tolgono uno per uno.
// I pulsanti dei capi vengono dal modello (userData.strato / pezzo), quindi un capo nuovo aggiunto in Blender compare da solo.
// Trascina per girare attorno, rotellina o +/− per avvicinarti.
import * as THREE from 'three';
import { E, initContext, setupAtmosphere, createTextures, setToon, loadElfa3d, elfa3d, vesti, pezziElfa3d, tuttiIPezzi, PI } from '../src/index.js';

const err = document.getElementById('err');
const fail = m => { err.hidden = false; err.textContent = m; };
addEventListener('error', e => fail('Errore nella scena: ' + e.message + ' (riga ' + e.lineno + ')'));
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
const PR = Math.min(window.devicePixelRatio || 1, 2);
renderer.setPixelRatio(PR); renderer.setSize(innerWidth, innerHeight, false);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x6f7a72);
const camera = new THREE.PerspectiveCamera(innerWidth < innerHeight ? 50 : 32, innerWidth / innerHeight, 0.05, 100);
initContext({ renderer, scene, camera, mood: 'sun' });
setupAtmosphere(); createTextures(); scene.fog = null;
{ // pedana di legno scuro
  const g = new THREE.CylinderGeometry(0.9, 0.95, 0.08, 40); const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0x4a3a2c })); m.position.y = -0.04; scene.add(m); }

const NOMI = { intimo: 'Intimo', abiti: 'Abiti', accessori: 'Accessori', capelli: 'Capelli' };
let actor = null, worn = [], clip = 'fermo';
try { await loadElfa3d(); }
catch (e) { fail('Il modello dell\'elfa non si carica (' + e.message + '). Apri la pagina da un server: vedi docs/motore.md.'); }

const pezzi = pezziElfa3d(), buttons = {};
function aggiorna() {
  if (actor) vesti(actor, worn);
  for (const [p, b] of Object.entries(buttons)) b.setAttribute('aria-pressed', String(worn.includes(p)));
}
function nuova() {
  if (!actor && !Object.keys(pezzi).length) return;
  if (actor) scene.remove(actor.root);
  actor = elfa3d({ vesti: worn }); scene.add(actor.root); setToon(actor.root, true); actor.anim.play(clip, 0);
}
{ // una riga di pulsanti per strato, letti dal modello
  const box = document.getElementById('wardrobe');
  for (const [strato, lista] of Object.entries(pezzi)) {
    const row = document.createElement('div'); row.className = 'row panel';
    const who = document.createElement('span'); who.className = 'who'; who.textContent = NOMI[strato] || strato; row.appendChild(who);
    for (const p of lista) {
      const b = document.createElement('button'); b.className = 'act'; b.type = 'button'; b.textContent = p.replace('_', ' ');
      b.addEventListener('click', () => { worn = worn.includes(p) ? worn.filter(x => x !== p) : [...worn, p]; aggiorna(); });
      buttons[p] = b; row.appendChild(b);
    }
    box.appendChild(row);
  }
}
const PRESET = { corpo: () => [], intimo: () => [...(pezzi.intimo || []).filter(p => p !== 'calze'), ...(pezzi.capelli || [])], tutto: () => tuttiIPezzi() };
for (const b of document.querySelectorAll('[data-preset]')) b.addEventListener('click', () => { worn = PRESET[b.dataset.preset](); aggiorna(); });
document.getElementById('nuova').addEventListener('click', () => { nuova(); aggiorna(); });
for (const b of document.querySelectorAll('[data-clip]')) b.addEventListener('click', () => {
  clip = b.dataset.clip; if (actor) actor.anim.play(clip);
  for (const o of document.querySelectorAll('[data-clip]')) o.setAttribute('aria-pressed', String(o === b));
});
worn = PRESET.tutto(); nuova(); aggiorna();

/* ---------- camera che gira attorno ---------- */
let yaw = 0.4, pitch = 0.12, dist = 4.2, dragId = null, lx = 0, ly = 0;
canvas.addEventListener('pointerdown', e => { if (dragId !== null) return; dragId = e.pointerId; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => { if (e.pointerId !== dragId) return; yaw -= (e.clientX - lx) * 0.008; pitch = Math.max(-0.2, Math.min(1.0, pitch + (e.clientY - ly) * 0.004)); lx = e.clientX; ly = e.clientY; });
const up = e => { if (e.pointerId === dragId) dragId = null; }; canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
canvas.addEventListener('wheel', e => { dist = Math.max(0.8, Math.min(9, dist * (1 + e.deltaY * 0.001))); e.preventDefault(); }, { passive: false });
document.getElementById('zin').addEventListener('click', () => dist = Math.max(0.8, dist * 0.8));
document.getElementById('zout').addEventListener('click', () => dist = Math.min(9, dist * 1.25));

const clock = new THREE.Clock(); let T = 0;
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05); T += dt; E.time.value = T;
  if (actor) actor.anim.update(dt);
  const cy = dist < 1.6 ? 1.5 : 0.95;                    // da vicino la camera guarda il viso
  camera.position.set(Math.sin(yaw) * Math.cos(pitch) * dist, cy + Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist);
  camera.lookAt(0, cy, 0);
  renderer.render(scene, camera); requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.fov = innerWidth < innerHeight ? 50 : 32; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight, false); });
