# 01: Vorbereitung auf 100 Würfel-Level

**What to build:** Werkzeuge, Tests und Spiel kommen mit vielen Würfel-Leveln zurecht, sodass jede Gruppe der Tickets
02–21 nur noch Leveldaten hinzufügt.

**Spec:** ../spec.md

**Status:** resolved

- [x] **Kandidaten:** `tools/ausbau.mjs pool` (oder ein eigener Aufruf) erzeugt Kandidaten im Würfel 7 × 7 × 7,
      parallel wie im flachen Feld. Die Vorprüfung auf Zerfall (`ZWEITER_TEIL_HOECHSTENS`) gilt auch im Würfel.
- [x] **Ähnlichkeit** (`tools/aehnlichkeit.mjs`) im Würfel: über die Symmetrien des Würfels, die Drehachse jedes
      Elements mitgedreht. Welche Symmetrien gelten (etwa nur um die senkrechte Achse, weil unten die Plattform liegt,
      oder alle), ist begründet; die Grenze ist an Aufzug, Kern und frischen Kandidaten gemessen.
- [x] **Reihenfolge:** Die Würfel-Level haben eine eigene Reihenfolge nach der Formel, mit den Regeln der Spec (Grad
      sinkt nie, Mittel je 10 steigt, Haupt-Kernidee höchstens zweimal je 10). Werkzeug zum Einordnen und Wahl je
      Gruppe (Bedarf nach der Tabelle der Spec); Tests der Levelliste prüfen die Regeln auch für den Würfel.
- [x] **KI-Tester im Würfel:** Feldbeschreibung als Text (`tools/ki-tester/field.mjs`), etwa Ebene für Ebene mit
      Drehachse jedes Elements und dem Licht in der Startstellung in drei Koordinaten; Screenshots des Würfels aus
      einer oder mehreren Ansichten; `prepare.mjs` und Protokoll können Würfel-Kandidaten. Festgelegt und begründet,
      welche Anker die KI-Tester im Würfel bekommen (es gibt noch keine geeichten Würfel-Level).
- [x] **Spiel:** `LEVELS_3D` nimmt die neuen Level auf; die Levelauswahl „Würfel“ hat Abschnitte nach Grad und
      Blättern wie die flache, auch mit 500 Leveln (Desktop und Handy, Screenshot-Proben).
      Fortschritt wird nach Namen gespeichert.
- [x] **Tests:** Der Golden-Test deckt auch die Würfel-Level ab (Strahlbilder in Start- und Lösungsstellung, Löser
      für eine Stichprobe); Namen eindeutig über flache und Würfel-Level.
- [x] **Probelauf:** Mit 25 Probe-Leveln (nicht committet) laufen alle Tests grün; Laufzeiten mit 502 Würfel-Leveln
      abgeschätzt, falls nötig beschleunigt, ohne das Verhalten zu ändern.
- [x] Review nach dem Ticket.

## Comments

- 2026-10-24: Erledigt. Werkzeuge: wuerfelliste.mjs, ordne-wuerfel.mjs, wuerfel.mjs, Ähnlichkeit über die 48 Symmetrien des Würfels, Leveldaten, Golden-Test, KI-Tester im Würfel (Ablauf W1, Anker Aufzug und Kern), Würfel-Seiten in der Levelauswahl. Aufzug und Kern nach der Formel beide „leicht“.
- Probelauf mit 25 Kandidaten aus Pool-1 (Seeds 20001–20400) und erfundenen Urteilen: alle Prüfungen bestanden, Grade 7/13/5/2. Danach zurückgesetzt. Er hat zwei Fehler gezeigt: Das Durchprobieren im logic-Test lief bei grossen Würfel-Leveln endlos (jetzt bis 2^14 Stellungen wie bei flachen), und Urteile gingen nach dem Einordnen verloren (Zuordnung jetzt über kandidatName).
- Laufzeit: Wahl etwa 20 s, ordne-wuerfel etwa 3 s, Bilder der KI-Tester etwa 1,8 min je Kandidat.
- Review: Ein Fehler gefixt (wahl ordnete Urteile der Level im Spiel nicht über kandidatName zu, dc733a3). Offen und klein: Namen ohne Apostroph wählen, sonst bricht die Namenszeile in ordne-wuerfel.mjs.
- tests/offline.mjs ist rot, auch auf dem Stand vor dem Ticket (Zeitüberschreitung beim Laden der Skybox beach), unabhängig von den Würfel-Leveln.
