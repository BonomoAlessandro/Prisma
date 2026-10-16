# 14: Würfel-Branch: Beurteilung im Würfel

**What to build:** Auf dem Branch `feature/3d-wuerfel` funktioniert die Beurteilung auch mit Würfel-Leveln. Das zeigt,
dass die Feldform an echten Würfeln taugt. Die Würfel-Logik bleibt auf dem Branch.

**Spec:** ../spec.md, Abschnitt „Würfel“.

**Blocked by:** 12 (Schwierigkeit geeicht), 13 (Spielwert geeicht)

**Status:** resolved

- [x] main ist in den Branch übernommen, die Konflikte sind gelöst, und alle Tests des Branches sind grün.
- [x] Auf dem Branch gibt es eine Würfel-Feldform: Zellen mit drei Koordinaten, 18 Richtungen und Drehachsen.
- [x] Die Tests der Beurteilung laufen zusätzlich mit Würfel-Leveln: Aufzug, Kern und Mini-Würfel-Level mindestens für
      Mischziel, Scheinmischung und Knäuel. Beim Knäuel zählen die Nachbarn im Raum.
- [x] Fehlt der Feldform auf main etwas, wird es dort mit eigenem Commit nachgezogen und nicht auf dem Branch umgangen.
- [x] Ausser diesen Korrekturen an der Feldform kommt nichts nach main.

## Comments

**Abschluss 16.10.2026.** Gearbeitet im Worktree `prisma-wt/t14` auf dem Branch `ticket-14` (Stand von
`feature/3d-wuerfel`), in drei Schritten. Alle Läufe gingen über `leise.sh` mit 20 %, nacheinander.

**Stufe A: Merge** (`1771c24`). „main“ heisst hier `feature/levelgenerator` (`2e05bae`); dort liegt die ganze Arbeit am
Levelgenerator.
- **Konflikte:**
  - `index.html`, Logikblock: Die schnelle Strahlregel aus Ticket 03 und 04 ist die Grundlage.
    - `traceBeams` wählt vor der Schleife `tracePass3` oder `tracePass`, an zwei getrennten Aufrufstellen. `tracePass`
      ist unverändert.
    - `tracePass3` ist auf die schnelle Fassung übertragen: Anhalten an `OPEN` mit `resume` und Weitermachen,
      `first` als Feld, ohne Ausnahme und `partialHits`.
  - `index.html`, `window.__prisma*`: beide Seiten behalten.
  - `tools/solver.mjs`: die Fassung aus `feature/levelgenerator`, dazu die Exporte des Würfels.
  - Golden-Test: die Fassung aus `feature/levelgenerator`, eine Obermenge der Fassung des Branches.
  - README und PLAN: beide Seiten behalten.
- **Nachweis:**
  - Würfel-Pfad des Branches gegen den übertragenen: 1502 Würfelfelder, 34 000 Strahlbilder, 2420 Suchen. Keine
    Abweichung, Kommazahlen bis 8,9e-16.
  - Neue Logiktests: Würfel-Level und Zufallswürfel gegen das Durchprobieren, jedes Blatt wie von vorn. Dazu jedes
    flache Level als Würfel mit einer Ebene: gleiche Strahlbilder und gleicher Löser.
- **Strahlregel für flache Level** (`bench.mjs trace solver`, Reihenfolge ABBA):
  - je Aufruf 1,082 und 1,057 µs vorher, 1,031 und 1,008 µs nachher;
  - in einem Prozess abwechselnd B/A = 0,998;
  - Löser 14,4 und 13,8 gegen 14,0 und 14,1 CPU-s, gleiche Knoten und Prüfsumme.

**Teil 1: Die Feldform kennt die Wirkung der Elemente** (`2e32eec`). Dieser Commit gehört nach `feature/levelgenerator`,
er enthält keinen Würfel-Code.
- **Neu in der Feldform:**
  - `spiegeln(el, richtung, stellung?)`, `brechen(el, richtung, farbe, stellung?)`, `ausgang(el, stellung?)`;
  - `startstrahl(zelle, richtung, farbe)` und `quelleStatt(el, stellung)`;
  - `drehachse(el)`.
  - Die Achse von `durchlauf` ist „die Linie“: die kleinere der beiden Richtungen statt Richtung modulo 4.
  - Richtungen sind die Zahlen 0 … n − 1 mit n ≤ 32.
- **Umgestellt:**
  - Das Spielermodell rechnet Tabellen aus `spiegeln`, `brechen` und `ausgang`.
  - `ohneZulauf`, Sammelstelle und Scheinmischung nutzen die Schnittstelle.
  - Ausserhalb der Feldform steht in `tools/beurteilung/` keine Richtungsnummer und kein `reflectOnMirror` oder
    `refractInPrism` mehr.
