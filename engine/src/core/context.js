// Contesto condiviso del motore: scena, renderer, camera, tempo, colore della nebbia
// e le liste degli oggetti che si animano (insegne, lanterne) o che servono agli effetti
// (punti di gronda per le gocce, comignoli per il fumo, chiome per i petali, ostacoli).
import * as THREE from 'three';

export const E = {
  scene: null, renderer: null, camera: null,
  mood: 'rain',                       // 'rain' (giorno di pioggia) | 'night' (notte di pioggia)
  fog: new THREE.Color(0x97a29a),     // colore della nebbia: lo leggono anche gli shader
  fogDensity: 0.03,
  time: { value: 0 },                 // uniform condiviso del tempo (acqua, vento, pioggia)
  sunDir: new THREE.Vector3(-0.35, 0.86, -0.36).normalize(),
  swing: [],        // {pv, ph, x0, kind:'sign'|'lantern'} oggetti appesi che dondolano
  dripPoints: [],   // punti di gronda (Vector3 nel mondo)
  chimneys: [],     // [gruppo, punto locale] dei comignoli
  crowns: [],       // [x, y, z, fiorito] cime degli alberi (petali che cadono)
  obstacles: [],    // [x, z, raggio] per le collisioni e per non sovrapporre oggetti
  lights: [],       // sorgenti di luce calda per la notte {x,y,z,nx,nz,k,kind}
};

export function initContext({ renderer, scene, camera, mood }) {
  Object.assign(E, { renderer, scene, camera });
  if (mood) E.mood = mood;
}
