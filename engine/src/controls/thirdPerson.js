// Camminata in terza persona: muovi un personaggio (es. l'abitante) con WASD/frecce o il joystick,
// Shift per correre, trascina per girare la camera attorno, rotellina per avvicinarti.
// Le animazioni passano da sole tra 'fermo', 'cammina' e 'corre' in base alla velocità.
import * as THREE from 'three';
import { E } from '../core/context.js';

/**
 * opts: { canvas, actor:{root, anim}, walk:1.4, run:3.6, groundAt(x,z), collide(p),
 *         stick, knob, dist:6, minDist, maxDist, height:1.5, actions:{ KeyE:'saluta' } }
 * Restituisce { update(dt), zoom(f), play(clip), position }.
 */
export function thirdPerson(opts) {
  const cam = E.camera, canvas = opts.canvas, A = opts.actor, root = A.root;
  const walkV = opts.walk ?? 1.4, runV = opts.run ?? 3.6, groundAt = opts.groundAt || (() => 0);
  const collide = opts.collide || (p => { for (const o of E.obstacles) { const dx = p.x - o[0], dz = p.z - o[1], d = Math.hypot(dx, dz), m = o[2] + 0.35; if (d < m && d > 1e-4) { p.x = o[0] + dx / d * m; p.z = o[1] + dz / d * m; } } });
  let yaw = opts.yaw ?? root.rotation.y + Math.PI, pitch = opts.pitch ?? 0.28, dist = opts.dist ?? 6, heading = root.rotation.y, action = null, actionT = 0;
  const minD = opts.minDist ?? 2.2, maxD = opts.maxDist ?? 40, H = opts.height ?? 1.5;
  const keys = new Set(); let jx = 0, jy = 0;
  addEventListener('keydown', e => { if (/^(Key[WASD]|Arrow|Shift)/.test(e.code)) { keys.add(e.code); if (e.code.startsWith('Arrow')) e.preventDefault(); }
    const act = opts.actions && opts.actions[e.code]; if (act && !e.repeat) play(act); });
  addEventListener('keyup', e => keys.delete(e.code)); addEventListener('blur', () => keys.clear());
  let dragId = null, lx = 0, ly = 0;
  canvas.addEventListener('pointerdown', e => { if (dragId !== null) return; dragId = e.pointerId; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (e.pointerId !== dragId) return; yaw -= (e.clientX - lx) * 0.006; pitch = Math.max(-0.15, Math.min(1.2, pitch + (e.clientY - ly) * 0.004)); lx = e.clientX; ly = e.clientY; });
  const up = e => { if (e.pointerId === dragId) dragId = null; }; canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', e => { zoom(1 + e.deltaY * 0.001); e.preventDefault(); }, { passive: false });
  const stick = opts.stick, knob = opts.knob; let stickId = null;
  if (stick && knob) {
    const move = e => { const r = stick.getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const m = Math.hypot(dx, dy), max = r.width / 2 - 14; if (m > max) { dx *= max / m; dy *= max / m; } knob.style.transform = `translate(${dx}px,${dy}px)`; jx = dx / max; jy = dy / max; };
    stick.addEventListener('pointerdown', e => { stickId = e.pointerId; stick.setPointerCapture(e.pointerId); move(e); e.preventDefault(); });
    stick.addEventListener('pointermove', e => { if (e.pointerId === stickId) move(e); });
    const end = e => { if (e.pointerId !== stickId) return; stickId = null; jx = jy = 0; knob.style.transform = ''; };
    stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
  }
  function zoom(f) { dist = Math.max(minD, Math.min(maxD, dist * f)); }
  /** un'azione che interrompe il cammino (es. 'saluta'); riparte da sola dopo la durata della clip */
  function play(clip) { const c = A.anim.clips.find(k => k.name === clip); if (!c) return; action = clip; actionT = c.duration * 2; A.anim.play(clip, 0.2); }
  const target = new THREE.Vector3(root.position.x, root.position.y + H, root.position.z), p = { x: 0, z: 0 };
  return {
    zoom, play, get position() { return root.position; },
    update(dt) {
      // direzione voluta, relativa alla camera
      let f = -jy, s = jx;
      if (keys.has('KeyW') || keys.has('ArrowUp')) f += 1; if (keys.has('KeyS') || keys.has('ArrowDown')) f -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) s += 1; if (keys.has('KeyA') || keys.has('ArrowLeft')) s -= 1;
      const mag = Math.min(1, Math.hypot(f, s)), running = keys.has('ShiftLeft') || keys.has('ShiftRight') || Math.hypot(jx, jy) > 0.9;
      if (mag > 0.08) {
        const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);   // avanti e destra della camera sul piano
        const dx = (fx * f + rx * s) / Math.max(1, Math.hypot(f, s)), dz = (fz * f + rz * s) / Math.max(1, Math.hypot(f, s));
        const want = Math.atan2(dx, dz); let d = want - heading; d = Math.atan2(Math.sin(d), Math.cos(d)); heading += d * Math.min(1, dt * 10);
        const v = (running ? runV : walkV) * mag; p.x = root.position.x + dx * v * dt; p.z = root.position.z + dz * v * dt; collide(p);
        root.position.x = p.x; root.position.z = p.z; root.rotation.y = heading;
        action = null; A.anim.play(running ? 'corre' : 'cammina', 0.2);
      } else if (action) { actionT -= dt; if (actionT <= 0) { action = null; A.anim.play('fermo', 0.3); } }
      else A.anim.play('fermo', 0.3);
      root.position.y += (groundAt(root.position.x, root.position.z) - root.position.y) * Math.min(1, dt * 12);
      A.anim.update(dt);
      // camera che segue da dietro, con un po' di ritardo
      target.lerp(new THREE.Vector3(root.position.x, root.position.y + H, root.position.z), Math.min(1, dt * 6));
      cam.position.set(target.x + Math.sin(yaw) * Math.cos(pitch) * dist, target.y + Math.sin(pitch) * dist, target.z + Math.cos(yaw) * Math.cos(pitch) * dist);
      cam.position.y = Math.max(cam.position.y, groundAt(cam.position.x, cam.position.z) + 0.3);
      cam.lookAt(target);
    }
  };
}
