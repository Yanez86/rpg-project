# Il motore: guida ai moduli

Il codice della scena di riferimento è diviso in moduli ES in `engine/src/`. Tutto si importa da `engine/src/index.js`.
Three.js **r128** viene da CDN tramite *import map* (vedi `engine/demo/index.html`).

## Come si compone una scena (ordine obbligatorio)

```js
import * as THREE from 'three';
import { E, initContext, createTextures, setupAtmosphere, house, tree, bake, createPost /* … */ } from '../src/index.js';

initContext({ renderer, scene, camera, mood: 'rain' }); // oppure 'night'
const atmosphere = setupAtmosphere();   // 1. nebbia e luci (imposta E.fog, che gli shader leggono)
createTextures();                       // 2. texture (prima di qualsiasi materiale)
// 3. il mondo: tutto ciò che è statico va in un gruppo `world`
const world = new THREE.Group(); scene.add(world);
house(world, 6, 0, { rotY: -Math.PI / 2, front: true });
tree(world, 14, 8);
bake(world);                            // 4. unione statica per materiale (dopo aver costruito tutto)
// 5. effetti e post-processing
const post = createPost();
function tick() { /* aggiorna E.time.value, effetti, controlli */ post.render(); requestAnimationFrame(tick); }
```

- **`E` (core/context.js)** è il contesto condiviso: scena, renderer, camera, `mood`, colore e densità della nebbia, `time` (uniform del tempo), e le liste riempite dagli oggetti:
  - `swing`: insegne e lanterne che dondolano;
  - `dripPoints`: gronde;
  - `chimneys`: comignoli;
  - `crowns`: chiome degli alberi;
  - `obstacles`: ostacoli;
  - `lights`: sorgenti di luce per la notte.
- **`rnd()`** è seminato: lo stesso codice genera sempre lo stesso mondo. `setSeed(n)` cambia il mondo.

## Moduli

