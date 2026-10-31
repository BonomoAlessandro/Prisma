# 02: Szene zeichnet nicht hinter deckenden Bildschirmen; Mechanismus für Ruhen und Aufwecken

**Spec:** ../spec.md

**Blocked by:** 01

**Status:** ready-for-agent

**What to build:** Solange ein deckender Bildschirm die 3D-Szene vollständig verdeckt, wird sie **nicht gezeichnet**,
also mit 0 gerenderten Bildern statt 60 bzw. 30. Das betrifft den Startbildschirm, die Bühne von Prolog und Epilog im
Szenenmodus und jede andere deckende Ebene. Die Logik läuft weiter. Optisch ändert sich nichts. Dieses Ticket baut
ausserdem den Mechanismus für Ruhen und Aufwecken der Hauptschleife, den Ticket 06 wiederverwendet.

Heute läuft `frame()` (`index.html` um 19411) auf jedem Display-Refresh. `frameRate.busy()` (19363) liefert für
`flow.state === 'intro'` true, also 60 fps hinter dem deckenden `#intro` (Hintergrund deckend, 305). Hinter
`story.covered` (Prolog, 18419) sind es 30 fps.

**Wichtig: `animate()` (um 19430) ist Logik, nicht Rendern.** Darin laufen `story.update` mit den `story.tweens`,
worauf `story.wait()` (18852) beruht, `skyTheme.update` mit den Überblend-Gewichten, `uReady`/`uFade` und dem
Freigeben alter Himmel, sowie `updateFlow`, `celebration` und `beamView`. Die Lade-Schleifen der Skybox
(`shown()`, 11781–11797) warten auf `uFade`/`uReady`. Hält man `animate()` an, hängen `story.wait()` (z. B. 18124,
18247–18250, `wait(1.9)` bei 18415), `skyTheme.shown` wird nie wahr und der Himmel lädt hinter dem Prolog nie fertig.

- [x] **Logik und Zeichnen trennen.** In `frame()` laufen Logik (`animate()` und alles, was Zustand fortschreibt) und
      Zeichnen (`renderReflection`, `composer.render`, Schatten, alles mit GPU-Arbeit) getrennt. Bei verdeckter Szene
      läuft nur die Logik, im rAF-Takt oder gedrosselt, solange Timer und Tweens korrekt bleiben. Gezeichnet wird nicht.
- [x] Einen zentralen Zustand «Szene verdeckt» einführen. Er weiss, welche Ebenen deckend sind: `#intro`,
      `#story` im Szenenmodus (`#020208`, 357) und weitere, die man beim Durchsehen findet. Halbtransparente Ebenen und
      das Menü über dem sichtbaren Himmel zählen **nicht** dazu. Dort prüfen, was durchscheint.
- [x] **Mechanismus für Ruhen und Aufwecken** (`wake()` o. ä.): Die Hauptschleife meldet pro Durchgang, ob sie
      zeichnen muss und ob sie überhaupt weiterlaufen muss, also ob Logik ansteht (Tweens, Überblendungen, Ladeschleifen,
      die auf `uFade`/`uReady` warten, Feiern). Steht nichts an, ruht sie ohne rAF. Eingaben, Tweens, `story.wait`,
      Skybox-Laden, `resize`, `visibilitychange` usw. wecken sie über `wake()`. In diesem Ticket wird nur der
      Mechanismus gebaut und für die verdeckten Phasen benutzt. Ruhen im sichtbaren Spiel ist Ticket 06.
- [x] Laden, Hochladen in Stücken (`sliced`, läuft über `nextFrame` unabhängig von `frame()`) und Uploads laufen in
      verdeckten Phasen weiter. Die Zeitbasis der Szene (Himmel, Staub, Uhr) springt beim Aufdecken nicht.
- [x] **Aufwärmen statt Hänger:** Kurz bevor die Szene aufgedeckt wird, also bevor die Überblendung beginnt, wird
      einmal gezeichnet. Das passiert, wenn Shader, Uploads und Render-Targets nach der Pause «kalt» sein könnten. Der
      erste sichtbare Frame darf nicht länger dauern als heute.
