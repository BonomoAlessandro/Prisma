# 22: Würfel-Branch: Generator im Würfel

**What to build:** Auf dem Branch `feature/3d-wuerfel` erzeugt der neue Generator auch Würfel-Level. Damit ist die
Feldform an echten Würfeln geprüft. Würfel-Level kommen nicht ins Spiel.

**Spec:** ../spec.md, Abschnitt „Würfel“.

**Blocked by:** 14 (Würfel-Branch: Beurteilung im Würfel), 21 (Alte Werkzeuge abbauen)

**Status:** resolved

- [x] main ist erneut in den Branch übernommen, und alle Tests sind grün.
- [x] Die Tests des Generators laufen zusätzlich mit der Würfel-Feldform. Ein Auftrag für einen kleinen Würfel liefert
      ein eindeutig lösbares Würfel-Level, das die Beurteilung besteht.
- [x] Fehlt der Feldform auf main etwas, wird es dort mit eigenem Commit nachgezogen.
- [x] Kein Würfel-Level kommt ins Spiel.

## Comments

**Hinweis aus Ticket 18 (Generator):**
- Der Generator braucht von der Feldform zusätzlich `element(zelle, angaben)` (Leveldaten eines Elements in einer
  Zelle) und `rahmen` (Angaben der Leveldaten, die das Feld festlegen, im Würfel etwa `{ dim: 3, size }`). Die flache
  Feldform hat sie seit Ticket 18, die Würfel-Feldform braucht sie auch.
- Quellen entstehen über `quelleStatt` aus einem Kombinator, der in die gewünschte Richtung abgibt (`ausgang`). Mit
  der Standardachse y gibt es so nur Richtungen der Ebene; für andere Achsen müsste `element` eine Achse wählen.
- Die flache Feldform hält die Nachbarn in einer Tabelle, und `feldformVon` legt sie je Grösse einmal an: Das
  Spielermodell fragt die Nachbarn in jeder Beurteilung zehntausendfach ab (vorher 40 % der Zeit des Generators). Die
  Würfel-Feldform profitiert ebenso.
- `tests/generator.test.mjs` sucht im Quelltext des Generators nach `.x` und `.z`; für den Würfel gehört `.y`
  dazu.

**Vorbereitung durch den Koordinator (18.10.2026, Entscheid des Nutzers):**
- Ticket 27 (ein Durchlauf der Strahlregel) ist in `feature/3d-wuerfel` übernommen, als Fast-Forward auf `7524457`.
- Vier alte Commits des Würfel-Branches trugen die Zeile „Co-Authored-By: Claude“. Der Branch ist ohne diese Zeilen
  neu geschrieben und per Force-Push ersetzt (vorher `cf636c6`, jetzt `7524457`). Dateistände, Autoren und Daten aller
  Commits sind gleich, und die Elternteile aus `feature/levelgenerator` sind unverändert. Der alte Stand liegt lokal
  unter `backup/3d-wuerfel-vor-bereinigung` und `backup/ticket-27-vor-bereinigung`.
- Neue Hashes für Verweise in Tickets und Notizen (die ersten vier Commits des Branches sind unverändert):

  | alt | neu | Commit |
  |---|---|---|
  | `cfeda0b` | `02a0841` | feat(3d): Elemente im Würfel mit Ring und Achszapfen statt Sockel |
  | `e4e459d` | `06f4a7f` | fix(3d): Zellen mittig im Würfel, Ringe der untersten Ebene über der Platte |
  | `9591678` | `87b77d0` | feat(levelauswahl): Umschalter Fläche (2D) / Würfel (3D) |
  | `f4e0e48` | `4ddd294` | refactor(3d): Ebenenwahl im Würfel entfernt |
  | `16c52b7` | `65e8f01` | feat(3d): Siegesanimation im Würfel |
  | `1771c24` | `19fd4e9` | merge: feature/levelgenerator in den Würfel-Branch (Ticket 14, Stufe A) |
  | `2e32eec` | `e5461fe` | refactor(beurteilung): Feldform kennt die Wirkung der Elemente |
  | `1ca9954` | `7003202` | feat(3d): Beurteilung mit Würfel-Leveln (Würfel-Feldform) |
  | `9e8c889` | `548ac73` | fix(beurteilung): Drehungen drehen auch Elemente ohne Richtung oder Stellung |
  | `cf636c6` | `1c93d52` | docs(3d): Würfel-Feldform im README, Test für Elemente ohne Angaben (Review Ticket 14) |
  | `bcdfb1f` | `08d1c1b` | refactor(logik): Ein Durchlauf der Strahlregel für flache Level und Würfel |
  | `69ff89d` | `c83086e` | docs(3d): Ticket 27 erledigt |
  | `8f8d8f0` | `304564a` | fix(logik): Ungültige Richtung im Würfel meldet auch die Spiegelregel … (Review Ticket 27) |
  | `9c974d3` | `7524457` | docs(3d): Review Ticket 27, keine offenen Funde |

