# 01: Höhe im Modell, im Spiel und in den Werkzeugen

**Spec:** ../spec.md

**Blocked by:** –

**Status:** resolved

**What to build:** Würfel-Level mit eigener Höhe (`height`, Standard `size`), siehe Spec „Das Modell“.

- [ ] Spiel: Brett, Strahlregel, Darstellung, Kamera, Anklicken und Levelauswahl mit 7 × 7 × 5; Screenshots desktop
      und handy geprüft.
- [ ] Feldform, Generator, Beurteilung, Ähnlichkeit (Symmetrien der Grundfläche), KI-Tester (Text, Bilder),
      Leveldaten, Wahl und Ordnen kennen die Höhe.
- [ ] Ohne `height` verhält sich alles wie bisher (Golden-Referenz unverändert, Aufzug und Kern als Testdaten).
- [ ] Tests für einen Quader 7 × 7 × 5; alle Tests grün; Review.

## Comments

**26.10.2026, Koordinator: erledigt.**

- **Leveldaten:** `height` ist neu und wahlweise. Ohne `height` gilt `size`, also ein Würfel wie bisher. Die Golden-Referenz und alle 300 Würfel-Level sind unverändert.
- **Spiel:**
  - `createBoard3` legt das Raster mit size × size × height an und prüft y gegen die Höhe.
  - `tracePass` lässt einen Strahl über der obersten Ebene auslaufen.
  - Rahmen, Zellpunkte, Kamerahöhe, Staub und Feier-Effekt rechnen mit der Höhe.
  - Zwei verschobene Level (aus Kellertreppe und Gauss) als Probe in 7 × 7 × 5, Bilder desktop, oben, seite und handy: Der Rahmen ist flacher, die Elemente sind richtig platziert, auf der Konsole gibt es keine Fehler.
- **Werkzeuge:**
  - `wuerfelFeldform(groesse, hoehe)`, und `rahmen` enthält `height`.
  - `feldformVon` liest `height`.
  - Ähnlichkeit: Im Quader gelten nur die 16 Symmetrien, die y erhalten. Würfel und Quader sind nie ähnlich.
  - Leveldaten: `levelCode` schreibt `height`. Der Abdruck nimmt `height` nur auf, wenn es von `size` abweicht.
  - KI-Tester: Der Feldtext rechnet mit der Höhe. Für einen Würfel ist er wortgleich, deshalb ist keine neue Version nötig.
  - `istWuerfel` und `WUERFEL_TEXT` in `tools/wuerfelliste.mjs` gelten für Wahl und Ordnen. `NAMENSZEILE` in ordne-wuerfel kennt `height`.
- **Noch nicht umgestellt:** `WUERFEL` in `wuerfelliste.mjs` und `ausbau.mjs` steht noch auf 7 × 7 × 7. Die Umstellung folgt in Ticket 02 und 03, zusammen mit Regel und Daten.
- **Tests:**
  - Neu: Quader in logic (Brett, Rand oben, Ziel ganz oben), feldform-wuerfel (Zellen, Nachbarn, rahmen, Drehungen) und wuerfelliste (Leveltext und Abdruck mit height, Ähnlichkeit im Quader).
  - Alle Tests grün, mit Exit 0, darunter generator über leise.sh und golden.
