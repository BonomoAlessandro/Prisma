# 04: Löser schneller

**What to build:** Der Löser beantwortet die häufigste Frage des Generators, ob es genau eine Lösung gibt, deutlich
schneller. Die bestehenden Auswertungen liefern weiterhin dieselben Zahlen. Was nur die Suche betrifft, gehört in den
Löser und nicht in die Strahlregel.

**Spec:** ../spec.md, Abschnitt „Löser“.

**Blocked by:** 01 (Golden-Test), 02 (Ausgangszahlen), 03 (Strahlregel schneller). 03 und 04 berühren beide das Lesen
offener Stellungen.

**Status:** resolved

- [x] Ein neuer Modus für die Eindeutigkeit bricht ab der zweiten Lösung ab.
- [x] Suchen, die heute doppelt laufen, laufen nur noch einmal. Wo dieselbe Stellung mehrfach verfolgt wird, hilft ein
      Zwischenspeicher.
- [x] Die bestehenden Aufrufe liefern unverändert Lösungen, Knoten, Blätter, Fast-Lösungen und Rateschritte. Der
      Golden-Test ist grün.
- [x] Der bestehende Vergleich mit stumpfem Durchprobieren ist grün und deckt auch den neuen Modus ab.
- [x] Der Gewinn ist mit dem Messskript aus 02 gemessen und steht unter `## Comments`.

## Comments

**Hinweis aus Ticket 02 (Messskript):** Der Teil `solver` von `tools/bench.mjs` misst nur `solve(level)` mit den
Standardoptionen über alle Level. Den neuen Modus für die Eindeutigkeit dort wählbar machen, damit sein Gewinn messbar
ist. `--compare` vergleicht nur die Summe der Knoten; die Ergebnisse je Level sichert `node tests/golden.mjs --voll`.
Die Ausgangszahl ist 103,8 CPU-s bei 9 831 779 Knoten (`tools/bench-baseline.json`). Sie streut mit der Last auf dem
Rechner um 20 % und mehr, deshalb vorher und nachher in derselben Sitzung messen.

**Hinweis aus Ticket 03 (Strahlregel schneller):** `Need` und die werfenden Getter in `tools/solver.mjs` sind schon
weg. `solve` setzt die drehbaren Elemente auf `L.OPEN` (-1). Liest die Verfolgung eine solche Stellung, liefert
`traceBeams` nur `{ open: Element, hits }`. `visit` setzt die Stellung mit `setRot` und beim Zurückgehen wieder
`L.OPEN`. Nach Ticket 03 braucht der Löser über alle Level 32–35 CPU-s statt 88–90 (gemessen in derselben Sitzung),
bei unveränderten 9 831 779 Knoten. Das ist der neue Vergleich für dieses Ticket.

**Hinweis aus dem Review von Ticket 03:**
- Die Spec nennt als heisse Stelle auch: Bei jedem Knoten der Suche werden alle Strahlen neu verfolgt. Das gehört
  hierher, etwa als Zwischenspeicher oder als Verfolgung, die beim nächsten offenen Element weitermacht, statt von vorn
  zu beginnen.
- Im Löser kommen `value.set`/`setRot` und `value.delete`/`setRot(el, L.OPEN)` immer paarweise; `value.has(id)` ist
  dasselbe wie `getRot(el) !== L.OPEN`. Den doppelten Zustand hier auflösen.

**Abschluss 15.10.2026.** Umgebaut sind `tools/solver.mjs`, der Logikblock in `index.html`, `tools/generate.mjs` und
`tools/bench.mjs`, dazu `tests/logic.test.mjs`, `tests/golden.mjs` und das README. Alles lief über `leise.sh`,
nacheinander: Tests und Messungen von Löser und Strahlregel mit 20 %, der Generator mit 50 %.

**Umgebaut:** fünf Schritte, jeder einzeln gemessen.
1. **Modus unique:** `solve(level, { unique: true })` hält bei der zweiten Lösung an. `count` ist dann mindestens 2,
   die übrigen Zahlen gelten bis dahin. Bei höchstens einer Lösung ist das Ergebnis dasselbe wie ohne den Modus.
