# 18: Generator: erster Durchstich für „leicht“

**What to build:** Der neue Generator liefert auf einen Auftrag hin ein Level oder nichts. Der Auftrag besteht aus
Grad, Kernidee, Seed und Feldform. Der erste Durchstich deckt den Grad „leicht“ ab, ohne Kernidee und mit der Kernidee
Mischziel aus zwei Quellen (ADR 0004). Die Lehren aus der Messung der Effizienz sind von Anfang an eingebaut.

**Spec:** ../spec.md, Abschnitte „Generator“ und „Effizienz“, Nahtstelle 4 unter „Entscheide zu den Tests“.

**Blocked by:** 12 (Schwierigkeit geeicht), 13 (Spielwert geeicht)

**Status:** ready-for-agent

- [ ] Der Generator hat einen einzigen Einstieg: Ein Auftrag mit Grad, Kernidee, Seed und Feldform ergibt ein Level oder
      nichts.
- [ ] Für „leicht“ liefert er Level, ohne Kernidee und mit der Kernidee Mischziel aus zwei Quellen.
- [ ] Derselbe Auftrag mit demselben Seed ergibt dasselbe Level.
- [ ] Jedes gelieferte Level erfüllt vier Bedingungen:
      - genau eine Lösung, geprüft mit dem Modus aus Ticket 04;
      - die Beurteilung ist bestanden;
      - der verlangte Grad ist erreicht;
      - die verlangte Kernidee ist nötig.
- [ ] Günstige, exakte Prüfungen laufen zuerst. Bei zu wenigen Klicks bekommt ein Kandidat eine neue Startstellung,
      statt verworfen zu werden. Es gibt nur Budgets, die die Untergrenzen erreichen können.
- [ ] Der Generator setzt keine wirkungslosen Elemente. Ein Filter, dessen Strahl schon die Filterfarbe hat, kommt
      nicht vor, ebenso ein fester Spiegel, der weder für die Lösung zählt noch als Lockvogel wirkt. Ein Test mit
      festen Seeds belegt das.
- [ ] Der Generator kennt das Feld nur über die Feldform.
- [ ] Er läuft nur über die gedeckelte Umgebung mit höchstens 50 % CPU.
- [ ] Tests der Nahtstelle Generator prüfen Determinismus, Eindeutigkeit und die bestandene Beurteilung.
- [ ] Das Messskript aus Ticket 02 misst die angenommenen Level je CPU-Stunde für „leicht“ und vergleicht mit dem
      heutigen Generator, beide mit der Beurteilung als Abnahme. Das Ergebnis steht unter `## Comments`.

## Comments

**Hinweis aus Ticket 02 (Messskript):** `--compare` in `tools/bench.mjs` vergleicht nur Gruppen gleichen Namens.
Über einen Generatorwechsel, also den alten Generator nach Profilen gegen den neuen nach Graden, vergleicht es noch
nicht, und `grades` und `total` vergleicht es gar nicht. Das in diesem Ticket nachrüsten, zusammen mit dem neuen
Generator in `GENERATORS` und der Beurteilung in `ACCEPTANCES`.

**Hinweis aus Ticket 04 (Löser schneller):**
- **Eindeutigkeit** mit `solve(level, { unique: true })` prüfen. Er hält bei der zweiten Lösung an. Bei höchstens einer
  Lösung liefert er genau dasselbe wie ohne den Modus, also auch Knoten und Rateschritte für die Beurteilung.
  `maxNodes` zählt nur bis zum Anhalten: „zu gross“ heisst dann „bis zur zweiten Lösung zu gross“.
- **Doppelte Suchen vermeiden:** `metrics(level, { sol, full })` übernimmt Suchen, die der Aufrufer schon hat; `finish`
  in `tools/generate.mjs` zeigt, wann sie noch gelten (solange das Feld gleich bleibt). Die Beurteilung sollte Suchen
  ebenso annehmen.
- **Teuer ist im alten Generator jetzt die Lockvogel-Suche** in `generateOne`: 47 % der Zeit, davon gut die Hälfte in
  den Rückrufen je Blatt (`pathCells`, `segmentCells`), nicht im Löser. Danach kommen die Vollsuche in `finish` (16 %)
  und `makeUnique` (15 %). Statistiken über alle Blätter günstiger sammeln (z. B. aus `events` statt aus Abschnitten)
  oder nur eine Vollsuche mit allen Rückrufen machen.
  - Gemessen ist das mit `node --cpu-prof` über `generateOne` für die Seeds 1–4000 je Profil in 3-misch, 3-bunt,
    4-prisma und 3-prisma, in einem Prozess.
  - Angegeben ist die Zeit in `solve` samt Rückrufen, nach Aufrufer, als Anteil an der ganzen Zeit.
- **Löser über das Messskript:** `bench.mjs solver --unique` misst den Modus; die Level ohne Blocker zeigen, was der
  Abbruch bei der zweiten Lösung bringt (× 2,8–2,9 gegen den Standard).
