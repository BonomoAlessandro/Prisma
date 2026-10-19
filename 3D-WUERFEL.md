# Würfel-Level in 3D – Prototyp

Stand: 11. Oktober 2026, Beurteilung und Tests nachgeführt am 16. Oktober (Ticket 14), Generator am 18. Oktober
(Ticket 22) · Branch `feature/3d-wuerfel` ·
Zweck: prüfen, ob Rätsel in einem Würfel Potenzial haben.
Alle bisherigen Level (Tutorial + 150) bleiben genau so, wie sie sind.

## Auftrag

1. Zuerst abklären, was der Schritt von 2D zu 3D bedeuten würde (Analyse mit zwei Agents: Logik/Level/Werkzeuge
   und Darstellung/Bedienung). Ergebnis: Logik gut machbar, das Hauptrisiko ist die Lesbarkeit im Würfel;
   7×7×7 voll besetzt wäre auf dem Handy kaum bedienbar, daher klein anfangen.
2. Danach umsetzen: 5×5×5-Würfel, zwei Beispiel-Level, eigener Branch, Teilschritte einzeln committen.

## Vorgehen (Commits auf dem Branch)

| Commit | Inhalt |
|---|---|
| `test: Golden-Regressionstest für alle 2D-Level` | **Zuerst** ein Sicherheitsnetz: `tests/golden.mjs` hält für jedes 2D-Level die Strahlbilder in Start- und Lösungsstellung (Segmente, Ereignisse, Treffer …) sowie Löser und Wertung (Tutorial + jedes 10. Level) fest. `tests/golden.json` wurde aus dem Stand **vor** dem Umbau (main) erzeugt. |
| `feat(3d): Strahllogik für Würfel-Level und zwei Beispiel-Level` | Eigener Logikpfad für `dim: 3`, zwei Level, Löser und Tests erweitert. |
| `feat(3d): Darstellung und Bedienung der Würfel-Level` | Elemente im Raum, Strahl-Shader in 3D, Ebenenwahl, Kamera, Levelauswahl. |
| `docs: …` | Diese Datei, Probe-Skripte für Screenshots und Klicks im Würfel. |

Jeder Schritt wurde vor dem Commit von einem Review-Agent geprüft; die Befunde sind eingearbeitet (siehe unten).

## Das Modell (Entscheidung)

**Jedes Element dreht um eine feste Achse** (`axis: 'x' | 'y' | 'z'`, Standard `'y'`) und wirkt in der Ebene
senkrecht dazu genau wie ein 2D-Element: `rot` bzw. `dir` zählen dort in 45°-Schritten wie `DIRS`.

- Achse `y` ist die 2D-Ebene. Ein Spiegel mit waagrechter Achse (`x` oder `z`) lenkt Licht zwischen die Ebenen
  („Aufzug“) – dafür braucht es keinen neuen Elementtyp.
- Richtungen sind ganzzahlige Vektoren aus −1/0/1 **ohne Raumdiagonalen**: 6 Achsen + 12 Flächendiagonalen.
  Spiegelungen führen nie aus dieser Menge heraus (Länge bleibt erhalten; Test prüft das).
- Spiegel: Fläche durch Achse und Ebenenrichtung `rot`, Normale `planeDir(axis, rot + 2)`;
  Reflexion `d' = d − 2(d·n)/(n·n)·n` bleibt ganzzahlig. Parallel zur Fläche → Licht endet an der Rahmenkante.
- Prisma: fächert in seiner Ebene wie in 2D; Licht schräg zur Ebene tritt nicht aus.
- Pro Element gleich viele Stellungen wie in 2D (Spiegel 4, Prisma/Kombinator 8) → der Löser bleibt schnell.
- Verworfen: „freie“ 3D-Drehungen (6–26 Stellungen je Element, unanschaulich, Suchraum explodiert).
- Ebenenbasis `AXES` (u, a, v) ist rechtshändig. Die Darstellung dreht die vorhandenen 2D-Modelle mit
  `makeBasis(u, a, v)` in ihre Ebene (lokal y = Drehachse) – es gibt **keine neuen 3D-Modelle**.

Level-Format (`LEVELS_3D` in index.html, im LOGIC-Block direkt nach `LEVELS`):

```js
{ name, dim: 3, size: 5, hint,
  elements: [{ type, x, y, z, axis?, dir?, rot?, color?, fixed? }],   // y = Ebene, 0 = unten
  solution: { "x,y,z": rot bzw. dir } }
```

## Wo was im Code steht (index.html)