- [x] Bedingungen, die heute ein gezeichnetes Bild brauchen, sauber behandeln:
      - `sceneReady` als Voraussetzung des Intro-Starts (15790–15796, wartet bis zu 5 s): Die Enthüllung soll nicht
        mehr auf ein WebGL-Bild warten, das man nicht sieht. Was dieses erste Bild bisher vorbereitet hat, macht
        stattdessen das Aufwärmen.
      - Shader-Vorkompilierung (`compileParallel`, `KHR_parallel_shader_compile`) und das Aufwärm-Zeichnen bei
        `introCalm` (11727–11730).
      - `adaptiveResolution` darf aus verdeckten Phasen nichts lernen.
      - `perfHud.avgMs`, `__prisma.fps()` und `__prisma.frames`: Die Tests warten auf `__prisma.frames > 2`
        (`tests/geschichte-probe.mjs`, `tests/offline.mjs` u. a.). Alle Stellen suchen und auf ein passendes Signal
        umstellen, z. B. «Logik läuft» bzw. «erstes Bild gezeichnet».
- [x] Messen mit dem Werkzeug aus 01: Startbildschirm und Prolog vorher und nachher, ungedrosselt und gedrosselt.
      Ein Übergang Start → Prolog → Spiel ohne Bild über 33 ms (Laden hinter Überblendung ausgenommen und markiert).
- [ ] Tests grün, Review des Diffs, Commit auf `feature/leistung`.

## Comments

**Umsetzung (31.10.2026, Branch `leistung/02-szene-ruht` ab `feature/leistung` 83b90cd, darin Ticket 01 gemergt,
später `feature/leistung` ac56593 nachgezogen).**

- **`sceneLoop`** (`index.html`, gleich nach `nextFrame`, vor allem anderen definiert, weil `skyTheme.set` schon beim
  Laden weckt): die Hauptschleife. `frame()` macht Logik (`animate`, `__prisma.ticks`) und nur, wenn die Szene zu sehen
  ist, Zeichnen (neu `draw(dt, t0, learn)`: `renderReflection`, `composer.render`, `leistung.gpuBeginn/bildEnde`,
  `adaptiveResolution.tick`, `perfHud.tick`, `__prisma.frames`). Sichtbar läuft alles wie bisher über `frameRate.due`.
- **Verdeckt:** `sceneLoop.covered` (Getter) ist wahr bei `flow.state === 'intro'` (der deckende `#intro`, bis der
  Klick ihn ausblendet) und bei der Bühne: `story.covered` ist jetzt Getter/Setter (`_covered`), der Setter ruft
  `sceneLoop.coverStory(on)`. Ganz zu ist die Bühne erst, wenn die Transitionen von `#story` (Opacity und
  Hintergrund, 0,8 s, im Finale 1,8 s) fertig sind (`el.getAnimations()` → `finished`), dazu `data-mode="scene"` und
  nicht `.hidden`. Während des Einblendens zeichnet die Szene also weiter (30 Bilder/s wie bisher, `frameRate.busy`).
  Menü, Übersicht, Untertitel und Schleier (`caption`, `veil`) sind durchscheinend und zählen nicht; eine weitere
  deckende Vollbild-Ebene gibt es nicht (`#leistung-karte` ist eine Karte). `createStoryScene` und das Bühnen-CSS sind
  unberührt (Ticket 04).
- **Ruhen und Wecken (für 03/06):** Verdeckt fragt jeder Durchgang `sceneLoop.pending()`: Tweens der Geschichte, Träger,
  `story.blend`, Feld im Übergang (`in`/`out`), Feier, `skyTheme.busy` (neu: Überblenden, Vorschau einblenden, Panorama
  blendet ein/schärft nach/Streifen, ausgeblendetes wartet aufs Freigeben; je Panorama neu `busy` und `held`), Kamera
  (`cameraRig.homing`, neu `cameraRig.settling` aus `updateCamera`), wachsende Strahlen, Drehung und Puls der Elemente.
  Nach `REST_STEPS` = 10 Durchgängen ohne Anstehendes ruht die Schleife ohne rAF (`sceneLoop.awake = false`); vorher
  ein Bild, wenn sich seit dem letzten etwas geändert hat (`dirty`): das ist das Aufwärmen. **`sceneLoop.wake(cold =
  false)`** meldet einen rAF an, falls die Schleife ruht (`cold`: vor dem nächsten Ruhen auf jeden Fall zeichnen, etwa
  nach `resize`). Geweckt wird von `story.tween` (damit `wait`, `gazeTo` usw.), `story.open/close`, dem Setter von
  `story.covered`, `ui.start`, `introCalm`, `skyTheme.set/preload`, im Panorama-Laden bei Vorschau, Netz (`mesh`),
  scharfem Bild, jedem Streifen und am Ende von `build` (auch gescheitert), `changeLevel`, `enterLevel`,
  `recomputeBeams`, Eingaben (`pointerdown`, `wheel`, `keydown`, `touchstart`), `resize` (kalt), `visibilitychange`.
  Sichtbar ruht die Schleife in diesem Ticket nie; Ticket 06 kann `pending()` um «sichtbar bewegt sich nichts»
  erweitern und dieselben Weckstellen nutzen (dort fehlen dann noch etwa `pointermove` beim Ziehen und Hover, der Start
  der Feier, `startPulse`). Testschnittstelle: `__prisma.ticks` (Logikschritte), `__prisma.ruht()`,
  `__prisma.verdeckt()`; `__prismaDebug.sceneLoop` und `__prismaDebug.adaptiveResolution`.