**Stand am Abend des 18.10.2026** (Pause über Nacht auf Wunsch des Nutzers; Branch `ticket/22-wuerfel-generator` im
Worktree `.claude/worktrees/agent-ae7764404a8e6fa32`, nicht gepusht). Es läuft nichts mehr.
- **Erledigt:**
  - Merge von `feature/levelgenerator` (`3a9d8d2`) in den Branch (`5a36b8d`). Konflikte in `index.html` (Würfel-Level
    hinter `LEVELS` mit `CUBE_START`, dazu die Grade aus Ticket 17 statt `DIFFICULTY`), `feldform.mjs`,
    `feldform.test.mjs` und README, je beide Seiten. Die Strahlregel ist die des Branches: Auf
    `feature/levelgenerator` hat sich dort seit `2e05bae` nur ein Kommentar geändert. Der LEVELS-Block ist genau der von
    `feature/levelgenerator`, `LEVELS_3D` genau der des Branches. `levelliste.test.mjs` gibt dem Code, den es aus
    `index.html` liest, `CUBE_START` mit.
  - Danach grün: golden und `--voll` (ohne `--write`), logic 567, beurteilung 201, generator 28, levelliste 37,
    ki-tester 64, offline; Proben im Browser: Interaktion, Klicks im Würfel, Kern gelöst („Ziele 3 / 3“),
    Levelauswahl, je ohne Konsolenmeldung.
  - Der Feldform fehlte, ein Element mit einer anderen Drehachse als y zu setzen. Nachgezogen auf
    `ticket/22-feldform` (von `feature/levelgenerator`, `8ca2c64`): `drehachsen` und `element` mit `drehachse`; der
    Generator setzt drehbare Elemente, feste Spiegel und Quellen mit jeder Drehachse. Flache Level bitgleich: alle 28
    Aufträge, 10 610 Seeds, Ergebnis und Strahlverfolgungen gleich wie `3a9d8d2`. Dort alle Tests grün. In den Branch
    gemergt (`2f35f6e`).
  - Würfel-Feldform mit `element`, `rahmen`, Drehachsen, Nachbartabelle, je Grösse eingefroren; Generator-Test mit fünf
    Aufträgen im Würfel 4 × 4 × 4 (`696cee7`). Ein Auftrag „leicht“ im Würfel 4 × 4 × 4 liefert eindeutig lösbare
    Level, die die Beurteilung bestehen, mit Licht zwischen den Ebenen (Seeds 1–100: 90 Level). Alle Tests grün:
    generator 29, beurteilung 205, übrige wie oben.
- **Rot oder offen:**
  - Der Generator-Test brauchte mit den Würfel-Aufträgen 112,7 s statt 72 s, das Ziel sind etwa 90 s. Der Rechner war
    dabei langsamer (beurteilung 107 statt 90 s); der Vergleich abwechselnd mit und ohne Würfel-Aufträge in einem Lauf
    steht noch aus. Reicht es nicht, werden die Würfel-Aufträge kleiner.
  - README und `3D-WUERFEL.md` sind nachgeführt (dieser Commit), die Notiz „Umgesetzt“ fehlt noch.
