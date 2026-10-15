# 20: Generator: Verfeinern bis „sehr schwer“

**What to build:** Der Generator verfeinert ein Level Schritt für Schritt, bis es die Ziel-Schwierigkeit des Auftrags
erreicht. So liefert er Level für alle Grade bis „sehr schwer“. Das ersetzt das bisherige Härten.

**Spec:** ../spec.md, Abschnitte „Generator“ und „Effizienz“.

**Blocked by:** 18 (Generator: erster Durchstich)

**Status:** ready-for-agent

- [ ] Der Generator verfeinert schrittweise bis zur Ziel-Schwierigkeit des Auftrags. In jedem Schritt gelten die
      Ausschlüsse und der Spielwert.
- [ ] Reparaturen sind begrenzt, denn laut Messung bringen sie ab der dritten kaum noch etwas.
- [ ] Er liefert Level mit Kernidee für „mittel“, „schwer“ und „sehr schwer“.
- [ ] Tests wie in Ticket 18 decken alle Grade ab.
- [ ] Das Messskript misst die angenommenen Level je CPU-Stunde und Grad und vergleicht mit den Ausgangszahlen des
      heutigen Generators einschliesslich Härten, beide mit der Beurteilung als Abnahme. Bei „schwer“ und „sehr schwer“
      liefert der neue Generator mehr als der heutige. Das Ergebnis steht unter `## Comments`.

## Comments

**Hinweis aus Ticket 02 (Messskript):** Für „härten“ fehlt die Ausgangszahl, denn ein Lauf kostet oft über 10
CPU-Minuten. Sie wird mit eigenem Zeitbudget gemessen, **bevor** Ticket 21 `harden.mjs` entfernt, oder danach in
einem Worktree auf einem Stand vor Ticket 21 (`a52407f` hat `bench.mjs` noch nicht, erst der Commit von Ticket 02).
Etwa mit `LEISE_CPU=50 sh tools/blender/out/arbeit/leise.sh node tools/bench.mjs generator härten --seeds N
--save datei`. Achtung: `--save` führt nur bei gleichen Seeds und gleichem `--jobs` mit einer
vorhandenen Messung zusammen. Die Ausgangszahlen haben 60 000 Seeds je Profil, das ist für „härten“ zu teuer. Also
entweder eine eigene Datei nehmen oder das Zusammenführen für Gruppen mit eigener Seed-Zahl erweitern.