- **Zeitbasis:** `clock` läuft weiter, `t` springt also nicht; dt-Animationen stehen nur still, wenn nichts ansteht.
  Nach dem Ruhen beginnt dt neu mit 1/60 (`sceneLoop.last = null`). Laden in Stücken (`sliced`, `nextFrame`,
  `compileParallel`, `skyWarmDraw`) hängt nicht an `frame()` und läuft weiter; die Schleifen, die auf `uFade`/`uReady`
  warten, bekommen ihre Logik, weil `skyTheme.busy` ansteht, bis das Panorama eingeblendet ist.
- **Aufwärmen, `sceneReady`:** Die Enthüllung wartet nicht mehr auf ein Bild aus `frame()`, sondern auf die Schrift
  (≤ 0,8 s) und `sceneStarted` (Shader des Starts übersetzt, `sceneLoop.start`, ≤ 5 s wie bisher); dann zeichnet
  `sceneLoop.aufwaermen()` einmal unsichtbar (was das erste Bild bei three einrichtet), danach `.go`. `sceneReady` heisst
  jetzt «erstes Bild gezeichnet, auch zum Aufwärmen»; darauf wartet weiter die Skybox. Während der Enthüllung (`.go`
  bis `introCalm`) zeichnet die verdeckte Szene nicht (`mayDraw`), ausser es wäre das allererste Bild; was liegen
  blieb, zeichnet sie nach `introCalm`. Vor dem Aufdecken ist die Szene so immer schon gezeichnet: beim Startbildschirm
  das Bild vor dem Ruhen; bei der Bühne zeichnet sie ab `covered = false` wieder, während `#story` noch deckt (die Welt
  der Bühne blendet 1,6 s aus, `#story` danach 0,8 s). Für Ticket 03: Die Wartezeit vor der Enthüllung hängt jetzt an
  `sceneStarted`, nicht mehr an einem gezeichneten Bild.
- **`adaptiveResolution`** lernt nichts aus verdeckten Phasen: Verdeckte Bilder (Aufwärmen, Bild vor dem Ruhen) gehen
  über denselben Weg wie das Ersatzmass aus 01c (`adaptiveResolution.skip` ≥ 1: `tick` nimmt nur die Zeit), beim
  Aufdecken `hold(0.5)`, und `frameRate` setzt neu an (erstes Bild sofort). Den Teil für das Ersatzmass (readPixels)
  brachte 2455277 von `leistung/01-messwerkzeug` (hier gemergt).
- **`__prisma.frames`** zählt nur noch gezeichnete Bilder, `__prisma.fps()`/`perfHud.avgMs` ebenso (hinter der Bühne
  bleibt der letzte Wert stehen). Umgestellt auf `__prisma.ticks > 2`: `tests/geschichte-probe.mjs` (alle acht
  Stellen), `tests/offline.mjs` (`sceneRuns`), `tests/screenshot.mjs` (Warten und Prüfung), `tools/ki-tester/shots.mjs`
  («Spiel startet», «Seite neu geladen»; `rendered()` und das Warten auf das Level bleiben bei `frames`, dort ist die
  Szene zu sehen). Nicht umgestellt: `.scratch/noa-geschichte/menue-vorschau/aufnahme.mjs` (alt; Menü sichtbar, geht
  weiter). README (Abschnitt Leistung) nachgeführt.
- **Für Ticket 03/05 notiert, nicht umgebaut:** `audio._quiet` wartet nach `.go` auf `introCalm` und `whenIdle`. Kommt
  der Knopf früher (03), kann es statt dessen auf eine ruhige Stelle warten, an der die Schleife hinter dem
  Startbildschirm ruht (`!sceneLoop.awake`, `__prisma.ruht()`), wie im Review von Ticket 05 vorgeschlagen.

