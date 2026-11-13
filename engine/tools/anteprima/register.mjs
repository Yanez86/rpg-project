import { register } from 'node:module';
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, n) { if (s === 'three') return { url: ${JSON.stringify(new URL('./mini-three.mjs', import.meta.url).href)}, shortCircuit: true }; return n(s, c); }`));
