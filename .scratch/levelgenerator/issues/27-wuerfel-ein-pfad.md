# 27: Würfel-Branch: ein Pfad für flache Level und Würfel

**What to build:** Auf dem Branch `feature/3d-wuerfel` rechnen flache Level und Würfel-Level über denselben Pfad der
Strahlregel. Ein flaches Level ist dabei ein Würfel mit einer Ebene (ADR 0003). Damit verhält sich der Strahl überall
gleich, und jede Änderung der Strahlregel geschieht nur einmal. Das ist die Voraussetzung, bevor der Würfel irgendwann
nach main kommt.

**Spec:** ../spec.md, Abschnitt „Würfel“.

**Blocked by:** 03 (Strahlregel schneller). Dessen Beschleunigung wird übernommen.

**Status:** ready-for-agent

- [ ] Flache Level laufen über denselben Pfad wie Würfel-Level. Der getrennte Würfel-Pfad entfällt.
- [ ] Der Golden-Test ist grün: Das Verhalten stimmt exakt, Kommazahlen weichen höchstens um 1e-9 ab.
- [ ] Der flache Fall ist nicht langsamer als auf main, gemessen mit dem Messskript aus Ticket 02. Heute ist der
      Würfel-Pfad etwa 1,3-mal langsamer.
- [ ] Alle Würfel-Tests auf dem Branch sind grün.
- [ ] Nichts davon kommt nach main, bevor der Würfel als Ganzes kommt.
