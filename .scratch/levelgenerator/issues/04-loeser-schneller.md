# 04: Löser schneller

**What to build:** Der Löser beantwortet die häufigste Frage des Generators, ob es genau eine Lösung gibt, deutlich
schneller. Die bestehenden Auswertungen liefern weiterhin dieselben Zahlen. Was nur die Suche betrifft, gehört in den
Löser und nicht in die Strahlregel.

**Spec:** ../spec.md, Abschnitt „Löser“.

**Blocked by:** 01 (Golden-Test), 02 (Ausgangszahlen), 03 (Strahlregel schneller). 03 und 04 berühren beide das Lesen
offener Stellungen.

**Status:** ready-for-agent

- [ ] Ein neuer Modus für die Eindeutigkeit bricht ab der zweiten Lösung ab.
- [ ] Suchen, die heute doppelt laufen, laufen nur noch einmal. Wo dieselbe Stellung mehrfach verfolgt wird, hilft ein
      Zwischenspeicher.
- [ ] Die bestehenden Aufrufe liefern unverändert Lösungen, Knoten, Blätter, Fast-Lösungen und Rateschritte. Der
      Golden-Test ist grün.
- [ ] Der bestehende Vergleich mit stumpfem Durchprobieren ist grün und deckt auch den neuen Modus ab.
- [ ] Der Gewinn ist mit dem Messskript aus 02 gemessen und steht unter `## Comments`.

## Comments

**Hinweis aus Ticket 02 (Messskript):** Der Teil `solver` von `tools/bench.mjs` misst nur `solve(level)` mit den
Standardoptionen über alle Level. Den neuen Modus für die Eindeutigkeit dort wählbar machen, damit sein Gewinn messbar
ist. `--compare` vergleicht nur die Summe der Knoten; die Ergebnisse je Level sichert `node tests/golden.mjs --voll`.
Die Ausgangszahl ist 103,8 CPU-s bei 9 831 779 Knoten (`tools/bench-baseline.json`). Sie streut mit der Last auf dem
Rechner um 20 % und mehr, deshalb vorher und nachher in derselben Sitzung messen.

**Hinweis aus Ticket 03 (Strahlregel schneller):** `Need` und die werfenden Getter in `tools/solver.mjs` sind schon
weg. `solve` setzt die drehbaren Elemente auf `L.OPEN` (-1). Liest die Verfolgung eine solche Stellung, liefert
`traceBeams` nur `{ open: Element, hits }`. `visit` setzt die Stellung mit `setRot` und beim Zurückgehen wieder
`L.OPEN`. Nach Ticket 03 braucht der Löser über alle Level 32–35 CPU-s statt 88–90 (gemessen in derselben Sitzung),
bei unveränderten 9 831 779 Knoten. Das ist der neue Vergleich für dieses Ticket.

**Hinweis aus dem Review von Ticket 03:**
- Die Spec nennt als heisse Stelle auch: Bei jedem Knoten der Suche werden alle Strahlen neu verfolgt. Das gehört
  hierher, etwa als Zwischenspeicher oder als Verfolgung, die beim nächsten offenen Element weitermacht, statt von vorn
  zu beginnen.
- Im Löser kommen `value.set`/`setRot` und `value.delete`/`setRot(el, L.OPEN)` immer paarweise; `value.has(id)` ist
  dasselbe wie `getRot(el) !== L.OPEN`. Den doppelten Zustand hier auflösen.
