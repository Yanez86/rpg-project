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

## Ambiente degli artifact claude.ai
- Gli script si caricano solo da cdnjs / jsdelivr / unpkg; Three.js r128 da cdnjs e `BufferGeometryUtils` da `cdn.jsdelivr.net/npm/three@0.128.0`.
- Il sandbox di sviluppo non ha rete: test con `node --check` e uno **stub di THREE** (`reference/build/stub.js`), che però non vede gli errori GPU.

## Moduli ES
- I moduli non si caricano da `file://`: serve un server HTTP. `three` arriva dall'import map (`three@0.128.0/build/three.module.js`); l'import map deve precedere ogni `<script type="module">`.
- Nelle pagine pubblicate come artifact claude.ai la query string non arriva alla pagina: per le varianti (es. notte) usare l'hash (`#notte`).
- Un modulo non deve creare materiali o texture al caricamento (top-level): `createTextures()` e il contesto non esistono ancora. Crearli in modo pigro al primo uso (vedi `lanternMats()`, `flowerGeometry()`, `leafMat()`).

## Texture dei personaggi
- `CanvasTexture` di default ha `ClampToEdgeWrapping`: se le UV vanno oltre 1 (texture ripetuta sul loft) si vede solo l'ultimo pixel stirato e la superficie sembra un colore piatto. Impostare `wrapS = wrapT = RepeatWrapping` (e le mipmap per le texture grandi viste da lontano).
- Le texture si possono controllare senza browser: eseguire in Node le funzioni dei pixel e salvarle come PNG (così le ha controllate chi ha scritto questa nota).
- **Commenti che inghiottono codice**: un commento `//` aggiunto alla fine di una riga "spinge" dentro il commento tutto ciò che segue sulla stessa riga. È successo con la membrana del drago (`position` mai creata → errore `a.array`). Commenti sempre su una riga propria o alla fine di un'istruzione completa.
- La prova di fumo ora usa geometrie e attributi "veri a metà" (`test/three-stub.mjs`): un attributo mai creato o una geometria vuota fanno fallire il test come nel browser.
- **Deformazioni a soglia**: una condizione secca (`if (z > 0.2)`) o un peso lineare che parte di colpo dentro una deformazione crea una cresta visibile nell'ombreggiatura (l'effetto "maschera" sulla testa). Usare pesi raccordati (smoothstep) e compressioni con derivata continua.
- La forma delle teste si controlla senza browser: si esegue `shapeHead` in Node su una sfera e si disegna con un piccolo rasterizzatore in Python (vista frontale, di profilo e di tre quarti).
- **Forme del corpo con pezzi separati**: sfere appoggiate su un busto (per petto, muscoli) si vedono come elementi estranei. Modellare la forma dentro la sezione del loft (`bumps`), così la superficie resta una sola.
- **Contorno del cel shading**: lo scafo invertito gonfiato di una quantità fissa diventa spesso da vicino e sparisce da lontano. Gonfiare in spazio vista proporzionalmente alla distanza (`mvPosition.xyz += n * k * -mvPosition.z`) e dare al materiale un `customProgramCacheKey` proprio, altrimenti three può riusare il programma di un MeshBasic normale.