2. **Doppelter Zustand:** Die Map `value` fällt weg, entschieden ist ein Element mit `getRot(el) !== L.OPEN`.
   - Anzahl und Produkt der offenen Stellungen führt die Suche mit, statt sie an jedem Blatt neu zu zählen.
   - Fast-Lösungen zählt sie über `satisfied.size`.
   - `onLeaf` bekommt kein drittes Argument mehr. Kein versionierter Aufrufer nutzte es, wohl aber Skripte in den
     unversionierten Review-Ordnern der Pools; der Hinweis steht in den Tickets 09 und 11.
3. **Weitermachen am offenen Element** (Zwischenspeicher):
   - Hält die Verfolgung an einem Element auf `OPEN` an, liefert `traceBeams` zusätzlich `resume`, den Stand des
     angehaltenen Durchlaufs.
   - `traceBeams(board, extraRays, from)` macht dort auf einer Kopie weiter. Bis zum Anhalten hat die Verfolgung das
     Element nie gelesen, der Teil davor ist für jede Stellung gleich.
   - Der Löser gibt jedem Kind den Stand des Elternknotens mit. So wird der gemeinsame Anfang nicht mehr je Stellung
     neu verfolgt; laut einer Zählung vorab bleiben 36 % der Rasterschritte.
   - Es bleibt eine Strahlregel (ADR 0003): Der Haken sitzt in ihr wie `OPEN`, die Suche bleibt im Löser. Das Spiel ruft
     `traceBeams(board)` wie bisher auf.
4. **Doppelte Suchen:** `metrics(level, { sol, full })` übernimmt Suchen, die der Aufrufer schon hat.
   - `tests/golden.mjs` gibt seine Suche mit, ebenso `tests/logic.test.mjs` (eine Suche je Level für die alte Wertung
     und den Test der Eindeutigkeit).
   - `finish` im Generator gibt die Suche aus `makeUnique` oder aus der Probe ohne Blocker und die Vollsuche weiter.
     `remove` verwirft sie bei jeder Änderung an `els`.
   - `metrics` übernimmt eine Suche nur, wenn sie nicht abgebrochen ist und innerhalb seiner eigenen Grenze liegt
     (2e6 bzw. 3e5 Knoten); sonst sucht es selbst. Die Grenzen stehen nur dort.
5. **Generator im Modus unique:** `makeUnique` und die Probe ohne Blocker in `finish`.
   - Bei höchstens einer Lösung ist das Ergebnis gleich.
   - Bei mehreren wählt `makeUnique` dieselbe Alternative: Die erste Lösung neben der gesuchten liegt immer unter den
     ersten beiden.

**Messskript:** `bench.mjs solver --unique` misst den Löser im Modus unique.
- Alle 159 Level sind eindeutig, der Modus sucht dort gleich weit (gleiche Knoten).
- Deshalb misst der Teil `solver` zusätzlich die 17 Level mit Blockern ohne diese. 16 davon haben dann mehrere Lösungen,
  wie die Kandidaten des Generators vor dem Blockieren.
- `--compare` vergleicht diesen Teil mit, die Knoten nur bei gleichem Modus.

**Gewinn gesamt:** `bench.mjs trace solver` mit Standardoptionen. Der alte Stand lief in einem Worktree auf `1e837ba`,
in derselben Sitzung (20:20–20:24) und in beiden Reihenfolgen:

| | vorher | nachher | Faktor |
|---|---:|---:|---:|
| Strahlregel je Aufruf, vorher zuerst gemessen | 1,176 µs | 1,131 µs | × 1,04 |
| Strahlregel je Aufruf, nachher zuerst gemessen | 1,082 µs | 1,105 µs | × 0,98 |
| Löser über 159 Level, vorher zuerst gemessen | 34,0 CPU-s | 15,1 (unique 15,0) | × 2,25 (× 2,27) |
| Löser über 159 Level, nachher zuerst gemessen | 33,2 CPU-s | 14,7 (unique 15,0) | × 2,26 (× 2,21) |
| 17 Level ohne Blocker (alter Löser, neues Messskript) | 6,14 CPU-s | 2,56–2,67 (unique 0,91–0,92) | × 2,3–2,4 (× 6,7) |

