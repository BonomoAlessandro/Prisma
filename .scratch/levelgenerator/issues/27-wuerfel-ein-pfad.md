# 27: Würfel-Branch: ein Pfad für flache Level und Würfel

**What to build:** Auf dem Branch `feature/3d-wuerfel` rechnen flache Level und Würfel-Level über denselben Pfad der
Strahlregel. Ein flaches Level ist dabei ein Würfel mit einer Ebene (ADR 0003). Damit verhält sich der Strahl überall
gleich, und jede Änderung der Strahlregel geschieht nur einmal. Das ist die Voraussetzung, bevor der Würfel irgendwann
nach main kommt.

**Spec:** ../spec.md, Abschnitt „Würfel“.

**Blocked by:** 03 (Strahlregel schneller). Dessen Beschleunigung wird übernommen.

**Status:** resolved

- [x] Flache Level laufen über denselben Pfad wie Würfel-Level. Der getrennte Würfel-Pfad entfällt.
- [x] Der Golden-Test ist grün: Das Verhalten stimmt exakt, Kommazahlen weichen höchstens um 1e-9 ab.
- [x] Der flache Fall ist nicht langsamer als auf main, gemessen mit dem Messskript aus Ticket 02. Heute ist der
      Würfel-Pfad etwa 1,3-mal langsamer.
- [x] Alle Würfel-Tests auf dem Branch sind grün.
- [x] Nichts davon kommt nach main, bevor der Würfel als Ganzes kommt.

## Comments

**Umgesetzt (17.10.2026).** Gearbeitet im Worktree `.claude/worktrees/agent-a515546cd92810a07` auf dem Branch
`ticket/27-wuerfel-ein-pfad` (Stand von `feature/3d-wuerfel`, `cf636c6`), Code in `bcdfb1f`. „main“ heisst hier wie in
Ticket 14 `feature/levelgenerator` (`974c4f0`). Alle Läufe gingen über `leise.sh`, nacheinander: Messungen mit 20 %,
Tests und Proben mit 50 %.

**Ein Durchlauf:** `tracePass` rechnet flache Level und Würfel, `tracePass3` ist weg; `traceBeams` ruft nur noch
`tracePass` auf.
- **Ein flaches Level ist ein Würfel mit einer Ebene:** y = 0, Drehachse y, Raster `z · size + x` wie die unterste
  Ebene des Würfels. Die 18 Richtungen stehen in `DIRS3`; die ersten acht sind die von `DIRS` mit derselben Nummer,
  wie in der Würfel-Feldform aus Ticket 14. Ein Strahl trägt die Nummer seiner Richtung.
- **Drehebene über Tabellen je Achse:** `PLANE_K` (Richtung des Anteils in der Ebene), `PLANE_A` (Anteil längs der
  Achse) und `FROM_PLANE` (zurück zur Richtung im Raum). Für Achse y und die acht Richtungen der Ebene sind sie die
  Gleichheit.
- **Spiegel:** Der Anteil in der Drehebene wird mit `reflectOnMirror` gespiegelt, wie in 2D, der Anteil längs der
  Achse bleibt. Das ist bei jedem Treffer derselbe Aufruf wie bisher im flachen Pfad; die Gegenprobe des Golden-Tests,
  die `reflectOnMirror` verfälscht, fällt deshalb weiter in 100 Leveln auf. `reflect3` und `mirrorFrontNormal3` folgen
  derselben Regel statt der eigenen Vektorrechnung. Ein neuer Logiktest vergleicht die Spiegelregel für jede Achse,
  Stellung und Richtung mit der Vektorformel d − 2 (d·n) / (n·n) · n.
- **Prisma:** `refractInPrism` in der Drehebene; Licht schräg zur Ebene tritt nicht aus, wie bisher.
- **Ausgabe:** Flache Level ohne y, mit Normalen `[nx, nz]`, so wie bisher (`litCells` und die Darstellung erkennen
  daran den flachen Fall). Würfel mit `y`, `y0`/`y1` und `[nx, ny, nz]`.
- **Übernommen aus Ticket 03:** alles, was `tracePass` schon hatte: `OPEN` mit Anhalten und Weitermachen, `first` als
  Feld, `seen` als Feld, `Math.sqrt` statt `Math.hypot`, keine Destrukturierung im Rasterschritt.
