// Le comparse di Valfiorita al sole: abitanti, elfe e gatti in cel shading che passeggiano tra la piazza e i sentieri.
// La scena (valfiorita-sole.html) espone window.VF; qui si usano i moduli del motore con lo stesso three della pagina.
import { initContext, villager, elf, cat, setToon, wanderer, eyeHeight, rnd, R } from '../engine/src/index.js';

const VF = window.VF;
if (VF) {
  initContext({ renderer: VF.renderer, scene: VF.scene, camera: VF.camera, mood: 'sun' });
  const free = (x, z, pad) => !VF.obs.some(o => Math.hypot(x - o[0], z - o[1]) < o[2] + pad);
  // mete: per lo più la piazza attorno alla fontana, a volte i sentieri verso il ponte e verso la torre
  function pick() {
    for (let t = 0; t < 40; t++) {
      let x, z; const k = rnd();
      if (k < 0.72) { const a = rnd() * Math.PI * 2, r = R(5.2, VF.PLAZA - 0.9); x = Math.cos(a) * r; z = Math.sin(a) * r; }
      else if (k < 0.88) { x = R(-0.7, 0.7); z = R(VF.PLAZA + 1, 30); }
      else { x = R(-0.7, 0.7); z = R(-19, -VF.PLAZA - 0.5); }
      if (free(x, z, 0.6)) return [x, z];
    }
    return [0, 7];
  }
  const people = [], P = VF.player;
  function add(make, o) {
    const a = make(); setToon(a.root, true); VF.scene.add(a.root);
    const w = wanderer(a, Object.assign({ pick, groundAt: VF.groundAt, collide: VF.collide, player: P, others: people }, o));
    people.push(w); return w;
  }
  // l'altezza degli occhi di chi gioca è quella di un abitante
  { const probe = villager(); VF.setEye(eyeHeight(probe)); }
  for (let i = 0; i < 5; i++) add(villager, { speed: 1.35, run: 'corre', runSpeed: 3.4, runChance: 0.08, pause: [2, 7] });
  for (let i = 0; i < 2; i++) add(elf, { speed: 1.45, pause: [3, 8], radius: 0.32 });
  for (let i = 0; i < 2; i++) add(cat, { speed: 0.5, run: 'trotta', runSpeed: 1.25, runChance: 0.35, rest: 'seduto', restChance: 0.5, greet: null, radius: 0.25, pause: [2, 6] });
  // un paio di comparse subito in vista, davanti a chi entra in piazza
  people[0].pos.x = 1.6; people[0].pos.z = 6.4; people[5].pos.x = -2.4; people[5].pos.z = 5.6; people[7].pos.x = 0.6; people[7].pos.z = 7.8;
  VF.onTick = dt => { for (const p of people) p.update(dt); };
}
