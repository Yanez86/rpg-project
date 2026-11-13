# Estetica di gioco — la "bibbia grafica"

Regole ricavate dalla scena di riferimento **Valfiorita sotto la pioggia** (`reference/valfiorita-pioggia.html`).
Valgono per ogni scena, oggetto e shader del gioco. Quando una regola e un'idea nuova sono in conflitto, vince la regola, a meno che non la si cambi qui.

L'obiettivo in una frase: **un borgo fantasy reale, bagnato e vissuto, in pixel-art 3D**. Il riferimento visivo è un villaggio in pixel/voxel sotto la pioggia: tetti di tegole, finestre arancioni accese, vegetazione fitta, nebbia a strati e righe orizzontali da schermo.

---

## 1. Principi (cosa rende "vivo" e non "cartoon")

1. **Dettaglio a ogni scala** (*frequenza del dettaglio*). Nessuna superficie grande e liscia: ogni materiale ha una struttura leggibile da vicino (tegole, assi, conci, fili d'erba) e una variazione da lontano (macchie, sporco, toni).
2. **Gerarchia dei valori.** Si usa tutta la scala, dal quasi nero (sotto le gronde, negli incavi) al chiaro (cielo, acqua che cade, finestre). Nessun oggetto deve essere bianco pieno e grande: "mangia" la scena.
3. **Palette di materiali veri, con accenti saturi pochi e distribuiti.** Il colore saturo è riservato a finestre accese, stendardi, fiori, lanterne e insegne.
4. **Variazione di tinta (hue shifting).** Ogni pixel di texture vira un po' verso il caldo o il freddo. Mai "grigio × un colore".
5. **Usura (weathering) ovunque.** Sporco che sale da terra, muschio alla base, colature verticali, grana di sporco.
6. **Occlusione ambientale.** Angoli, incavi, contatti con il terreno e sotto-gronda sono più scuri. Gli oggetti devono sembrare appoggiati e incastrati, non incollati.
7. **Silhouette complesse.** Niente sfere, coni o cilindri "nudi" come forma finale. Alberi ramificati, chiome frastagliate, fiori modellati, insegne sagomate.
8. **Prospettiva aerea a strati.** La nebbia separa i piani: ogni strato lontano è più chiaro e meno contrastato, ma resta una silhouette leggibile.
9. **Tutto si muove un poco.** Vento sulle foglie, insegne e lanterne che dondolano, pioggia, gocce dalle grondaie, acqua simulata, fumo morbido.
10. **Niente scritte nel mondo.** Botteghe e luoghi si riconoscono da simboli dipinti (insegne), non da testo.

### Da evitare (feedback esplicito dell'autore)

- Look **cartoon / cel-shading**: palette pastello, forme primitive, proporzioni tozze, contorni neri.
- **Effetto PS1** (vertici tremolanti, texture che si deformano). Le righe orizzontali sì, il PS1 no.
- **Fughe tra elementi spesse o curve "morbide"**: le fughe sono sottili e seguono la struttura (vedi §6).
- Cartelli con scritte.
- Un oggetto molto luminoso e grande al centro della scena (es. fontana sovraesposta).

---

## 2. Palette

Tutti i colori passano da `mute()` (desatura del 20%, scurisce un poco). Valori di base, prima di `mute()`:

| Ruolo | Colori |
|---|---|
| Intonaci | `#d9cdb6 #cbbd9f #bfb3a0 #d4c4a4 #c2b8a8 #b8a890` |
| Tetti (ardesia e coppi vecchi) | `#585e66 #4c535a #666b70 #5e5048 #50565c #6a5a4e` |
| Scuri | `#3e3028 #34444c #4e2e24 #3c4634 #46383e #5a4028` |
| Porte | `#4a3424 #3a2a1e #34404a #5a2e24 #2e2620` |
| Travi / legno scuro | `#3a2a20` (listelli finestre `#2a1e16`) |
| Pietra | `#a8a294` (ponte: `#9a968a #8a867c #a8a294 #948e80`, copertine `#b0aa9c`) |
| Ferro battuto | `#242426` / `#2a2a2c` |
| Ottone (ex oro) | `#b08a48`, targhette `#8a7040` |
| Prato (vertex color) | folto `0.36,0.50,0.24` · secco `0.58,0.56,0.32` · terra `0.50,0.41,0.30` · muschio `0.24,0.36,0.20` |
| Erba (ciuffi) | `#5a8a3c #6a9444 #4f7e36 #76a04c` |
| Chiome | `#4a7e36 #5a8c3e #3f7034 #66963f` + toni ×0.72 e schiariti verso `#e8f0a0` |
| **Accenti** | stendardi `#c8302a #b22a34 #d0402a #2a58a8`, oro stendardi `#e0b048`, bandierine `#8a2a24 #a8843a #2f5a5a #34507a #6a2a48 #c8bca0 #4a3a5a` |
| Finestre accese | vetro → `#ffc070` (MeshBasic + texture interno), lampade `#ffb45a #ffd38a` |
| Lanterne di carta | carta `#ff8048`→ texture rosso-arancio, nervature `#4a160e`, nappa `#d84a2a` |

**Regola:** nessun colore primario puro (`#ff0000`, `#3f7fd9`, ecc.) su superfici grandi. I saturi stanno solo su superfici piccole e ripetute.

---

## 3. Texture: pixel-art dipinta pixel per pixel

- Generate in codice (`pix(S, fn)`): canvas `S×S`, filtro **Nearest** in ingrandimento, mipmap in riduzione.
- Dimensioni tipiche: 32 (dettagli), 64 (pietra, intonaco), 128 (legno, erba, ciottoli).
- La funzione restituisce un grigio, e il colore arriva dal materiale. **Ma ogni pixel grigio riceve automaticamente l'hue shift:**
  ```js
  t  = (hn(X>>2,y>>2,91)-0.5)*0.24 + (hn(X,y,92)-0.5)*0.08;  // caldo/freddo a blocchi 4px + per pixel
  gq = (hn(X>>3,y>>3,93)-0.5)*0.12;                           // verde a blocchi 8px
  r*=1+t; g*=1+gq; b*=1-t;
  ```
- Il rumore è un hash deterministico (`hn(a,b,seed)`). **Non usare il generatore casuale della scena dentro le texture**, altrimenti si sposta il layout del mondo.

### Ricette delle texture principali

| Texture | Regole |
|---|---|
| **Tegole** (`tilePix`) | file da 8 px (circa 10 cm); riga 7 = ombra netta (×0.20), riga 6 = semiombra (×0.48), riga 0 = bordo chiaro (×1.3); fuga verticale ×0.5; file sfalsate di 4 px; tinta per tegola (più blu / verde / bruna, ±15%); 3,5% di macchie di muschio |
| **Legno** (128 px) | 6 assi di larghezze diverse (0,22,38,61,80,104,128); una **giunta di testa** per asse a un'altezza casuale; venatura sinusoidale che **gira attorno ai nodi**; nodi scuri con alone; crepe lunghe; due chiodi ai lati di ogni giunta; bordo chiaro consumato; circa 30% delle assi ingrigite |
| **Pietra** | corsi di 16 px, blocchi da 24 px sfalsati di 12; fughe a 85; blocchi ±55 di luminosità; muschio verde nelle fughe basse |
| **Ciottoli** | 18×12 px sfalsati, fughe a 70, bordo superiore chiaro |
| **Intonaco** | base chiara con macchie a 16 px; scurimento negli ultimi pixel in basso; crepe e macchie rade |
| **Erba** (`grass2`, 128 px) | fili verticali sfalsati per colonna (blocchi di 4 px), punte chiare, 5% di buchi scuri, trifogli chiari, sassolini |
| **Foglie** (`leaf`, 32 px) | 20% di buchi scuri, 12% di foglie chiarissime, resto medio: alta frequenza |
| **Corteccia** | solchi verticali ondulati, macchie scure; betulla: bianca con lenticelle nere orizzontali |
| **Vetro finestra** (16 px) | interno caldo più acceso al centro, tende scure ai lati, piccole ombre di oggetti |
| **Foglie con trasparenza** (card, 64 px RGBA) | dipinte con un rng locale; quercia ≈190 foglie 2–3 px con highlight in alto a sinistra e ombra in basso a destra, rametti; betulla 120 foglie piccole giallo-verdi; salice a fili verticali; abete a fronda con aghi diagonali; fiorito 70% petali |
| **Insegne** (32×24) | fondo di legno scuro con venatura e scrostature, filetto dorato, simbolo con alpha a soglia (pixel netti) |

---

## 4. Materiali

- Base: `MeshLambertMaterial` (economica, va bene con il cielo coperto). Solo la versione notte usa `MeshPhongMaterial` per le luci puntiformi per pixel.
- **Usura (weathering)** iniettata con `onBeforeCompile` in **tutti** i materiali opachi del mondo (funzione `wear()`). Lavora sulla posizione nel mondo, così è continua tra oggetti diversi:
  - sporco dal suolo: ×0.55 a terra → ×1 a 1,5 m (con rumore);
  - muschio verdastro sulle facce verticali basse (`vec3(0.8,0.93,0.74)`);
  - colature verticali: colonne di circa 14 cm lungo il muro, il 28% con colatura, più scure in alto e sfumate in basso;
  - grana di sporco a blocchi di circa 7 cm (`floor(pos*14)`) e macchie più larghe sulle facce orizzontali.
- **Canale alpha del render target = maschera dei riflessi (SSR).** Il valore di `opacity` di un materiale *non trasparente* finisce nell'alpha:
  - `< 0.6` → acqua, pozzanghere, solchi bagnati (riflesso forte 0,8);
  - `< 0.75` → selciato bagnato della piazza (0,42);
  - `< 0.95` → tetti e sentieri (0,2);
  - `1.0` → nessun riflesso.

  **Regola:** ogni materiale con alphaTest (foglie, edera) deve forzare `diffuseColor.a = 1.0` dopo l'alpha test, altrimenti le mipmap creano riflessi fantasma.
- Le luci (finestre, lampade, lanterne) sono `MeshBasicMaterial` caldi, con valore alto, così il bloom le prende.

---

## 5. Luce e atmosfera

### Giorno di pioggia (scena base)
- Nebbia `FogExp2(#97a29a, 0.03)`, cielo a cupola con nuvole in shader dello stesso colore.
- `Hemisphere(#c8d0c8 / #4a5044, 0.95)`, `Ambient(#b8c4bc, 0.18)`, sole debole `#dfe4dc 0.28` con ombre PCFSoft.
- Pioggia: 1700 segmenti, schizzi a terra, gocce dalle grondaie (320), pozzanghere che si increspano.

### Notte di pioggia (`reference/valfiorita-notte.html`)
- Nebbia `#26343a 0.034`; emisfero `#5a6e88/#1a1c1a 0.32`; luna `#8aa4d0 0.16`.
- Le **finestre devono "buttare" luce fuori**:
  1. **light culling**: da 2 a 8 PointLight vere (il numero dipende da `MAX_FRAGMENT_UNIFORM_VECTORS`), assegnate a ogni frame alle sorgenti più vicine;
  2. **light decal / pozze di luce**: quad additivi a terra davanti a ogni finestra e lampione;
  3. **coni volumetrici finti** che escono dalle finestre;
  4. **halo** additivi attorno alle sorgenti;
  5. bloom più forte (soglia 0,36, mix 0,95);
  6. pioggia e banchi di nebbia tinti d'arancio vicino alle luci.
- Cielo notturno: nuvole basse illuminate da sotto dal bagliore del borgo.

### Strati lontani
- Tre anelli di pareti di roccia boscose (raggi 56, 74 e 96 m). Hanno materiale proprio, già mescolato al colore della nebbia (0,42 → 0,6 → 0,76) e con una foschia di valle alla base.

---

## 6. Geometria e proporzioni

- **Scala reale**: porta circa 0,95×1,9 m, finestra 0,88×1,1 m (vetro) con griglia 3×3 di listelli, seduta della panchina a 0,45 m, parapetto a 0,55 m, tegole di circa 10 cm.
- **Fughe e giunzioni**: sottili (circa 2,5 cm), scure, e **seguono la struttura** (bordi dei blocchi, assi, conci), mai curve morbide sopra la geometria.
- Ogni oggetto composto da **parti separate leggibili**: doghe distinte, conci distinti, catenelle ad anelli, nervature delle lanterne.
- Mesh statiche unite per materiale (`bake()`); gli oggetti animati (insegne, lanterne, acqua, particelle) restano fuori dall'unione.
- **Attenzione**: `bake()` conserva solo `position`, `normal` e `uv`. Mesh con colori per vertice (terreno, fiori istanziati) vanno aggiunte direttamente alla scena.

---

## 7. Post-processing (ordine)

1. Render della scena in un render target con **DepthTexture** (l'alpha è la maschera dei riflessi).
2. **SSAO** (10 campioni, raggio 0,6 m, normale ricostruita dalla profondità, sfuma tra 18 e 60 m) × 0,85.
3. **SSR**: ray-march in view space, 40 passi + 5 di raffinamento, normale increspata dalle gocce, Fresnel.
4. **Foschia bassa** (height mist) sotto gli 8 m.
5. **Bloom**: soglia luminanza 0,6→0,95 (notte 0,36→0,85), blur separabile a ¼ di risoluzione, mix 0,55 (notte 0,95).
6. **Grading**: −8% saturazione, curva S (0,35 + 0,2), neri appena sollevati (`c*0.97+0.012`).
7. **Scanlines** come nell'immagine di riferimento: 1 riga su 3 ×0,72, le altre ×1,05, più una grana leggera. Pixel ratio ≤ 1,5.

---

## 8. Prestazioni (mobile prima di tutto)

- Pixel ratio ≤ 1,5; antialias spento (lo fa la pixel-art).
- Particelle e vegetazione minuta con **InstancedMesh** (`frustumCulled=false` se le istanze sono sparse).
- Foglie su card con alphaTest, senza ombre (`castShadow=false`).
- Massimo 8 PointLight e solo per pixel; controllare il limite di uniform del dispositivo (vedi `docs/errori-noti.md`).