- **Die Strahlregel** ist gleich schnell geblieben, der Haken kostet das Spiel nichts Messbares.
- **Am längsten** braucht nachher Urknall 2,0–2,3 s (vorher 4,6–4,9 s), dann Lichtbrücke, Spiegelkabinett und Quasar
  mit je 1,1–1,3 s.
- **Generator** (`bench.mjs generator`, 3000 Seeds je Gruppe, 10 Prozesse, 20:18–20:20, in beiden Reihenfolgen):
  3-prisma × 1,29–1,49, 3-bunt × 1,49–1,50, 3-misch × 1,82–1,89, 4-prisma × 1,69–1,82, 4-misch × 1,60–1,66,
  5-bunt × 2,03–2,18. Gesamt × 1,70–1,79 (88,0 → 51,7 und 90,8 → 50,6 CPU-s).
- **Gegen die Ausgangszahlen** (`generator 2-farbe 2-spiegel 1-prisma --compare tools/bench-baseline.json`) sind die
  Fingerabdrücke gleich. Gegen `1e837ba` in derselben Sitzung: 2-farbe × 1,11–1,13, 2-spiegel × 0,99–1,06,
  1-prisma × 1,34–1,39. Diese Level sind klein, die Suche macht dort wenig aus.

**Gewinn je Schritt:**
- **Löser:** in einem Prozess, je Stand eine Kopie, abwechselnd auf Quasar, Lichtbrücke, Zenit, Lichtkegel,
  Spiegelkabinett und Urknall. Drei Runden (20:14–20:18), CPU-s summiert, bei gleichen Knoten.
- **Generator:** wie oben, je Stand ein Lauf.

| Schritt | Löser | Faktor | Generator | Faktor |
|---|---:|---:|---:|---:|
| vorher (`1e837ba`) | 48,20 s | | 88,0 / 90,8 s | |
| 1 Modus unique (nur die Option) | 47,51 s | × 1,01 | | |
| 2 doppelter Zustand, Blätter | 45,50 s | × 1,04 | | |
| 3 Weitermachen am offenen Element | 21,49 s | × 2,12 | 60,0 / 60,7 s (1–3) | × 1,47 / 1,50 |
| 4 doppelte Suchen in `metrics` | (`solve` gleich) | | 58,8 / 59,4 s | × 1,02 / 1,02 |
| 5 Generator im Modus unique | 21,20 s (nach 4 und 5) | × 1,01 | 51,7 / 50,6 s | × 1,14 / 1,17 |
| Modus unique auf denselben Leveln | 21,22 s | | | |

- **Schritt 4** wirkt vor allem in den Tests. Mit Schritt 3 kostete die zweite Suche in `metrics` 1,8 von 5,0 CPU-s
  (24 Level des Golden-Tests) und 14,5 von 39,9 CPU-s (150 Hauptlevel im Logiktest).
- **Jeder Schritt bringt messbar etwas**, ausser Schritt 1 allein; er ist die Grundlage für Schritt 5 und das Messskript.

**Gleich geblieben:**
- **Golden-Test `--voll`** ist grün: Lösungen, Knoten, Blätter, Fast-Lösungen und Rateschritte aller 159 Level.
- **Messskript:** 9 831 779 Knoten in allen Läufen von `bench.mjs solver`, auch im Modus unique. Die Prüfsumme der
  Strahlbilder ist `70adec2148791d44` in allen Läufen von `bench.mjs trace`.
