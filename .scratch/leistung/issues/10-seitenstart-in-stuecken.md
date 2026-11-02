# 10: Seitenstart in Stücken

**Spec:** ../spec.md

**Blocked by:** 07

**Status:** ready-for-agent

**What to build:** Das Hauptscript läuft beim Laden nicht mehr als eine einzige lange Aufgabe. Auf dem Poco soll keine
Aufgabe des Seitenstarts länger als 100 ms dauern (heute 342 ms Script). Optisch ändert sich nichts, der Startknopf
kommt nicht später.

**Messwerte (07):**

- Poco, Handy-Durchlauf 2: Seitenstart-Hänger 342 ms («`?perf=`: Script 332 ms», das Hauptscript), dazu 173 ms ohne
  Script und 120 ms (`FrameRequestCallback`, Script 77 ms). Durchlauf 1: 807 ms; Tickets 02–05 haben schon viel
  herausgenommen.
- T2000 Desktop: 246 ms (ohne Script), Handy-Emulation 4×: 684 ms; 6×: 1552 ms.
- CPU-Profil des Ladens (Handy-Emulation 4×): Hauptscript (`index.html` Zeile 1199) 1376 ms in einer Aufgabe. Darin:
  `compileParallel` → `issue` (Programme der Szene anstossen, three erzeugt ihren Code synchron) 406 ms;
  `buildEnvironment` × 2 (PMREM `fromScene`, synchron übersetzt und gezeichnet) 388 ms; Gruppe der Elemente zum
  Vorwärmen (`index.html` um 21003) 132 ms; `createStars` (mit `gauss`) 126 ms; Renderer anlegen 60 ms;
  `createComposer` 16 ms. Geteilt durch ~4 ergibt das die 332 ms des Poco.

**Was man sieht:** Während des Seitenstarts steht der Startbildschirm noch vor der Enthüllung (zählt als Laden, nicht
gegen die Grenzwerte). Die lange Aufgabe verzögert aber das erste Bild und die Enthüllung und blockiert Eingaben.

**Vorschlag:**

- [ ] Das Hauptscript nach dem Aufbau des Nötigsten (Renderer, Szene, Startbildschirm) in Abschnitte teilen, mit
      `await` auf eine neue Aufgabe dazwischen (`scheduler.yield`, sonst `setTimeout(0)`/`MessageChannel`):
      Umgebung (`buildEnvironment`, die zweite für die Spiegelung erst danach), Sterne, Elemente zum Vorwärmen,
      `compileParallel` der Szene. Die Reihenfolge bleibt (`scene.environment` vor dem Anstossen der Programme).
- [ ] `compileParallel` → `issue`: in Häppchen über die Wurzeln bzw. Materialien (wie in 09), nicht die ganze Szene in
      einem `renderer.compile`.
- [ ] Prüfen, dass nichts vor dem Ende der Abschnitte auf die Teile zugreift (Testschnittstelle, `?nointro`, Proben),
      und dass `sceneReady`/Vorwärmen vor `.go` gleich bleibt (Ticket 03).
- [ ] Messen: CPU-Profil des Ladens vorher/nachher (Handy-Emulation 4×), Start-Probe (Knopf nach Laden), Referenzdurchlauf
      Desktop und Handy 4×.
- [ ] Tests grün (alle Proben mit `?nointro` und mit Startbildschirm), Review, Commit.

**Abnahmekriterium:** Handy-Emulation 4×: keine Aufgabe im Seitenstart über 400 ms Script (entspricht ~100 ms auf dem
Poco); Knopf nach dem Laden nicht später als vorher (Start-Probe, je 2 Läufe). Poco (Schlussabnahme): längster
Hänger im Seitenstart ≤ 150 ms. Startbildschirm und Spiel unverändert.

**Gewinn und Rang:** Seitenstart zählt als Laden; der Gewinn ist ein früheres erstes Bild und keine eingefrorene Seite
beim Öffnen. Niedriger Rang als 09 und 11.

## Comments

**02.11.2026, Umsetzung** (Branch `leistung/10-seitenstart`: `leistung/09-einzelbilder` auf `7549329`, danach
`feature/leistung` bis `fb4952d` mit 11b und 09 gemergt, ohne Konflikte). Optisch gleich: dieselben Daten, nur in
anderen Aufgaben (Sterne mit derselben Zufallsfolge, beide Umgebungen aus einem PMREMGenerator).

- **Drei Scripts statt einem:** Konfiguration, Logik und Leveldaten (bis `LOGIC:END`), Darstellung (Renderer bis
  Composer), Kamera/Spiel/Oberfläche/Geschichte. Der Parser startet sie in eigenen Aufgaben, auch das Übersetzen
  (v8.compile) teilt sich. Regel dafür (im Code vermerkt): Funktionsdeklarationen gelten erst ab ihrem Script, also ruft
  ein Script beim Laden nichts aus einem späteren auf; geprüft mit einer Liste aller Vorwärtsverweise (nur Kommentare
  und Aufrufe zur Laufzeit). `mulberry32` steht darum oben bei `FIXED_TIME` (`?t=` rief es beim Laden).
