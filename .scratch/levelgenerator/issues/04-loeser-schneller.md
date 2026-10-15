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
