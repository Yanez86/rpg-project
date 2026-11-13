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

## Abitante — `villager()`
- Giunti: `anca`, `busto`, `collo`, `testa`, `mantello`, `spallaS/D`, `gomitoS/D`, `cosciaS/D`, `ginocchioS/D` (S = sinistra = +x).
- Altezza circa 1,75 m. Tunica con gonnella, cintura con fibbia, tracolla e bisaccia, mantellina e mantello che ondeggia, pantaloni, stivali con risvolto.
- Volto dipinto 16×16 (frangia, sopracciglia, occhi, naso, bocca, barba facoltativa), naso e orecchie in rilievo.
- Varianti casuali: carnagione, capelli, colori di tunica, mantello e pantaloni, barba, cappuccio o cappello.
- Clip: `fermo` (respiro, si guarda attorno), `cammina` (1 s), `corre` (0,62 s, busto in avanti, gomiti piegati), `saluta`.

## Gatto — `cat()`
- Giunti: `corpo`, `testa`, `orecchioS/D`, `zampaAS/AD/PS/PD` con `gambaAS/AD/PS/PD`, coda in 6 anelli `coda0…coda5`.
- Pelo tigrato in pixel-art (rosso, grigio, nero con petto bianco, crema), ventre e muso chiari, occhi con pupilla a fessura, "M" sulla fronte, baffi, orecchie con l'interno rosa.
- Clip: `fermo` (coda che ondeggia a S, orecchio che scatta), `cammina` (passo laterale: posteriore e anteriore dello stesso lato in sequenza), `trotta` (diagonali insieme), `seduto`.

## Drago — `dragon()`
- Scala: testa a circa 8,7 m (cinque volte l'abitante), corpo lungo circa 7 m, apertura alare circa 17 m.
- Giunti: `corpo`, `collo0…collo5`, `testa`, `mascella`, `coda0…coda9`, `zampaAS/AD/PS/PD`, `gambaAS/AD/PS/PD`, `piedeAS/AD/PS/PD`, `alaS/D`, `avambraccioS/D`, `manoS/D`, `ditoS1…4` e `ditoD1…4`.
- **Forme organiche con il loft** (`characters/loft.js`): ogni pezzo è una sezione ellittica che scorre lungo un asse cambiando larghezza e altezza, con un rigonfiamento a metà per i muscoli. Niente parallelepipedi: corpo con fianchi, ventre e petto; anelli di collo e coda affusolati che si sovrappongono; cosce muscolose; testa con cranio e muso in un solo pezzo.
- Scaglie embricate in pixel-art sopra, placche del ventre sotto (secondo gruppo di materiale del loft).
- Cresta dorsale di spine dalla testa alla punta della coda; coda che si assottiglia e finisce a losanga.
- Testa con cranio e muso affusolato, arcate sopraccigliari, occhi ambra a mandorla con palpebra, narici, zanne più lunghe davanti, lingua, due paia di corna ricurve in quattro segmenti, frangia di spine sulle guance.
- Zampe in tre segmenti (quelle posteriori digitigrade), piede con tre dita in avanti e uno sperone dietro, ognuno col suo artiglio ricurvo; muscoli di spalle e cosce attaccati al corpo.
- Ali: omero, avambraccio, mano con artiglio, quattro dita. La **membrana** è una mesh ricalcolata a ogni frame dalle posizioni delle ossa (`update()`), con il bordo d'uscita a festone. In Godot va rifatta come mesh con scheletro (skinning).
- Varianti: cremisi, verde bronzo, ardesia, nero.
- Clip: `fermo` (respiro lento, collo e coda che ondeggiano, ali chiuse), `cammina` (2,4 s, passo laterale), `ruggisce` (si impenna, apre la mascella e le ali), `vola` (battito d'ali, zampe raccolte, si alza di circa 4 m).
