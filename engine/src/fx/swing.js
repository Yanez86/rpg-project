// Oscillazione nel vento di insegne e lanterne appese (E.swing).
import { E } from '../core/context.js';

export function updateSwing(T) {
  for (const s of E.swing) {
    if (s.kind === 'sign') s.pv.rotation.x = s.x0 + Math.sin(T * 1.2 + s.ph) * 0.07 + Math.sin(T * 2.9 + s.ph * 2) * 0.015;
    else { s.pv.rotation.z = Math.sin(T * 1.3 + s.ph) * 0.08; s.pv.rotation.x = Math.cos(T * 1.1 + s.ph) * 0.06; }
  }
}
