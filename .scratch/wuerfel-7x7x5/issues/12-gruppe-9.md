# 12: Würfel-Gruppe 9 in 7 × 7 × 5 (300 Level)

**Spec:** ../spec.md

**Blocked by:** 11

**Status:** resolved

**What to build:** 25 neue Würfel-Level 7 × 7 × 5 nach dem Ablauf einer Gruppe (Spec `wuerfel-500`), alle nach
der Ebenen-Regel. Neu je Grad (leicht / mittel / schwer / sehr schwer): 4 / 13 / 6 / 2. Danach im Spiel: 51 / 159 / 63 / 27.

- [x] 25 neue Level, je Grad wie oben; Fehlmengen begründet und für die nächste Gruppe vermerkt.
- [x] Genau eine Lösung, Beurteilung bestanden, ab „mittel“ nötige Kernidee, Ebenen-Regel erfüllt, keinem anderen
      Würfel-Level zu ähnlich.
- [x] Beide KI-Tester haben jedes neue Level beurteilt; von beiden abgelehnte sind ersetzt.
- [x] Namen ohne Freigabe, eindeutig, gut unterscheidbar; Herkunft nachbaubar.
- [x] Golden-Referenz, alle Tests grün, Stichproben der Screenshots, auf `feature/3d-wuerfel` gepusht; Review.

## Comments

**27.10.2026, Koordinator: erledigt.** Im Spiel stehen wieder **300 Würfel-Level**, je Grad 51 / 159 / 63 / 27, das Ziel der Spec. Alle sind im Quader 7 × 7 × 5 und erfüllen die Ebenen-Regel.

- **Häufungen und Entscheide:**
  - **Seite 21, Sammelstelle 5-mal bei mittel:** Entfernt sind Färber, Patchwork und Bandoneon. Alle drei kamen erst in diesem Umbau dazu und waren nie auf main.
  - Danach häuften sich Sammelstelle und Mischziel, weil der Pool im oberen Bereich von „mittel“ fast nur diese Kernideen hatte.
    - Neu: `pool-2-mittel-oben.jsonl`, Stand 33eb4e5, `--schwierigkeit 53,58.4`, 4 Aufträge × 2000 Seeds, 158 Kandidaten.
    - Die Wahl schloss Sammelstelle und Mischziel ab 53 aus, im Ersatz auch Falle.
  - **Nach dem Urteil der Tester Falle 4-mal auf Seite 21:** Ersetzt ist cf05527f, den die Tester um +5 dorthin geschoben hatten.
- **Code:** In `korrigiereNachZiel` liegt das Ziel einen halben Platz weiter. Bei gleichem Ziel entschied sonst der Platz vorher gegen das korrigierte Level, und ±1 ging verloren (Review 11). Der Test ist angepasst.
- **KI-Tester:**
  - **wuerfel-9-q:** 28 Kandidaten, keiner von beiden abgelehnt.
    - Ersetzt, obwohl nicht abgelehnt: 7e78e620 (leicht, <A1/A1, Gefühl 2/3), wie in den Gruppen 2 und 4.
  - **wuerfel-9-q2:** 5c951cc4 und 345e3321, keiner abgelehnt.
    - Tester A versuchte zum Schluss, seine Antwort mit Python zu prüfen. Das ist gegen den Auftrag. Der Versuch scheiterte, weil Python fehlt, und er gewann damit keine Information. Das Urteil gilt.
- **Namen:** Tablett, Rüstmesser, Gürtel, Schuhcreme, Lastenvelo, Zellenschmelz, Klipper, Treibarbeit, Rösslitram, Krüppelwalm, Triglyphe, Risalit, Parkett, Ketsch, Fallreep, Steingut, Autogiro, Kannelur, Klöppeln, Frottage, Bonampak, Yazd, Dunhuang, Dura-Europos, Philae, Lothal, Ljapunow, Isometrie.
  - Alle sind streng geprüft.
  - Drei Schiffsteile sind von Hand getauscht.
- **Golden und Tests:** Golden nachgeführt (809 Level, davon 300 Würfel). Alle Tests mit Exit 0.
- **Bilanz des Umbaus:**
  - 75 Level behalten und gesenkt.
  - 225 aus dem Spiel. Ihre Namen werden nie wieder vergeben.
  - 9 Gruppen mit neuen Leveln.
  - Gegen Häufungen sind unterwegs 15 neue Level wieder entfernt worden. Alle stammten aus diesem Umbau.
  - Die Korrektur durch die KI-Tester gilt im Würfel jetzt mit der Verschiebung aus dem Lauf, auf einmal nach Zielplatz.
