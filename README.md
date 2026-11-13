# rpg-project

Motore e grafica di un gioco di ruolo fantasy con l'estetica di **Valfiorita sotto la pioggia**: pixel-art 3D, materiali veri e usurati, pioggia, nebbia a strati, finestre calde e righe da schermo.

## Struttura

| Percorso | Contenuto |
|---|---|
| `docs/estetica.md` | **La bibbia grafica**: principi, palette, texture, materiali, luce, post-processing, prestazioni |
| `docs/oggetti.md` | Ricette degli oggetti: esterni (case, lanterne, insegne, panchine, alberi, fiori, ponte, terreno, acqua, fumo) e interni (camino, lampadario, tavoli, bancone, cucina, scala, letto…) |
| `docs/tecniche.md` | Glossario delle tecniche con i loro nomi |
| `docs/errori-noti.md` | Trappole tecniche già incontrate |
| `reference/valfiorita-pioggia.html` | Scena di riferimento, giorno di pioggia (stile definitivo) |
| `reference/valfiorita-notte.html` | Variante notturna (luci delle case, pozze di luce, coni e aloni) |
| `scene/locanda.html` | **Locanda del Boccale**: interno su due piani (sala con camino e lampadario, bancone, cucina, ballatoio, camera con il letto) a luci soffuse |
| `tools/anteprima.js` | Fotografa una scena con Chromium senza GPU, per vedere il render anche senza rete (vedi `docs/errori-noti.md`) |
| `reference/build/` | Script con cui sono state generate le scene (vedi il README lì) |
| `.claude/skills/scena-estetica/` | Skill per Claude: applica queste regole quando si creano scene o oggetti |

Le scene sono file HTML autonomi: si aprono in un browser e caricano Three.js r128 da CDN. Nella locanda i pulsanti in basso a destra portano in sala, in cucina, sul ballatoio e nella camera.
