# Errori noti e trappole tecniche

Problemi incontrati costruendo la scena di riferimento. Controllali prima di scrivere codice nuovo.

## JavaScript
- **TDZ (temporal dead zone).** Una `function` è sollevata in cima allo scope, ma le `const` che usa non lo sono. Chiamare `groundAt()` prima che `bridgeH` fosse definita ha bloccato la scena notturna. Costruire gli oggetti che dipendono da costanti definite più avanti al primo frame, oppure riordinare il codice.
- **Il generatore casuale della scena è seminato.** Ogni chiamata in più a `rnd()` sposta tutto ciò che viene dopo. Le texture usano hash (`hn`) o un rng locale.
- Su ogni pagina tenere un **riquadro che mostri l'errore** (`window.addEventListener('error', …)`). Su telefono è l'unico modo di sapere cosa si è rotto.

## Three.js (r128)
- **`FogExp2` copia il colore**: modificarlo dopo con `.color.set()`, non riassegnando la variabile.
- **`InstancedMesh` + frustum culling**: con istanze sparse su tutta la mappa le istanze spariscono. Usare `frustumCulled=false`.
- **`bake()` perde gli attributi extra** (colore per vertice): le mesh con `vertexColors` vanno fuori dall'unione, altrimenti diventano nere.
- **Alpha test + mipmap**: l'alpha intermedio finisce nella maschera dei riflessi. Forzare `diffuseColor.a=1.0` dopo `#include <alphatest_fragment>`.
- **Scrivere shader dentro stringhe generate**: nelle stringhe JS servono `\n` prima di `#ifdef`/`#endif`. Attenzione ai doppi escape quando il JS è generato da Python.
- **GLSL**: `smoothstep(a,b,x)` con `a>b` è indefinito. Una curva S `c*c*(3-2c)` va applicata a valori già limitati a [0,1].
- **Limite di uniform sui telefoni**: troppe PointLight con materiali per pixel non compilano (schermo nero). Leggere `MAX_FRAGMENT_UNIFORM_VECTORS` e ridurre le luci; se un programma risulta `!diagnostics.runnable`, togliere le luci e ricompilare.
- Euler per oggetti appesi: per oscillare attorno a un asse locale dopo `scene.attach()` usare `rotation.reorder('YXZ')`.
- **`updateMatrixWorld(true)` su un oggetto annidato non aggiorna i genitori**: usa la `matrixWorld` vecchia del genitore. Nella locanda le luci delle lanterne (gruppo dentro un gruppo) finivano vicino all'origine e la cucina restava buia. Per leggere la posizione nel mondo di un punto usare `obj.updateWorldMatrix(true,false)` prima di `localToWorld` (funzione `wpos`).
- **`bake()` e materiali multipli**: una mesh con un array di materiali (l'insegna: faccia dipinta + legno) non si può unire per materiale. Va lasciata fuori dall'unione, come le `ShaderMaterial`.
- **Le PointLight senza ombra passano attraverso i muri.** In un interno a più stanze una lanterna della cucina illuminerebbe il pavimento della sala. Rimedio: scegliere le luci a rotazione pesando la stanza della sorgente rispetto a quella di chi guarda (tabella `VIS` della locanda); le uniche luci con ombra sono fisse (fuoco e lampadario).
- **Ombre delle PointLight**: ogni luce con ombra disegna la scena 6 volte. Con la scena ferma basta calcolarle all'inizio: `renderer.shadowMap.autoUpdate=false` e `needsUpdate=true` nei primi fotogrammi. Il `near` della camera d'ombra va abbassato (0,08), altrimenti gli oggetti vicini alla fiamma non fanno ombra.
- **La texture `plaster` ha una fascia scura in fondo a ogni ripetizione**: su un muro alto più di una ripetizione disegna righe orizzontali. Per gli interni c'è `plasterIn`, senza fascia (lo sporco in basso lo mette `wear()`).
- **Decal additive sui muri** (pozze di luce verticali): viste di sbieco diventano troppo forti perché l'additivo non dipende dall'angolo. Tenerle debolissime o usare le luci vere.
- **Luci a rotazione con la dissolvenza**: se il programma va a pochi fotogrammi al secondo (o dopo un salto di punto di vista) le luci arrivano in ritardo e la stanza sembra buia. Al cambio di vista assegnarle subito (`snapLights`).

## Ambiente degli artifact claude.ai
- Gli script si caricano solo da cdnjs / jsdelivr / unpkg; Three.js r128 da cdnjs e `BufferGeometryUtils` da `cdn.jsdelivr.net/npm/three@0.128.0`.
- Nel sandbox di sviluppo i CDN non si raggiungono. Primo controllo: `node --check` sullo script e lo **stub di THREE** (`reference/build/stub.js`), che però non vede gli errori GPU.
- **Per vedere davvero il render** (ambiente cloud di Claude Code): `node tools/anteprima.js <scena.html> <cartella> [larghezza altezza] [viste…]`. Usa il Chromium di Playwright con SwiftShader (WebGL in software) e prende Three.js r128 da npm (`npm pack three@0.128.0`, il registro npm è raggiungibile), servendolo al posto dei CDN. Fa pochi fotogrammi al secondo: le attese sono lunghe, e a `SCALA=2` ogni fotogramma costa circa 4 volte tanto. Stampa gli errori della pagina e il riquadro degli errori.
- SwiftShader dichiara `MAX_FRAGMENT_UNIFORM_VECTORS` = 4096, quindi prova solo il ramo "8 luci". Per provare il ramo dei telefoni deboli si può forzare il valore sovrascrivendo `getParameter(0x8DFD)` con `page.addInitScript`.