- **Als Nächstes:** Laufzeit des Generator-Tests messen, Beispiel-Level für die Notiz, Notiz „Umgesetzt“ mit
  Auslegungen (Knäuel im Raum, Drehungen bei Prismen mit waagrechter Achse, Bausteine in kleinen Feldern), Haken und
  Status.

**Umgesetzt (19.10.2026).** Gearbeitet im Worktree `.claude/worktrees/agent-ae7764404a8e6fa32` auf dem Branch
`ticket/22-wuerfel-generator` (von `feature/3d-wuerfel`, `7524457`), dazu der Branch `ticket/22-feldform` (von
`feature/levelgenerator`). „main“ heisst hier wie in Ticket 14 `feature/levelgenerator`. Alle Läufe über `leise.sh`,
nacheinander, mit `LEISE_MAX_CPU=65 LEISE_CPU=65` (der Kontrolllauf mit 50 % steht unten); Rechner i7-9750H, Node 22.12.0.

**Stufe A: Merge** (`5a36b8d`, `feature/levelgenerator` auf `3a9d8d2`; Ticket 29 kam später über `ticket/22-feldform`,
siehe unten).
- **Konflikte:**
  - `index.html`, Spiel: `CUBE_START`, `levelNumber` und `MAIN_COUNT` des Würfels, dazu die Grade aus Ticket 17
    (`GRAD_ANZEIGE`, `fillTier`) statt `DIFFICULTY`. Die Seiten der Levelauswahl nennen den Grad im Titel und behalten
    `mode` für den Umschalter Fläche/Würfel.
  - `tools/beurteilung/feldform.mjs`: die Fassung von `feature/levelgenerator` (`element`, `rahmen`, Nachbartabelle,
    eine Feldform je Grösse) mit der Weiche zur Würfel-Feldform; `feldform.test.mjs` und README: beide Seiten.
  - Ohne Konflikt, aber rot: `levelliste.test.mjs` führt Code der Anzeige und des Fortschritts aus `index.html` aus,
    der auf dem Branch `CUBE_START` braucht. Der Test gibt ihn jetzt mit (dort ohne Würfel-Level, also das Ende von
    `LEVELS`).
- **Logikblock:** Auf `feature/levelgenerator` hat sich die Strahlregel seit `2e05bae` nicht geändert, nur ein
  Kommentar und die Doku der Leveldaten (`grad`). Der Logikblock ohne `LEVELS` ist nach dem Merge Zeile für Zeile der
  des Branches (Ticket 27) mit diesen Kommentaren; `tests/golden.json` ist grün ohne `--write`.
- **Levelliste:** Der LEVELS-Block ist genau der von `feature/levelgenerator`, `LEVELS_3D` genau der des Branches
  (verglichen als Text).
- Proben im Browser nach dem Merge, je ohne Konsolenmeldung: Interaktion auf einem flachen Level, Klicks im Würfel
  (jeder Klick dreht das angeklickte Element), Kern gelöst („Ziele 3 / 3“, Index 160), Levelauswahl (Fläche
  2D · 0/159, Würfel 3D · 0/2). `index.html` hat sich seither nicht mehr geändert.

**Teil 1: Die Feldform kennt Drehachsen** (`8ca2c64` auf `ticket/22-feldform`; gehört nach `feature/levelgenerator`).
- **Was fehlte:** Mit `element` und `quelleStatt` entstanden nur Elemente der Standardachse y (Hinweis aus Ticket 18).
  Im Würfel blieben Licht und Elemente so in ihrer Ebene, Quellen konnten nicht nach oben oder unten leuchten.
- **Feldform:** `drehachsen` (flach nur y) und `element(zelle, { …, drehachse })`. Die flache Feldform schreibt die
  Drehachse nicht in die Leveldaten und weist eine andere als y ab.
