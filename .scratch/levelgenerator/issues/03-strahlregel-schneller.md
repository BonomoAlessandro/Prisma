# 03: Strahlregel schneller

**What to build:** Die gemeinsame Strahlregel rechnet schneller, ohne ihr Verhalten zu ändern (ADR 0003). Spiel, Löser,
Generator und Tests profitieren davon. Es bleibt bei genau einer Strahlregel, eine schnellere Kopie für die Werkzeuge
gibt es nicht.

**Spec:** ../spec.md, Abschnitt „Strahlregel“.

**Blocked by:** 01 (Golden-Test), 02 (Ausgangszahlen)

**Status:** resolved

- [x] Die heissen Stellen aus der Messung sind beseitigt:
      - die Ausnahme, die beim Lesen einer offenen Stellung im häufigen Fall geworfen wird,
      - Längen, die bei jedem Strahlschritt neu berechnet werden,
      - die aufwendige Buchhaltung der Kombinatoren.
- [x] Der Golden-Test und alle bestehenden Logiktests sind grün.
- [x] Das Messskript aus 02 zeigt die Zeit je Aufruf vorher und nachher. Der Gewinn steht unter `## Comments`.
- [x] Screenshots des Spiels sind vor und nach dem Umbau gleich: Desktop und Handy, je ein Level mit Prisma,
      Kombinator und Filter. Sie entstehen über die gedeckelte Umgebung, nacheinander.

## Comments

**Abschluss 15.10.2026.** Umgebaut sind `index.html` (Logikblock) und `tools/solver.mjs`, dazu kommt der Schalter
`--schnell` in `tests/golden.mjs` und im README. Es bleibt bei einer Strahlregel (ADR 0003). Alles lief über
`leise.sh` mit 20 %, nacheinander.

**Umgebaut:** vier Schritte aus dem Ticket und vier Stellen aus dem neuen Profil.
1. **Längen** (`tracePass`):
   - a) Die Länge des Rasterschritts (`Math.hypot(dx, dz)` je Strahl) fällt weg. Die Rückversätze an Spiegelkante,
     Quelle und Blocker rechnen mit dem Einheitsvektor `ahead`, bitgleich.
   - b) `emit` rechnet die Länge mit `Math.sqrt(lx * lx + lz * lz)` statt mit `Math.hypot`. Längen und Abstände
     weichen um Rundungsreste ab, Endpunkte nicht.
2. **Buchhaltung der Kombinatoren:** `first` ist ein Feld aus drei Zahlen (`first[b]` für die Grundfarbe `1 << b`)
   statt eines Objekts. `primariesOf`, `Object.values` und `Math.max(...)` fallen dort weg. Der Eintrag kommt wie
   bisher beim ersten Treffer in `combinerInputs`. So bleibt die Reihenfolge der Map gleich, von der `mixes` und die
   Fixpunktprüfung abhängen.
3. **Aufwand in `traceBeams`:** Schleifen statt `filter`, `every`, `map` und kopierter Maps. `solved` vergleicht
   `satisfied.size` mit der Zahl der Ziele (die Ids sind eindeutig). Die Fixpunktprüfung bricht beim ersten
   Unterschied ab.
4. **Offene Stellung ohne Ausnahme:**
   - Neue Konstante `OPEN = -1`. `tracePass` prüft an den drei bisherigen Lesestellen (Spiegel, Prisma, Ausgang eines
     Kombinators) und gibt dort `{ open: el, hits }` zurück. `traceBeams` ODER-t die Treffer des vorigen Durchlaufs
     hinein, wie bisher der `catch`. Beide `try/catch` fallen weg.
   - In `tools/solver.mjs` fallen `Need` und die werfenden Getter weg. `solve` setzt die drehbaren Elemente auf
     `L.OPEN`. `visit` setzt die Stellung mit `setRot` und beim Zurückgehen wieder `L.OPEN`.
   - Der alte Setter wandte `mod8` an; der Löser setzt aber nur Werte in 0 … `period - 1`. Liest ein
     `onLeaf`-Aufrufer die Stellung eines freien Elements, bekommt er `-1` statt einer Ausnahme. Heute tut das keiner.
