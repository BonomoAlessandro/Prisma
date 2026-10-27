# 11: Würfel-Gruppe 8 in 7 × 7 × 5 (275 Level)

**Spec:** ../spec.md

**Blocked by:** 10

**Status:** resolved

**What to build:** 25 neue Würfel-Level 7 × 7 × 5 nach dem Ablauf einer Gruppe (Spec `wuerfel-500`), alle nach
der Ebenen-Regel. Neu je Grad (leicht / mittel / schwer / sehr schwer): 3 / 13 / 6 / 3. Danach im Spiel: 47 / 146 / 57 / 25.

- [x] 25 neue Level, je Grad wie oben; Fehlmengen begründet und für die nächste Gruppe vermerkt.
- [x] Genau eine Lösung, Beurteilung bestanden, ab „mittel“ nötige Kernidee, Ebenen-Regel erfüllt, keinem anderen
      Würfel-Level zu ähnlich.
- [x] Beide KI-Tester haben jedes neue Level beurteilt; von beiden abgelehnte sind ersetzt.
- [x] Namen ohne Freigabe, eindeutig, gut unterscheidbar; Herkunft nachbaubar.
- [x] Golden-Referenz, alle Tests grün, Stichproben der Screenshots, auf `feature/3d-wuerfel` gepusht; Review.

## Comments

**27.10.2026, Koordinator: erledigt.** Im Spiel stehen jetzt 275 Würfel-Level, je Grad 47 / 146 / 57 / 25, wie in der Tabelle.

- **Reihenfolge, Fund aus Review 10:** Gauss (88,1, eines der leichtesten „sehr schweren“) stand auf Platz 250, 19 Plätze hinter der Formel.
  - Ursache: `korrigiere` wendet die Korrekturen nacheinander an. Jedes Level, das nach vorn zieht, schiebt die dazwischen um einen Platz zurück. Fast alle „sehr schweren“ hatten −1 bis −5.
  - **Entscheid:** Im Würfel gilt `korrigiereNachZiel` (`tools/levelliste.mjs`, Option `nachZiel` von `reihenfolge`, gesetzt in `wuerfelReihenfolge`). Jedes Level bekommt als Ziel seinen Platz vorher plus die Korrektur, höchstens MAX_SHIFT. Im Abschnitt seines Grads wird nach dem Ziel geordnet, bei gleichem Ziel nach dem Platz vorher.
  - Danach steht Gauss auf 257, sein Platz nach der Formel ist 254. Die flachen Level sind unverändert.
- **Häufungen:** Die neue Ordnung öffnete Seite 7 und Seite 15 mit „Farben abzählen“.
  - Entfernt: Marionette (Gruppe 6, nie auf main).
  - Ausgeschlossen: die Kandidaten b979a143 und a578d21f.
  - Neu gewählt: 3 mittlere (cbedd10e, 959e53e6, 47b49081), Lauf wuerfel-8-q2, keiner abgelehnt.
- **KI-Tester:** wuerfel-8-q mit 25 Kandidaten, keiner abgelehnt.
- **Namen:** Geranie, Blumenvase, Kugelschreiber, Laubsäge, Maurer, Graveur, Enkaustik, Glockenguss, Stuckmarmor, Pleuel, Hängekoje, Formschneider, Raspel, Trolleybus, Nippur, Yaxchilan, Tiwanaku, Cahokia, Kairouan, Bamiyan, Peano, Kardioide, Euklid, Lugger, Engobe, Säulenbasis.
  - Alle sind streng geprüft.
  - Von Hand getauscht wegen Häufungen: Keramik und Schiffsteile.
- **Review 10:** gemergt, mit 14 Umbenennungen und ohne `ankerNamen`.
- **Golden und Tests:** Golden nachgeführt (784 Level). Alle Tests mit Exit 0.

**27.10.2026, Reviewer: in Ordnung nach elf Umbenennungen, eine Frage offen** (Branch `review/quader-11`).

