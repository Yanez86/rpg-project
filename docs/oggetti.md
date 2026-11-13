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
