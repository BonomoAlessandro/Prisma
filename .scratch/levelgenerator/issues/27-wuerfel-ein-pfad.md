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
