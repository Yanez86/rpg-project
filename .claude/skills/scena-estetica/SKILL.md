---
name: scena-estetica
description: Applica l'estetica del gioco (Valfiorita sotto la pioggia, pixel-art 3D realistica e usurata) quando si crea o modifica una scena, un oggetto, una texture, un materiale o uno shader per rpg-project.
---

# Creare scene e oggetti con l'estetica del gioco

Prima di scrivere codice grafico:

1. Leggi `docs/estetica.md`: principi, palette, texture, materiali, luce, post-processing.
2. Se crei un oggetto, cerca la sua ricetta in `docs/oggetti.md`; se non c'è, segui le regole comuni in cima a quel file e aggiungi la ricetta nuova al file.
3. Leggi `docs/errori-noti.md` per evitare le trappole già incontrate.
4. Usa il motore in `engine/src/` (guida in `docs/motore.md`): importa da `engine/src/index.js` le funzioni esistenti (`pix`, `wear`, `tm`, `P`, `hangSign`, `tree`, `flower`, `bench`, `house`, ecc.) invece di riscriverle. Un oggetto nuovo diventa un modulo nuovo, esportato da `index.js`. Per ciò che non è ancora un modulo, il riferimento è `reference/valfiorita-pioggia.html`.
5. Dopo le modifiche esegui `cd engine && npm test` (e `--notte`).

## Controlli prima di consegnare
- Nessuna forma primitiva nuda come forma finale; parti separate e leggibili.
- Colori dalla palette; saturi solo negli accenti piccoli.
- Texture in pixel-art con hue shift; materiali con `wear()`; nessuna scritta nel mondo.
- I materiali con alphaTest forzano alpha 1; l'`opacity` dei materiali opachi rispetta la maschera dei riflessi.
- Proporzioni reali (vedi §6).
- Funziona su telefono: niente TDZ, luci entro il limite, pagina con il riquadro degli errori.
- Spiega all'autore i nomi delle tecniche usate (l'autore lo chiede sempre) e rispondi in italiano.
- Se non puoi vedere il render, dillo esplicitamente.
