// Generatore casuale seminato (mulberry32) e hash deterministico.
// Il seme fa sì che lo stesso mondo venga generato uguale ogni volta.
// Le texture usano solo hn(): così aggiungere una texture non sposta il layout del mondo.
let seed = 20261112;
export function setSeed(s) { seed = s | 0; }
export function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
export const pick = a => a[Math.floor(rnd() * a.length)];
export const R = (a, b) => a + rnd() * (b - a);
export const hn = (a, b, c) => { let h = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul((c | 0) + 7, 83492791); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
/** rumore liscio (value noise) in 2D, scala s, seme k */
export function vnoise(x, z, s, k) {
  x /= s; z /= s; const x0 = Math.floor(x), z0 = Math.floor(z), fx = x - x0, fz = z - z0, sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  const a = hn(x0, z0, k), b = hn(x0 + 1, z0, k), c = hn(x0, z0 + 1, k), d = hn(x0 + 1, z0 + 1, k);
  return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz;
}