**Messung (31.10.2026)**, Rechner der Agenten (Quadro T2000, 4K-Bildschirm mit 250 %, Chrome 156, `leise.sh`), echtes
Fenster per `tests/leistung-probe.mjs --fenster` bzw. `--fenster --handy --drossel 4`. Vorher = Stand 01 + 05
(`c7c005e`, als Kopie gefahren), nachher = dieser Branch. Andere Agenten massen gleichzeitig, die Last schwankte stark;
gedrosselt darum je zwei Läufe.

Ungedrosselt (Desktop, 1536 × 729):

| Abschnitt | vorher p95 / max / > 33 / gez/s | nachher p95 / max / > 33 / gez/s |
|---|---|---|
| Startbildschirm | 18,4 / 809 / 4 / **49** | 17,1 / 951 / 6 / **0** (1–3 Bilder insgesamt) |
| Prolog | 53,8 / **461** / 551 / **14** | 50,2 / **84** / 561 / **0** |
| Menü | 18,7 / 314 / 2 / 34 | 17,2 / 267 / 1 / 40 |
| Einstieg | 18,6 / 54 / 1 / 56 | 17,1 / 50 / 1 / 60 |
| Spiel | 18,6 / 36 / 2 / 53 | 17,1 / 33 / 1 / 56 |
| Reise | 18,5 / 48 / 4 / 56 | 17,1 / 67 / 7 / 59 |
| adaptiv / Umbauten | 1,00 / 2 | 1,00 / 0 |

Takt vorher 56 Hz, nachher 60 Hz (andere Last). Hänger im Prolog vorher 450–470 ms «ohne Script» (alle acht der
längsten), nachher höchstens 87 ms. Der Startbildschirm-Hänger bei etwa 5,5 s (950 bzw. 809 ms, «ohne Script») liegt
bei `introCalm`: Übersetzen und Hochladen der Skybox, Vorwärmen von Menü, Übersicht und Bühne (Ticket 03), nicht das
Zeichnen der Szene.

Handy-Emulation, 4× gedrosselt (393 × 873, Pixeldichte 2,75), je zwei Läufe:

| Abschnitt | vorher p95 / > 33 / gez/s | nachher p95 / > 33 / gez/s |
|---|---|---|
| Startbildschirm | 18,4 / 15 / **47**; 50,2 / 114 / **32** | 16,9 / 11 / **0**; 17,1 / 15 / **0** |
| Prolog | 36,2 / 681 / **19**; 66,9 / 901 / **12** | 50,2 / 937 / **0**; 66,9 / 941 / **0** |
| Prolog max (ms) | 494; 133 | 150; 134 |
| Menü | 35,7 / 13 / 25; 50,1 / 24 / 31 | 50,2 / 23 / 28; 66,9 / 29 / 23 |
| Spiel | 52,6 / 200 / 36; 50,1 / 258 / 37 | 66,6 / 300 / 30; 50,4 / 307 / 29 |
| adaptiv / Umbauten | 1,00 / 2; 0,75 / 3 | 1,00 / 2; 1,00 / 2 |

Dazu `--ersatzmass` gedrosselt je einmal: vorher adaptiv 1,00 / 2 Umbauten, nachher 0,50 / 2. Eine eigene Probe (Zeit
jedes `adaptiveResolution.set`) zeigt: Gedrosselt fällt die Absenkung **im sichtbaren Spiel** (erstes Level, Überlast
62 %), nicht hinter Startbildschirm oder Bühne. Die 4×-Drosselung macht das Spiel selbst CPU-gebunden (CPU p95 36–53 ms
je Bild), dort greift die Notbremse wie gedacht. Hinter Startbildschirm und Bühne gab es keine Umbauten mehr.

Gedrosselt ist der Prolog nicht flüssiger: Er hängt an der SVG-Bühne (Ticket 04), die WebGL-Bilder dahinter waren auf
dem Laptop billig. Der Gewinn zeigt sich als 0 gezeichnete Bilder, im Wegfall der langen Hänger (ungedrosselt 460 →
84 ms) und im Startbildschirm. Auf dem Poco (Zeichnen p95 136 ms, Hänger 200 ms in `frame` hinter der Bühne) sollte er
grösser sein. Ein Übergang Start → Prolog → Spiel ganz ohne Bild über 33 ms ist erst mit 03 (Hänger bei `introCalm`)
und 04 (Prolog) erreichbar.