- **Neu schneller:** Die Normalen der Spiegel (`MIRROR_FRONT`, `MIRROR_FRONT3`) und die austretenden Strahlen der
  Prismen (`PRISM_OUT`) stehen in Tabellen. Sie entstehen beim Laden aus `mirrorFrontNormal` und `refractInPrism`,
  statt bei jedem Treffer neue Felder zu bauen. Auch die Normale am Ende eines Abschnitts kommt aus einer Tabelle
  (`BACK_DIRS`). Alle Einträge sind eingefroren wie bisher `UNIT_DIRS`, weil Strahlen sie teilen.

**Gleich geblieben** (alter Stand `cf636c6` gegen neu, Skript im Scratchpad):
- **Strahlbilder:** 84 080 Stück. Dazu gehören 47 700 flache (159 Level × 300 Zufallsstellungen), Aufzug und Kern mit
  je 3000, 1500 Zufallswürfel (Kante 3–6, alle Achsen und Elementtypen) mit je 20 sowie Startstrahlen in allen 18
  Richtungen.
  - Kein diskretes Feld weicht ab.
  - Die flachen Level sind bitgleich.
  - Im Würfel weichen Kommazahlen um höchstens 2,2e-16 ab, weil die Normale jetzt aus der 2D-Normalen in der
    Drehebene entsteht statt mit `unit3`.
- **Spiegel:** `reflect3` gibt in allen 432 Fällen (3 Achsen × 8 Stellungen × 18 Richtungen) dasselbe wie vorher.
- **Löser:** 5002 Würfel (Aufzug, Kern und Zufallswürfel) in den Modi Standard, `prune: false` und `unique`. Die
  Ergebnisse sind gleich, verglichen mit `isDeepStrictEqual`.

**Flacher Fall** (i7-9750H, 12 logische Kerne, Node 22.12.0):
- **Messskript:** `tools/bench.mjs trace solver` mit den Standardoptionen (20 000 Stellungen, Seed 1), CPU-Zeit.
  - Gleiches Skript für alle drei Stände: das des Branches; bei `trace` und `solver` gleicht es dem auf
    `feature/levelgenerator`.
  - Jeder Stand lief als Kopie von `index.html` und `tools/solver.mjs`, in der Reihenfolge vorher, nachher, lg, lg,
    nachher, vorher, ein Prozess je Lauf (23:11–23:16).

| | vorher (`cf636c6`) | nachher | `feature/levelgenerator` |
|---|---:|---:|---:|
| Strahlregel je Aufruf | 1,498 / 1,623 µs | 1,448 / 1,524 µs | 1,524 / 1,522 µs |
| Löser über 159 Level | 19,9 / 20,2 CPU-s | 19,0 / 18,8 CPU-s | 19,6 / 20,0 CPU-s |

- **Gleiche Strahlbilder und Knoten:**
  - Die Prüfsumme ist vorher und nachher `70adec2148791d44`. Auf `feature/levelgenerator` ist sie
    `d0b21dcf4c222983`, weil die Level dort anders geordnet sind; damit sind auch die Zufallsstellungen andere.
  - Der Löser hat überall 9 831 779 Knoten.
- **In einem Prozess abwechselnd:** Getrennte Prozesse streuen bis 20 % (Ticket 03). Darum lief der Vergleich auch in
  einem Prozess, auf denselben 159 Leveln und Stellungen, mit 30 Blöcken zu 318 000 Aufrufen.

| | `feature/levelgenerator` | nachher | Würfel-Pfad vorher (`tracePass3`, flaches Level als Würfel) |
|---|---:|---:|---:|
| Strahlregel, Median je Aufruf | 1,670 µs | 1,572 µs (× 0,94) | 2,849 µs (× 1,71) |
| Löser, Mittel aus 2 Runden, je Level abwechselnd | 20,65 CPU-s | 18,92 CPU-s (× 0,92) | |

- **Ohne die Tabellen** (erster Stand) war der eine Durchlauf gleich schnell wie `feature/levelgenerator`: in einem
  Prozess × 1,00 (Summe) bzw. × 1,03 (Median) bei der Strahlregel und × 1,02 beim Löser. Mit den Tabellen ist er
  schneller.
- **Der frühere Würfel-Pfad** war auf flachen Leveln 1,7-mal langsamer, nicht 1,3-mal, wie das Ticket schätzte.

**Tests am Schluss** (Wanduhr, nacheinander über `leise.sh` mit 50 %):