5. **Aus dem neuen Profil:**
   - `seen` ist ein Feld mit `includes` statt eines Sets; je Durchlauf gibt es nur wenige Strahlen.
   - Die Normalen der Spiegelfläche stehen in der Tabelle `MIRROR_NORMALS`. Sie entsteht mit derselben Rechnung einmal
     je Stellung, statt bei jedem Treffer `Math.sin` und `Math.cos` aufzurufen.
   - `emit` setzt `fade` mit einer Zuweisung statt mit einem Objekt-Spread.
   - Der Rasterschritt liest `DIRS` ohne Destrukturierung.
   - Alle vier sind bitgleich.

**Gewinn gesamt** (`tools/bench.mjs trace solver`, Standardoptionen: 20 000 Stellungen, Seed 1). Der alte Stand lief in
einem Worktree auf `7515122`, in derselben Sitzung (18:51–18:57) und in beiden Reihenfolgen:

| | vorher | nachher | Faktor |
|---|---:|---:|---:|
| Strahlregel je Aufruf, vorher zuerst gemessen | 2,384 µs | 1,030 µs | × 2,31 |
| Strahlregel je Aufruf, nachher zuerst gemessen | 2,014 µs | 1,154 µs | × 1,75 |
| Löser über 159 Level, vorher zuerst gemessen | 88,2 CPU-s | 32,5 CPU-s | × 2,71 |
| Löser über 159 Level, nachher zuerst gemessen | 89,7 CPU-s | 34,9 CPU-s | × 2,57 |

- **Im Mittel** wird die Strahlregel rund doppelt so schnell (2,20 → 1,09 µs) und der Löser 2,6-mal (89 → 34 CPU-s).
- **Am längsten** brauchten nachher Urknall 4,6–5,0 s (vorher 13,0–13,3 s), Spiegelkabinett 3,0–3,2 s (9,0–9,6 s)
  und Quasar 2,5–2,7 s (7,5–7,6 s).

**Gewinn je Schritt:** Je Schritt habe ich eine Kopie gemessen, in der genau dieser Schritt zurückgenommen ist (Stand
vor den Stellen aus dem Profil). Angegeben ist, um wie viel die Kopie langsamer ist als der volle Stand.
- **`bench.mjs trace`:** Jede Kopie lief in einem eigenen Prozess, drei Runden abwechselnd (18:32–18:39), angegeben
  ist der Median. Getrennte Prozesse streuen um bis zu 20 % (ohne Schritt 3: 1,695–2,014 µs). Der volle Stand
  brauchte 1,374–1,450 µs, jede Kopie war aber in allen drei Runden langsamer.
- **In einem Prozess:** Alle Kopien liefen abwechselnd in 50 Blöcken zu 10 000 Stellungen je Level (Median der
  Wanduhr), zweimal in anderer Reihenfolge. Das streut viel weniger.

| ohne Schritt | `bench.mjs trace` | in einem Prozess |
|---|---:|---:|
| keinen (voller Stand) | 1,425 µs | × 1,00 |
| 1a Länge des Rasterschritts | 1,572 µs (× 1,10) | × 1,06–1,07 |
| 1b `Math.sqrt` statt `Math.hypot` | 1,670 µs (× 1,17) | × 1,11–1,12 |
| 2 Buchhaltung der Kombinatoren | 1,769 µs (× 1,24) | × 1,09–1,10 |
| 3 Aufwand in `traceBeams` | 1,915 µs (× 1,34) | × 1,08–1,09 |
| 4 Ausnahme | 1,522 µs (× 1,07) | × 1,01–1,02 |
| alle vier (`7515122`) | 2,233 µs (× 1,57) | × 1,35 |

- **Schritt 4 zielt auf den Löser.** `bench.mjs solver` in der Reihenfolge ABBA ergab 51,1 und 47,7 CPU-s mit dem
  Schritt, 75,3 und 72,7 CPU-s ohne ihn (× 1,50), bei gleichen Knoten.
- **Jeder Schritt bringt messbar etwas.** Zurückgenommen ist keiner.