- **Logik (LOGIC-Block):** `AXES`, `DIRS3` (die 18 Richtungen, die ersten acht wie `DIRS`), die Tabellen der
  Drehebene (`PLANE_K`, `PLANE_A`, `FROM_PLANE`), `planeDir`, `planeIndex`, `reflect3`, `mirrorFrontNormal3`,
  `refractInPrism3`, `createBoard3`. Flache Level und Würfel laufen durch denselben Durchlauf `tracePass` (ADR 0003,
  Ticket 27): Ein flaches Level ist ein Würfel mit einer Ebene (y = 0, Drehachse y). Spiegel und Prisma rechnen in
  der Drehebene mit `reflectOnMirror` und `refractInPrism` wie in 2D. Eine eigene Fassung hat nur noch das Brett
  (`createBoard` ruft bei `dim === 3` `createBoard3`); `tracePass` unterscheidet nur Drehachse und Ausgabe.
  Segmente/Ereignisse im Würfel haben zusätzlich `y0/y1` bzw. `y`, Normalen sind `[nx, ny, nz]`; die flachen bleiben
  ohne y und bitgleich (`tests/golden.mjs`).
- **Levelliste:** `LEVELS` im LOGIC-Block enthält nur die 2D-Level (Tests, Golden-Test, Werkzeuge der Levelliste
  wie `tools/ordne-level.mjs`).
  Im Spiel hängt `LEVELS.push(...LEVELS_3D)` sie hinten an (`CUBE_START` = erster Würfel-Index, heute 159).
  Eigene Seite „Würfel“ in der Levelauswahl; „Weiter“ nach Level 150 führt nicht in den Würfel.
- **Darstellung:** `cubeToWorld`, `beamPointToWorld`, `normalToWorld`, `placeInCube`. Strahl-Shader:
  Schnittnormalen als `aCap0/aCap1` (vec3), Abstand zu den Schnittebenen wird im Vertex-Shader als `vCut`
  berechnet (linear in p, daher exakt interpoliert). Bodenschein wird mit der Höhe schwächer (`vLift`).
- **`cubeView`:** Würfelrahmen und Zellpunkte; alle Elemente sind direkt anklickbar (die Ebenenwahl ist entfernt).
  `cubeView.glow(k)` lässt den Rahmen beim Lösen in der Wellenfarbe aufleuchten.
- **Siegesanimation:** wie in 2D (Ziele nacheinander, Akkord, Bloom-Puls), aber die Lichtwelle ist eine
  Kugelschale aus der Würfelmitte (`createShockShell`, Fresnel-Rand, additiv). Wo sie die Platte schneidet, läuft
  der 2D-Bodenring mit; durchquert sie den Rahmen, leuchtet er auf. Statt Funkenregen ein Feuerwerk aus jedem Ziel
  (`rain.burstFrom`, mit Luftwiderstand). `celebration.endWave()` setzt Ring, Schale und Rahmen zurück.
- **Kamera:** `cameraRig.cube/lift/zoom/tilt/turn` – im Würfel Blick auf die Würfelmitte, flacher, schräger,
  weiter weg (im Hochformat näher), Neigung `CUBE.phiMin … phiMax` statt der engen 2D-Grenzen.
- **Werkzeuge:** `tools/solver.mjs` – `keyOf` liefert im Würfel "x,y,z", Exporte der 3D-Funktionen.
- **Beurteilung** (Ticket 14): `tools/beurteilung/feldform-wuerfel.mjs`, die Würfel-Feldform mit Zellen "x,y,z", den
  18 Richtungen und der Drehachse je Element; `feldformVon` liefert sie bei `dim: 3`. Die Wirkung der Elemente kommt
  aus `planeDir`, `reflect3` und `refractInPrism3`. Drehungen nur um die senkrechte Achse und nur, soweit darstellbar:
  Ein Prisma mit waagrechter Achse, dessen Achse eine Drehung umkehrt, bräche Rot und Blau zu den vertauschten
  Seiten (Aufzug und Kern haben darum je zwei Drehungen).
- **Generator** (Ticket 22): Derselbe Generator (`tools/generator/`) erzeugt mit der Würfel-Feldform Würfel-Level,
  etwa `generiere({ grad: 'leicht', kernidee: null, seed: 2, feldform: feldformVon({ dim: 3, size: 4 }) })`. Die
  Würfel-Feldform liefert dafür wie die flache `element`, `rahmen` (`{ dim: 3, size }`), die Nachbarn aus einer
  Tabelle und eine eingefrorene Feldform je Grösse, dazu die Drehachsen `drehachsen` (y, x, z): Drehbare Elemente und
  feste Spiegel des Ergänzens bekommen eine davon, Quellen die erste, mit der sie in die verlangte Richtung leuchten
  (auf `feature/levelgenerator` nachgezogen, dort nur y). Die Bausteine der Kernideen bauen mit Drehachse y; Licht
  zwischen die Ebenen bringen ihre Quellen und das Ergänzen. Würfel-Level kommen nicht ins Spiel; `LEVELS_3D` bleibt
  bei Aufzug und Kern.

## Die zwei Level

- **Aufzug** (3 drehbar, Wertung 12.3): Spiegel (Achse z) hebt den Strahl, Prisma (Achse x) fächert ihn senkrecht
  auf drei Ziele in der obersten Ebene, ein Spiegel lenkt Grün zur Seite.