| Lauf | Ergebnis | Dauer |
|---|---|---:|
| `node tests/golden.mjs` | grün, Gegenprobe grün | 4,8 s |
| `node tests/golden.mjs --voll` | grün | 26,8 s |
| `node tests/logic.test.mjs` | 575 grün (574 + Spiegelregel gegen Vektorformel) | 45,9 s |
| `node tests/beurteilung.test.mjs` | 196 grün | 57,3 s |
| `node tests/ki-tester.test.mjs` | 54 grün | 0,4 s |
| Würfel-Probe `cube-click` | jeder Klick dreht das angeklickte Element | 57 s |
| Würfel-Probe Kern gelöst | „Ziele 3/3“, keine Konsolenmeldung | 77 s |

**Abweichungen:**
- **Tabellen:** Die Normalen der Spiegel und die Austritte der Prismen kommen aus Tabellen, nicht aus einem Aufruf je
  Treffer. Die Regel bleibt dieselbe, die Tabellen entstehen aus `mirrorFrontNormal` und `refractInPrism`. Verlangt war
  das nicht; es gleicht die zusätzliche Arbeit des Würfels im flachen Fall mehr als aus.
- **Geteilte Normalen:** Normalen sind jetzt auch über Aufrufe hinweg geteilte, eingefrorene Felder. Bisher waren nur
  die der Startstrahlen geteilt. Kein Aufrufer verändert sie.
- **Brett:** `createBoard3` bleibt eine eigene Fassung. Das Brett gehört nicht zur Strahlregel, und die Prüfungen
  unterscheiden sich (Ebene y Pflicht, Achse).
- **Schleifenerkennung:** Ihr Schlüssel ist neu, mit Kantenlänge bis 64 und 18 Richtungen. `MAX_SIZE_3D` (16) bleibt.
- **Startstrahlen:** Ein Startstrahl im Würfel mit ungültiger Richtung (Raumdiagonale) wirft jetzt einen Fehler.
  Bisher blieb er ungeprüft.
- **`mirrorFrontNormal3`:** Bei einem Strahl genau parallel zur Spiegellinie kann die Seite der Normalen anders
  ausfallen als vorher, wegen eines Rundungsrests wie in 2D. Die Strahlregel braucht diesen Fall nie, der Strahl endet
  dort an der Rahmenkante.

**Hinweise:**
- **Gemeinsamer Gültigkeitsbereich:** Der Logikblock teilt ihn mit dem Renderer.
  - Den ersten Namen für das leere Prisma (`NO_LIGHT`) gab es dort schon. Im Browser wäre das ein Syntaxfehler gewesen.
  - Die Logiktests laden nur den Logikblock und sehen so etwas nicht. `node --check` auf das Skript der Seite und die
    Würfel-Proben finden es.
- **Ticket 22 (Würfel-Generator):** Er kann `tracePass` ohne Weiche nutzen; die Richtungsnummern von `DIRS3` sind
  die der Würfel-Feldform.
- **Bevor der Würfel nach `feature/levelgenerator` kommt:** Der flache Fall ist dort nicht langsamer. Die Tabellen
  könnten auch allein vorab übernommen werden, wenn die Strahlregel dort schneller werden soll.

Commit siehe git log.

