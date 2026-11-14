# Ricette degli oggetti

Ogni ricetta descrive **di quali parti è fatto** l'oggetto e **quali dettagli non possono mancare**. L'implementazione di riferimento è in `reference/valfiorita-pioggia.html` (il nome della funzione è indicato per ogni ricetta).

Regole comuni: proporzioni reali, parti separate, materiali con usura, nessuna scritta, almeno un dettaglio di "vita vissuta" (foglie cadute, muschio, sporco, un pezzo storto).

---

## Case — `timberHouse`, `roundHouse`, `tallHouse`, `houseDetails`
- Zoccolo in pietra, piano superiore a graticcio sporgente con travi scure e controventi diagonali.
- Tetto a due falde in tegole d'ardesia con colmo; comignolo in pietra con cappello e **fumo morbido**.
- **Finestre**: telaio scuro, vetro caldo con texture d'interno, **griglia 3×3 di listelli**, architrave, davanzale chiaro, scuri a volte; fioriera con fiori modellati, cespuglio e rametti che pendono.
- Davanti alla porta: **stendardi di stoffa** (rossi o blu) con emblema e frange dorate, vasi con cespuglio e fiori, casse, edera sui muri, aiuole.
- **Lanterna di carta** appesa a un braccio (vedi sotto); **insegna appesa** sulle case della piazza.
- Gocce dalle grondaie: i punti di gronda sono restituiti da ogni tipo di casa (`eaves`).

## Lanterna di carta — `paperLantern`
- Corpo tornito (**LatheGeometry**, 14 punti di profilo, 20 spicchi) alto circa 0,44 m, con profilo `0.055 + 0.135·sin(π(0.06+0.88t))^0.8`.
- Texture di carta: più chiara al centro (la candela), pieghe orizzontali ogni 6 px, cuciture verticali, fascia dorata, emblema astratto.
- 5 **nervature** scure di bambù (tori), tappi di legno sopra e sotto con bordo dorato, anello di gancio, cordino.
- **Nappa**: perlina dorata + 6 fili rossi divergenti. Dondola con due seni sfasati.

## Insegna appesa — `hangSign`, `iconTex`, `boardGeo`
- **Staffa di ferro battuto**: piastra a muro, braccio orizzontale, tirante obliquo, 3 riccioli (tori parziali), punta decorativa.
- **Due catenelle** di 5 anelli alternati di 90°, con gancio.
- **Tavola sagomata** con gli angoli alti scavati a quarto di cerchio, estrusa e smussata, con traversa in cima.
- **Simbolo dipinto** (niente testo): mela, rocchetto, vaso, ampolla, pagnotta, fiore, lanterna, boccale, incudine, chiave, pesce, scudo. Su fondo di legno scuro con venatura, scrostature e filetto dorato.
- Sulle case la staffa è **perpendicolare al muro**; sulle bancarelle è montata sul palo e sporge di lato.
- Oscilla attorno all'asse del braccio (`rotation.order='YXZ'`).

## Panchina — `bench`
- 3 **fianchi in ghisa** (sinistro, centro, destro): gambe anteriore e posteriore, montante inclinato dello schienale, traversa sotto le doghe, traversa bassa, piedini, ricciolo tra le gambe.
- Braccioli in ghisa con riccioli e rivestimento in legno.
- **5 doghe** di seduta separate da fessure, tinte diverse, una leggermente imbarcata; 3 doghe di schienale inclinate.
- Bulloni scuri su ogni appoggio, targhetta d'ottone, foglie bagnate sopra e attorno.

## Alberi — `tree`, `branch`, `cluster`, `fir`
- **Ramificazione ricorsiva**: ogni ramo è disegnato in 2 tratti con una piega casuale a metà (nodosità); i figli ruotano attorno a un asse casuale, con una spinta verso l'alto, accorciati e assottigliati. Radici che affiorano alla base.
- **Chiome su card**: gruppi di 5–6 piani incrociati con texture di foglie trasparenti + un nucleo scuro opaco. Vento nel vertex shader, più forte in alto.
- Specie (parametri in `SPECIES`):

| Specie | Carattere |
|---|---|
| Quercia | tronco tozzo e nodoso, 3 livelli, rami larghi, chioma folta e scura |
| Betulla | alta e sottile, corteccia bianca con segni neri, rami verso l'alto, foglioline chiare |
| Salice | vicino all'acqua, rami che si piegano, fronde lunghe che pendono dalle punte |
| Abete | tronco dritto, palchi ogni 0,32–0,46 m con fronde pendenti più lunghe in basso, punta |
| Fiorito | basso e contorto, petali rosa spento e bianchi (da qui cadono i petali animati) |
| Secco | quasi spoglio, pochi ciuffi ingialliti |

## Fiori — `FLOWER_GEO`, `flower`, `flowerBed`
- Ogni fiore = **stelo curvo in 3 tratti** + foglie + petali + bottone, come geometrie separate (petali tintabili).

