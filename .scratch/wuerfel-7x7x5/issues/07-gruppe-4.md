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

**26.10.2026, Reviewer: in Ordnung nach zwei Umbenennungen** (Branch `review/quader-07`).

- **Umbenannt:**
  - Wandteppich → Barkasse. Wandteppich heisst dasselbe wie Tapisserie (Platz 81). Dazu standen auf den Plätzen
    114–124 fünf Kunst-Namen: Triptychon, Wandteppich, Emaille, Relief, Ikone.
  - Ikone → Zeppelin. Ikone und Triptychon sind beide sakrale Tafelbilder. Auf den Plätzen 118–127 fehlten Schiffe und
    Fahrzeuge.
  - Beide Namen sind frei, auch gegenüber `entfernteNamen` (Draisine und Rikscha stehen dort). Sie teilen kein
    Grundwort und sind kein Teilwort. Golden ist nachgeführt.
- **Herkunft:** Harappa und Sanchi hatten „Ziel 74,0–86,0“. Jetzt steht dort „Ziel 74–86“, wie bei den flachen Leveln
  (`zielText` in `ordne-level.mjs`). `ordne-wuerfel.mjs` schreibt das Ziel nun ebenso. Beide stehen mit Auftrag, Seed,
  Ziel [74, 86] und Stand 4ef5157 in `tests/output/quader/pool-2-schwer-oben.jsonl`, mit gleichem Abdruck. Der Pool
  hat 76 Kandidaten aus 4 Aufträgen.
- **Geprüft, in Ordnung:**
  - Die Namen sind eindeutig über alle 684 Level, und keiner steht auf `entfernteNamen`. Sie teilen kein Grundwort.
    Nur das Bestimmungswort teilen Federball (Federkiel, entfernt), Schiessstand (Schiessscharte, entfernt),
    Ankerwinde (Ankerplatz) und Spielzeugauto (Spieluhr). Diese Namen bleiben.
  - Der Stil passt je Grad. Schwer sind antike Stätten, sehr schwer Mathematik: Lemniskate, Cauchy, Fourier.
  - Die Verteilung ist 32 / 95 / 33 / 15, neu 4 / 13 / 5 / 3.
  - Protokoll: wuerfel-4-q hat 25 Urteile, 21 davon im Spiel. Nicht im Spiel sind 7f6e688e (von beiden abgelehnt,
    Knäuel), 5e4f94f8, e92487d8 und 8188f8f7. wuerfel-4-q2 hat 4 Urteile, alle im Spiel. Damit hat jedes neue Level
    genau ein Urteil. Bei Lemniskate lehnt nur B ab (Knäuel), also ist es nicht abgelehnt.
  - Die Plätze der Anker steigen: 2/26/36/126/147/158/171/172 und 2/25/36/126/145/158/173/174.
  - Die Ebenen-Regel gilt für alle 25. Jedes Level steht am Boden. Ankerwinde und Droschke liegen mit den Ebenen 0–2
    knapp darin.
  - Bilder, Stichproben wuerfel-4-q L9 (Federball) und L14 (Droschke), dazu wuerfel-4-q2 L2 (Harappa): Die Level gehen
    über mehrere Ebenen, mit Elementen am Boden.
- **Offen:**
  - Lemniskate und Cauchy haben bei beiden Testern nur Gefühl 3 und 2. Das ist erlaubt, aber knapp für „sehr schwer“.
  - Dampfwalze und Walzer (flach) sehen sich ähnlich, haben aber ein anderes Wort. Der Name bleibt.
  - Auf den Plätzen 115–120 stehen noch vier Instrumente: Spinett, Clavichord, Grammophon, Bandoneon. Instrumente
    weiter nur selten vergeben, Kunst-Namen ebenso.
  - Gleichbedeutende Namen wie Wandteppich und Tapisserie findet das Namen-Skript nicht. Auf sie achtet man von Hand.
