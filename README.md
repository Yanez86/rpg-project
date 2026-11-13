# rpg-project

Motore e grafica di un gioco di ruolo fantasy con l'estetica di **Valfiorita sotto la pioggia**: pixel-art 3D, materiali veri e usurati, pioggia, nebbia a strati, finestre calde e righe da schermo.

## Struttura

| Percorso | Contenuto |
|---|---|
| `engine/src/` | **Il motore, diviso in moduli ES**: texture, materiali, oggetti, case, vegetazione, terreno, acqua, effetti, post-processing, controlli |
| `engine/demo/` | Demo "Borgo del Ponte" costruita solo con i moduli (`#notte` per la notte) |
| `engine/test/` | Prova di fumo in Node (`npm test`) |
| `docs/motore.md` | Guida ai moduli: come si compone una scena, cosa esporta ogni modulo |
| `docs/estetica.md` | **La bibbia grafica**: principi, palette, texture, materiali, luce, post-processing, prestazioni |
| `docs/oggetti.md` | Ricette degli oggetti: esterni (case, lanterne, insegne, panchine, alberi, fiori, ponte, terreno, acqua, fumo) e interni (camino, lampadario, tavoli, bancone, cucina, scala, letto…) |
| `docs/tecniche.md` | Glossario delle tecniche con i loro nomi |
| `docs/errori-noti.md` | Trappole tecniche già incontrate |
| `reference/valfiorita-pioggia.html` | Scena di riferimento, giorno di pioggia (stile definitivo) |
| `reference/valfiorita-notte.html` | Variante notturna (luci delle case, pozze di luce, coni e aloni) |
| `scene/locanda.html` | **Locanda del Boccale**: interno su due piani (sala con camino e lampadario, bancone, cucina, ballatoio, camera con il letto) a luci soffuse |
| `engine/tools/blender/` | Script di Blender (Python) che modellano i personaggi: `elfa.py` → `engine/assets/elfa.glb` (vedi `docs/motore.md` › Modelli fatti in Blender) |
| `engine/assets/` | Modelli esportati da Blender (`.glb`) |
| `engine/demo/guardaroba.html` | Guardaroba dell'elfa: corpo base, intimo, abiti e accessori da mettere e togliere uno per uno |
| `tools/anteprima.js` | Fotografa una scena con Chromium senza GPU, per vedere il render anche senza rete (vedi `docs/errori-noti.md`) |
| `reference/build/` | Script con cui sono state generate le scene (vedi il README lì) |
| `.claude/skills/scena-estetica/` | Skill per Claude: applica queste regole quando si creano scene o oggetti |

Le scene di riferimento e la locanda sono file HTML autonomi: si aprono in un browser e caricano Three.js r128 da CDN. Nella locanda i pulsanti in basso a destra portano in sala, in cucina, sul ballatoio e nella camera.
La demo del motore usa moduli ES: va servita via HTTP (per esempio `python3 -m http.server -d engine`, poi apri `/demo/`).
