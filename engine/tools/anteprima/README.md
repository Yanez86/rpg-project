# Anteprime senza browser

Per controllare la forma di un personaggio senza GPU né rete:

```sh
cd engine/tools/anteprima
node --import ./register.mjs personaggio.mjs villager /tmp/v.json   # villager | elf | cat | dragon
node --import ./register.mjs personaggio.mjs elf /tmp/e.json
python3 render.py /tmp/corpi.png /tmp/v.json /tmp/e.json           # vista frontale, di profilo e di tre quarti, stessa scala
```

`mini-three.mjs` è un "three" minimo (gruppi, mesh, trasformazioni, geometrie di base) che basta a calcolare i triangoli in coordinate mondo; `render.py` li disegna con uno z-buffer e una luce (serve `numpy` e `Pillow`). I colori sono quelli dei materiali, senza texture: serve a giudicare forme e proporzioni, non i dettagli dipinti. La posa è quella di riposo (nessuna animazione).

Con `TOON=1 python3 render.py ...` l'anteprima imita il cel shading di `characters/toon.js` (due toni, ombra lilla, contorno), con normali piatte: serve a giudicare colori e ombre, non la morbidezza del passaggio.