- **Weitermachen:** 1 963 365 Blätter wurden mit einer Verfolgung von vorn verglichen, ohne Abweichung. Verglichen
  wurden Abschnitte, Ereignisse, Treffer, Mischungen, erfüllte Ziele, „gelöst“ und „abgebrochen“.
  - Geprüft ist jedes 7. von 13,7 Mio. Blättern: alle Level mit und ohne Abschneiden und 1545 Zufallsfelder, davon
    1245 mit Kombinator.
  - Beide Arten des Anhaltens kommen vor: beim Abschicken der Startstrahlen und im Strahl, auch in späteren
    Durchläufen der Kombinatoren.
- **Generator:** Alt und neu liefern für 1500 Seeds in 10 Profilen dasselbe, also Level, `metrics` und `quality` oder
  denselben Grund der Ablehnung. Die Fingerabdrücke aller Messungen oben sind gleich. `climb` aus `harden.mjs` liefert
  für sechs Seeds dasselbe: Seeds 1–4 mit 60 Schritten und Zielwertung 30–34, Seeds 5 und 6 mit 300 Schritten und
  44–54. Seed 5 brauchte 17,0 → 3,7 CPU-s.
- **`metrics` mit mitgegebener Suche** liefert für alle 150 Hauptlevel dasselbe wie ohne.

**Tests** nach den Nachbesserungen aus dem Review, nacheinander über `leise.sh` (21:09–21:10), alle grün, Wanduhr.
Die beiden Läufe vor dem Review (20:26 und 20:32) lagen bei 1,2–1,5 s, 4,4–5,5 s, 18,3–21,9 s und 28,4–28,7 s.

| Lauf | Dauer | nach Ticket 03 |
|---|---:|---:|
| `node tests/golden.mjs --schnell` | 1,2 s | 1,3 s |
| `node tests/golden.mjs` | 4,3 s | 12,3 s |
| `node tests/golden.mjs --voll` | 17,9 s | 45,7 s |
| `node tests/logic.test.mjs` (558 Tests) | 28,8 s | 1 min 52 s |

Die Laufzeiten im README und im Kopf von `tests/golden.mjs` sind nachgeführt. Danach lief
`generator 2-farbe 1-prisma --compare tools/bench-baseline.json` ohne ≠.

**Tests für den Modus unique** (zuerst rot gegen den alten Löser, dann grün):
- **Vergleich mit dem Durchprobieren:** Beide bestehenden Vergleiche prüfen den Modus mit und ohne Abschneiden.
  - Bei höchstens einer Lösung muss das Ergebnis gleich sein.
  - Sonst muss er bei den ersten Lösungen derselben Suche anhalten, mit höchstens so vielen Knoten.
- **Neuer Vergleich auf lösbaren Zufallsfeldern:** Die bestehenden 300 Zufallsfelder sind fast alle unlösbar (4 von 299
  haben eine Lösung).
  - Die Ziele bekommen die Farbe, die in der Startstellung ankommt.
  - Jedes Feld wird mit und ohne seine dunklen drehbaren Elemente geprüft.
  - Das ergibt mehr als 20 Felder mit einer und mehr als 20 mit mehreren Lösungen.

**Test für das Weitermachen** (aus dem Review), kostet etwa 1 s:
- **Jedes Blatt wie von vorn:** In allen Vergleichen mit dem Durchprobieren prüft ein `onLeaf` der Suche ohne
  Abschneiden jedes Blatt mit `assert.deepStrictEqual(r, L.traceBeams(board))`.
- **Zufallsfelder mit zusätzlich 2–3 Kombinatoren**, je zur Hälfte drehbar und fest: 202 geprüfte Felder mit 1028
  Blättern. Die Verfolgung hält dort 66-mal beim Abschicken der Startstrahlen und 112-mal in späteren Durchläufen an.
- **Ein handgebautes Feld** für den Fall, dass ein Kombinator vor und nach dem Anhalten Licht bekommt. Sein Ausgang
  läuft über drei feste Spiegel in ihn zurück.
