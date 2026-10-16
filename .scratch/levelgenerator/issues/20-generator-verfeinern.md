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
Etwa mit `LEISE_CPU=50 sh tools/leise.sh node tools/bench.mjs generator härten --seeds N
--save datei`. Achtung: `--save` führt nur bei gleichen Seeds und gleichem `--jobs` mit einer
vorhandenen Messung zusammen. Die Ausgangszahlen haben 60 000 Seeds je Profil, das ist für „härten“ zu teuer. Also
entweder eine eigene Datei nehmen oder das Zusammenführen für Gruppen mit eigener Seed-Zahl erweitern.

**Hinweis aus Ticket 04 (Löser schneller):**
- **Härten ist schneller geworden:** Ein Lauf von `climb` mit 300 Schritten (Seed 5, Zielwertung 44–54) brauchte 3,7
  statt 17,0 CPU-s. Die Ausgangszahl für „härten“ hängt also davon ab, ob sie vor oder nach Ticket 04 gemessen wird.
  Für den Vergleich mit dem neuen Generator den Stand nach Ticket 04 nehmen.
- **`makeUnique` sucht im Modus unique.** Eine Suche mit mehreren Lösungen, die erst nach der zweiten über
  `maxSearch` (beim Härten 1,5e6) käme, gilt nicht mehr als „zu gross“; das Level wird repariert. In sechs Proben
  verlief `climb` gleich wie vorher, in Einzelfällen kann ein Lauf aber anders verlaufen.
- **Beim Verfeinern** stellt jeder Schritt die Eindeutigkeit her. Dafür den Modus unique nehmen; seine Knoten und
  Rateschritte gelten bei einer Lösung unverändert für die Beurteilung (siehe Ticket 18).
- **Doppelte Suchen, die in den alten Werkzeugen bleiben** (Ticket 04 hat sie nicht mehr umgebaut; das Verfeinern
  ersetzt das Härten). Der neue Generator sollte sie vermeiden:
  - `harden.mjs`, Zeile 330: `climb` ruft `finish` ohne `sol` auf. Dann wiederholt `metrics` die Suche von `makeUnique`
    aus `evaluate`, bis 1,5e6 Knoten. Abhilfe: Das Ergebnis von `makeUnique` in `evaluate` aufheben und als `sol`
    mitgeben.
  - Die Vollsuchen in `finish` und `metrics` wiederholen in manchen Fällen die Lockvogel-Suche von `generateOne`
    (zusammen knapp 1 % der Knoten), die Lockvogel-Suche in `quality` wiederholt die Vollsuche (1,4 %). Alle drei
    brauchen eigene Rückrufe je Blatt. Besser ist eine Vollsuche, die alle Rückrufe auf einmal bedient.