| Specie | Forma | Colori |
|---|---|---|
| Margherita | 12 petali a raggiera inclinati, bottone giallo schiacciato | bianco, crema, lilla chiaro |
| Tulipano | coppa di 6 petali su due giri, foglie a lama | rosso, arancio, giallo, rosa |
| Campanula | stelo arcuato con 3 campanelle pendenti | blu-viola |
| Papavero | 4 petali larghi a coppa, centro quasi nero | rosso |
| Lavanda | spiga di 11 boccioli a spirale | viola |

- Nei prati sono **istanziati** e crescono **a chiazze della stessa specie** (85%) con qualche intruso.

## Ponte in pietra — blocco "ponte in pietra ad arco ribassato"
- Corpo estruso dal profilo laterale (strada sopra, arco ribassato parabolico sotto).
- **Conci a raggiera** sulle due facce (15), profondità alternate, **chiave di volta** più grande e sporgente.
- Cornice sporgente sotto il parapetto; **parapetti** a corsi con **copertina** chiara; cordolo interno.
- **Lastricato** in file di lastre di larghezza variabile e toni diversi.
- Pilastrini alle testate con cappello e sfera; **muri d'ala** che si aprono verso le sponde.
- Erba tra le pietre, edera che pende, sassi alla base nell'acqua.

## Terreno — blocco "isola" + "sottobosco"
- Mesh suddivisa (150×150) con **colori per vertice** da rumore a 3 scale: prato folto, erba secca, muschio (più vicino al fiume), terra battuta attorno a piazza e sentieri.
- Ondulazioni **solo verso l'alto** (così nulla resta sospeso), piatto vicino a piazza, sentieri e fiume.
- Sentieri: piano di terra + **due solchi delle ruote bagnati** (riflettono) + sassi lungo i bordi.
- Sottobosco: felci (fronde a raggiera), funghi a gruppetti, massi con cappello di muschio, foglie cadute (istanze), sassolini, canne lungo il fiume con pannocchie.

