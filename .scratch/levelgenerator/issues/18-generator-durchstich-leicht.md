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