**Review (18.10.2026).** Unabhängiger Reviewer im selben Worktree, Korrekturen in `8f8d8f0`. Alle Läufe über
`leise.sh` mit 50 %, nacheinander; die Skripte liegen im Scratchpad unter `review27\`.

**Geprüft:**
- **Ein Durchlauf** (`git diff cf636c6 HEAD`):
  - Flach ist `A = 0`, `y = 0`, Richtungen 0–7. Die Tabellen der Drehebene sind dort die Gleichheit, und die Rechnung
    ist dieselbe wie vorher, auch die Länge mit `ly = 0`. Darum sind die flachen Level bitgleich.
  - Spiegel im Würfel: `nk` hat dieselbe Parität wie `k`; mit Anteil längs der Achse ist `k` gerade, es entsteht also
    nie eine Raumdiagonale. Parallel heisst `k ≡ rot (mod 4)` oder längs der Achse, mit Rückversatz `MIRROR_EDGE` wie
    bisher. Die Seite der Normalen hängt von `n · d` in der Ebene ab, und das ist dasselbe wie im Raum.
  - Prisma: `PRISM_OUT` ist leer bei einem Anteil längs der Achse, Mischlicht zerfällt über `refractInPrism` je Farbe.
  - Rand: y wird nur bei `dy ≠ 0` geprüft. Das ist gleichwertig, weil jeder Strahl in einer Zelle des Würfels startet.
  - Raster `(y · S + z) · S + x`, Anhalten und Weitermachen mit `cy`.
- **Schlüssel der Schleifenerkennung:** eindeutig für Kantenlänge unter 64, 18 Richtungen und 8 Farben. Der grösste
  Wert ist 37 748 735, weit unter 2^53.
- **Geteilte, eingefrorene Normalen:** Kein Aufrufer verändert sie.
  - Die Seite liest sie nur über `normalToWorld` (`fromArray`, `set`), in `buildBeamGeometry` sowie bei Flecken und
    Blitzen. Löser, Beurteilung und Werkzeuge lesen sie höchstens. `golden.mjs` ändert nur eine Kopie
    (`structuredClone`).
  - Das Skript der Seite läuft mit `'use strict'`, ein Schreibversuch würfe also.
  - Stichprobe: Alle Normalen in 30 000 Würfel- und 159 flachen Strahlbildern sind eingefroren, ein zweiter Aufruf
    ergibt dasselbe.
- **Gültigkeitsbereich:** `node --check` auf das Hauptskript der Seite ist grün, vor und nach dem Review. Keiner der
  neuen Namen kommt ausserhalb des Logikblocks vor, auch nicht in `backgrounds/skies.js` oder im Skript im Kopf. Das
  gilt auch für `dirIndex` und `AXIS_NAMES` aus dem Review.
- **Stichproben mit den Skripten des Entwicklers** (gegen `cf636c6`):
  - **Kopien:** `vorher`, `nachher` und `lg` entsprechen `cf636c6`, `69ff89d` und `974c4f0`, bis auf die Zeilenenden.
    `bench.mjs` ist überall das des Branches; die Teile `trace` und `solver` sind dieselben wie auf `974c4f0`.
  - **`vergleich.mjs`:** 84 080 Strahlbilder gleich, flach 0 nicht bitgleich, im Würfel höchstens 2,2e-16, wie notiert.
  - **`vergleich-loeser.mjs`:** gleich, aber dünn. Es sind 23 152 Knoten auf 15 006 Suchen. Meist verzweigt die Suche
    nicht, weil das Licht in Zufallswürfeln selten ein drehbares Element trifft.
- **Eigene Stichproben** mit anderen Seeds:
  - **Strahlbilder:** 3000 Zufallswürfel mit Kante 2–8 und bis 25 Elementen, je 10 Stellungen. Die Hälfte davon
    bekommt einen Startstrahl ab einer Randzelle in einer der 18 Richtungen. Alles gleich, Kommazahlen höchstens
    4,4e-16 verschieden.
  - **Randfälle darin:**
    - 7 572 Abschnitte laufen über eine Würfelkante hinaus.
    - Prismen: 1 407 mit Mischlicht, 2 941 ohne Austritt.
    - Spiegel: 4 535 Treffer bei waagrechter Achse. Parallel liefen 320 Strahlen in der Ebene, 180 längs der Achse
      und 1 091 schräg.
  - **Löser:** 8 000 Würfel, deren Elemente auf dem Lichtweg liegen, in den Modi Standard, `prune: false` und
    `unique`. Alles gleich, bei 190 992 Knoten.
  - **Urteil zum Nachweis:** tragfähig. Dazu tragen auch `golden.mjs --voll` (derselbe Durchlauf, flach 9,8 Mio.
    Knoten) und die Logiktests gegen das Durchprobieren bei.
- **Messung:** methodisch sauber.
  - Dasselbe `bench.mjs` für alle drei Stände, CPU-Zeit, gleicher Rechner und dieselbe Sitzung, Reihenfolge ABCCBA,
    `LEISE_CPU=20` wie in Ticket 02.
  - Getrennte Prozesse streuen mehr, als die Stände sich unterscheiden: vorher 1,498 und 1,623 µs. Darum zählt der
    Vergleich in einem Prozess.
  - Nachgemessen in einem Prozess mit 16 Blöcken zu 636 000 Aufrufen, den Löser in 2 Runden:

| neu gegen `feature/levelgenerator` | Faktor |
|---|---:|
| Strahlregel, Median der Blöcke | × 0,94 |
| Strahlregel, Summe | × 0,98 |
| Strahlregel, je Block (kleinster bis grösster) | × 0,76–1,51 |
| Löser, gleiche Knoten | × 0,935 |
| früherer Würfel-Pfad (`tracePass3`), Median | × 1,80 |

  - **„Nicht langsamer“ ist belegt.** Beim Löser zeigen drei Messungen denselben Gewinn (× 0,92–0,95). Bei der
    Strahlregel liegt er innerhalb der Streuung; der Rechner war durch andere Läufe belastet.
- **Abnahme:** Alle fünf Punkte sind erfüllt.

**Behoben** (`8f8d8f0`):
- **Ungültige Richtung:** `reflect3` und `mirrorFrontNormal3` rechnen seit dem Umbau über die Nummern der 18
  Richtungen.
  - Bei einer Raumdiagonale oder einem Nullvektor gaben sie bisher mit Achse x oder z still eine falsche Richtung
    bzw. Normale zurück, mit Achse y warfen sie einen TypeError.
  - Jetzt melden sie wie der Startstrahl „… mit ungültiger Richtung“ (`dirIndex`).
  - Die Beurteilung ruft sie nur mit den 18 Richtungen auf.
- **Neuer Logiktest für die Normalen:**
  - Die Normale am Spiegel aus der Verfolgung gleicht `mirrorFrontNormal3`, für jede Achse, Stellung und Richtung
    (288 Treffer). Das gilt auch mit Anteil längs der Achse. Die Abschnitte davor und danach tragen dieselbe Normale.
  - Gegenprobe: Bei einer falschen Tabelle `MIRROR_FRONT3` (Achse y für alle) blieben die Logiktests bisher grün; nur
    zwei Drehungstests der Beurteilung wurden rot.
  - Der neue Test findet sie, ebenso eine Normale ohne Seitenwahl.
- **Neuer Logiktest für die Meldung** bei ungültiger Richtung: Startstrahl, Spiegelung und Normale.
- **Kleinigkeiten:**
  - `AXIS_NAMES` statt der verschachtelten Bedingung in `inPlane`.
  - Kommentar zu `MAX_SIZE_3D`: Der Schlüssel trägt bis 64.
  - Kommentar zu `extraRays`: Auch die Beurteilung nutzt sie, nicht nur die Tests.
  - `3D-WUERFEL.md` sagt genauer, dass nur noch das Brett getrennt ist, und nennt 577 Logiktests.

**Offen:** keine mittleren oder grossen Funde. Hinweise (niedrig, kein Muss):
- **Zweite Abbildung:** `refractInPrism3`, `planeDir` und `planeIndex` rechnen die Abbildung zwischen Raum und
  Drehebene ein zweites Mal, neben `PLANE_K`, `FROM_PLANE` und `PRISM_OUT` in der Verfolgung.
  - Dass beide gleich rechnen, belegt der Beurteilungstest „Brechen wie die Strahlregel“ für jede Achse, Stellung und
    Richtung.
  - Wer sie auf die Tabellen umstellt, achtet auf −0: `planeDir` liefert etwa bei Achse z `-0`, die Tabellen `+0`.
- **Doppelte Ereignisse:** In `tracePass` steht jedes der acht Ereignisse zweimal da (`cube ? { x, y, z, … } :
  { x, z, … }`).
  - Das ist bewusst so, wegen der festen Objektform und ohne Spread.
  - Ein Helfer, der die Felder nachträglich setzt, wäre kürzer, müsste aber neu gemessen werden.
- **Bitmaske:** `el.rot & 7` steht als Index der Tabellen, sonst überall `mod8`. Gleichwertig, weil Stellungen ganze
  Zahlen sind.

**Tests nach dem Review** (Wanduhr, nacheinander über `leise.sh` mit 50 %, Node 22.12.0; der Rechner war durch andere
Läufe belastet):

| Lauf | Ergebnis | Dauer |
|---|---|---:|
| `node tests/golden.mjs` | grün, Gegenprobe in 100 Leveln | 4,7 s |
| `node tests/golden.mjs --voll` | grün | 24,0 s |
| `node tests/logic.test.mjs` | 577 grün (575 + 2 aus dem Review) | 43,9 s |
| `node tests/beurteilung.test.mjs` | 196 grün | 83,7 s |
| `node tests/ki-tester.test.mjs` | 54 grün | 0,3 s |
| `node tests/offline.mjs` | grün | 72,1 s |
| Interaktionsprobe auf einem flachen Level | Klick, Rechtsklick und Ziehen gehen; keine Konsolenmeldung | 36 s |

Die Würfel-Proben im Browser habe ich nicht wiederholt. Das Review ändert nichts, was die Seite beim Spielen aufruft,
ausser `inPlane` beim Laden; das ist dieselbe Rechnung und durch die Logiktests abgedeckt.

**Urteil:** Ticket 27 ist fertig.
