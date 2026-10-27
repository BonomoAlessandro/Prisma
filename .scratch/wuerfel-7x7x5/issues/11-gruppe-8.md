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
