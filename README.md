# rpg-project

Motore e grafica di un gioco di ruolo fantasy con l'estetica di **Valfiorita sotto la pioggia**: pixel-art 3D, materiali veri e usurati, pioggia, nebbia a strati, finestre calde e righe da schermo.

## Struttura

| Percorso | Contenuto |
|---|---|
| `docs/estetica.md` | **La bibbia grafica**: principi, palette, texture, materiali, luce, post-processing, prestazioni |
| `docs/oggetti.md` | Ricette degli oggetti (case, lanterne, insegne, panchine, alberi, fiori, ponte, terreno, acqua, fumo) |
| `docs/tecniche.md` | Glossario delle tecniche con i loro nomi |
| `docs/errori-noti.md` | Trappole tecniche già incontrate |
| `reference/valfiorita-pioggia.html` | Scena di riferimento, giorno di pioggia (stile definitivo) |
| `reference/valfiorita-notte.html` | Variante notturna (luci delle case, pozze di luce, coni e aloni) |
| `reference/build/` | Script con cui sono state generate le scene (vedi il README lì) |
| `.claude/skills/scena-estetica/` | Skill per Claude: applica queste regole quando si creano scene o oggetti |

Le scene di riferimento sono file HTML autonomi: si aprono in un browser e caricano Three.js r128 da CDN.
