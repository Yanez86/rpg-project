// Un "three" minimo per le anteprime senza browser: scena, gruppi, mesh, trasformazioni e le geometrie usate
// dai personaggi. Serve a esportare i triangoli in coordinate mondo e disegnarli (vedi render.py).
export const PI = Math.PI;
export class Color { constructor(r, g, b) { this.r = 1; this.g = 1; this.b = 1; if (g === undefined && r !== undefined) this.set(r); else if (r !== undefined) { this.r = r; this.g = g; this.b = b; } }
  set(v) { if (v instanceof Color) { this.r = v.r; this.g = v.g; this.b = v.b; } else this.setHex(v); return this; }
  setHex(h) { this.r = ((h >> 16) & 255) / 255; this.g = ((h >> 8) & 255) / 255; this.b = (h & 255) / 255; return this; }
  getHex() { const c = x => Math.max(0, Math.min(255, Math.round(x * 255))); return (c(this.r) << 16) | (c(this.g) << 8) | c(this.b); }
  setRGB(r, g, b) { this.r = r; this.g = g; this.b = b; return this; } multiplyScalar(k) { this.r *= k; this.g *= k; this.b *= k; return this; }
  lerp(c, t) { this.r += (c.r - this.r) * t; this.g += (c.g - this.g) * t; this.b += (c.b - this.b) * t; return this; } clone() { return new Color(this.r, this.g, this.b); } copy(c) { return this.set(c); } }
export class Vector3 { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; } set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  clone() { return new Vector3(this.x, this.y, this.z); } copy(v) { return this.set(v.x, v.y, v.z); } add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; } multiplyScalar(k) { this.x *= k; this.y *= k; this.z *= k; return this; }
  lerp(v, t) { this.x += (v.x - this.x) * t; this.y += (v.y - this.y) * t; this.z += (v.z - this.z) * t; return this; } length() { return Math.hypot(this.x, this.y, this.z); }
  normalize() { const l = this.length() || 1; return this.multiplyScalar(1 / l); } addScaledVector(v, k) { this.x += v.x * k; this.y += v.y * k; this.z += v.z * k; return this; }
  applyMatrix4(m) { const e = m, x = this.x, y = this.y, z = this.z; this.x = e[0] * x + e[4] * y + e[8] * z + e[12]; this.y = e[1] * x + e[5] * y + e[9] * z + e[13]; this.z = e[2] * x + e[6] * y + e[10] * z + e[14]; return this; } }
