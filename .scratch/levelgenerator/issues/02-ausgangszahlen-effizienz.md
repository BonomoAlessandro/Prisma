# 02: Ausgangszahlen der Effizienz

**What to build:** Ein Messskript misst, wie viele Level der heutige Generator je CPU-Stunde liefert und wie schnell
Strahlregel und Löser rechnen. Diese Zahlen sind der Vergleich für alle späteren Verbesserungen. Das Skript soll später
auch den neuen Generator je Schwierigkeitsgrad messen und mit der Beurteilung als Abnahme laufen können.

**Spec:** ../spec.md, Abschnitt „Effizienz“.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Das Skript läuft nur über die gedeckelte Umgebung mit höchstens 50 % CPU. Mehrere Prozesse laufen nur innerhalb
      dieses Deckels, nie mehrere Läufe nebeneinander.
- [ ] Die Seeds sind fest: Zwei Läufe mit gleichen Seeds liefern dieselben angenommenen Level.
- [ ] Ausgabe: angenommene Level je CPU-Stunde (CPU-Zeit, nicht Wanduhr), für jedes Profil des heutigen Generators.
- [ ] Ausgabe: mittlere Zeit je Aufruf der Strahlregel auf zufälligen Stellungen aller Level (fester Seed) und die
      Gesamtzeit des Lösers über alle Level.
- [ ] Die Abnahme ist austauschbar. Heute gilt die Abnahme des alten Generators, später die Beurteilung. Die Messung
      lässt sich nach Schwierigkeitsgrad aufteilen.
- [ ] Die Ausgangszahlen stehen mit Datum und Rechner unter `## Comments` in diesem Ticket.