## Acqua — `Sim`, `surface`, `ribbon`
- **Heightfield simulato** (equazione d'onda) per vasche e fiume, con gocce di pioggia; superficie con quantizzazione a pixel.
- Cascate e veli d'acqua: **ribbon** con strisce che scorrono; colori smorzati (mai bianco pieno: `lite #b4c4bf`).
- Pozzanghere sul selciato con riflesso e increspature.

## Fumo e nebbia — `softSys`
- **Particelle morbide a billboard** istanziate con texture fbm: fumo dei comignoli (12 per camino), 40 banchi di nebbia che derivano, nebbiolina di cascata e fontana.

## Personaggi a marionetta — `characters/puppet.js`
- Corpo fatto di **pezzi rigidi** appesi a **giunti** con nome (niente pelle che si deforma): come una marionetta.
- Le animazioni sono **clip di keyframe** (`makeClip`) campionate da funzioni del tempo: si esportano in glTF e in Godot diventano animazioni dell'`AnimationPlayer` con lo stesso nome.
- Materiali senza usura (l'usura è legata al mondo), texture pixel-art a colori pieni per volti e pelo.
- Guardano verso +z, i piedi toccano y=0. Nomi di giunti e clip in italiano.

## Umanoidi: abitante ed elfa — `villager()`, `elf()`
- Stesso scheletro e stesse clip: giunti `anca`, `busto`, `collo`, `testa`, `mantello`, `spallaS/D`, `gomitoS/D`, `cosciaS/D`, `ginocchioS/D` (S = sinistra = +x). Clip `fermo`, `cammina`, `corre`, `saluta` generate da `villagerClips({ hip, stride, arm })` con l'altezza dell'anca del personaggio.
- **Forme morbide con il loft** (asse verticale): bacino e gonna che si allarga, busto con vita, petto e spalle, cintura con fibbia, braccia con manica che si allarga al polso, mano a muffola con pollice, cosce e polpacci con un leggero muscolo, stivale con gambale, risvolto e piede.
- **Testa modellata** (`shapeHead`): una sfera deformata con funzioni morbide, senza modellazione a mano: mascella e mento che si stringono (di più nell'elfa), nuca, tempie, piano del viso raccordato, arcate sopraccigliari, orbite, zigomi, guance appena incavate, naso con le ali, labbra, solco sotto il labbro, mento. I tratti scolpiti coincidono con quelli dipinti nel volto (texture 64×32 che avvolge la sfera, viso sul davanti).
- **Capelli in un unico pezzo** (`hairGeometry`): una sfera ad alta risoluzione che segue la forma della testa; sul viso la superficie rientra con un bordo netto (attaccatura pulita, anche dietro le orecchie e sotto il mento); ciocche in rilievo che scendono, volume morbido sulla calotta, punte irregolari. Abitante: corti, che si aprono sulla nuca. Elfa: lunghi dietro e ai lati (circa mezzo metro), che scendono un poco staccati dalla schiena. Barba in volume con i baffi a parte; orecchie a conchiglia con l'interno più scuro; per l'elfa orecchie a lama con l'incavo e orecchino.
- Mantellina a cono sulle spalle e **mantello curvo** (spicchio di cilindro) appeso al giunto `mantello`.
- **Anatomia** (con il loft, misure in `VILLAGER`/`ELF`): busto con curva lombare, costato e petto; deltoidi; bicipite e muscolo dell'avambraccio; polso sottile; mano a muffola con il pollice (volutamente semplice); coscia con il quadricipite, rotula, polpaccio.
- **Vestiti**: orlo della gonna con una fascia, cintura con fibbia e borsello, polsini; stivali con lacci incrociati e suola.
- **Abitante**: circa 1,75 m, anca a 0,93 m; collo a V e tre bottoni sulla tunica; tunica di lana, tracolla e bisaccia, varianti casuali di carnagione, capelli, vestiti, barba, cappuccio o cappello.
- **Elfa**: circa 1,9 m, anca a 1,0 m; tutto più snello (busto ×0,84, braccia ×0,8, gambe ×0,86), gambe e collo più lunghi, testa un po' più piccola. **Figura femminile accentuata con misura**: vita stretta (0,11), fianchi più larghi (0,21), petto modellato nella stessa sezione del busto (due rigonfiamenti morbidi del loft, `bumps`, non pezzi separati appoggiati sopra), corsetto di cuoio allacciato sul davanti, colletto alto, spallacci a lamelle d'argento, maniche a campana. Abito lungo di stoffa fine che si allarga, bracciali di cuoio, stivali alti, mantello più lungo, capelli lunghi sulla schiena, orecchie a punta, diadema d'argento con gemma, volto con occhi a mandorla, ciglia e labbra. Passo più lungo e braccia che oscillano meno. Quattro palette (verde, avorio, viola, ruggine).

## Elfa modellata in Blender — `elfa3d()` (`characters/elfa3d.js`, `engine/assets/elfa.glb`)
- È l'elfa di `elf()` rifatta in Blender con più dettaglio dallo script `engine/tools/blender/personaggi.py --modello elfa` (Python di Blender). Si carica una volta (`await loadElfa3d()`), poi `elfa3d()` è sincrona come `elf()` e restituisce `{ root, anim }`.
- **Pilastri tenuti uguali** (li controlla `test/modelli3d.mjs`): marionetta a pezzi rigidi; stessi giunti con lo stesso genitore, nella posizione data dalle misure del modello (`userData.misure` del nodo `elfa`), senza rotazioni a riposo, quindi le clip di `villagerClips()` vanno senza modifiche; piedi a y = 0; guarda verso +z; quattro palette, carnagioni, capelli e occhi da `elfLook()`; materiali da `humanMats()`, senza usura; cel shading con `setToon()`.
- **Proporzioni (richiesta dell'autore, confrontate con una foto di riferimento di una modella in piedi)**: gambe più lunghe e busto più corto dell'elfa del motore (anca 1,06 m, coscia 0,50, gamba 0,40, busto 0,46), spalle più strette (giunto a 0,165 m dal centro) e più basse che scendono morbide dal collo al braccio (trapezio, più pieno dietro), collo più lungo (0,07), braccia più lunghe (0,34 + 0,32, la mano resta della sua misura), vita meno stretta (0,125) e cassa toracica un po' più stretta (0,16). Altezza 1,88 m. In frazioni dell'altezza: cavallo 0,49, ginocchio 0,27, punta delle dita circa 0,40, larghezza delle spalle 0,22 (riferimento: circa 0,47, 0,27, 0,38, 0,21). Lo script disegna busto e braccia nelle misure di partenza e li allunga o accorcia in altezza (`scala_y`), tranne spallacci e mano.
- **Il file porta solo forme e nomi dei materiali** (`abito`, `gonna`, `mantello`, `calze`, `cuoio`, `cintura`, `metallo`, `bordo`, `pelle`, `pelle_ombra`, `capelli`, `volto`, `gemma`): colori e texture pixel-art li rimette il motore, così il modello resta nello stile e cambia palette.
- **Forme**: le stesse sezioni del loft dell'elfa, raccordate con curve **Catmull-Rom** e con molte più righe; la spalla tonda fa parte del braccio (niente sfera appoggiata); petto dentro la sezione del busto; testa e capelli con le stesse funzioni di `shapeHead`/`hairGeometry` (portate in Python) e la stessa mappatura uv, più ciocche fini.
- **Dettagli in più**: corsetto con le stecche in rilievo, canale e lacci incrociati veri con occhielli e fiocco, profilo dorato; cintura con fibbia a cornice e puntale; **baschina** scura (colore del mantello) con pieghe e orlo dorato; borsello smussato con patta, bottone e passanti; gonna con pieghe che si aprono verso l'orlo, orlo ondulato con fascia e riga ricamata; spallacci a tre lamelle bordate d'oro con i ribattini; maniche a campana con pieghe e l'orlo che scende dietro; bracciali allacciati sull'esterno; mani semplici ma fini (palmo stretto, dita unite appena piegate verso il palmo con i solchi accennati, pollice piccolo lungo l'indice); stivali con il risvolto a punta sul davanti, lacci e occhielli, cucitura laterale, punta affusolata, suola e tacco; mantello con pieghe, orlo a festoni, profili e due fermagli con gemma; orecchie a lama con l'incavo scuro; orecchini ad anello con goccia; diadema a nastro che segue capelli e fronte (proiettato sulla superficie) e scende a punta con la gemma incastonata, foglioline e due gemme piccole.
- **Viso più armonioso** dell'elfa del motore (richiesta dell'autore: era "schiacciato"): testa un po' più stretta e alta (`HS`), metà bassa del viso più lunga, mascella che si stringe solo verso il mento (le guance restano piene), mento piccolo un po' in avanti, profilo meno appiattito (fronte, naso e mento escono), attaccatura dei capelli e diadema più alti per lasciare la fronte, guance appena incavate.
- **Capelli (sempre in un pezzo solo)**: frangia a ciocche appuntite e asimmetriche (`bang_drop`: l'attaccatura scende a punta sulla fronte e fra una punta e l'altra si vede la fronte), due ciocche che incorniciano il viso davanti alle orecchie e scendono a punta fino al colletto, più volume sulla calotta, punte a ciuffi dietro (`tri`). I capelli lunghi restano sotto il mantello come nell'elfa del motore.
- **Motivo a foglia** (punte, come il risvolto degli stivali): baschina a otto linguette, orlo del mantello a cinque punte, orlo delle maniche a punte; **foglia ricamata in oro** al centro della schiena del mantello (contorno, nervatura, venature).
- **Corpetto**: doppio profilo dorato a V dalle spalle alla punta del corsetto, **spilla con gemma** sul davanti del colletto; **bracciale alto** (doppio cerchio dorato) sul braccio sotto gli spallacci.
- **Volto 128×64** (il doppio): stessa disposizione del volto standard, occhi a mandorla con iride, pupilla e riflesso (un pixel più vicini fra loro), ciglia con la coda, sopracciglia arcuate, rossore leggero. Resta pixel-art (`NearestFilter`).
- **Gonna in due metà sui giunti `cosciaS`/`cosciaD`**: camminando seguono la gamba e davanti si apre uno spacco, invece di farsi bucare dal ginocchio. L'attacco è coperto dalla baschina, che resta sull'anca.
- **Dettagli senza contorno**: lacci, occhielli, profili, gemme, fibbie, orli sono in oggetti `<giunto>_dettagli` con la proprietà `noOutline` (in Blender una proprietà dell'oggetto, nel glTF `extras`, nel motore `userData.noOutline`): `setToon` non gli mette il contorno.
- Peso vestita: circa 60 000 triangoli disegnati (l'elfa del motore circa 16 000); il file, con corpo e intimo, ne contiene circa 75 000 (1,8 MB).

## Corpo base e capi (guardaroba) — `vesti()`, `engine/demo/guardaroba.html`
- L'elfa di Blender è scomposta in **strati**: `corpo` → `intimo` → `abiti` → `accessori` / `capelli`. Ogni oggetto ha in `userData` (proprietà dell'oggetto in Blender, `extras` nel glTF): `strato`, `pezzo` (il capo), `regione` (la parte del corpo che occupa), `nasconde` (regioni che il capo copre del tutto), `richiede` (il capo su cui si appoggia).
- **Corpo base**: liscio come un manichino, senza dettagli anatomici; regioni `testa`, `orecchie`, `collo`, `busto`, `bacino`, `braccio`, `avambraccio`, `mano`, `coscia`, `gamba`, `piede`. Ha le stesse sezioni dei vestiti qualche millimetro più dentro (busto 4 mm, cosce e gambe 3 mm); le spalle nude arrivano alle braccia; la cima delle cosce è a cupola e disegna la linea dei fianchi; piedi con tallone, collo del piede e dita accennate (semplici come le mani). Calvo: i capelli sono un capo.
- **Intimo** (primo strato, lino chiaro): `fascia` sul petto, `culotte`, `calze` (scure, fino alla caviglia).
- **Abiti**: `abito` (corpetto con il profilo a V, colletto, maniche e maniche a campana, baschina, gonna in due metà), `corsetto`, `cintura`, `bracciali`, `stivali`, `spallacci`, `mantello`. **Accessori**: `diadema` (richiede i capelli), `orecchini`, `borsello` (richiede la cintura), `spilla` e `bracciali_alti` (richiedono l'abito). **Capelli**: `capelli`.
- **Regola di visibilità** (`scegliVisibili`): un capo si vede se è indossato e c'è ciò che richiede; il corpo si vede sempre; un oggetto con una `regione` si nasconde se un capo di uno strato più alto la `nasconde` (l'abito nasconde busto, braccio e bacino del corpo e l'intimo sotto; gli stivali nascondono gamba e piede, anche le calze). Così la pelle non buca mai la stoffa.
- Uso: `elfa3d({ vesti: ['fascia', 'culotte', 'stivali'] })`, poi `vesti(attore, [...])` per cambiare; `pezziElfa3d()` elenca i capi del modello per strato, `tuttiIPezzi()` è l'elfa completa (quella di prima).
- Il corpo nudo è a pezzi rigidi come tutto il resto: nelle animazioni si vedono le giunture (spalle, anche, ginocchia) come in una bambola articolata. Un corpo continuo richiede lo skinning (pelle che si deforma), che oggi non è un pilastro del progetto.

## Wuxia — `wuxia3d()` (`characters/wuxia3d.js`, `engine/assets/wuxia.glb`)
- Personaggio originale: una donna adulta da romanzo wuxia, senza i tratti dell'elfa. Stesso script (`personaggi.py --modello wuxia`), stesso scheletro e stesse clip (passo un po' più corto), stesso guardaroba a strati.
- **Proporzioni da una foto di riferimento** (donna in piedi di fronte, di profilo e di schiena), in frazioni dell'altezza (circa 1,71 m al cranio, 1,73 con gli chignon): mento 0,87, spalle 0,81, gomito 0,64, cavallo 0,48, punta delle dita 0,44, ginocchio 0,30; spalle larghe 0,22 e fianchi 0,22 (riferimento: 0,88, 0,83, 0,64, 0,49, 0,45, 0,30; 0,21 e 0,21).
- **Tratti femminili accentuati un poco (richiesta dell'autore)**, senza dettagli espliciti: figura a clessidra con la vita sottile (0,112) e i fianchi larghi quanto le spalle, disegnati dalle **cosce piene in alto** (`cosce` 1,13: si allargano i fianchi senza ingrossare le ginocchia); seno più pieno e tondo (`seno` 0,36, metà in un rigonfiamento largo e morbido, `seno_largo`, così di profilo non è a cono); **glutei pieni anche in alto (richiesta dell'autore)**: due volumi tondi con un leggero solco al centro (`glutei` 0,3, `glutei_a`/`_s`, `glutei_solco`), già pieni subito sotto la vita, il punto più pieno a metà altezza e il fondo che si arrotonda verso la coscia (`glutei_k` per le cinque sezioni del bacino; prima erano gonfi in basso e vuoti in alto e sembravano schiacciati). **Schiena (richiesta dell'autore)**: curva accentuata, con le reni che rientrano alla vita (`lordosi` 0,3: rigonfiamento negativo dietro, la vita va un poco avanti e il bacino si inclina, i glutei vanno indietro, `inclina`) senza entrare nel bacino (`lombi_k`), solco della colonna e scapole appena in rilievo (`schiena`). **Fianchi**: il punto più largo in basso, all'altezza dei glutei, con la linea dalla vita che ci arriva curva (`anca_w` per sezione, una sezione in più a metà, `anca_mezzo`) e la cima delle cosce stretta, così non fa spigolo (`cosce_k`). Il corpo resta liscio come un manichino.
- **Viso** (`VISO['wuxia']`): più tondo e morbido dell'elfa (mascella meno stretta, guance piene, zigomi un po' più alti, naso piccolo); orecchie umane (piccola conchiglia con l'incavo più scuro). **Volto dipinto 128×64** con il trucco da film wuxia: sopracciglia sottili a foglia di salice, riga scura sulla palpebra che sale verso la tempia, ombretto rosato, occhi scuri a mandorla con il riflesso, labbra rosse con il labbro di sotto più pieno, rossore.
- **Capelli** (un pezzo solo con gli chignon): frangia dritta e leggera fino alle sopracciglia, due ciocche sottili davanti alle orecchie fino alla mascella, raccolti in alto (i lati sotto le orecchie e la nuca restano scoperti), scriminatura dietro, **due chignon** avvolti a spirale. **Fermagli** (accessorio, richiede i capelli): un fiore a cinque petali su ogni chignon e uno spillone d'oro con la gemma.
- **Intimo** (seta coordinata, profili dorati): **dudou** (pannello sul davanti con la punta sul ventre, teso sopra il seno: non entra nella scollatura; fiore ricamato in oro, lacci al collo e in vita annodati dietro); **brasiliana** (richiesta dell'autore, al posto della culotte di lino): vita bassa (`vita_culotte`), sgambata sui fianchi (`sgambato`), dietro un taglio a V che copre la parte centrale e alta dei glutei e lascia scoperta la parte bassa esterna (`brasiliana`); profilo dorato in vita e sulle sgambature.
- Aspetto casuale (`wuxiaLook()`): carnagione, capelli scuri, occhi, seta del dudou con il suo ricamo (rossa, giada, blu, prugna), fiori, rossetto.

## Gatto — `cat()`
- Giunti: `corpo`, `testa`, `orecchioS/D`, `zampaAS/AD/PS/PD` con `gambaAS/AD/PS/PD`, coda in 6 anelli `coda0…coda5`.
- Pelo tigrato in pixel-art (rosso, grigio, nero con petto bianco, crema), ventre e muso chiari, occhi con pupilla a fessura, "M" sulla fronte, baffi, orecchie con l'interno rosa.
- Clip: `fermo` (coda che ondeggia a S, orecchio che scatta), `cammina` (passo laterale: posteriore e anteriore dello stesso lato in sequenza), `trotta` (diagonali insieme), `seduto`.

## Drago — `dragon()`
- Scala: testa a circa 8,7 m (cinque volte l'abitante), corpo lungo circa 7 m, apertura alare circa 17 m.
- Giunti: `corpo`, `collo0…collo5`, `testa`, `mascella`, `coda0…coda9`, `zampaAS/AD/PS/PD`, `gambaAS/AD/PS/PD`, `piedeAS/AD/PS/PD`, `alaS/D`, `avambraccioS/D`, `manoS/D`, `ditoS1…4` e `ditoD1…4`.
- **Forme organiche con il loft** (`characters/loft.js`): ogni pezzo è una sezione ellittica che scorre lungo un asse cambiando larghezza e altezza, con un rigonfiamento a metà per i muscoli. Niente parallelepipedi: corpo con fianchi, ventre e petto; anelli di collo e coda affusolati che si sovrappongono; cosce muscolose; testa con cranio e muso in un solo pezzo.
- **Pelle dipinta a colori** (64×64, a colori pieni, non grigio tinto):
  - scaglie embricate a ventaglio, ogni fila copre la successiva; luce in alto e ombra in basso, carena centrale, riflesso iridescente sul bordo alto (oro sul cremisi, verde acqua sul bronzo, viola sull'ardesia, rosso sul nero), contorno netto, ombra portata sulla fila sotto;
  - ogni scaglia ha la sua tinta; qualcuna è scheggiata o segnata da un graffio (cicatrici);
  - la texture è dimensionata in metri (`tile: [1.6, 1.6]` nel loft): le scaglie hanno la stessa misura su corpo, collo, coda e zampe (circa 20 cm);
  - **disegno ampio con i colori per vertice**: dorso più scuro, fianchi, chiaro verso il ventre (controombreggiatura), bande scure sul dorso, macchie;
  - ventre a placche larghe con solco scuro e bordo lucido; corna con anelli di crescita ondulati e punta chiara;
  - membrana delle ali con UV a ventaglio: ossa delle dita, venature che si diramano verso il bordo, chiazze traslucide, bordo scuro.
- **Attenzione**: le texture ripetute (`uRep`/`vRep` > 1) devono avere `RepeatWrapping`, altrimenti si allunga l'ultimo pixel e la pelle sembra piatta.
- Cresta dorsale di spine dalla testa alla punta della coda; coda che si assottiglia e finisce a losanga.
- Testa con cranio e muso affusolato, arcate sopraccigliari, occhi ambra a mandorla con palpebra, narici, zanne più lunghe davanti, lingua, due paia di corna ricurve in quattro segmenti, frangia di spine sulle guance.
- Zampe in tre segmenti (quelle posteriori digitigrade), piede con tre dita in avanti e uno sperone dietro, ognuno col suo artiglio ricurvo; muscoli di spalle e cosce attaccati al corpo.
- Ali: omero, avambraccio, mano con artiglio, quattro dita. La **membrana** è una mesh ricalcolata a ogni frame dalle posizioni delle ossa (`update()`), con il bordo d'uscita a festone. In Godot va rifatta come mesh con scheletro (skinning).
- Varianti: cremisi, verde bronzo, ardesia, nero.
- Clip: `fermo` (respiro lento, collo e coda che ondeggiano, ali chiuse), `cammina` (2,4 s, passo laterale), `ruggisce` (si impenna, apre la mascella e le ali), `vola` (battito d'ali, zampe raccolte, si alza di circa 4 m).

## Comparse che passeggiano — `wanderer()`, `eyeHeight()` (`characters/npc.js`)
- Ciclo: sceglie una meta (`pick()`), si gira (max 3,2 rad/s) e cammina con la clip `cammina` a una velocità che corrisponde al passo dell'animazione (abitante 1,35 m/s, elfa 1,45, gatto 0,5 / trotto 1,25); alla meta si ferma da 1,5 a 7 s.
- Ogni tanto la meta si raggiunge di corsa (`run`, `runChance`); il gatto a volte si siede a lungo (`rest: 'seduto'`).
- Se chi gioca si avvicina (2,6 m) si gira verso di lui e saluta; poi non saluta più per 14 s.
- Si scansano tra loro (`others`) e scansano chi gioca; `collide(p)` della scena le tiene fuori dagli ostacoli. Se in 2 s avanzano meno di 0,5 m cambiano meta.
- `eyeHeight(actor)`: altezza degli occhi nella posa di riposo (abitante circa 1,61 m); serve per la camera in prima persona.
- Esempio: `reference/gente-sole.js` (5 abitanti, 2 elfe, 2 gatti in Valfiorita al sole).

---

# Interni — `scene/locanda.html` (Locanda del Boccale)

Regole in più per gli interni: vedi `docs/estetica.md` §9. Le funzioni citate sono in `scene/locanda.html`.

## Struttura della locanda — blocchi "pianta", "muri perimetrali", "tetto visto da dentro"
- Pianta 12×10 m: **sala a doppia altezza** davanti, **ballatoio** e stanze sopra la parte di fondo (piano a 3,0 m), **cucina** dietro il bancone, **nicchia** sotto il ballatoio.
- **Muri con aperture** (`holesSplit`, `wallZ`, `wallX`): strisce verticali tra i bordi dei fori, così funzionano anche due finestre una sopra l'altra; UV proiettate nel mondo (`w:1`) perché la texture continui da un pezzo all'altro.
- **Legno a vista** su ogni muro: montanti 20 cm che sporgono 6 cm, corrente all'altezza del solaio, dormiente in gronda, saette diagonali nelle campate grandi. **Boiserie** (perlinato) alta 0,92 m con cimasa e zoccolino.
- **Solaio**: assito su travetti 12×16 cm ogni 50 cm; travi maestre su pilastri con plinto di pietra e due saette.
- **Tetto visto da dentro**: tavolato, travicelli ogni 0,59 m, due arcarecci, colmo, **capriate** (catena, monaco, puntone, saetta, staffe di ferro con bulloni), timpani intonacati.
- Pavimenti: assi nella sala, **lastre di pietra** (`flag`) in cucina, sul focolare e sulla soglia.

## Finestra vista da dentro — `winIn`
- Foro con la **strombatura** rivestita di legno, telaio verso il filo esterno, vetro 0,88×1,1 m con la **griglia 3×3 di listelli**, davanzale interno, architrave.
- **Scuri interni** aperti contro il muro (doghe, traverse, bandelle). Si tolgono (`nosh`) se toccherebbero un mobile.
- Vetro: shader con la notte dietro (tetti e finestre accese delle case di fronte) e **rivoli di pioggia** che scendono a pixel.

## Porta a doghe — `doorLeaf`, `doorFrame`
- Doghe verticali separate con tinte diverse, **traverse a Z** sulla faccia interna, teste dei chiodi, **bandelle di ferro** con i cardini, anello e saliscendi. Versione piccola (sottoscala) con il solo anellino.
- Stipiti e architrave che sporgono dal muro. L'anta è costruita dal cardine: per aprirla basta ruotare il gruppo.

## Scala, ringhiera e ballatoio — blocchi "scala" e "ringhiera del ballatoio"
- Alzate di 20 cm, pedate di 28 cm con il **naso sporgente** di 3 cm, cosciali, sottoscala chiuso da assi con la sua porticina.
- Pilastro di partenza con cappello e pomo tornito (`FINIAL`), corrimano, **colonnine tornite** (`BALG`) due per gradino.
- Ringhiera del ballatoio alta 1 m: montanti con pomo, colonnine ogni 13 cm, corrimano e traverso basso; due **stendardi** appesi verso la sala.
- Per camminarci: si sceglie il pavimento più alto raggiungibile con un passo (`groundAt`); la parte di scala più alta di un passo fa da muro.

## Camino della sala — blocco "camino"
- Focolare di lastre, **stipiti di conci separati** alternati lunghi e corti, fondo annerito con la piastra di ghisa, **architrave di rovere**, mensola, **cappa** a tronco di piramide (`taper`), canna fumaria fino al tetto.
- Alari con il pomo, **ciocchi** con la corteccia e gli anelli in testa, **letto di brace** che pulsa, cenere, attizzatoio e molle appoggiati, **catasta di legna** accanto.
- Sulla mensola candelieri, brocca e boccali; sulla canna fumaria l'**insegna della locanda** (`boardGeo` + `iconTex`, un boccale) appesa a due catenelle.
- Luce vera con le ombre, messa sul filo dell'apertura: gli stipiti fanno ombra e la luce esce a ventaglio. Fiamme a pixel, alone, pozza di luce a terra, faville.

## Lampadario a ruota — blocco "lampadario a ruota"
- Cerchio di 12 **gavelli** separati con il cerchione di ferro, mozzo con due anelli, 8 raggi rastremati.
- 8 candele su bugie di ferro, 4 catenelle fino a un anello e una catena fino alla catena della capriata.
- Luce vera con le ombre al centro. I pezzi del lampadario **non fanno ombra**, altrimenti sotto compare un cerchio nero.

## Lanterna a olio da muro — `wallLantern`, `lanternBody`
- Piastra, braccio, tirante e ricciolo di ferro battuto, gancio; corpo con 4 montanti, base, 4 vetri caldi (MeshBasic con la fiamma **dipinta nella texture** `LGLASS`), cappello a piramide con collare e anello, serbatoio d'ottone, goccia sotto.
- Variante appesa a una catena (cucina).
- Luce: alone e pozza a terra. La pozza sul muro va tenuta debolissima (vedi `docs/errori-noti.md`).

## Candela — `candle`
- Bugia tornita con l'anello (oppure candeliere o candelabro), fusto con 3 **colature di cera**, stoppino, fiamma a pixel, alone piccolo, pozza di luce sul piano.

## Tavoli e sedute — `trestle`, `table`, `roundTable`, `bench`, `stool`
- **Tavolo a cavalletti** (h 0,76 m): piano di 3 assi separate (quella centrale un filo più alta), cavalletti a lastra con piede e traversa, traversa lunga con i cunei.
- **Tavolino**: piano di 3 assi, 4 gambe, grembiale, traverse basse. **Tavolo tondo**: piano di assi (UV planari), colonna tornita, piede a croce con 4 mensole.
- **Panca** (seduta a 0,45 m): seduta di 2 assi, fianchi a lastra con l'intaglio a V (estrusi), traverse, teste dei tenoni a vista.
- **Sgabello**: seduta tornita con lo spigolo arrotondato, 3 gambe divaricate, 3 pioli.
- Vita vissuta: boccale rovesciato con la **birra versata** (riflette), monete, dadi, pane a metà, macchie sulle sedute.

## Bancone e retrobanco — blocchi "bancone" e "retrobanco"
- Fronte a **specchiature** (montanti, traversi, pannelli rientrati con la bugna), zoccolo scuro, **piano di 2 assi lucide** (maschera dei riflessi 0,9), cornice, **poggiapiedi d'ottone** su mensole, ritorno verso la nicchia, ripiano del barista con le ciotole.
- Sopra: boccali, botticella con la spina sul cavalletto, tagliere con formaggio e coltello, candela, monete, straccio.
- **Lanterne di carta** (`paperLantern`, riusata) appese alla trave con un braccetto di ferro; dondolano un poco.
- Retrobanco: due **botti in mescita** sul cavalletto con le spine d'ottone, 3 mensole su staffe di ferro con bottiglie, orci e piatti in piedi, **boccali appesi** ai ganci, passavivande con un piatto pronto.

## Botte tornita — `barrel`
- LatheGeometry che si gonfia al centro, texture a doghe (`staves`), 4 cerchi di ferro, fondi a tavole, tappo. Si corica (`lie`) per le botti in mescita. Sostituisce la vecchia botte cilindrica dell'esterno.

## Stoviglie e cibo — `tankard`, `plate`, `bowl`, `jug`, `bottle`, `crock`, `bread`, `cheese`, `coins`
- Tutto tornito: boccale di peltro o a doghe con i cerchi, manico a mezzo toro e schiuma; piatto, ciotola, brocca con manico e beccuccio, bottiglia da vino e fiasca col tappo, orcio con coperchio e pomello.
- Pane con 3 tagli, formaggio con la fetta mancante (facce del taglio a parte), monete.

## Cucina — blocco "cucina"
- **Focolare rialzato** di mattoni con il piano di lastre, muri anneriti dietro il fuoco, cappa con la trave, **gru girevole** di ferro con catena e **paiolo** (vapore).
- **Forno a volta** nel muro: fronte di mattoni estrusa con la bocca ad arco, brace dentro, soglia di pietra, mensola con gli orci, sportello e pala appoggiati.
- Tavolo da lavoro con tagliere, coltello, carote, cavolo (sfera deformata), cipolle tornite, ciotola di farina, mattarello; **rastrelliera** di padelle e pentole appesa alle catene; **erbe a seccare** e **trecce d'aglio** ai travetti; scaffali con orci, brocche e pile di ciotole; sacchi; botte dell'acqua con il mestolo; secchio a doghe.

## Camera da letto — blocco "camera da letto"
- **Letto** 2,0×1,4 m: 4 colonne tornite (`POSTG`, testiera 1,3 m, pediera 0,88), testiera a pannelli, **pagliericcio a righe** (`rbox`, texture `tick`), lenzuolo risvoltato, 2 cuscini inclinati, **trapunta a toppe** che ricade sui lati con le onde (`drape`, texture `quilt`) e il suo risvolto, coperta arrotolata in fondo.
- **Cassapanca** con 3 bande di ferro, serratura, maniglie ad anello e una coperta piegata; comodino con candela e libro; **lavabo** con catino (l'acqua riflette), brocca e asciugamano; **tappeto** con le frange; **camino piccolo** nella canna fumaria che sale dalla cucina; mantello appeso; fiori sul davanzale.

## Piccoli oggetti tessili e di contorno — `cloak`, `sack`, `crate`
- **Mantello** appeso al piolo: corpo tornito che si allarga in basso, pieghe verticali, schiacciato contro il muro, cappuccio e collo di lana.
- **Sacco**: icosaedro deformato con un rumore fisso, schiacciato in basso, collo legato con lo spago.
- **Cassa a doghe**: montanti d'angolo e assi separate su ogni lato.
