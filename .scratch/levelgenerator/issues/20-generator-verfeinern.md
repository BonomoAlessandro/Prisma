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