- **Generator:** `bau.varianten(zelle, angaben)` liefert ein Element je Drehachse.
  - Drehbare Elemente und feste Spiegel des Ergänzens wählen unter allen Drehachsen und Stellungen, die das Licht
    sinnvoll weitergeben (`stellungenMit` in `schritte.mjs`).
  - Eine Quelle (`bau.quelle`) nimmt die erste Drehachse, mit der sie in die verlangte Richtung leuchtet; der Zufall
    zieht dafür nichts.
  - Im flachen Feld ist die Liste dieselbe wie vorher, in derselben Reihenfolge, und der Zufall zieht gleich.
- **Bitgleich:** alle 28 Aufträge (die sieben leichten und „leicht“ mit 33–43 und 20–30, Seeds 1–1000; mittel und
  schwer je Kernidee 1–100; sehr schwer 1–30), das ganze Ergebnis von `generiere` als Hash und die Zahl der
  Strahlverfolgungen: 10 610 von 10 610 gleich wie `3a9d8d2`, nach dem Merge mit Ticket 29 ebenso 10 610 von 10 610
  gleich wie `bfd92a2`.
- **Tests:** Drehachsen der flachen Feldform; der Quelltext-Test des Generators sucht auch `.y`, `y:` und `axis`.
  Tests auf `ticket/22-feldform` nach dem Merge mit `bfd92a2` (`42edc52`): golden, logic 548, beurteilung 178,
  generator 30 (70,0 s), levelliste 37, ki-tester 64, alle grün.
- **Merge mit Ticket 29:** `bfd92a2` in `ticket/22-feldform` (`42edc52`, ohne Konflikt), dann in den Branch
  (`ffa814f`; Konflikt nur im Generator-Test und README: die Würfel-Aufträge neben dem Seed unter der Untergrenze der
  Quellen, dessen Test sucht nur unter den flachen Aufträgen).

**Teil 2: Würfel-Feldform für den Generator** (`696cee7`, nur auf dem Branch).
- `element` (Drehachse x oder z als `axis`, y ohne Angabe wie in `LEVELS_3D`), `drehachsen` (y, x, z), `rahmen`
  `{ dim: 3, size }`, die Nachbarn aus einer Tabelle, eine eingefrorene Feldform je Grösse (`wuerfelFeldform`).
- `feldform-wuerfel.test.mjs`: `element` mit jeder Drehachse, `rahmen`, eine Quelle in jeder der 18 Richtungen über
  `element` und `quelleStatt`, Nachbartabelle gleich dem Schritt über die Koordinaten, je Grösse dieselbe Feldform,
  eingefroren.
- **Generator-Test** (`generator.test.mjs`, auf dem Branch): fünf Aufträge im Würfel 4 × 4 × 4 laufen durch alle
  Prüfungen der flachen (Determinismus, genau eine Lösung, Beurteilung neu und gleich der mitgegebenen, Grad,
  Kernidee, Quellen nach der Vorgabe, Leveldaten mit `dim` und `size`, Startstellung, keine wirkungslosen Filter,
  festen Spiegel und Blocker). Dazu ein eigener Test: Die Würfel-Level nutzen den Raum (Licht zwischen den Ebenen,
  drehbare Elemente mit waagrechter Drehachse), der feste Seed 2 liefert ein solches Level. Gefunden werden die
  festen Seeds der flachen Aufträge nur unter den flachen.

| Auftrag im Würfel 4 × 4 × 4 | Seeds | Level | verlangt | Seeds 1–100 |
|---|---:|---:|---:|---:|
| leicht | 1–20 | 20 | 12 | 90 |
| leicht, Mischziel | 1–20 | 13 | 6 | 53 |
| leicht, Abschalten | 1–10 | 10 | 6 | 97 |
| leicht, Sammelstelle | 1–10 | 9 | 5 | 81 |
| mittel, Mischziel | 1–20 | 6 | 4 | 38 |

**Würfel-Level aus dem Generator** (Würfel 4 × 4 × 4, `generiere({ grad, kernidee, seed, feldform:
feldformVon({ dim: 3, size: 4 }) })`; Ebenen von oben, je Ebene die Reihen z = 0 … 3, Element mit Achse x/z, Lösung
bzw. Richtung, Farbe):