- **Bitgleich:** alle 342 Beurteilungen (150 ohne und mit den teuren Regeln, 42 Kandidaten der Eichmenge), verglichen
  mit `isDeepStrictEqual`. Golden-Test, Beurteilungstests und `eiche-schwierigkeit.mjs` mit unveränderten Gewichten.

**Teil 2: Würfel-Feldform** (nur auf dem Branch):
- **`tools/beurteilung/feldform-wuerfel.mjs`:**
  - Zellen „x,y,z“ Ebene für Ebene wie im Brett der Strahlregel.
  - Die 18 Richtungen der Strahlregel: die ersten acht wie im flachen Feld, dann die zehn mit Anteil in y.
  - Drehachse je Element (`axis`, Standard y).
  - Die Wirkung aus `planeDir`, `reflect3` und `refractInPrism3`; eine eigene Strahlregel gibt es nicht (ADR 0003).
- **Weiche:** `feldformVon` liefert sie bei `dim: 3`; das ist die einzige Änderung in einer gemeinsamen Datei. Die
  Erwartung in `feldform.test.mjs` ist für den Branch angepasst.
- **Tests in zwei neuen Dateien:**
  - `tests/beurteilung/feldform-wuerfel.test.mjs` (13 Tests): Zellen, Richtungen, Nachbarn. Jede Wirkung für jede
    Achse, Stellung und Richtung gegen die Strahlregel. Durchlauf senkrecht und schräg. Drehungen mit gleichem
    Strahlbild.
  - `tests/beurteilung/wuerfel.test.mjs` (10 Tests): Aufzug und Kern ganz beurteilt; Mini-Würfel für Mischziel,
    Scheinmischung und Knäuel. Flache Level als Würfel mit einer Ebene.
  - Gegenprobe: Vier Verfälschungen der Würfel-Feldform machen die Tests rot: falsche Stellung beim Drehen,
    Raumdiagonalen als Nachbarn, Achse des Durchlaufs je Laufrichtung, gedrehtes Prisma trotz umgekehrter Achse.
- **Flache Level über die Würfel-Feldform:** Alle 150 als Würfel mit einer Ebene werden genau wie flach beurteilt, ohne
  und mit den teuren Regeln (0 Abweichungen, bis auf die Schreibweise der Zellen). Der Test prüft jedes 10. Level mit
  allen Regeln. Das prüft jede Regel der Beurteilung an der Würfel-Feldform, nicht nur die mit eigenem Mini-Würfel.

**Auslegungen:**
- **Knäuel im Würfel** (Entscheid des Nutzers): Es zählen die 18 Nachbarn ohne Raumdiagonalen, dieselben Richtungen,
  in denen ein Strahl läuft.
  - Die Grenze 1,30 bleibt vorläufig.
  - Im Raum hat ein Element bis zu 18 Nachbarn statt 8, ein dichter Würfel erreicht die Grenze also leichter.
  - Neu zu prüfen, sobald der Generator Würfel-Level liefert (Ticket 22).
- **Drehungen im Würfel** (Entscheid: vier um die senkrechte Achse, Achsen und Stellungen über die Ebenenbasis
  mitgedreht): So umgesetzt, aber geliefert werden nur die Drehungen, die sich mit den Elementen der Strahlregel
  darstellen lassen.
  - Der Grund: Die Ebenenbasis (`AXES`) ist für jede Achse fest und rechtshändig. Kehrt eine Drehung die Achse eines
    Prismas um, z wird etwa zu −x, bräche das gedrehte Prisma Rot und Blau zu den vertauschten Seiten. Keine Achse
    und Stellung der Strahlregel bricht so; ein Test belegt das für jede Achse, Stellung und Drehung.
  - Ein Prisma mit Achse x lässt 0 und 1 Vierteldrehung zu, eines mit Achse z 0 und 3. Aufzug und Kern haben darum je
    zwei Drehungen; mit Prismen beider Achsen bleibt nur das Level selbst.
  - Spiegel, Quellen, Kombinatoren und Prismen mit Achse y drehen immer mit; ohne Prisma mit waagrechter Achse sind es
    alle vier.
  - **E:** So lassen? Oder Achsen mit Richtung im Elementmodell des Branches (etwa `axis: '-x'`), dann gingen immer
    alle vier? Das wäre eine Änderung der Strahlregel und der Leveldaten auf dem Branch.
- **Mini-Würfel:** gebaut mit `miniLevel` aus dem Testhelfer plus `dim` und `size`; der Helfer ist unverändert.

**Beurteilung von Aufzug und Kern** (`beurteile` ohne Grad, mit allen Regeln; Rang unter den 150 heutigen Leveln):

| | Aufzug | Kern |
|---|---:|---:|
| Schwierigkeit | 20,5 (über 1 der 150) | 39,4 (über 23) |
| Spielwert | 51 (über 38) | 83,8 (über 123) |
| Haupt-Kernidee | keine | Mischziel aus zwei Quellen |
| Ausschlussgründe | keine | keine |