Bildzähler einer eigenen Probe (headless mit GPU, frischer Stand): Startbildschirm ruhig 0 Bilder in 2 s, Schleife
ruht; Prolog beim Warten auf Tippen 0 Bilder in 1,5 s, ruht, verdeckt; vom Laden bis zum Klick insgesamt 3 Bilder
(Aufwärmen, Vorschau, Himmel eingeblendet), 9 während die Bühne einblendet; im Spiel 30–45 Bilder/s wie bisher.

**Poco F4 GT, Handy-Durchlauf 1 mit 01c als Vorher-Referenz** (volle Auflösung, Karte `adaptiv 1.00, Umbauten 0`,
Grafik gut; ganze Karte in Ticket 01): Startbildschirm p95 16,7 ms, max 98,7 ms, 5 Bilder > 33 ms, Zeichnen p95
40,0 ms, **62 gez/s**; Prolog p95 65,9 ms, max 148 ms, 320 Bilder > 33 ms, **Zeichnen p95 137,3 ms**, **22 gez/s**;
Spiel p95 16,6 ms, Zeichnen p95 37,6 ms, 54 gez/s; Seitenstart-Hänger 807 ms Script. Mit diesem Ticket fallen die
gezeichneten Bilder hinter Startbildschirm und Bühne weg (dort 62 bzw. 22 je s mit 40 bzw. 137 ms Zeichenzeit);
Nachweis im Handy-Durchlauf 2 (Ticket 07). Überholt: der erste Durchlauf mit 01b (`adaptiv 0.50, Umbauten 2`, halbe
Auflösung ab dem Prolog wegen des Ersatzmasses).

**Befund `adaptiveResolution` ohne Verdeckung (nicht geändert):** Sie misst den Abstand zweier gezeichneter Bilder,
nicht die Zeichenzeit: Jeder Hänger des Hauptthreads oder des Grafikprozesses (SVG, DOM, Uploads, Hall) zählt als
langsames Bild, auch wenn die Auflösung nichts dafür kann. Langsam heisst über max(20 ms, 1,25 × Sollabstand), also
schon ein ausgelassenes Bild bei 60 Hz; nach 2 s mit über 30 % langsamen Bildern senkt sie (Handy um 0,25, Desktop um
0,12). Die Probe danach («hat es geholfen?») vergleicht die nächsten 2 s mit den vorigen, auch wenn sich der Inhalt
inzwischen geändert hat (Prolog → Spiel, Menü → Einstieg): Eine Absenkung bleibt so leicht stehen, obwohl sie nichts
brachte, und erholt sich erst nach 8 s ruhigem Lauf (+0,08 bis zur Obergrenze, diese steigt nach 30 s um 0,05).
Vorschläge für die Messrunde (07), falls das Poco ohne `?perf` je absenkt: Bilder mit bekanntem Hänger nicht werten
(Abschnittswechsel, Laden, Uploads, über `hold`), erst nach zwei Fenstern in Folge senken, oder wo messbar die GPU-Zeit
statt des Abstands werten. Die Rolle als Notbremse bleibt so.

Tests: `node tests/logic.test.mjs` (2033), `node tests/golden.mjs`, `node tests/hall.test.mjs` (6), `tests/offline.mjs`,
`tests/screenshot.mjs` (Bild gleich wie vorher), `tests/leistung-probe.mjs` (headless Desktop und `--handy`, Fenster,
Fenster `--handy --drossel 4`, `--ersatzmass`), `tests/geschichte-probe.mjs --start`, `--grad leicht --welten 1 --finale
leicht` (Epilog → Menü: längste Lücke 33 ms, keine über 50 ms) und `--handy`: alle grün, Konsole ohne Fehler. Offen:
Review des Diffs, Merge nach `feature/leistung` (Koordinator).

**Review Code (31.10.2026).** Diff 00238ed + 8652165 (Vergleich `c7c005e..HEAD` ohne die Merges von 01/05) gegen
`animate()` und alle Stellen durchgesehen, die Zustand fortschreiben.