| Modulo | Esporta | Note |
|---|---|---|
| `core/context.js` | `E`, `initContext` | contesto condiviso |
| `core/rng.js` | `rnd`, `R`, `pick`, `hn`, `vnoise`, `setSeed` | casuale seminato, hash, value noise |
| `core/geometry.js` | `V`, `PI`, `B`, `uvB`, `CY`, `CO`, `SP`, `TO`, `uvS`, `mergeGeometries` | scorciatoie |
| `core/bake.js` | `bake(group)` | unione statica; **perde i colori per vertice** |
| `textures/pix.js` | `pix(S, fn)`, `G` | pixel-art con hue shift automatico |
| `textures/library.js` | `TEX`, `createTextures()` | tegole, pietra, ciottoli, erba, terra, legno, intonaco, edera, foglie, corteccia, betulla, vetro |
| `materials/palette.js` | `WALLS`, `ROOFS`, `SHUT`, `DOORS`, `TIMBER`, `STONE`, `IRON`, `BRASS`, `BANNERS`, `BUNTING`, `GRASS`, `FOLIAGE`, `GLASS`, `LIT`, `mute` | palette |
| `materials/wear.js` | `wear(material)` | usura in shader |
| `materials/factory.js` | `tm(color, o)`, `P(parent, geo, color, x, y, z, o)`, `vertexColorMaterial`, `ivyMaterial` | materiali condivisi; di notte Phong |
| `props/sign.js` | `hangSign(parent, base, dir, len, kind)`, `iconTex`, `boardGeo`, `ICONS`, `HOUSE_ICONS` | insegne appese |
| `props/lantern.js` | `paperLantern()`, `wallLantern(parent, x, y, z)` | lanterne di carta |
| `props/bench.js` | `bench(parent, x, y, z, rotY)` | panchina |
| `props/flowers.js` | `flower`, `flowerBed`, `flowerField(spots)`, `FLOWER_TYPES`, `FLOWER_COLS` | fiori modellati |
| `props/containers.js` | `barrel`, `crate`, `sack`, `basket` | contenitori |
| `buildings/house.js` | `house(parent, x, z, {rotY, front, type})`, `win`, `door`, `gable`, `chimney`, `timberHouse`, `roundHouse`, `tallHouse`, `houseDetails` | la facciata guarda verso +z locale |
| `vegetation/trees.js` | `tree(parent, x, z, {kind, nearWater})`, `fir`, `SPECIES`, `TREE_KINDS`, `leafMat` | alberi procedurali |
| `vegetation/grass.js` | `grassField({count, radius, center, ok, tall, flowers})` | erba e prato fiorito istanziati |
| `vegetation/undergrowth.js` | `undergrowth(parent, {area, ok, nearPath, reeds, counts})` | felci, funghi, massi, foglie, sassolini, canne |
| `world/terrain.js` | `createTerrain({size, segments, center, radius, flat, dirt, damp})` | terreno a macchie |
| `world/path.js` | `path(parent, ax, az, bx, bz, w)` | sentiero con solchi bagnati |
| `world/bridge.js` | `stoneBridge(parent, x, z, rotY)`, `bridgeDeck(z)` | ponte lungo z locale, 7,2 m |
| `world/cliffs.js` | `distantCliffs({center, layers})` | pareti lontane a strati |
| `water/water.js` | `Sim`, `waterSurface`, `waterRibbon`, `puddle`, `puddleMaterial` | acqua simulata, cascate, pozzanghere |
| `fx/particles.js` | `PS`, `particleTextures`, `setParticleScale` | particelle a punti |
| `fx/soft.js` | `softSys`, `smokeAndFog({litBy})` | fumo dei comignoli e banchi di nebbia |
| `fx/rain.js` | `createRain({groundAt, litBy})` | pioggia, schizzi, gocce dalle grondaie |
| `fx/sky.js` | `createSky()` | cielo coperto (o notturno) |
| `fx/swing.js` | `updateSwing(T)` | oscillazione di insegne e lanterne |
| `render/lighting.js` | `setupAtmosphere()` | nebbia e luci per `E.mood` |
| `render/post.js` | `createPost({pixelRatio, reflections, scanlines})` | SSAO, SSR, foschia, bloom, grading, scanlines |
| `render/nightLights.js` | `createNightLights({groundAt})` | light culling, pozze, coni, aloni |
| `characters/puppet.js` | `joint`, `piece`, `charMat`, `charTex`, `makeClip`, `animator` | marionette a pezzi rigidi e clip di animazione |
| `characters/villager.js` | `villager()`, `elf()`, `elfLook()`, `humanMats(look, face)`, `villagerClips({hip, stride, arm})` | umanoidi morbidi (abitante, elfa): `fermo`, `cammina`, `corre`, `saluta`; aspetto e materiali riusabili dai modelli di Blender |
| `characters/elfa3d.js` | `loadElfa3d(url)`, `setElfa3d(buffer)`, `elfa3d({vesti})` (l'attore ha anche `misure`), `vesti(attore, capi)`, `pezziElfa3d()`, `tuttiIPezzi()`, `scegliVisibili(tags, capi)`, `ELFA3D_MATERIALS` | l'elfa modellata in Blender (`engine/assets/elfa.glb`): stessi giunti e clip di `elf()`, più dettaglio; corpo base, intimo, abiti, accessori e capelli che si mettono e si tolgono |
| `core/glb.js` | `parseGlb(buffer)` | lettore minimo di `.glb`: nodi, mesh, uv, nomi dei materiali (`userData.mat`) e proprietà di Blender (`userData`) |
| `characters/cat.js` | `cat()`, `catClips()` | gatto: `fermo`, `cammina`, `trotta`, `seduto` |
| `characters/loft.js` | `loft(sezioni, opts)`, `taper(...)` | forme organiche: sezioni ellittiche lungo un asse, con gruppo "ventre"; `bumps` per rigonfiamenti morbidi dentro la stessa sezione |
| `characters/dragon.js` | `dragon()`, `dragonClips()` | drago: `fermo`, `cammina`, `ruggisce`, `vola`; chiamare `update()` dopo l'animazione |
| `characters/toon.js` | `setToon(root, on, {outline})`, `TOON` | cel shading "anime" (stile JRPG) solo sui personaggi: luce propria fissata alla camera, ombra lilla a due toni, rim light, contorno sottile; non tocca le luci della scena. `TOON` contiene i parametri |
| `characters/npc.js` | `wanderer(actor, {pick, groundAt, collide, player, others, ...})`, `eyeHeight(actor)` | comparse che passeggiano, si fermano e salutano chi gioca; altezza degli occhi per la camera |
| `controls/thirdPerson.js` | `thirdPerson({canvas, actor, walk, run, collide, stick, knob, actions})` | muovi un personaggio in terza persona; clip automatiche `fermo`/`cammina`/`corre`, azioni da tasto (es. E → `saluta`) |
| `controls/firstPerson.js` | `firstPerson({canvas, start, groundAt, collide, stick, knob})` | camminata in prima persona |

Gli `update` restituiti dai moduli vanno chiamati a ogni frame. La demo (`engine/demo/main.js`) mostra l'ordine completo.

## Avviare la demo

I moduli ES non si caricano da `file://`. Servi la cartella `engine` con un server qualsiasi, per esempio `npx serve engine` oppure `python3 -m http.server -d engine`, e apri `/demo/`. Aggiungi `#notte` all'indirizzo per la versione notturna.

## Prova dei personaggi

`engine/demo/personaggi.html`: un abitante, l'elfa del motore, l'elfa modellata in Blender e un gatto con i pulsanti per ogni animazione; "Un altro" genera una variante. `engine/demo/guardaroba.html`: l'elfa di Blender su una pedana, con un pulsante per ogni capo (dal corpo base all'abito completo) e le animazioni. `engine/demo/drago.html`: il drago in un prato; tu sei l'abitante e ti muovi in terza persona.

