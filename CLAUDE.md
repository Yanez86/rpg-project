# rpg-project — istruzioni per Claude

- Rispondi in italiano.
- Per qualsiasi lavoro grafico (scene, oggetti, texture, materiali, shader, effetti) segui la skill `scena-estetica` e i documenti in `docs/`.
- `docs/estetica.md` è la fonte di verità dello stile: se l'autore cambia una regola, aggiorna anche quel file.
- Il codice vive in `engine/src/` come moduli ES (guida: `docs/motore.md`). Ogni oggetto nuovo diventa un modulo o una funzione esportata da `engine/src/index.js`, mai codice incollato in una scena.
- Dopo ogni modifica al motore esegui `cd engine && npm test` (e `--notte`); se usi una classe di three nuova, aggiungila a `engine/test/three-stub.mjs`.
- Quando aggiungi un oggetto nuovo, aggiungi la sua ricetta a `docs/oggetti.md`.
- Quando incontri un errore tecnico nuovo e lo risolvi, aggiungilo a `docs/errori-noti.md`.
