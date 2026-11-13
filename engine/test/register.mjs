// Fa risolvere 'three' allo stub di test (nessuna rete, nessuna GPU).
import { register } from 'node:module';
register('./loader.mjs', import.meta.url);