```
leicht, Seed 2: genau eine Lösung, Schwierigkeit 22,7, Spielwert 38,0, keine Kernidee, Grad leicht;
2 Quellen, 4 drehbare Spiegel (Achsen z, x, x, x), 2 Ziele; 3 von 6 Abschnitten laufen zwischen den Ebenen
  y=3: .    .    .    .     | .    .    .    .     | .    .    .    .     | .    .    .    .
  y=2: .    .    .    .     | .    .    Mx1  .     | Mz3  .    .    Q4    | .    .    Mx3  .
  y=1: .    .    .    .     | .    .    .    .     | .    .    .    .     | .    .    .    .
  y=0: .    .    .    .     | Tw   .    Qx2  .     | Mx1  .    .    .     | .    .    Tw   .

leicht-mischziel, Seed 3: genau eine Lösung, Schwierigkeit 28,4, Spielwert 81,4, Haupt-Kernidee Mischziel aus zwei
Quellen; Cyan und Gelb treffen sich als Weiss auf dem Ziel (1,0,1), beide über zwei Spiegel und durch zwei Ebenen
  y=2: .    .    .    Q2y   | .    .    .    Mx3   | .    .    .    .     | .    .    .    .
  y=1: .    .    .    .     | .    .    .    .     | .    .    .    .     | .    Mz3  .    Q4c
  y=0: .    .    .    .     | .    Tw   .    Mz3   | .    .    .    .     | .    Mx1  .    .

leicht-sammelstelle, Seed 1: genau eine Lösung, Schwierigkeit 22,7, Spielwert 65,7, Haupt-Kernidee Sammelstelle;
das Prisma (1,3,2) bricht Blau und Grün aus zwei Zuläufen auf eigene Ziele, Rot kommt über zwei Spiegel mit Achse x
von unten herauf
  y=3: .    Q3b  .    Q3g   | M2   .    .    Mxf   | .    P1   .    .     | .    Tb   Tg   Tr
  y=2: .    .    .    Q2r   | .    .    .    Mx1   | .    .    .    .     | .    .    .    .
```

Die Leveldaten von Seed 2 (leicht): `{"name":"","grad":"leicht","dim":3,"size":4,"elements":[{"type":"source","x":3,
"y":2,"z":2,"dir":4},{"type":"source","x":2,"y":0,"z":1,"axis":"x","dir":2},{"type":"mirror","x":0,"y":2,"z":2,
"axis":"z","rot":2},{"type":"mirror","x":0,"y":0,"z":2,"axis":"x","rot":3},{"type":"mirror","x":2,"y":2,"z":1,
"axis":"x","rot":0},{"type":"mirror","x":2,"y":2,"z":3,"axis":"x","rot":2},{"type":"target","x":0,"y":0,"z":1,
"color":"white"},{"type":"target","x":2,"y":0,"z":3,"color":"white"}],"solution":{"0,2,2":3,"0,0,2":1,"2,2,1":1,
"2,2,3":3}}`.

**Ausbeute im Würfel** (Seeds 1–100, ein Prozess; zum Vergleich das flache Feld 7 × 7 und kleine flache Felder):

| Auftrag | Würfel 3 | Würfel 4 | Würfel 5 | flach 4 × 4 | flach 5 × 5 | flach 7 × 7 |
|---|---:|---:|---:|---:|---:|---:|
| leicht | 72 | 90 | 94 | 68 | 78 | 92 |
| leicht, Mischziel | 56 | 53 | 53 | 68 | 75 | 70 |
| leicht, Abschalten | 78 | 97 | 95 | | | 90 |
| leicht, Farben abzählen | 0 | 0 | 11 | 0 | 14 | 77 |
| leicht, Sammelstelle | 64 | 81 | 88 | | | 90 |
| leicht, Falle | 0 | 0 | 28 | 0 | 24 | 63 |
| leicht, Lockvogel | 0 | 0 | 0 | 0 | 0 | 73 |
| mittel | 2 | 5 | 2 | | | 7 |
| mittel, Mischziel | 13 | 38 | 42 | | | 55 |

