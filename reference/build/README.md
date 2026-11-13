# Script di generazione (storico)

Le scene sono state costruite come **patch successive** su una scena di partenza in cel-shading:

1. `src.html` è la scena di partenza (prima persona nel mercato, stile cartoon).
2. `make.py` applica le patch dell'atmosfera di pioggia, l'acqua simulata (`water_port.js`), il fumo morbido, le gocce, e genera la variante notturna.
3. `rich.py` aggiunge il dettaglio (tegole, finestre, stendardi, vegetazione, pareti lontane) a entrambe le versioni.
4. `real.py` porta **solo la versione con la pioggia** alla base realistica: palette, hue shift, usura, SSAO, panchine, alberi procedurali, insegne, ponte, terreno, legno, fiori.

Gli script usano percorsi assoluti del vecchio ambiente (`/home/claude/vox/pioggia/`) e servono come riferimento di come è stata costruita ogni parte. Per il motore conviene estrarre le funzioni in moduli (vedi `docs/oggetti.md` per i nomi).

`stub.js` esegue lo script della scena in Node con un finto THREE: rileva errori JavaScript (per esempio la TDZ), ma non gli errori degli shader.
