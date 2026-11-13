// Prova di fumo: esegue la demo con un finto browser e un finto three.
// Trova errori JavaScript (riferimenti mancanti, TDZ, import/export sbagliati). Non vede gli errori GPU.
const els = {};
const el = () => ({ hidden: true, textContent: '', style: {}, addEventListener() {}, setAttribute() {}, setPointerCapture() {}, getBoundingClientRect() { return { left: 0, top: 0, width: 112, height: 112 }; }, firstElementChild: {} });
const canvas2d = () => new Proxy({}, { get: (t, k) => k === 'createImageData' ? ((w, h) => ({ data: new Uint8ClampedArray(w * h * 4) })) : k === 'getImageData' ? ((x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) })) : (typeof k === 'string' ? (() => ({ addColorStop() {} })) : undefined), set: () => true });
let frames = 0;
Object.assign(globalThis, {
  innerWidth: 390, innerHeight: 844, devicePixelRatio: 3,
  window: globalThis, location: { search: '', hash: process.argv.includes('--notte') ? '#notte' : '' },
  document: { getElementById: id => els[id] || (els[id] = el()), querySelectorAll: () => [], createElement: () => ({ width: 0, height: 0, getContext: canvas2d }) },
  addEventListener() {}, requestAnimationFrame: f => { if (frames++ < 3) setTimeout(f, 0); },
});
process.on('uncaughtException', e => { console.error('ERRORE:', e); process.exit(1); });
const page = process.argv.find(a => a.endsWith('.js')) || 'main.js';
await import('../demo/' + page);
await new Promise(r => setTimeout(r, 50));
console.log(`ok · ${page} · ${process.argv.includes('--notte') ? 'notte' : 'pioggia'} · frame eseguiti: ${frames}`);