- Im Würfel 4 haben die leichten Level im Mittel 4,2 drehbare Elemente, davon 2,8 mit Achse x oder z, auf 3,2
  Ebenen; in 89 von 90 läuft Licht zwischen den Ebenen. Schwierigkeit Q1 / Median / Q3 21,1 / 26,2 / 32,3, flach
  22,3 / 28,7 / 35,0.
- Ein Seed kostet im Würfel 4 rund 6 ms („leicht“) bis 13 ms (mittel mit Mischziel).

**Laufzeit des Generator-Tests** (65 %, Generator-Test abwechselnd ohne die Würfel-Aufträge, also auf dem Stand von
`ticket/22-feldform`, und mit ihnen, je in einem Lauf von `leise.sh`; Wanduhr):

| Lauf | ohne Würfel-Aufträge | mit Würfel-Aufträgen | nur die Würfel-Aufträge |
|---|---|---|---|
| zuerst: fünf Aufträge mit 30/30/20/20/20 Seeds | 65,6 / 66,4 / 66,2 s | 70,7 / 69,2 / 69,7 s | 3,4 / 2,9 / 2,9 s |
| verkleinert auf 20/20/10/10/10 Seeds | 63,9 / 65,0 s | 66,2 / 66,8 s | |
| jetzt: 20/20/10/10/20 Seeds | 65,7 / 64,1 s | 85,6 ¹ / 65,6 s | |

¹ Ausreisser: Das Erzeugen allein brauchte 60,7 statt 42,3 s, der Rechner war in dieser Minute belastet.
- **Die Würfel-Aufträge kosten rund 2 s** (3 % des Tests; vor dem Verkleinern 3–5 s, davon 1,3 s Erzeugen). Der Test
  ohne sie braucht auf
  ruhigem Rechner 64–66 s; die 112,7 s von gestern Abend kamen von der Last (dort brauchten auch beurteilung und logic
  20–30 % länger). Die 95 s des Reviewers von Ticket 29 lagen ebenso unter Last.
- Mittel mit Mischziel liefert in den Seeds 1–10 kein Level, darum 20 Seeds (0,2 s mehr).
- **Mit dem Deckel des Repos (50 %):** Kontrolllauf mit `LEISE_CPU=50`, in einem Lauf: mit Würfel-Aufträgen 66,8 s,
  ohne 63,0 s. Der Test rechnet fast nur in einem Prozess, darum macht der Deckel zwischen 50 und 65 % kaum etwas
  aus; die Vorgabe von etwa 90 s hält er auch im Repo, solange der Rechner nicht anderweitig belastet ist.

**Tests am Schluss** (65 %, Wanduhr, Stand `ffa814f` und Würfel-Aufträge verkleinert):

| Lauf | Ergebnis | Dauer |
|---|---|---:|
| `node tests/golden.mjs` | grün, Gegenprobe grün | 1,5 s |
| `node tests/golden.mjs --voll` | grün | 23,1 s |
| `node tests/logic.test.mjs` | 567 grün (548 auf `feature/levelgenerator` und 19 Würfel-Tests) | 28,2 s |
| `node tests/beurteilung.test.mjs` | 205 grün (201 nach dem Merge, 1 Drehachsen flach, 3 Würfel-Feldform) | 73,5 s |
| `node tests/generator.test.mjs` | 31 grün (30 auf `ticket/22-feldform`, 1 Würfel) | 67,4 s |
| `node tests/levelliste.test.mjs` | 37 grün | 46,2 s |
| `node tests/ki-tester.test.mjs` | 64 grün | 0,7 s |
| `node tests/offline.mjs` | grün | 66,7 s |
| Proben im Browser (nach dem Merge, oben) | ohne Konsolenmeldung | 39–75 s |

