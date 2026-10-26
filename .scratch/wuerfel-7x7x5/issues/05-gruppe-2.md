# 05: Würfel-Gruppe 2 in 7 × 7 × 5 (125 Level)

**Spec:** ../spec.md

**Blocked by:** 04

**Status:** resolved

**What to build:** 25 neue Würfel-Level 7 × 7 × 5 nach dem Ablauf einer Gruppe (Spec `wuerfel-500`), alle nach
der Ebenen-Regel. Neu je Grad (leicht / mittel / schwer / sehr schwer): 3 / 13 / 6 / 3. Danach im Spiel: 24 / 69 / 22 / 10.

- [x] 25 neue Level, je Grad wie oben; Fehlmengen begründet und für die nächste Gruppe vermerkt.
- [x] Genau eine Lösung, Beurteilung bestanden, ab „mittel“ nötige Kernidee, Ebenen-Regel erfüllt, keinem anderen
      Würfel-Level zu ähnlich.
- [x] Beide KI-Tester haben jedes neue Level beurteilt; von beiden abgelehnte sind ersetzt.
- [x] Namen ohne Freigabe, eindeutig, gut unterscheidbar; Herkunft nachbaubar.
- [x] Golden-Referenz, alle Tests grün, Stichproben der Screenshots, auf `feature/3d-wuerfel` gepusht; Review.

## Comments

**26.10.2026, Koordinator: erledigt.** Im Spiel stehen jetzt 125 Würfel-Level, je Grad 24 / 69 / 22 / 10, wie in der Tabelle.

- **Wahl:** 3 / 13 / 6 / 3, mit 3 Tauschen gegen Häufungen.
- **KI-Tester:** Lauf wuerfel-2-q unter W6.
  - Tester A schrieb zusätzlich die 8 Anker als Urteile in die Datei (Einordnung = eigene Kennung). Diese 8 Einträge sind entfernt, das Original liegt als `urteile.json.mit-ankern` daneben. Die 25 Urteile zu den Leveln sind unverändert.
  - Kein Kandidat ist abgelehnt.
  - **Ersetzt:** Kandidat a1f97f10 (leicht). Beide Tester sahen darin nur einen Strang („Füllteil“, Gefühl 2/2, Einordnung <A1). Füllteil zählt bei „leicht“ nicht als Ablehnung, aber so ein Level soll nicht ins Spiel, wie schon in Gruppe 12 des Würfels 7 × 7 × 7.
  - Der Ersatz Kandidat 39b02c38 kam mit `--behalte` und `--ohne` in Lauf wuerfel-2-q2. Beide Tester: A1-A2, Gefühl 3/3, keine Ablehnung.
- **Namen:** Puppenstube, Vogeltränke, Steckenpferd, Chorgestühl, Wimperg, Vestibül, Kasematte, Ravelin, Bibliothek, Tuba, Kontrafagott, Marimba, Celesta, Spinett, Clavichord, Bandoneon, Ellora, Cusco, Delphi, Ayutthaya, Wartburg, Pergamon, Kolmogorow, Borges, Aleph.
  - Nach Review 04 werden die 225 entfernten Namen nicht wieder vergeben (`entfernteNamen`).
  - Der Vorrat ist um etwa 230 geprüfte Namen ergänzt.
- **Golden und Tests:** Golden nachgeführt (634 Level). Alle Tests mit Exit 0, je Test geprüft.
