# 01: Vorbereitung auf 100 Würfel-Level

**What to build:** Werkzeuge, Tests und Spiel kommen mit vielen Würfel-Leveln zurecht, sodass jede Gruppe der Tickets
02–21 nur noch Leveldaten hinzufügt.

**Spec:** ../spec.md

**Status:** ready-for-agent

- [ ] **Kandidaten:** `tools/ausbau.mjs pool` (oder ein eigener Aufruf) erzeugt Kandidaten im Würfel 7 × 7 × 7,
      parallel wie im flachen Feld. Die Vorprüfung auf Zerfall (`ZWEITER_TEIL_HOECHSTENS`) gilt auch im Würfel.
- [ ] **Ähnlichkeit** (`tools/aehnlichkeit.mjs`) im Würfel: über die Symmetrien des Würfels, die Drehachse jedes
      Elements mitgedreht. Welche Symmetrien gelten (etwa nur um die senkrechte Achse, weil unten die Plattform liegt,
      oder alle), ist begründet; die Grenze ist an Aufzug, Kern und frischen Kandidaten gemessen.
- [ ] **Reihenfolge:** Die Würfel-Level haben eine eigene Reihenfolge nach der Formel, mit den Regeln der Spec (Grad
      sinkt nie, Mittel je 10 steigt, Haupt-Kernidee höchstens zweimal je 10). Werkzeug zum Einordnen und Wahl je
      Gruppe (Bedarf nach der Tabelle der Spec); Tests der Levelliste prüfen die Regeln auch für den Würfel.
- [ ] **KI-Tester im Würfel:** Feldbeschreibung als Text (`tools/ki-tester/field.mjs`), etwa Ebene für Ebene mit
      Drehachse jedes Elements und dem Licht in der Startstellung in drei Koordinaten; Screenshots des Würfels aus
      einer oder mehreren Ansichten; `prepare.mjs` und Protokoll können Würfel-Kandidaten. Festgelegt und begründet,
      welche Anker die KI-Tester im Würfel bekommen (es gibt noch keine geeichten Würfel-Level).
- [ ] **Spiel:** `LEVELS_3D` nimmt die neuen Level auf; die Levelauswahl „Würfel“ hat Abschnitte nach Grad und
      Blättern wie die flache, auch mit 500 Leveln (Desktop und Handy, Screenshot-Proben).
      Fortschritt wird nach Namen gespeichert.
- [ ] **Tests:** Der Golden-Test deckt auch die Würfel-Level ab (Strahlbilder in Start- und Lösungsstellung, Löser
      für eine Stichprobe); Namen eindeutig über flache und Würfel-Level.
- [ ] **Probelauf:** Mit 25 Probe-Leveln (nicht committet) laufen alle Tests grün; Laufzeiten mit 502 Würfel-Leveln
      abgeschätzt, falls nötig beschleunigt, ohne das Verhalten zu ändern.
- [ ] Review nach dem Ticket.

## Comments
