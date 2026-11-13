# Glossario delle tecniche

I nomi usati durante il lavoro, con una spiegazione breve. Utile per parlarne e per cercare documentazione.

| Nome | Cosa fa | Dove si usa |
|---|---|---|
| **Hue shifting** (variazione di tinta) | ogni pixel vira verso il caldo o il freddo invece di cambiare solo luminosità | tutte le texture `pix()` |
| **Weathering** (usura) | sporco, muschio, colature calcolati in shader sulla posizione nel mondo | `wear()` su tutti i materiali |
| **SSAO** (Screen-Space Ambient Occlusion) | scurisce angoli e incavi guardando la profondità dei pixel vicini | post-processing |
| **SSR** (Screen-Space Reflections) | riflessi sul bagnato cercando il raggio riflesso nell'immagine già disegnata | post, mascherato dall'alpha |
| **Bloom** | le zone molto luminose "sbavano" luce attorno | post |
| **Height mist** (foschia bassa) | nebbia più densa vicino al suolo | post |
| **Prospettiva aerea a strati** | i piani lontani sono più chiari e meno contrastati | pareti lontane, nebbia |
| **Color grading** | correzione finale di saturazione e contrasto (curva S) | post |
| **Scanlines** | righe orizzontali scure ogni 3 pixel, come nell'immagine di riferimento | post |
| **Light culling** | poche luci vere assegnate alle sorgenti più vicine | notte |
| **Light decal / pozze di luce** | macchie di luce additive disegnate a terra | notte |
| **Fake volumetric light / light shafts** | coni trasparenti additivi che simulano la luce nella nebbia | notte |
| **Halo** | alone morbido attorno a una sorgente | notte |
| **Flicker** | tremolio dell'intensità della fiamma | lanterne di notte |
| **Per-pixel lighting (Phong)** | la luce calcolata per pixel invece che per vertice | notte |
| **Additive blending (alpha preservato)** | `CustomBlending` con `blendSrcAlpha=Zero`, `blendDstAlpha=One` così non si rompe la maschera dei riflessi | effetti di luce |
| **Soft particles / billboard** | particelle a quad sempre rivolte alla camera con texture morbida | fumo, nebbia |
| **Heightfield water / wave equation** | superficie d'acqua simulata come griglia di altezze | vasche, fiume |
| **Alpha cards** (foglie su card) | piani incrociati con texture di foglie trasparenti per chiome complesse | alberi, felci |
| **L-system / ramificazione ricorsiva** | rami generati da regole che si ripetono | alberi |
| **Vertex wind** | oscillazione dei vertici nel vertex shader | foglie |
| **Loft** (estrusione a sezioni) | solido ottenuto facendo scorrere una sezione che cambia forma lungo un percorso | corpo, collo, coda, zampe, testa del drago |
| **Catmull-Rom** (spline) | curva che passa per tutti i punti dati e li raccorda in modo morbido | sezioni del loft nell'elfa di Blender |
| **glTF / GLB** | formato standard dei modelli 3D (GLB = versione in un solo file binario); lo leggono three, Godot e Blender | `engine/assets/elfa.glb` |
| **Extras** (proprietà personalizzate) | dati liberi attaccati a un oggetto in Blender che arrivano nel motore in `userData` | `noOutline` sui dettagli |
| **Solidify** | modificatore di Blender che dà spessore a una superficie sottile | mantello, maniche, gonna, lamelle degli spallacci |
| **Bevel** (smussatura) | modificatore di Blender che arrotonda gli spigoli | borsello |
| **Ray casting / BVH** | si lancia un raggio contro la mesh (indicizzata in un albero di volumi) per trovare il punto della superficie | lacci, cuciture e diadema appoggiati sulla superficie |
| **Base mesh** (corpo base) | corpo neutro su cui si costruiscono e si indossano tutti i vestiti | corpo dell'elfa di Blender |
| **Layered clothing** (vestiti a strati) | i capi sono pezzi separati, a strati (intimo, abiti, accessori), che si mettono e si tolgono | guardaroba dell'elfa |
| **Body masking** (regioni nascoste) | le parti del corpo coperte da un capo si nascondono, così non bucano la stoffa | `nasconde` / `scegliVisibili` |
| **Rigid skinning** (marionetta) | ogni pezzo segue un solo giunto, senza deformarsi | tutti i personaggi; la gonna dell'elfa di Blender divisa sui giunti delle cosce |
| **LatheGeometry** (tornitura) | solido ottenuto ruotando un profilo | lanterne |
| **Extrude** (estrusione) | solido ottenuto spingendo una sagoma 2D | insegne, ponte |
| **Instancing** (`InstancedMesh`) | migliaia di copie della stessa geometria in una chiamata | erba, fiori, foglie, canne |
| **Static batching** (`bake()`) | unione delle mesh statiche per materiale | tutto il mondo statico |
| **Vertex colors** | colore memorizzato nei vertici | terreno, fiori istanziati |
| **Rumore a più scale (value noise / fbm)** | variazione naturale sovrapponendo rumori di dimensioni diverse | terreno, texture |
| **Greedy meshing + AO voxel** | (versione voxel Runess) unione delle facce uguali e occlusione per vertice | non usato nello stile attuale |