- **`seitenstart()`** am Ende: Umgebung der Szene, Umgebung des Spiegels (`MAT.mirror.envMap`, vorher `envMap` beim
  Anlegen), Sterne (`stars.userData.fill`, Generator je 2048 Sterne; gerechnet in einer gewöhnlichen Funktion, eine
  Schleife im Generator optimiert V8 nicht und war 2–3× langsamer), Vorwärm-Elemente (`vorwaermElemente`, behält ein
  schon geladenes Level samt `game.hitProxies`), dann `compileParallel([scene, passScene()], { slices: true, sliceMs: 50,
  pause: neueAufgabe, issued })`. Je Aufgabe etwa `SEITENSTART_MS` = 50 ms; grosse Schritte beginnen eine eigene.
  Zwischen den Stücken nur eine neue Aufgabe (`MessageChannel`), kein `nextFrame`: Mit `nextFrame` wartete der Aufbau
  auf den Grafikprozess (der in dieser Zeit Shader übersetzt) und auf Stil/Layout je Bild, die Enthüllung kam auf dem
  Desktop bis 0,5 s später.
- **Enthüllung:** `ui.init` wartet zusätzlich auf `seitenstartAngestossen` (alles aufgebaut und angestossen); Vorwärmen
  vor `.go`, `aufwaermen`, `ruhe` und Knopf nach 2,9 s unverändert. `compileParallel` hat dafür `sliceMs`, `pause` und
  `issued` (Vorgabe wie bisher).
- **Hänger «ohne Script» gefunden:** `skyBitmaps.flipsOk` malte das 1×2-Testbild auf eine Leinwand und las es mit
  `toDataURL` zurück (`RasterImplementation::ReadbackImagePixels`). Das wartete, bis der Grafikprozess die Shader des
  Seitenstarts übersetzt hatte: Trace Desktop ungedrosselt 489–709 ms `RunMicrotasks` ohne Script (LoAF `s: 0`) vor
  `.go`, in einer Zwischenfassung 1945 ms. Jetzt ein fertiges PNG als `data:`-URL (geprüft: oben rot, unten blau,
  gekippt umgekehrt): im Trace weg. Das passt zu den 490 ms «ohne Script» des Poco (Durchlauf 2b).
- **Grafikprozess sonst:** Die übrigen Stockungen ohne Script sind `CrGpuMain` → `RendererRasterWorker` →
  `DoEndRasterCHROMIUM::Flush` (Desktop bis 780 ms), während ANGLE auf Worker-Threads die Programme übersetzt (kalter
  Shader-Cache, ein Programm bis 2654 ms auf der T2000). Das Anstossen in Häppchen ändert daran nichts: Auf dem Desktop
  sind alle Programme in ein, zwei Häppchen angestossen, übersetzt wird ohnehin parallel. Gestaffelte Uploads betreffen
  den Seitenstart nicht (die Szene lädt dort nichts Grosses hoch; die Skybox hat eigene Häppchen). Kleiner würde es nur
  mit weniger oder kleineren Programmen beim Start (Bloom, Pinsel, Standardmaterial); für 11/13 notiert.

**Messung** (Quadro T2000, Chrome 156, echtes Fenster, `leise.sh` 100 %; andere Agenten arbeiteten gleichzeitig, die
Werte streuen stark). Vorher = `6d17f5f` (07 + 09) bzw. `fb4952d` (feature/leistung), nachher = dieser Branch.

Trace und CPU-Profil des Ladens (Handy-Emulation 4×, Fenster, je 2 Läufe), Aufgaben des Hauptthreads:

| Stück | vorher | nachher |
|---|---|---|
| Hauptscript | 1343 / 1491 ms in einer Aufgabe (v8.compile 123–163) | Script 1: 79–122, Script 2: 228–305, Script 3: 177–292 ms |
| darin `compileParallel` | 297–389 | Häppchen ≤ 115 ms (einmal 315) |
| `buildEnvironment` × 2 | 186–212 (zusammen) | je eigene Aufgabe, 100–250 |
| `createStars` | 198 | 4 Häppchen zu 60–140 |
| Vorwärm-Elemente | 147–190 | eine Aufgabe, ~220 |
| längste Aufgabe dieses Tickets | 1491 | ≈ 300 (Script 2 bzw. 3) |