**Auslegungen und Hinweise:**
- **Knäuel im Raum** (Ticket 14: Grenze 1,30 vorläufig, „neu zu prüfen, sobald der Generator Würfel-Level liefert“):
  - Paare benachbarter drehbarer Elemente je drehbares Element, im Mittel der gelieferten leichten Level: Würfel 3
    0,75, Würfel 4 0,54, Würfel 5 0,45; flach 4 × 4 0,61, 5 × 5 0,43, 7 × 7 0,35.
  - Grund ohne Level „Knäuel“, leicht ohne Kernidee: Würfel 3 15 von 100 Seeds, Würfel 4 4, Würfel 5 1, flach 7 × 7 1;
    mittel mit Mischziel: Würfel 3 34 (dazu 9 mit Zerfall oder Füllteil), Würfel 4 11 (dazu 3), Würfel 5 2, flach 0.
  - Mit 18 Nachbarn ist ein Würfel dichter als ein flaches Feld gleicher Kante, aber nicht dichter als ein flaches
    Feld mit ähnlich vielen Zellen je Ebene. Ab Kante 4 bleibt die Grenze 1,30 tragbar; im Würfel 3 ist der Knäuel der
    häufigste Grund ohne Level. Nicht geändert; ob die Grenze im Raum gleich sein soll, entscheiden Spieltests.
- **Prismen mit waagrechter Achse** (Ticket 14: im Würfel nur die darstellbaren Drehungen): 37 von 90 leichten
  Würfel-Leveln (Würfel 4, Seeds 1–100) und 11 von 53 mit Mischziel haben ein solches Prisma und darum weniger als vier
  Drehungen; die Beurteilung mittelt dort über weniger Drehungen (Ticket 12). Der Generator braucht keine Drehungen.
  Die offene Frage aus Ticket 14 (Achsen mit Richtung, etwa `axis: '-x'`) bleibt offen.
- **Bausteine in kleinen Feldern:** Farben abzählen, Falle und Lockvogel liefern im Würfel 4 nichts, Grund „nicht
  eingebaut“. Im flachen Feld 4 × 4 ist es genauso, im 5 × 5 fast (14, 24 und 0 gegen 11, 28 und 0 im Würfel 5): Es
  liegt an der Kante, nicht am Würfel. Ring, Holzweg und Ringtausch brauchen Platz in einer Ebene.
  - Die Bausteine setzen ihre Spiegel und Prismen mit der ersten Drehachse (y), ihre Kernidee liegt also in einer
    Ebene; Licht zwischen die Ebenen bringen ihre Quellen und das Ergänzen.
  - Die Annahme aus Ticket 19 (ein Spiegel hat genau zwei Auswege) gilt auch im Würfel: Ein Spiegel jeder Achse hat
    für eine Richtung höchstens zwei.
- **Mischziel im Würfel:** Im Würfel 4 und 5 enden 38 und 41 von 100 Seeds mit „nicht eingebaut“, flach 4: Zwei
  Strahlen kreuzen sich im Raum seltener.

**Abweichungen:**
- **Zweiter Worktree:** Angelegt, aber nicht nutzbar: Die Sandbox erlaubt git und Schreiben nur im eigenen Worktree. Er
  ist wieder entfernt, `ticket/22-feldform` lief im selben Worktree (Branch gewechselt, getestet, committet).
- **Nicht nur die Feldform auf `feature/levelgenerator`:** Teil 1 ändert auch den Generator (`bau.mjs`,
  `schritte.mjs`); ohne das bliebe er bei der Drehachse y. Flache Level sind bitgleich.
- **Geteilte Tests auf dem Branch angepasst** wie `feldform.test.mjs` in Ticket 14: `generator.test.mjs`
  (Würfel-Aufträge) und `levelliste.test.mjs` (`CUBE_START`).
- **Kein Würfel-Level kommt ins Spiel:** `LEVELS` gleich `feature/levelgenerator`, `LEVELS_3D` unverändert (Aufzug,
  Kern), `tools/levelliste.json` gleich.

Commits siehe git log.