**Neues Profil und Kandidaten:**
- **Profil** des Stands nach den vier Schritten, Anteile an allen Samples:
  - Strahlregel: Zeile von `mod8` 14,7 % (+4,0 % in `refractInPrism`), Aufruf von `tracePass` 6,9 %,
    `segments.push` mit Objekt-Spread 4,9 %, Destrukturierung von `DIRS` 4,6 %, `seen.add` 5,6 %.
  - Löser: `seen.add` 11,5 %, Aufruf von `tracePass` 7,6 %, `segments.push` 7,1 %, `Math.sin` und `Math.cos` in
    `mirrorFrontNormal` 4,5 %, Destrukturierung von `DIRS` 4,0 %.
- **Gemessen** gegen den Stand nach den vier Schritten:
  - Strahlregel: in einem Prozess wie oben, zwei Läufe.
  - Löser: Quasar, Lichtbrücke, Zenit, Lichtkegel, Spiegelkabinett und Urknall, zwei Runden, je Level abwechselnd in
    einem Prozess, bei gleichen Knoten.

| Kandidat | Strahlregel | Löser |
|---|---:|---:|
| `seen` als Feld | × 0,91 | × 0,88 |
| Normalen aus der Tabelle | × 0,96 | |
| ohne Objekt-Spread | × 0,95–0,97 | |
| ohne Destrukturierung | × 0,96 | |
| die drei ohne `seen` zusammen | × 0,87 | × 0,87 |
| alle vier zusammen (übernommen) | × 0,78 | × 0,74 |
| `mod8` als `n & 7` (nicht übernommen) | × 0,99–1,01 | |

- **`mod8` trotz 15 % im Profil:** Gemessen bringt die Bitmaske nichts. Das Profil schreibt der Zeile offenbar
  eingebettete Arbeit von `tracePass` zu. Für Zahlen ausserhalb der ganzen Zahlen hätte `n & 7` zudem anders
  gerechnet.

**Gleich geblieben:**
- **Prüfsumme** der Strahlbilder: `70adec2148791d44` in allen 25 Läufen von `bench.mjs trace` (alle Kopien, vorher,
  nachher).
- **Knoten des Lösers:** 9 831 779 in allen 8 Läufen von `bench.mjs solver`.
- **Alt gegen neu** auf 318 000 Zufallsstellungen (159 Level × 2000, alte Logik aus `7515122`, Stand nach allen
  Umbauten):
  - Kein diskretes Feld weicht ab: Art, Farbe, Element und Ziel der Ereignisse, Farbe der Abschnitte, Treffer,
    Mischungen, „gelöst“ und „abgebrochen“.
  - Die grösste Abweichung einer Kommazahl beträgt 3,55e-15 (Kreuzfeuer, `events[13].dist`). Sie kommt von
    `Math.sqrt` statt `Math.hypot` und liegt weit unter der Toleranz von 1e-9.

**Screenshots:** Level „Morgenröte“ (Index 149, Level 141): Licht läuft dort durch Prisma, Filter und Kombinator.
Desktop 1440 × 900, Handy 390 × 844 mit `MOBILE=1 DPR=2`, angehaltene Zeit `?t=12`.
- **Ergebnis:** Vorher (zweimal aus einem Worktree auf `7515122`) und nachher (Repo) sind byte-gleich, auf Desktop wie
  auf Handy (`tests/output/t03-vorher2-*`, `t03-vorher3-*`, `t03-nachher2-*`). Nach dem Neuladen entstanden 112–124
  (Desktop) bzw. 147–149 (Handy) Bilder; trotz verschiedener Zahl sind die Bilder gleich, die Szene war also ruhig.
  Keine Konsolenfehler.