Desktop ungedrosselt: Hauptscript 352–441 ms → Scripts ≤ 62 ms; `flipsOk` 489–709 ms → weg. Abnahme 4× («keine Aufgabe
über 400 ms Script») für die Teile dieses Tickets erfüllt. Noch darüber, nicht aus diesem Ticket:
**`vorwaermenVorStart` → `story.vorwaermen` → `createStoryScene`** (Bühne des Prologs, Ticket 16) 525–1092 ms bei 4×
(vorher 530–763), und **`aufwaermen`** im Bild von `.go` (erstes Zeichnen; auf dem gemergten Stand 452 ms bei 4×, davon
`bloom.render` 314 ms; vorher 144–247).

Start-Probe (`tests/start-probe.mjs --fenster [--handy --drossel 4] --nur neu`, vorher/nachher im Wechsel; Zeiten ab
Laden in s, Knopf stets 2,90–2,94 s nach `.go`):

| | `.go` vorher | `.go` nachher | Seitenstart max vorher | nachher |
|---|---|---|---|---|
| Desktop (3 Runden) | 1,88 1,76 2,00 · 1,49 1,16 1,87 · 2,33 2,84 | 1,46 0,87 0,74 · 0,81 1,36 1,32 · 1,95 1,32 | 318–959 ms | 93–535 ms (meist 108–151) |
| Handy 4× (dieselben) | 3,78 4,34 3,83 · 2,94 3,10 3,69 · 4,54 4,66 | 5,09 4,73 4,26 · 3,74 4,71 4,72 · 4,89 5,22 | 1044–2108 ms | 462–699 ms |

Die Proben laden mit `?perf`; dessen Messschleife erzwingt je Bild Layout (bei 4× 35–77 ms Script plus Layout). Der
Seitenstart hat jetzt Bilder zwischen den Stücken (24–34 statt 8–10), darum kommt `.go` in der Handy-Emulation mit
`?perf` 0,3–1 s später. Ohne `?perf` (eigene Probe, 4×, je 4 Läufe im Wechsel, `fb4952d` gegen nachher): `.go` im
Mittel 4,19 → 4,12 s, Knopf 7,11 → 7,03 s, längstes Bild vor `.go` 1755 → 755 ms. Auf dem Desktop kommt `.go` früher
(Mittel etwa 1,9 → 1,3 s), weil `flipsOk` nicht mehr auf den Grafikprozess wartet.

Referenzdurchlauf (`tests/leistung-probe.mjs`, je 1 Lauf, gemergter Stand gegen `fb4952d`): Desktop Seitenstart max
231 → 467 ms (Hänger 454 ms «ohne Script», Grafikprozess wie oben; streut), Handy 4× Seitenstart max 923 → 695 ms,
Hänger 1356 → 1161 ms («ohne Script, Rendern 512 ms», Rastern beim Vorwärmen der Bühne) bzw. 499 (Script 356) → 560
(Script 457, `vorwaermenVorStart`). Karte Desktop `adaptiv 1.00, Umbauten 0` (auch `--ersatzmass` und headless
`--handy`); Handy 4× im Fenster 0,75 / 3 (vorher am selben Tag 0,50 / 2; CPU-gebunden, bekannt aus 03/09).

Tests auf dem gemergten Stand: `logic` (2036), `golden`, `hall`, `offline`, `screenshot`, `start-probe` (headless und
`--fenster`), `leistung-probe` (`--fenster`, `--fenster --handy --drossel 4`, `--handy`, `--fenster --ersatzmass`),
`geschichte-probe --start` und `--handy`, `leerlauf-probe`: grün, Konsole ohne Fehler, keine Warnung «Weckstelle
fehlt». `?t=`, `?nointro` und `?perf` laufen (Screenshot, Golden- und Bildtests, Proben).

Berührungspunkte: **16** – `ui.init` (Zeile mit `Promise.all([... seitenstartAngestossen])` direkt vor
`vorwaermenVorStart`); `vorwaermenVorStart` und `story.vorwaermen` unverändert, sie laufen jetzt nach dem Anstossen
der Programme und sind die grösste verbleibende Aufgabe im Seitenstart. **12** – kein Code berührt; `menu.vorwaermen`
(in `vorwaermenVorStart`, bei 4× ~130 ms `zeichne`/`getBoundingClientRect`) unverändert. **Alle:** Neuer Code auf
oberster Ebene darf beim Laden keine Funktion aus einem späteren Script aufrufen (Grenzen nach `LOGIC:END` und vor
`KAMERA`); die drei `<script>`-Grenzen beim Mergen erhalten. **Code aus 09:** `compileParallel` (neue Optionen),
`skyBitmaps.flipsOk` (PNG statt Leinwand).

Offen: Das Poco (Handy-Durchlauf 3 bzw. Schlussabnahme) zeigt, ob die 342 ms Script und die 490 ms «ohne Script» weg
sind. Mit `?perf` kommt `.go` in der Emulation wegen der Messschleife später; falls das auf dem Poco stört, könnte die
Messschleife vor `.go` ohne erzwungenes Layout auskommen.