- **Kern** (5 drehbar, Wertung 21.6): Rot von unten vorne und Blau (aus einem Prisma oben hinten) müssen sich als
  Magenta in der Würfelmitte treffen; Grün kreuzt dabei den Blauschacht in einer leeren Zelle.

Beide sind laut Löser eindeutig lösbar; die Lösungen stehen als Kommentar über den Leveln.

## Tests und Befehle

Alle Läufe über `sh tools/leise.sh …`, nacheinander; die Zeiten sind von dort (19. Oktober, Ticket 22, mit
`LEISE_MAX_CPU=65 LEISE_CPU=65`).

```bash
node tests/logic.test.mjs        # 567 Tests, inkl. Block "Würfel (dim: 3)" (~30 s)
node tests/golden.mjs            # flache Level unverändert? (~2 s; --voll ~25 s) – --write nur bei bewusster Änderung
node tests/beurteilung.test.mjs  # 205 Tests (~75 s), Würfel in feldform-wuerfel.test.mjs und wuerfel.test.mjs
node tests/generator.test.mjs    # 31 Tests (~67 s mit 65 %), dazu fünf Aufträge im Würfel 4 × 4 × 4 (nur über leise.sh)
node tests/levelliste.test.mjs   # 37 Tests; liest Code der Anzeige aus index.html und gibt ihm CUBE_START mit
node tests/offline.mjs
node tests/screenshot.mjs interaction 1440 900 800 "$(cat tests/interaction-probe.js)"
node tests/screenshot.mjs cube-click 1440 900 500 "$(cat tests/cube-click-probe.js)"     # Klicks im Würfel (~50 s)
node tests/screenshot.mjs cube2 1440 900 25000 "window.CUBE_INDEX=160; $(cat tests/cube-probe.js)"   # (~70 s)
```

Headless-Chrome ohne Grafikkarte rendert nur 2–3 Bilder/s: Bei Screenshots 20–40 s warten.
Die Logik-Tests für den Würfel nutzen den Löser (`S.solve`) wie bei den 2D-Leveln.

## Review-Befunde (eingearbeitet)

- Logik: Strahlende bei Diagonale in der Spiegelfläche (jetzt erste Rahmenkante), Kommentare, fehlendes `y`
  meldet eigenen Fehler, zusätzliche Tests (Normalen aller Achsen, senkrechter Prismafächer).
- Darstellung: Ablauf der 2D-Level unverändert (letztes Level, „Alle Level gelöst“, Startlevel), Reiterleiste
  ohne Würfel-Reiter gerechnet; abgeblendete Ziele/Prismen leuchten weiter (Abgleich Kopie ↔ Original, je Kopie
  einmal pro Bild); Bodenschein-Schnitt vor dem Absenken; Rahmen steht auf der Platte; abgeblendete Elemente
  werfen keinen Schatten; Neustart (R) behält die gewählte Ebene; Screenreader-Text „Würfel“.

## Bekannt / offen

- N bzw. → auf Level 150 blättert weiter in den Würfel (nur „Weiter“ nach dem Lösen stoppt dort). Bewusst so
  gelassen – entscheiden, ob 2D und Würfel auch beim Blättern getrennt sein sollen.
- Kein Tutorial für Achsen/Ebenen, nur ein Hinweis pro Level in der Kopfzeile.
- Die Würfel-Level im Spiel sind handgebaut. Die Beurteilung kennt den Würfel (Ticket 14): Aufzug ist leicht und
  ohne Kernidee, Kern hat die Kernidee „Mischziel aus zwei Quellen“. Der Generator liefert Würfel-Level (Ticket 22),
  die aber nicht ins Spiel kommen. In kleinen Würfeln (4 × 4 × 4) liefern Farben abzählen, Falle und Lockvogel nichts,
  wie im flachen Feld 4 × 4; im Würfel 3 × 3 × 3 ist der Knäuel der häufigste Grund ohne Level.
- Nur in Headless-Chrome getestet (Screenshots, simulierte Klicks) – noch nicht von Hand gespielt, nicht auf
  einem echten Handy, Leistung nicht gemessen.
- Lesbarkeit ist das Hauptrisiko: Tiefe und Drehachse eines Elements sind schräg von oben nicht immer klar.
  Ideen: Lote/Schatten deutlicher, Achse am Element sichtbarer, Explosionsansicht der Ebenen.

## Nächste Schritte (Vorschlag)

1. Beide Level von Hand spielen (Desktop und Handy) und entscheiden, ob es sich lohnt (**E** in PLAN.md, Abschnitt 4).
2. Wenn ja: kleines Würfel-Tutorial (Achse, Ebenenwahl, Aufzug), 5–10 weitere handgebaute Level.
3. Danach Würfel-Level aus dem Generator (Ticket 22) von Hand und mit den KI-Testern prüfen, grössere Würfel erst nach
   Spieltests.