- **Aufzug ist leicht, und das passt:**
  - Eine Quelle, drei drehbare Elemente.
  - Das Spielermodell entscheidet alle drei rückwärts von den Zielen her, ohne Fallunterscheidung (Schliessen 1).
  - Nötig ist nur das Zerlegen im Prisma (Farblogik 1), Mischung und Zusammenspiel gibt es keine.
  - Weglänge 6 Abschnitte.
  - Schwierigkeit 20,5 liegt bei den leichtesten heutigen Leveln (Mittel der Plätze 1–30: 33,8).
  - Ohne Kernidee liegt der Spielwert unter dem Mindest-Spielwert 60. Das gilt auch für 82 der 150 heutigen Level, vor
    allem die leichten.
- **Kern liegt zwischen den leichten und den mittleren, mit hohem Spielwert, und das passt:**
  - Fünf drehbare Elemente, eine Fallunterscheidung bei Horizont 2 (Spiegel 2,0,0: 3 von 4 Stellungen widerlegt).
  - Gemischt und zerlegt wird je einmal nötig.
  - Kernidee: Das Magenta in der Würfelmitte kommt nur aus Rot und Blau zweier Quellen; das beschreibt
    `3D-WUERFEL.md` als Idee des Levels.
  - Zusammenspiel 2 Stellen: das gemeinsame Mischziel 2,2,2 und die Kreuzung von Grün und Blau in der leeren Zelle
    2,3,4, die `3D-WUERFEL.md` ebenso nennt.
  - Fast-Lösungen 48 von 182 Strahlbildern, keine weite.
- **Was die Beurteilung im Würfel nicht sieht:** die Lesbarkeit im Raum, laut `3D-WUERFEL.md` das Hauptrisiko. Die
  Schwierigkeit misst Denkarbeit wie im flachen Feld, die Mühe, Tiefe und Achse zu erkennen, nicht. Das wäre eine Frage
  an die KI-Tester, sobald es mehr Würfel-Level gibt.

**Tests am Schluss** (Wanduhr):

| Lauf | Ergebnis | Dauer |
|---|---|---:|
| `node tests/golden.mjs` | grün | 3,1 s |
| `node tests/golden.mjs --voll` | grün | 16,7 s |
| `node tests/logic.test.mjs` | 574 grün (558 auf `feature/levelgenerator`) | 28,9 s |
| `node tests/beurteilung.test.mjs` | 194 grün (171 nach Teil 1, 23 neue Würfel-Tests) | 43,3 s |
| `node tests/ki-tester.test.mjs` | 54 grün | 0,4 s |
| 342 Beurteilungen gegen den Stand vor Teil 1 | bitgleich | 28,7 s |
| Würfel-Probe `cube-click` | jeder Klick dreht das angeklickte Element | 51 s |
| Würfel-Probe Kern gelöst | „Ziele 3/3“, keine Konsolenmeldung | 70 s |

Der Beurteilungstest braucht mit den Würfel-Tests rund 6 s mehr (vorher 36–37 s). Allein braucht `wuerfel.test.mjs`
4,9 s, vor allem für den Vergleich der 15 flachen Level als Würfel auf vier Threads; `feldform-wuerfel.test.mjs` 0,2 s.

**Hinweise:**
- **Für die gemeinsame Feldform** (ein Kandidat für eine spätere Korrektur an Teil 1, nicht umgesetzt): Die
  Vierteldrehung der flachen Feldform dreht `dir` und `rot` nur, wenn sie in den Leveldaten stehen.
  - Ein Element ohne Angabe (Standard 0) bliebe ungedreht; ein gedrehtes Level wäre dann nicht mehr dasselbe Rätsel.
  - Heute betrifft das kein Level. Ein Mini-Level oder ein Generator, der die 0 weglässt, wäre betroffen.
  - Die Würfel-Feldform nimmt fehlende Angaben als 0.
  - Im Review behoben: Quellen und Kombinatoren drehen `dir`, Spiegel und Prismen `rot`; fehlt die Angabe, gilt 0.
    Je ein Test mit einem Mini-Level ohne Angaben, flach und im Würfel. Die 342 Beurteilungen bleiben bitgleich.
- **Ticket 22 (Würfel-Generator):** Grenze des Knäuels im Raum, Drehungen bei Prismen mit waagrechter Achse (siehe
  Entscheid oben).
- **Ticket 27 (ein Pfad):** `tracePass3` ist weiter ein eigener Durchlauf, jetzt mit derselben Mechanik wie `tracePass`.
  Der Test „flaches Level als Würfel mit einer Ebene“ im Logiktest ist dafür schon das Sicherheitsnetz.
- **Übertragung:** Teil 1 und dieses Ticket kommen getrennt auf `feature/levelgenerator`, Teil 2 bleibt auf dem
  Branch.

Commit siehe git log.
