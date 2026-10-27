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

**27.10.2026, Reviewer: in Ordnung nach 15 Umbenennungen** (Branch `review/quader-12`).

- **`korrigiereNachZiel`:** korrekt. Mit dem halben Platz steht ein Level mit +k hinter dem, das auf p + k steht, und
  eines mit −k davor; eine einzelne Korrektur wirkt jetzt wie in `korrigiere`, auch ±1. Fehlende Korrektur und 0
  bleiben ohne halben Platz, die Kappung bleibt.
  - Der angepasste Test stimmt (Level 8 wandert 3 Plätze statt 2).
  - **Behoben:** Ein Test für den eigentlichen Fehler fehlte. Neu: Eine einzelne Korrektur (+1, −1, +3, −5) ergibt nach
    Ziel dasselbe wie nacheinander.
  - Flach unverändert: Die Option gilt nur über `wuerfelReihenfolge`. Alle 509 flachen Level sind in golden.json
    gleich geblieben.
- **Entfernt:** Färber (c27a7beb), Patchwork (0986f27c) und Bandoneon (c3946586) stehen auf `entfernteNamen` und in
  `ohne.txt`, ebenso 7e78e620 und cf05527f.
- **Umbenannt** (Teilwörter, Häufungen, Synonyme):
  - Leicht:
    - Rüstmesser → Domino: direkt neben Mixer, Tablett zwei Plätze danach; drei Küchendinge auf 4 Plätzen.
    - Schuhcreme → Föhn: „Schuh“ in Handschuh, dem direkten Nachbarn, und im entfernten Schuhkarton.
    - Gürtel → Kühlbox: Handschuh, Gürtel, Knopf und Mütze, vier Kleidungsstücke auf 11 Plätzen.
  - Mittel:
    - Zellenschmelz → Origami: Zellenschmelz ist eine Art Emaille, fast ein Synonym zu Emaille (Würfel).
    - Fallreep → Krähennest: „Fall“ in Fallgatter (Würfel), Falltür, Lichtfalle und Wasserfall (flach).
    - Steingut → Akanthus: „Stein“ in Steinmetz (Würfel) und sieben flachen Namen; zwei Plätze neben Fayence.
    - Ketsch → Oldtimer: direkt neben Galionsfigur, Klipper 7 Plätze danach.
    - Klöppeln → Kintsugi: zwei Plätze neben Weber, zwei Textilhandwerke.
    - Autogiro → Mofa: „Auto“ in Spielzeugauto (Würfel) und Automaton (flach).
    - Kannelur → Kamee: direkt neben Triglyphe, zwei Teile des dorischen Tempels; „Kanne“ im entfernten Teekanne.
    - Lastenvelo → Stampflehm: „Lasten“ im entfernten Lastenaufzug.
    - Krüppelwalm → Nauen: „Walm“ in Walmdach (Würfel).
  - Schwer:
    - Dura-Europos → Avebury: „Europa“ (flach), „dura“ in Pietra dura (Würfel).
    - Philae → Segovia: Philae und Luxor, zwei Stätten in Ägypten auf derselben Seite 26.
  - Sehr schwer:
    - Ljapunow → Tensor: direkt neben Kolmogorow, zwei russische Mathematiker mit Endung „-ow“.
  - Die neuen Namen sind gegen alle flachen, Würfel- und entfernten Namen geprüft. Die alten waren nie auf main,
    deshalb nicht auf `entfernteNamen`. Golden ist nachgeführt.
- **Geprüft, in Ordnung:**
  - 300 Würfel-Level, 51 / 159 / 63 / 27; jedes erfüllt die Ebenen-Regel.
  - Jedes hat genau ein zählendes Urteil (`reihenfolge` bricht bei einem zweiten ab).
  - Herkunft: Format und Stand jedes Levels sind geprüft (wuerfelliste). Einen Seed nachzubauen ging hier nicht, weil
    `sh tools/leise.sh` in der Umgebung des Reviewers abgewiesen wurde.
  - Reihenfolge: Der Grad sinkt nie, das Mittel je 10 fällt nicht, keine Häufung der Kernidee ist offen.
  - PLAN.md 2.1 stimmt mit dem Stand überein.
  - Bilder (L1, L10, L25 aus wuerfel-9-q): Quader, Ebenen und Strahlen sind gut lesbar, auch auf dem Handy.
- **Tests:** wuerfelliste, levelliste, ki-tester, beurteilung, logic und golden mit Exit 0.
