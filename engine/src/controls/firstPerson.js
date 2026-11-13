// Camminata in prima persona: WASD/frecce, Shift per correre, trascinamento per guardare, joystick a schermo.
import { E } from '../core/context.js';

/**
 * opts: { canvas, start:{x,z,yaw,pitch}, eye:1.7, groundAt(x,z)→y, collide(p) (sposta p fuori dagli ostacoli),
 *         stick, knob (elementi del joystick, facoltativi) }
 * Restituisce { player, reset(), update(dt) }.
 */
export function firstPerson(opts) {
  const canvas = opts.canvas, cam = E.camera, S = opts.start || { x: 0, z: 0, yaw: 0, pitch: 0 }, eye = opts.eye ?? 1.7;
  const groundAt = opts.groundAt || (() => 0), collide = opts.collide || defaultCollide;
  const player = { x: S.x, z: S.z, y: groundAt(S.x, S.z) + eye }; let yaw = S.yaw || 0, pitch = S.pitch || 0, bob = 0;
  const keys = new Set(); let jx = 0, jy = 0;
  addEventListener('keydown', e => { if (/^(Key[WASD]|Arrow|Shift)/.test(e.code)) { keys.add(e.code); if (e.code.startsWith('Arrow')) e.preventDefault(); } });
  addEventListener('keyup', e => keys.delete(e.code));
  addEventListener('blur', () => keys.clear());
  let dragId = null, lx = 0, ly = 0;
  canvas.addEventListener('pointerdown', e => { if (dragId !== null) return; dragId = e.pointerId; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (e.pointerId !== dragId) return; const s = 0.0042 * (cam.fov / 70);
    yaw += (e.clientX - lx) * s; pitch += (e.clientY - ly) * s; pitch = Math.max(-1.2, Math.min(1.25, pitch)); lx = e.clientX; ly = e.clientY; });
  const endDrag = e => { if (e.pointerId === dragId) dragId = null; };
  canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
  const stick = opts.stick, knob = opts.knob; let stickId = null;
  if (stick && knob) {
    const move = e => { const r = stick.getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const m = Math.hypot(dx, dy), max = r.width / 2 - 14; if (m > max) { dx *= max / m; dy *= max / m; } knob.style.transform = `translate(${dx}px,${dy}px)`; jx = dx / max; jy = dy / max; };
    stick.addEventListener('pointerdown', e => { stickId = e.pointerId; stick.setPointerCapture(e.pointerId); move(e); e.preventDefault(); });
    stick.addEventListener('pointermove', e => { if (e.pointerId === stickId) move(e); });
    const end = e => { if (e.pointerId !== stickId) return; stickId = null; jx = jy = 0; knob.style.transform = ''; };
    stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
  }
  function defaultCollide(p) { for (const o of E.obstacles) { const dx = p.x - o[0], dz = p.z - o[1], d = Math.hypot(dx, dz), m = o[2] + 0.3; if (d < m && d > 1e-4) { p.x = o[0] + dx / d * m; p.z = o[1] + dz / d * m; } } }
  return {
    player,
    reset() { player.x = S.x; player.z = S.z; yaw = S.yaw || 0; pitch = S.pitch || 0; },
    update(dt) {
      let mf = -jy, ms = jx;
      if (keys.has('KeyW') || keys.has('ArrowUp')) mf += 1; if (keys.has('KeyS') || keys.has('ArrowDown')) mf -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) ms += 1; if (keys.has('KeyA') || keys.has('ArrowLeft')) ms -= 1;
      const mag = Math.min(1, Math.hypot(mf, ms));
      if (mag > 0.05) { const sp = (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 5.5 : 3.0) * dt / Math.max(1, Math.hypot(mf, ms));
        player.x += (-Math.sin(yaw) * mf + Math.cos(yaw) * ms) * sp; player.z += (-Math.cos(yaw) * mf - Math.sin(yaw) * ms) * sp; collide(player); bob += dt * mag * 9; }
      const gy = groundAt(player.x, player.z) + eye; player.y += (gy - player.y) * Math.min(1, dt * 10);
      cam.position.set(player.x, player.y + Math.sin(bob) * 0.035 * Math.min(1, mag * 3), player.z);
      cam.rotation.order = 'YXZ'; cam.rotation.set(pitch, yaw, 0);
    }
  };
}