- **Hängenbleiben: keine fehlende Weckstelle für die verdeckten Phasen gefunden.** Alles, worauf die Geschichte wartet,
  läuft über `story.tween` (weckt; damit `wait`, `gazeTo`, `skyOf`), über DOM/Timer (Bühne, `untilTap`, `storySleep`)
  oder über Zustände in `pending()` (`flow` in/out samt `sinkTo`, Feier, Kamera, Strahlen, Drehung/Puls,
  `skyTheme.busy`). Die Ladeschleifen auf `uFade`/`uReady` hängen an `nextFrame`, ihr Fortschritt an `skyTheme.busy`;
  Vorschau, Netz, scharfes Bild, Streifen, Ende/Fehlschlag von `build` wecken. Aufdecken weckt immer (`ui.start`,
  Setter `story.covered`, `open`/`close`), jedes Tippen auch. Ein verpasstes Wecken liesse also hinter der Bühne nur
  Logik liegen, bis zum nächsten Tippen oder Aufdecken; ein Hänger des Spiels folgt daraus nicht. Ordnung in `frame`
  stimmt: Weckt `animate` synchron (`enterLevel` aus `updateFlow`), setzt `still` zurück, bevor geruht wird; Weckungen
  aus Promise-Fortsetzungen kommen nach `awake = false` und melden neu an.
- **Behoben (Commit «Review Ticket 02»): Strahlen nach dem Ruhen mit veralteter Zeit.** `beamView.update` setzt Geburt
  und Tod ab `beamView.time`, das nur `animate` nachführt. Lädt ein Level, während die Schleife ruht, stand die Zeit
  beim letzten Schritt: Probe (Level über `zeige` nach 3 s Ruhe hinter dem Startbildschirm) Uhr 10,4 s, Zeit 7,4 s,
  erste Geburt 8,4 s, also 2 s in der Vergangenheit: Strahlen ohne Wachsen, Entfallenes ohne Ausblenden. Jetzt setzt
  `recomputeBeams` die Zeit nach dem Ruhen (`sceneLoop.last === null`; `awake` ist dort schon wahr, weil `close` und
  `enterLevel` vorher wecken) auf die Uhr (ohne `?t=`): erste Geburt 11,5 s bei Uhr 10,5 s. In 02 erreicht man das nur
  über `zeige`; **für 06 wichtig**, dort trifft es jede Drehung nach dem Ruhen.
- **Offen, für 03/04/07 (nicht umgebaut): Bild vor dem Ruhen mitten in der Prolog-Fahrt.** Endet hinter der Bühne
  etwas (Himmel blendet ein, Kamera steht), zeichnet die Szene 10 Schritte später einmal, zu einem beliebigen Moment
  der SVG-Fahrt; auf dem Poco 137 ms Zeichenzeit, als Ruck in der Fahrt sichtbar möglich. Für die Bühne ist es
  entbehrlich: Bei `covered = false` zeichnet die Szene ohnehin, solange `#story` noch deckt. Vorschlag: hinter der
  Bühne erst beim Warten aufs Tippen zeichnen (wie die Upload-Regel in 03) oder nur beim Startbildschirm; im
  Handy-Durchlauf 2 prüfen.
- **Offen, für 06: Sicherheitsnetz.** Sichtbar ruhend wird ein verpasstes Wecken sichtbar (stehendes Bild). Billig:
  solange die Schleife ruht, alle 250–500 ms `pending()` prüfen und dann wecken, in den Proben dabei warnen, damit
  fehlende Weckstellen auffallen statt verdeckt zu werden. Für 02 nicht nötig (siehe oben).
- Kleinigkeiten ohne Änderung: Wird `#story` geschlossen, während `story.covered` wahr bleibt (nur `zeige`), bleibt
  `storyOpaque` stehen, eine spätere Bühne gälte schon beim Einblenden als deckend (Setter ohne Wechsel). Ein
  gespeichertes altes Panorama hält hinter der Bühne bis 30 s Logik wach (`held`, Desktop `keep`), ohne zu zeichnen.
- Geprüft und in Ordnung: Verdeckt erst nach den Transitionen von `#story` (`getAnimations` spült den Stil, auch im
  Finale mit `slow`); `?nointro` (Start vor `sceneLoop.start`), Neuladen, Epilog → Menü (`covered = false` vor `close`);
  Zeitbasis `clock`/`t` springt nicht, dt nach dem Ruhen 1/60; `adaptiveResolution` wertet verdeckte Bilder nicht
  (`skip`), beim Aufdecken `hold(0.5)` und `frameRate` neu; `resize` kalt, `visibilitychange`, Eingaben;
  Tests `frames` → `ticks` vollständig (übrige `frames` in `shots.mjs` und die Anzeige in `geschichte-probe.mjs` mit
  Absicht). Stil (Deutsch, «ss», Kommentare) passt.
- Tests nach dem Fix: `logic` (2033), `golden`, `hall` (6), `geschichte-probe --start` grün, Konsole ohne Fehler.