## Modelli fatti in Blender

Blender si comanda con script Python: lo script costruisce il modello e lo esporta in `.glb` (glTF binario), il motore lo legge con `parseGlb()`.

- Script: `engine/tools/blender/` (oggi `elfa.py`). Il modello finisce in `engine/assets/`.
- Rigenerare, con Blender come modulo Python (`pip install bpy`, serve Python 3.13 per bpy 5.x):
  `python engine/tools/blender/elfa.py --out engine/assets/elfa.glb`
- Oppure con Blender installato (su macOS: Blender.app):
  `/Applications/Blender.app/Contents/MacOS/Blender --background --python engine/tools/blender/elfa.py -- --out engine/assets/elfa.glb`
  Aggiungi `--blend elfa.blend` per salvare anche il file da aprire in Blender.
- Regole: si scrive in coordinate three (x destra, y su, z avanti) e si converte in quelle di Blender solo quando si crea la mesh; un personaggio a marionetta ha i giunti come oggetti vuoti con i nomi del motore e nessuna rotazione a riposo; i materiali hanno solo un nome, colori e texture li mette il modulo del motore; i dettagli piccoli vanno in un oggetto con la proprietà `noOutline`; ogni oggetto ha le etichette del guardaroba (`strato`, `pezzo`, `regione`, `nasconde`, `richiede`: vedi `docs/oggetti.md` › Corpo base e capi), che lo script mette con `corpo()` e `pezzo(...)` prima di costruire.
- Il modello si carica con `fetch`, quindi la pagina va servita via HTTP. In Node (test) si legge il file e si passa a `setElfa3d(buffer)`.

## Anteprime senza browser

`engine/tools/anteprima/` disegna un personaggio di fronte, di profilo e di tre quarti senza GPU (vedi il README lì): serve a controllare forme e proporzioni prima di pubblicare.

## Test

`cd engine && npm test` esegue prima `test/elfa3d.mjs` (giunti, piedi a terra, altezza e materiali del modello di Blender, poi `elfa3d()` con il finto three) e poi la demo in Node (aggiungi `personaggi.js` per la pagina dei personaggi) con un finto three (`test/three-stub.mjs`). `node --import ./test/register.mjs test/smoke.mjs --notte` fa lo stesso per la notte.
Trova errori JavaScript (riferimenti mancanti, ordine di inizializzazione, import ed export sbagliati), non errori degli shader.

## Cosa non è ancora un modulo

Gli elementi unici della scena di riferimento: fontana a tre vasche, torre del mago, mulino, bancarelle del mercato, lampioni, festoni con bandierine, pozzo, carretto, bacheca, petali che cadono.
Sono in `reference/valfiorita-pioggia.html` e vanno estratti quando servono, seguendo lo stesso schema.

## Usare il motore in una pagina "classica"

Le scene di `reference/` caricano three r128 come variabile globale (`window.THREE`). Per aggiungerci oggetti del motore (es. le comparse di `reference/valfiorita-sole.html`) l'import map punta `three` a `engine/tools/three-global.js`, che riesporta il three globale: pagina e moduli usano così la stessa copia di three. La pagina espone `window.VF` (scena, camera, `groundAt`, `collide`, `player`, `setEye`, `onTick`) e un modulo come `reference/gente-sole.js` ci aggancia i personaggi. `node --import ./test/register.mjs test/gente-sole.mjs` ne fa la prova di fumo.

La **Locanda del Boccale** (`scene/locanda.html`) è nata come scena autonoma, prima del motore a moduli: i suoi pezzi vanno ancora portati in moduli. Sono le luci d'interno a rotazione per stanza, le fiamme a pixel, il `wear()` con la fuliggine, muri con aperture, finestre e porte viste da dentro, scala e ringhiera, camino, lampadario a ruota, lanterna a olio, candele, tavoli e sedute, bancone, cucina, letto e stoviglie. Le ricette sono in `docs/oggetti.md`.
