# 07: Würfel-Gruppe 4 in 7 × 7 × 5 (175 Level)

**Spec:** ../spec.md

**Blocked by:** 06

**Status:** resolved

**What to build:** 25 neue Würfel-Level 7 × 7 × 5 nach dem Ablauf einer Gruppe (Spec `wuerfel-500`), alle nach
der Ebenen-Regel. Neu je Grad (leicht / mittel / schwer / sehr schwer): 4 / 13 / 5 / 3. Danach im Spiel: 32 / 95 / 33 / 15.

- [x] 25 neue Level, je Grad wie oben; Fehlmengen begründet und für die nächste Gruppe vermerkt.
- [x] Genau eine Lösung, Beurteilung bestanden, ab „mittel“ nötige Kernidee, Ebenen-Regel erfüllt, keinem anderen
      Würfel-Level zu ähnlich.
- [x] Beide KI-Tester haben jedes neue Level beurteilt; von beiden abgelehnte sind ersetzt.
- [x] Namen ohne Freigabe, eindeutig, gut unterscheidbar; Herkunft nachbaubar.
- [x] Golden-Referenz, alle Tests grün, Stichproben der Screenshots, auf `feature/3d-wuerfel` gepusht; Review.

## Comments

**26.10.2026, Koordinator: erledigt.** Im Spiel stehen jetzt 175 Würfel-Level, je Grad 32 / 95 / 33 / 15, wie in der Tabelle.

- **Häufung:** Die erste Wahl liess Seite 16 offen, mit „Sammelstelle“ 5-mal. Die Häufung bestand nur aus Leveln im Spiel: Olympia, Torii, Schlossanlage, Bagan, Pergamon.
  - Lösung: Zwei leichtere schwere Kandidaten, 8188f8f7 und e92487d8, sind ersetzt durch schwere aus dem Bereich 74–85 mit anderer Kernidee. Die Wahl lief dafür mit `--ohne` über alle übrigen schweren.
  - Mit „Mischziel“ häufte sich dann dasselbe. Darum waren nur Abschalten, Falle und Farben abzählen erlaubt.
  - Dafür war der Pool zu dünn. Neu ist `pool-2-schwer-oben.jsonl`, Stand 4ef5157, `--schwierigkeit 74,86`, 4 Aufträge × 2000 Seeds, 76 Kandidaten, davon 47 mit erlaubter Kernidee.
  - Damit gewählt: c7838a0b und 43059b46. Danach ist keine Häufung offen.
- **KI-Tester:**
  - **wuerfel-4-q:** 25 Kandidaten, darunter die zwei ersetzten.
    - Abgelehnt: 7f6e688e (sehr schwer), beide Tester nennen Knäuel.
    - Ersetzt, obwohl nicht abgelehnt: 5e4f94f8 (leicht, ein einziger Strahl, Gefühl 2/3), wie in Gruppe 2.
    - Beide stehen in `ohne.txt`.
  - **wuerfel-4-q2:** 4 Ersatzlevel (f9f13c19, c7838a0b, 1a2e2a61, 43059b46), keines abgelehnt.
- **Namen:** Federball, Notizbuch, Wollknäuel, Wandteppich, Relief, Schiessstand, Droschke, Dampfwalze, Ikone, Lithografie, Blasebalg, Fontäne, Sessellift, Emaille, Bojenfeld, Ankerwinde, Baalbek, Jerash, Dougga, Lemniskate, Cauchy, Sanchi, Harappa, Spielzeugauto, Fourier.
  - Nach Review 06 ist jeder Name gegen gleiches Wortende, Teilwort und Ähnlichkeit geprüft, gegen das Spiel und `entfernteNamen`. Auch Namen, die von Hand gewählt sind.
  - Von Hand ersetzt: vier Schiffsteile hintereinander und drei Physik-Namen bei „sehr schwer“. Die Instrumente stehen im Vorrat zuletzt.
- **Golden und Tests:** Golden nachgeführt (684 Level). Alle Tests mit Exit 0, je Test geprüft.