- **Beleg:** In einer Kopie, die `combinerInputs` beim Weitermachen nur flach kopiert, werden die neuen Tests rot (das
  handgebaute Feld und das Level „Zwillinge“), im Review dazu drei bestehende Tests der Eindeutigkeit (Meisterstück,
  Spiegelsaal, Spiegelkabinett); ohne Kopie von `seen` sind es 138.
  - Offen, ohne Wirkung auf Werkzeuge: Teilen sich Eltern und Kinder nur die Felder `first`, weichen auf 16 Leveln nur
    Abstände (`dist`) ab, kein diskreter Wert, und kein Test wird rot. Ein Feld, in dem dieselbe Grundfarbe den
    Kombinator nach dem Anhalten auf kürzerem Weg erreicht, würde das fangen.
  - Die Zufallsfelder fangen diesen Fehler kaum, auch mit Grundfarben und Kombinatoren im Strahl einer Quelle (0–2 von
    300).
  - Eine verfälschte Mischung verschwindet im nächsten Durchlauf wieder, weil der Fixpunkt die Eingänge neu rechnet. Sie
    hält sich nur, wenn der Ausgang des Kombinators in ihn zurückläuft; deshalb das handgebaute Feld.
- **Standardweg von `metrics`:** Ein Test vergleicht für die Tutorial-Level `metrics` ohne und mit mitgegebener Suche.

**Abweichungen vom Ticket:**
- **Die Strahlregel in `index.html`** hat den Haken zum Weitermachen bekommen. Das Ticket legt die Suche in den Löser;
  hier gilt das für die Suche selbst, der Haken ist ein Teil der Verfolgung wie `OPEN`. Golden-Test, Prüfsumme und
  Laufzeit der Strahlregel sind gleich.
- **Screenshots** verlangt die Spec bei jedem Umbau der Strahlregel; ich hatte sie nicht gemacht. Im Review entstanden
  sie mit den Befehlen aus Ticket 03 (Level „Morgenröte“, `t=12`, 150 s). Desktop (125 Bilder) und Handy (153 Bilder)
  sind byte-gleich mit `tests/output/t03-nachher2-*`.
- **`makeUnique` meldet „Suche zu gross“ jetzt seltener.** Eine Suche mit mehreren Lösungen, die erst nach der zweiten
  über `spec.maxSearch` käme, ist nicht mehr „zu gross“; das Level wird repariert.
  - In den Ausgangszahlen (26 Profile × 60 000 Seeds) kommt „Suche zu gross“ nie vor, die Profile liefern also dieselben
    Level.
  - Beim Härten (`maxSearch` 1,5e6) kann ein Lauf deshalb anders verlaufen; in den sechs Proben tat er es nicht.
- **Das Messskript** misst zusätzlich die Level ohne Blocker. Verlangt war nur der wählbare Modus; ohne diese Level
  zeigte die Messung den Abbruch bei der zweiten Lösung nicht.
- **In den alten Werkzeugen laufen noch Suchen doppelt.** Sie brauchen Rückrufe je Blatt oder ein anderes Budget und
  gehen mit einer Notiz an Ticket 20, denn das Verfeinern ersetzt das Härten. Anteile an allen Knoten des Generators,
  gezählt auf je 3000 Seeds in 3-misch, 3-bunt, 4-prisma, 3-prisma und 5-misch:
  - **Vollsuche in `finish`:** Sie wiederholt die Lockvogel-Suche von `generateOne`, wenn seither nichts dazukam
    (166 Fälle, kaum Knoten).
  - **Vollsuche in `metrics`:** Sie wiederholt die Lockvogel-Suche von `generateOne`, wenn `finish` die seither
    dazugekommenen Lockvögel und Blocker wieder entfernt hat (0,9 %).
  - **Lockvogel-Suche in `quality`:** Sie wiederholt die Vollsuche von `finish` oder `metrics` (1,4 %).
  - **`harden.mjs`, Zeile 330:** `climb` ruft `finish` ohne `sol` auf. Dann wiederholt `metrics` die Suche von
    `makeUnique` aus `evaluate`, bis 1,5e6 Knoten.

Commit siehe git log.