- **Erste Aufnahmen nicht ruhig:** Die ersten Vorher-Bilder (`t03-vorher1-*`) weichen von den neuen Vorher-Bildern
  ab: auf Desktop 20 % der Pixel, auf Handy 0,4 %. Abweichend sind nur Elemente und Leuchten, die Strahlen nicht.
  - **Ursache:** Nach 25 s waren erst 14 bzw. 19 Bilder entstanden. Bei angehaltener Zeit laufen Herauswachsen und
    Aufleuchten weiter, aber mit höchstens 0,05 s je Bild (`dt` ist gedeckelt).
  - **Bedarf:** Das Herauswachsen als Welle dauert 0,6 s + 0,42 s, das Aufleuchten der drehbaren Elemente danach bis
    zu 0,63 s + 1,1 s. Nötig sind also mindestens etwa 55 Bilder; die späten Elemente der Welle (rechts unten) waren
    noch nicht fertig.
- **Befehle** aus dem Repo, nacheinander (vorher genauso mit `tests/screenshot.mjs` aus dem Worktree):

  ```sh
  JS="__prismaDebug.progress.save(149); setTimeout(() => location.reload(), 50); 'neu laden'"
  QUERY='t=12' sh tools/blender/out/arbeit/leise.sh node tests/screenshot.mjs t03-nachher2-desktop 1440 900 150000 "$JS"
  QUERY='t=12' MOBILE=1 DPR=2 sh tools/blender/out/arbeit/leise.sh node tests/screenshot.mjs t03-nachher2-handy 390 844 150000 "$JS"
  ```

  Das Neuladen ist nötig: Nach einem Levelwechsel wachsen die Strahlen bei angehaltener Zeit nie, weil
  `beamView.time` steht. Eine Aufnahme dauert so rund 2 min 40 s.

**Tests** nach dem letzten Umbau, nacheinander über `leise.sh` (19:14–19:17), alle grün, Wanduhr:

| Lauf | Dauer | vor dem Umbau |
|---|---:|---:|
| `node tests/golden.mjs --schnell` (Strahlbilder 12 ms) | 1,3 s | |
| `node tests/golden.mjs` | 12,3 s | rund 30 s (Ticket 01) |
| `node tests/golden.mjs --voll` | 45,7 s | 1 min 53 s (Ticket 01) |
| `node tests/logic.test.mjs` (554 Tests) | 1 min 52 s | 4 min 51 s (Ticket 02) |

Die Gegenprobe des Golden-Tests war in allen drei Läufen grün. Die Laufzeiten im README und im Kopf von
`tests/golden.mjs` sind auf diese Werte nachgeführt.

**Schalter `--schnell`** (für Zwischenschritte eines Umbaus):
- `node tests/golden.mjs --schnell` vergleicht `start` und `solved` aller 159 Level, ohne Löser und alte Wertung. Die
  Gegenprobe läuft ganz mit, weil keiner ihrer Teile den Löser braucht.
- Zusammen mit `--voll` oder `--write` bricht er mit einer Meldung ab.
- Doku im Kopf von `tests/golden.mjs` und im README, Abschnitt „Tests“: Nach mehreren Schritten, am Schluss und immer,
  wenn der Löser berührt ist, läuft der Test ohne `--schnell`.
- Beleg: In einer Kopie mit falscher Filterfarbe (`color: ray.color` statt `passed || ray.color`) meldete er 59
  Abweichungen und endete mit Exit 1.

**Abweichungen vom Ticket:**
- Umgebaut ist mehr als die drei heissen Stellen: dazu der Aufwand in `traceBeams` (Schritt 3) und vier Stellen aus
  dem neuen Profil. Jede ist einzeln gemessen.
- Der Schalter `--schnell` war nicht verlangt. Er macht Zwischenschritte schnell prüfbar.
- Längen und Abstände weichen um Rundungsreste ab (bis 3,55e-15), wie ADR 0003 es erlaubt. Endpunkte, Normalen und
  alles Diskrete sind gleich.
- Die Messung je Schritt läuft zusätzlich in einem Prozess, weil getrennte Prozesse bis zu 20 % streuen; die Faktoren
  aus `bench.mjs` sind deshalb nur grob.

**Für Ticket 04:** `Need` und die werfenden Getter sind schon weg. Offene Elemente stehen auf `L.OPEN`, und
`traceBeams` liefert dann `{ open, hits }`. Die Notiz steht auch in Ticket 04.

Commit siehe git log.