- **`korrigiereNachZiel`:** korrekt im Sinn des Entscheids.
  - Die Grade bleiben getrennt: Geordnet wird je zusammenhängendem Abschnitt eines Grads. Der ist zusammenhängend, weil
    `grad` aus der Folge selbst stammt.
  - Eine fehlende Korrektur ist 0 (`|| 0`). Die Kappung auf MAX_SHIFT ist da.
  - Flach unverändert: Die Option gilt nur über `wuerfelReihenfolge`. Golden und levelliste sind grün.
  - **Behoben:** Es fehlte ein Test. Neu in `tests/levelliste.test.mjs`: Ein unkorrigiertes Level zwischen lauter −3
    wandert nacheinander ans Ende, nach Ziel nur 2 Plätze. Dazu: Korrektur fehlt oder 0, Kappung, Gradgrenzen.
- **Offen, für Entwickler und Reviewer gemeinsam:** Bei gleichem Ziel entscheidet der Platz vorher. Ein Level landet so
  vor dem, das schon auf seinem Zielplatz steht, wenn es nach hinten will, und dahinter, wenn es nach vorn will. Jede
  einzelne Korrektur wirkt darum einen Platz schwächer: ±1 verliert sich ganz (so Cahokia, −1), ±5 wirkt als ±4.
  - Ein Vorschlag: das Ziel einen halben Platz weiter, `p + sign(k) · (min(|k|, MAX_SHIFT) + 0,5)`. Dann wirkt eine
    einzelne Korrektur wie in `korrigiere`.
  - Ausprobiert, nicht übernommen: Die Reihenfolge ändert sich, und auf Seite 11 öffnet sich eine Häufung
    „Abschalten“. Das braucht einen eigenen Durchgang mit `ordne-wuerfel.mjs` und vielleicht einen Tausch.
- **Entfernt:** Marionette (dc78c5a9) steht auf `entfernteNamen` und in `ohne.txt`, ebenso b979a143 und a578d21f.
- **Umbenannt** (Teilwörter, Wortenden, Häufungen):
  - Leicht:
    - Kugelschreiber → Fernbedienung: „Kugel“ in Lichtkugel und Kugelsternhaufen (flach); Lineal 2 Plätze davor.
    - Blumenvase → Salzstreuer: „Blume“ in Sonnenblume (flach), fast dasselbe wie das entfernte Blumentopf.
  - Mittel:
    - Glockenguss → Posamenter: „Glocken“ in Glockenspiel und Glockenturm (flach), wie Glockengiesser in Review 09.
    - Laubsäge → Einspänner: Schraubstock, Drehbank und Laubsäge, drei Werkzeuge auf 11 Plätzen; „Laub“ im
      entfernten Laubengang.
    - Säulenbasis → Kesselflicker: „Säule“ in Säulenhalle (flach), „Basis“ in Basislager (flach).
    - Lugger → Tempera: Brigg, Lugger und Kogge, drei Schiffe auf 11 Plätzen.
    - Trolleybus → Wagner: endet auf „bus“ wie Omnibus.
    - Hängekoje → Sfumato: „Hänge“ in Hängebrücke (flach) und im entfernten Hängematte; direkt neben Galionsfigur.
    - Formschneider → Spengler: direkt neben Lithografie, zwei Drucktechniken.
  - Schwer:
    - Kairouan → Butrint: Dougga, Karthago und Kairouan, drei Stätten in Tunesien auf 11 Plätzen (wie El Djem in
      Review 10).
    - Tiwanaku → Paphos: direkt neben Cusco, zwei Stätten der Anden; Machu Picchu 19 Plätze danach.
  - Die neuen Namen sind gegen alle flachen, Würfel- und entfernten Namen geprüft. Die alten waren nie auf main,
    deshalb nicht auf `entfernteNamen`. Golden ist nachgeführt.
- **Geprüft, in Ordnung:**
  - Die Verteilung ist 47 / 146 / 57 / 25.
  - Protokoll: Jedes der 26 neuen Level hat genau ein Urteil, 23 aus wuerfel-8-q und 3 aus wuerfel-8-q2. Keines ist
    abgelehnt.
  - Reihenfolge: Der Grad sinkt nie, das Mittel je 10 Level fällt nicht, keine Häufung ist offen (wuerfelliste).
    Gauss steht auf 257, nach der Formel auf 254.
- **Tests:** wuerfelliste, levelliste, ki-tester, beurteilung, logic und golden mit Exit 0.
