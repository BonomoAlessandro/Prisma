# 22: Würfel-Branch: Generator im Würfel

**What to build:** Auf dem Branch `feature/3d-wuerfel` erzeugt der neue Generator auch Würfel-Level. Damit ist die
Feldform an echten Würfeln geprüft. Würfel-Level kommen nicht ins Spiel.

**Spec:** ../spec.md, Abschnitt „Würfel“.

**Blocked by:** 14 (Würfel-Branch: Beurteilung im Würfel), 21 (Alte Werkzeuge abbauen)

**Status:** ready-for-agent

- [ ] main ist erneut in den Branch übernommen, und alle Tests sind grün.
- [ ] Die Tests des Generators laufen zusätzlich mit der Würfel-Feldform. Ein Auftrag für einen kleinen Würfel liefert
      ein eindeutig lösbares Würfel-Level, das die Beurteilung besteht.
- [ ] Fehlt der Feldform auf main etwas, wird es dort mit eigenem Commit nachgezogen.
- [ ] Kein Würfel-Level kommt ins Spiel.

## Comments

**Hinweis aus Ticket 18 (Generator):**
- Der Generator braucht von der Feldform zusätzlich `element(zelle, angaben)` (Leveldaten eines Elements in einer
  Zelle) und `rahmen` (Angaben der Leveldaten, die das Feld festlegen, im Würfel etwa `{ dim: 3, size }`). Die flache
  Feldform hat sie seit Ticket 18, die Würfel-Feldform braucht sie auch.
- Quellen entstehen über `quelleStatt` aus einem Kombinator, der in die gewünschte Richtung abgibt (`ausgang`). Mit
  der Standardachse y gibt es so nur Richtungen der Ebene; für andere Achsen müsste `element` eine Achse wählen.
- Die flache Feldform hält die Nachbarn in einer Tabelle, und `feldformVon` legt sie je Grösse einmal an: Das
  Spielermodell fragt die Nachbarn in jeder Beurteilung zehntausendfach ab (vorher 40 % der Zeit des Generators). Die
  Würfel-Feldform profitiert ebenso.
- `tests/generator.test.mjs` sucht im Quelltext des Generators nach `.x` und `.z`; für den Würfel gehört `.y`
  dazu.