export class Vector2 { constructor(x = 0, y = 0) { this.x = x; this.y = y; } }
// matrici 4x4 in colonna (come three)
const ident = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const mul = (a, b) => { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; };
function compose(p, r, s) { // rotazione Euler con ordine
  const [a, b, c] = [r.x, r.y, r.z], ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
  const RX = [1, 0, 0, 0, 0, ca, sa, 0, 0, -sa, ca, 0, 0, 0, 0, 1], RY = [cb, 0, -sb, 0, 0, 1, 0, 0, sb, 0, cb, 0, 0, 0, 0, 1], RZ = [cc, sc, 0, 0, -sc, cc, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const M = { X: RX, Y: RY, Z: RZ }, o = r.order || 'XYZ'; let R = mul(mul(M[o[0]], M[o[1]]), M[o[2]]);
  if (r.q) R = r.q;
  const S = [s.x, 0, 0, 0, 0, s.y, 0, 0, 0, 0, s.z, 0, 0, 0, 0, 1]; const T = ident(); T[12] = p.x; T[13] = p.y; T[14] = p.z;
  return mul(T, mul(R, S));
}
class Euler { constructor() { this.x = 0; this.y = 0; this.z = 0; this.order = 'XYZ'; } set(x, y, z, o) { this.x = x; this.y = y; this.z = z; if (o) this.order = o; this.q = null; return this; } reorder(o) { this.order = o; } }
export class Object3D {
  constructor() { this.children = []; this.parent = null; this.position = new Vector3(); this.rotation = new Euler(); this.scale = new Vector3(1, 1, 1); this.name = ''; this.matrixWorld = ident(); this.quaternion = { setFromUnitVectors: (a, b) => { this.rotation.q = rotBetween(a, b); return this.quaternion; } }; }
  add(o) { o.parent = this; this.children.push(o); return this; } remove(o) { this.children = this.children.filter(c => c !== o); }
  updateMatrixWorld() { const L = compose(this.position, this.rotation, this.scale); this.matrixWorld = this.parent ? mul(this.parent.matrixWorld, L) : L; this.children.forEach(c => c.updateMatrixWorld()); }
  traverse(f) { f(this); this.children.forEach(c => c.traverse(f)); } getObjectByName(n) { let r = null; this.traverse(o => { if (!r && o.name === n) r = o; }); return r; }
  attach(o) { this.add(o); } getWorldPosition(v) { return v.set(this.matrixWorld[12], this.matrixWorld[13], this.matrixWorld[14]); }
  worldToLocal(v) { return v; } lookAt() {} localToWorld(v) { return v.applyMatrix4(this.matrixWorld); }
}
function rotBetween(a, b) { const v = [a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x], c = a.x * b.x + a.y * b.y + a.z * b.z;
  const k = 1 / (1 + c + 1e-9), [x, y, z] = v; return [1 - k * (y * y + z * z), z + k * x * y, -y + k * x * z, 0, -z + k * x * y, 1 - k * (x * x + z * z), x + k * y * z, 0, y + k * x * z, -x + k * y * z, 1 - k * (x * x + y * y), 0, 0, 0, 0, 1]; }
export class Group extends Object3D {}
export class Scene extends Object3D {}
export class Mesh extends Object3D { constructor(g, m) { super(); this.geometry = g; this.material = m; } }
export class Points extends Mesh {} export class LineSegments extends Mesh {}
export class BufferAttribute { constructor(a, n) { this.array = a instanceof Float32Array ? a : Float32Array.from(a); this.itemSize = n; this.count = this.array.length / n; }
  getX(i) { return this.array[i * this.itemSize]; } getY(i) { return this.array[i * this.itemSize + 1]; } getZ(i) { return this.array[i * this.itemSize + 2]; }
  setX(i, v) { this.array[i * this.itemSize] = v; } setY(i, v) { this.array[i * this.itemSize + 1] = v; } setZ(i, v) { this.array[i * this.itemSize + 2] = v; }
  setXY(i, x, y) { this.setX(i, x); this.setY(i, y); } setXYZ(i, x, y, z) { this.setX(i, x); this.setY(i, y); this.setZ(i, z); } }
export const Float32BufferAttribute = BufferAttribute;
export class BufferGeometry { constructor() { this.attributes = {}; this.index = null; this.groups = []; }
  setAttribute(k, v) { this.attributes[k] = v; return this; } setIndex(i) { this.index = Array.isArray(i) ? i : Array.from(i); return this; } addGroup(s, c, m) { this.groups.push({ start: s, count: c, materialIndex: m }); }
  computeVertexNormals() {} computeBoundingSphere() {}
  _map(f) { const p = this.attributes.position; for (let i = 0; i < p.count; i++) { const r = f(p.getX(i), p.getY(i), p.getZ(i)); p.setXYZ(i, ...r); } return this; }
  translate(x, y, z) { return this._map((a, b, c) => [a + x, b + y, c + z]); } scale(x, y, z) { return this._map((a, b, c) => [a * x, b * y, c * z]); }
  rotateX(t) { const c = Math.cos(t), s = Math.sin(t); return this._map((x, y, z) => [x, y * c - z * s, y * s + z * c]); }
  rotateY(t) { const c = Math.cos(t), s = Math.sin(t); return this._map((x, y, z) => [x * c + z * s, y, -x * s + z * c]); }
  rotateZ(t) { const c = Math.cos(t), s = Math.sin(t); return this._map((x, y, z) => [x * c - y * s, x * s + y * c, z]); }
  clone() { const g = new BufferGeometry(); for (const k in this.attributes) g.attributes[k] = new BufferAttribute(Float32Array.from(this.attributes[k].array), this.attributes[k].itemSize); g.index = this.index && this.index.slice(); g.groups = this.groups.slice(); return g; } }
function grid(ws, hs, fn, open) { const P = [], I = []; for (let iy = 0; iy <= hs; iy++) for (let ix = 0; ix <= ws; ix++) P.push(...fn(ix / ws, iy / hs));
  for (let iy = 0; iy < hs; iy++) for (let ix = 0; ix < ws; ix++) { const a = iy * (ws + 1) + ix, b = a + 1, c = a + ws + 1, d = c + 1; I.push(a, c, b, b, c, d); }
  const g = new BufferGeometry(); g.setAttribute('position', new BufferAttribute(P, 3)); g.setIndex(I); return g; }
export class SphereGeometry extends BufferGeometry { constructor(r = 1, ws = 16, hs = 8, ps = 0, pl = 2 * PI, ts = 0, tl = PI) { super(); const g = grid(ws, hs, (u, v) => { const phi = ps + u * pl, th = ts + v * tl; return [-r * Math.cos(phi) * Math.sin(th), r * Math.cos(th), r * Math.sin(phi) * Math.sin(th)]; }); Object.assign(this, { attributes: g.attributes, index: g.index }); } }
export class CylinderGeometry extends BufferGeometry { constructor(rt = 1, rb = 1, h = 1, rs = 8, hs = 1, open = false, ts = 0, tl = 2 * PI) { super(); const g = grid(rs, hs, (u, v) => { const r = rt + (rb - rt) * v, th = ts + u * tl; return [r * Math.sin(th), h / 2 - v * h, r * Math.cos(th)]; });
  const P = Array.from(g.attributes.position.array), I = g.index.slice(); if (!open) for (const [y, r] of [[h / 2, rt], [-h / 2, rb]]) { if (r <= 0) continue; const c = P.length / 3; P.push(0, y, 0); for (let i = 0; i <= rs; i++) { const th = ts + i / rs * tl; P.push(r * Math.sin(th), y, r * Math.cos(th)); } for (let i = 0; i < rs; i++) I.push(c, c + 1 + i, c + 2 + i); }
  this.setAttribute('position', new BufferAttribute(P, 3)); this.setIndex(I); } }
export class ConeGeometry extends CylinderGeometry { constructor(r = 1, h = 1, rs = 8, hs = 1, open = false) { super(0, r, h, rs, hs, open); } }
export class BoxGeometry extends BufferGeometry { constructor(w = 1, h = 1, d = 1) { super(); const x = w / 2, y = h / 2, z = d / 2, v = [[-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z], [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]];
  this.setAttribute('position', new BufferAttribute(v.flat(), 3)); this.setIndex([0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5]); } }
export class TorusGeometry extends BufferGeometry { constructor(R = 1, r = 0.4, rs = 8, ts = 6, arc = 2 * PI) { super(); const g = grid(ts, rs, (u, v) => { const a = u * arc, b = v * 2 * PI; return [(R + r * Math.cos(b)) * Math.cos(a), (R + r * Math.cos(b)) * Math.sin(a), r * Math.sin(b)]; }); Object.assign(this, { attributes: g.attributes, index: g.index }); } }
export class OctahedronGeometry extends SphereGeometry { constructor(r) { super(r, 4, 2); } }
export class IcosahedronGeometry extends SphereGeometry { constructor(r) { super(r, 8, 6); } }
export class PlaneGeometry extends BufferGeometry { constructor(w = 1, h = 1) { super(); const g = grid(1, 1, (u, v) => [(u - 0.5) * w, (0.5 - v) * h, 0]); Object.assign(this, { attributes: g.attributes, index: g.index }); } }
class Mat { constructor(p) { p = p || {}; this.color = p.color instanceof Color ? p.color.clone() : new Color(p.color ?? 0xffffff); this.map = p.map; this.side = p.side; } clone() { const m = new this.constructor({}); m.color = this.color.clone(); m.map = this.map; return m; } }
export class MeshLambertMaterial extends Mat {} export class MeshPhongMaterial extends Mat {} export class MeshBasicMaterial extends Mat {}
export class CanvasTexture { constructor(c) { this.image = c; } }
export const NearestFilter = 0, LinearMipmapLinearFilter = 0, RepeatWrapping = 0, DoubleSide = 2, FrontSide = 0;
export class Quaternion { setFromEuler() { return this; } } export { Euler };
export class QuaternionKeyframeTrack { constructor() {} } export class VectorKeyframeTrack { constructor() {} }
export class AnimationClip { constructor(name, duration) { this.name = name; this.duration = duration; } }
export class AnimationMixer { clipAction() { const a = { reset: () => a, setEffectiveWeight: () => a, play: () => a, crossFadeTo: () => a, getClip: () => ({ name: '' }) }; return a; } update() {} }
export class Shape { moveTo() {} lineTo() {} quadraticCurveTo() {} absarc() {} }
export class ExtrudeGeometry extends BoxGeometry { constructor() { super(0.01, 0.01, 0.01); } }
