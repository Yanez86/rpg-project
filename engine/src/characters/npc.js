// Comparse che vivono la scena: scelgono una meta, ci camminano con la clip giusta, si fermano un po' e ripartono.
// Se chi gioca si avvicina, si girano verso di lui e salutano. Si scansano tra loro e scansano chi gioca.
import { rnd, R } from '../core/rng.js';

/**
 * wanderer(actor, opts) — actor: { root, anim } (da villager(), elf(), cat()).
 * opts: {
 *   pick() → [x, z]            nuova meta (obbligatorio)
 *   groundAt(x, z) → y         altezza del suolo
 *   collide(p)                 sposta p {x, z} fuori dagli ostacoli
 *   walk: 'cammina', speed: 1.35       clip e velocità (m/s) che corrispondono al passo dell'animazione
 *   run: null, runSpeed, runChance     facoltativi: ogni tanto la meta si raggiunge di corsa (o al trotto)
 *   idle: 'fermo', pause: [1.5, 5]     sosta alla meta
 *   rest: null, restChance             facoltativo: clip di sosta lunga (es. 'seduto' per il gatto)
 *   greet: 'saluta', greetDist: 2.6    saluto quando chi gioca si avvicina (null per nessun saluto)
 *   player: {x, z}             posizione di chi gioca (letta a ogni frame)
 *   others: []                 le altre comparse, per non sovrapporsi
 *   radius: 0.35
 * }
 * Restituisce { actor, pos, update(dt) }.
 */
export function wanderer(actor, opts) {
  const o = Object.assign({ walk: 'cammina', speed: 1.35, idle: 'fermo', pause: [1.5, 5], greet: 'saluta', greetDist: 2.6, radius: 0.35, others: [], runChance: 0, restChance: 0 }, opts);
  const root = actor.root, ground = o.groundAt || (() => 0);
  const start = o.pick(); const pos = { x: start[0], z: start[1] };
  let heading = rnd() * Math.PI * 2, target = o.pick(), state = 'pause', timer = R(0, 2), clip = o.idle, speed = o.speed;
  let check = 0, lastX = pos.x, lastZ = pos.z, greeted = 0, greetT = 0;
  const play = c => { if (c && c !== clip) { actor.anim.play(c, 0.3); clip = c; } };
  actor.anim.play(o.idle, 0);
  const self = { actor, pos, radius: o.radius };
  function newTarget() {
    target = o.pick(); state = 'walk'; check = 0; lastX = pos.x; lastZ = pos.z;
    const running = o.run && rnd() < o.runChance; play(running ? o.run : o.walk); speed = running ? o.runSpeed : o.speed;
  }
  function turnTo(ang, dt, rate) { let d = ang - heading; d = Math.atan2(Math.sin(d), Math.cos(d)); heading += Math.max(-rate * dt, Math.min(rate * dt, d)); return Math.abs(d); }
  self.update = function (dt) {
    const pl = o.player, dpx = pl ? pl.x - pos.x : 99, dpz = pl ? pl.z - pos.z : 99, dPl = Math.hypot(dpx, dpz);
    greeted = Math.max(0, greeted - dt);
    // saluto: chi gioca è vicino e non l'abbiamo salutato da poco
    if (o.greet && state !== 'greet' && dPl < o.greetDist && greeted <= 0) { state = 'greet'; greetT = 0; play(o.idle); }
    if (state === 'greet') {
      greetT += dt; const off = turnTo(Math.atan2(dpx, dpz), dt, 4);
      if (greetT > 0.35 && off < 0.4 && clip !== o.greet) play(o.greet);
      if (greetT > 2.4 || dPl > o.greetDist + 1.5) { greeted = 14; state = 'pause'; timer = R(0.5, 1.5); play(o.idle); }
    } else if (state === 'pause') {
      timer -= dt; if (timer <= 0) newTarget();
    } else {
      const dx = target[0] - pos.x, dz = target[1] - pos.z, d = Math.hypot(dx, dz);
      if (d < 0.4) {
        state = 'pause'; const rest = o.rest && rnd() < o.restChance;
        timer = rest ? R(6, 14) : R(o.pause[0], o.pause[1]); play(rest ? o.rest : o.idle);
      } else {
        const off = turnTo(Math.atan2(dx, dz), dt, 3.2), v = speed * Math.max(0, Math.cos(Math.min(off, Math.PI / 2)));
        pos.x += Math.sin(heading) * v * dt; pos.z += Math.cos(heading) * v * dt;
        check += dt; if (check > 2) { if (Math.hypot(pos.x - lastX, pos.z - lastZ) < 0.5) newTarget(); check = 0; lastX = pos.x; lastZ = pos.z; }   // bloccato: cambia meta
      }
    }
    // separazione dalle altre comparse e da chi gioca
    for (const b of o.others) { if (b === self) continue; const ex = pos.x - b.pos.x, ez = pos.z - b.pos.z, e = Math.hypot(ex, ez), m = o.radius + b.radius;
      if (e < m && e > 1e-4) { pos.x += ex / e * (m - e) * 0.5; pos.z += ez / e * (m - e) * 0.5; } }
    if (pl && dPl < o.radius + 0.35 && dPl > 1e-4) { const m = o.radius + 0.35; pos.x = pl.x - dpx / dPl * m; pos.z = pl.z - dpz / dPl * m; }
    if (o.collide) o.collide(pos);
    root.position.set(pos.x, ground(pos.x, pos.z), pos.z); root.rotation.y = heading;
    actor.anim.update(dt);
  };
  return self;
}

/** altezza degli occhi di un umanoide (villager/elf) rispetto ai suoi piedi, nella posa di riposo:
 *  serve a mettere la camera di chi gioca alla stessa altezza degli abitanti */
export function eyeHeight(actor) {
  const root = actor.root, head = root.getObjectByName('testa'); if (!head) return 1.6;
  let o = head.children.find(c => c.isMesh) || head, y = 0;          // centro del volto, risalendo i giunti fino ai piedi
  for (let k = 0; o && o !== root && k < 24; k++) { y += o.position.y; o = o.parent; }
  return y + 0.012;
}
