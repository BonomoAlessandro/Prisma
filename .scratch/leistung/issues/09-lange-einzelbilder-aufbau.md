# 09: Keine langen Einzelbilder beim Aufbau des Himmels und bei der Ankunft im Level

**Spec:** ../spec.md

**Blocked by:** 07

**Status:** resolved

**What to build:** Auf der Reise in eine neue Welt, beim Einstieg und bei der Ankunft im Level hält kein Stück Arbeit
auf dem Hauptthread ein Bild über 33 ms an (Poco). Heute sind es einzelne Bilder von 50–100 ms. Optisch ändert sich
nichts: dieselben Ebenen, dieselben Fische, dasselbe Level, nur anders auf Bilder verteilt.

**Messwerte (07):**

- Poco, Handy-Durchlauf 2: Reise max 98,8 ms («FrameRequestCallback: Script 104 ms» bei 80,0 s, also ein Häppchen
  von `sliced`, das über `nextFrame` läuft) und 65,8 ms («FrameRequestCallback → frame: Script 60 ms»); Einstieg
  65,8 ms («→ frame: Script 72 ms» und 59 ms); Spiel und Spiel n. Reise je ein Bild 49,5 ms.
- T2000, Handy-Emulation 4× (Referenzdurchlauf): Reise max 333,6 ms (Script 314 ms), 200 ms (ohne Script, Grafikprozess);
  6×: Reise 340,7 ms, Einstieg 250,2 ms. Ungedrosselt Desktop: Feier im Wald 83 ms (Script 90 ms: Vorladen des Meers),
  Menü nach dem Laden in Meer/Wüste 50–67 ms (Script 53–76 ms).
- CPU-Profil der Reise Wald → Meer (Handy-Emulation 4×, `Profiler`; Poco etwa 3,4-mal schneller, abgeleitet aus der
  CPU-Zeit von `frame()`: Poco p95 9,4 ms, 4× 31,9 ms), längste zusammenhängende Stücke:

| Stück (4×) | Wo | Poco geschätzt |
|---|---|---|
| 312 ms | `build` → `compileParallel` → `issue` → `renderer.compile(scene)`: three erzeugt den Code aller Programme der ganzen Szene synchron (228 ms), dazu `skyUpload` → `initTexture` (48 ms) | ~90 ms |
| 172 ms | `frame` → `animate` → Fische `advance`: Einschwimmen über `WARM` = 5 s, 150 Schritte in einem Bild (`createFishSim`, `index.html` um 11671) | ~50 ms |
| 135 ms | `frame` → `story.update` → `enterLevel` → `loadLevel` (Elemente bauen, `makeSource`, `makeInteractive`) | ~40 ms |
| 133 ms | `sliced` → `fishField` (`dist` 49 ms, `relax` 21 ms) und `bakedMesh` → `bytes` (Base64, 57 ms) | ~40 ms |
| 90 ms | `sliced` → `paintedInstances` → `unpackModel` → `bytes` | ~25 ms |
| 86 ms | `sliced` → `waterSurface` → `waterGeometry` (58 ms in einem Schritt) | ~25 ms |

  Die Häppchen von `sliced` (6 ms) greifen nicht, wo ein einzelner Schritt nicht unterteilt ist. Die Reise gilt als
  ruhige Stelle (`ruhe.jetzt`: das Spiel selbst), der Aufbau läuft also mitten in der Fahrt, wenn «Weiter» früh
  getippt wird (Vorladen ab «Gelöst», `preloadNext`).
- Desktop und Handy-Emulation ungedrosselt: alle Bereiche flüssig (p95 ≤ 17,2 ms, Tabelle in 07); die langen Bilder
  treten dort nur vereinzelt auf. Ursache ist also CPU auf dem Hauptthread, nicht GPU.

**Vorschlag (ohne sichtbare Änderung):**

- [x] `compileParallel` beim Aufbau einer Skybox: nur die neuen Teile anstossen (Szene mit allen übrigen Kindern in
      `skip`, die Lichter der Szene bleiben), und je Wurzel bzw. je etwa 10 Materialien ein Häppchen (yield). Prüfen,
      ob die Programme danach im Cache sind (kein Übersetzen im ersten Bild, `skyWarmDraw` misst das).
- [x] Fische: Das Einschwimmen (5 s, 150 Schritte) in Häppchen von `sliced` während des Aufbaus vorrechnen, nicht im
      ersten Bild. Nach einer Pause (Himmel ausgeblendet, `t` springt) nicht neu einschwimmen, sondern vom letzten
      Stand weiterrechnen bzw. in Häppchen nachholen; die Plätze sind ohnehin zufällig, das fällt nicht auf.
- [x] `fishField`, `bakedMesh`/`unpackModel` (Base64 dekodieren), `waterGeometry`: in kleinere Schritte teilen (yield
      in den Schleifen) oder in den Worker, der schon die Bilder dekodiert. Ziel: kein Schritt über 6 ms auf dem
      Desktop bzw. 15 ms bei 4×.
- [x] `loadLevel` beim Abstieg ins Level: die Elemente über mehrere Bilder bauen (sie wachsen ohnehin nacheinander ein)
      oder schon während der Fahrt vorbereiten, solange der Blick im Himmel ist; das erste sichtbare Bild bleibt gleich.
- [x] Erneut profilieren (Reise Wald → Meer und Meer → Wüste, Einstieg nach dem Prolog), Handy-Emulation 4×: kein
      zusammenhängendes Script-Stück über 60 ms (entspricht ~18 ms auf dem Poco), ungedrosselt keins über 20 ms.
- [x] Referenzdurchlauf Desktop und Handy 4× vorher/nachher; Bilder der Reise und des Strands nebeneinander (gleich).
- [ ] Tests grün (`geschichte-probe` mit Reisen, `leistung-probe`, `golden`, Screenshots), Review, Commit.

**Abnahmekriterium:** Handy-Emulation 4×: Reise und Einstieg ohne Hänger über 100 ms und ohne Script-Stück über
60 ms; ungedrosselt in allen Reisen (Messprobe der Bereiche aus 07) kein Bild über 33 ms. Auf dem Poco
(Schlussabnahme): Reise und Einstieg max ≤ 33 ms bzw. höchstens ein ausgelassenes Bild. Fische, Wasser, Bäume und
Level sehen gleich aus.

**Nicht hier:** Das Bild von 98,8 ms im Prolog (bei 21,4 s, «ohne Script») ist Grafikprozess (Hochladen in der Pause
oder Rastern der Bühne); es gehört zur parallelen Klärung der Beobachtungen vom Poco (Glühwürmchen beim Einflug,
Flackern in der ersten Noa-Szene).

## Comments

**01.11.2026, Umsetzung** (Branch `leistung/09-einzelbilder` ab `eb8105e`). Optisch gleich: dieselben Daten, nur auf
mehr Bilder verteilt; Bilder mit angehaltener Zeit (`?t=12`, Strand, Wald, Wüste, Vulkan, GPU) vorher/nachher
pixelgleich (grösste Abweichung 0/255).

- **`compileParallel`** bekommt `variants` (Fassungen, je Aufruf eingestellt und optional zurückgestellt) und
  `slices` (Anstossen in Häppchen über mehrere Bilder, je ein Material und eine Fassung, ein neues Bild nach etwa
  `SLICE_MS`). Der Aufbau einer Skybox stösst nur noch die neuen Teile an (die Szene bleibt Wurzel für Licht, Nebel
  und Umgebung, alle übrigen Kinder in `skip`), beide Fassungen des Panoramas als `variants`, den Pinsel ebenfalls in
  Häppchen. `warmupShaders` nach dem ersten Level ebenso (der Vorwärm-Zustand gilt nur je Häppchen). `skyWarmDraw`
  übersetzt danach nichts mehr (im Profil kein `acquireProgram` darunter). **Für Ticket 10:** Seitenstart
  (`compileParallel([scene, passScene()], …)`) unverändert ohne `slices`, also in einem Stück; 10 kann dort
  `slices: true` setzen. Ohne `KHR_parallel_shader_compile` läuft jetzt derselbe Weg, nur ohne das Warten auf
  Fertigmeldungen.
- **Fische:** `fishSchools` ist ein Generator des Aufbaus: Wasserkarte lesen, Abstandsfeld (`fishField(…, true)`, je
  Zeile) und das Einschwimmen (`sim.warm(t)`, je Schritt, Startsuche je Schwarm), vorher im Rückruf des Bilds bzw.
  im ersten Bild. Nach einer Pause rechnet `advance` höchstens `CATCH` = 0,25 s nach und geht vom letzten Stand
  weiter, statt neu einzuschwimmen. Mit `?t=` bleibt das erste Bild gleich (Test in `logic.test.mjs`).
- **In Häppchen:** Base64 (`b64Bytes`, 256 k Zeichen je Stück, `Uint8Array.fromBase64` wo vorhanden), Umrechnung der
  Felder (`mappedFloats`), `unpackModel` (Generator, auch Röhren und Blätter), Normalen (`vertexNormalsSteps`,
  dasselbe Ergebnis wie three, geprüft), `bakedMesh`, `waterGeometry` (Generator, Felder direkt; geprüft gleich),
  Index des Kugelnetzes (`skyProxyGeometry`) und seine Hüllkugel (`boundingSphereSteps`), Auslesen der Tiefe
  (`skyLogDepth`, Streifen), Zeilen von `groundShift`.
- **Tiefe, Wassermaske und Karten** (`skyUpload` ohne Streifen): als ImageBitmap ohne Farbumrechnung aus denselben
  Daten hochgeladen (im Hintergrund dekodiert, gekippt wie three); ein Bild dekodierte der Browser sonst beim
  Hochladen im Hauptthread neu (Tiefe des Strands 48 ms schon ungedrosselt headless).
- **Level vorab:** `prepareLevel(index)` baut die Elemente (`buildElements`, je Element ein Häppchen, an ruhigen
  Stellen), sobald das nächste Level feststeht (`changeLevel`, also auch `story.sinkTo`; `story.begin`,
  `story.enter`). `loadLevel` nimmt sie und baut nur den Rest; das alte Feld wird in den nächsten Bildern freigegeben.
  Mit `?t=` nicht (dort zieht `Math.random` eine feste Folge; Golden- und Bildtests unverändert).

**Messung** (Quadro T2000, Chrome 156, echtes Fenster, `leise.sh` 100 %; andere Agenten arbeiteten gleichzeitig).
Vorher = `eb8105e`, nachher = dieser Branch. Profile mit `profil.mjs` aus 07 (Handy-Emulation 4×; nachher mit
`--sofort`: Profil schon vor dem Lösen, «Weiter» 0,4 s nach «Gelöst», damit der ganze Aufbau der neuen Welt drin
ist).

Längste Script-Stücke aus diesem Ticket (4×, ohne das Zeichnen im selben Bild):

| Stelle | vorher | nachher |
|---|---|---|
| `compileParallel` beim Aufbau (ganze Szene) | 188–232 ms in einem Stück | ≤ 25 ms je Häppchen |
| Einschwimmen der Fische (erstes Bild) | 172 ms | ~1 ms je Schritt beim Aufbau |
| `fishField` (Rückruf des Bilds) | 87 ms | je Zeile |
| `bakedMesh` (Base64, Felder) | 120–183 ms | ≤ 50–65 ms (Streifen des Bilds über OffscreenCanvas) |
| `unpackModel` / `paintedInstances` | 50–61 ms | ≤ 45 ms (Normalen in Häppchen) |
| `waterGeometry` | 58–78 ms | je Zeile bzw. Ring |
| `skyBufferUpload` (Hüllkugel Wüste) | 75 ms | je 64 k Ecken |
| `skyUpload` → `initTexture` (Tiefe des Strands) | 48–79 ms | ImageBitmap, wenige ms |
| `enterLevel` → `loadLevel` im Bild des Abstiegs | 120–149 ms | 19–41 ms (Elemente vorab; Rest: Strahlen, Würfel) |
| `warmupShaders` | 95 ms | in Häppchen |

Hänger (long-animation-frame) im Abschnitt Reise der Profilläufe, 4×: vorher Wald → Meer 271 ms (Script 261 ms),
224 ms, 175 ms; Meer → Wüste 201 ms, 198 ms (Script 189 ms). Nachher (je zwei Läufe): kein Hänger über 100 ms mit
Script; einmal 133 ms «Script 10 ms, Rendern 130 ms».

Referenzdurchlauf (`tests/leistung-probe.mjs --fenster` bzw. `--fenster --handy --drossel 4`), p95 / max / Bilder >
33 ms; vorher 1 Lauf, nachher die Läufe der letzten zwei Runden:

| Abschnitt | Desktop vorher | Desktop nachher | Handy 4× vorher | Handy 4× nachher |
|---|---|---|---|---|
| Einstieg | 17,1 / 33,4 / 2 | 16,9 / 66,8 / 5; 17,1 / 50,0 / 4; 17,1 / 50,1 / 3 | 50,1 / 166,7 / 35 | 50,1 / 183,6 / 39; 50,1 / 150,2 / 35; 66,7 / 166,8 / 34 |
| Spiel | 17,1 / 18,2 / 0 | 16,9 / 50,1 / 5; 17,1 / 33,5 / 2; 17,0 / 33,4 / 2 | 50,1 / 133,5 / 295 | 66,7 / 116,8 / 294; 66,8 / 116,8 / 318; 66,9 / 133,4 / 313 |
| Reise | 17,2 / 83,4 / 9 | 16,9 / 66,7 / 3; 17,1 / 32,3 / 0; 17,1 / 40,9 / 8 | 33,6 / **333,6** / 141 | 33,9 / **84,0** / 189; 33,6 / **83,4** / 226; 50,1 / 116,7 / 333 |
| Spiel n. Reise | 17,1 / 17,7 / 0 | 16,9 / 33,4 / 1; 17,1 / 33,4 / 1; 17,1 / 33,3 / 1 | 33,5 / 66,7 / 72 | 66,7 / 100,1 / 84; 50,2 / 66,8 / 103; 50,2 / 83,5 / 85 |
| Hänger Reise | 80 ms (Script 13), 72 ms (Script 59) | keiner | 328 ms (Script 318), 234 ms (ohne Script) | keiner |
| adaptiv / Umbauten | 1,00 / 0 | 1,00 / 0 (alle) | 1,00 / 2 | 1,00 / 2; 1,00 / 2; 0,75 / 3 |

Handy 4× hatte schon vorher Umbauten (Streuung, CPU-gebunden, siehe 03); `0,75 / 3` im dritten Lauf, als der
Rechner sichtbar belastet war (auch Menü und Prolog langsamer). Eine Zwischenrunde mit Häppchen zu 8 Materialien und
beiden Fassungen hatte noch 165–193 ms Script in der Reise bei 4×; seit je ein Material und eine Fassung kein solcher
Hänger mehr.

Ungedrosselt, Messprobe der Bereiche aus 07 (Desktop, alle sechs Reisen, Ausgangsstand und Branch direkt
nacheinander): Reisen W3–W6 max 20–24 ms (vorher 19–27 ms), Reise → W2 einmal 476 ms «ohne Script» (vorher 36 ms).
Stockungen von 380–430 ms «ohne Script» zeigte in diesem Lauf auch der Ausgangsstand («nach Reise» W2, W3, W5), der
Branch an anderen Stellen; in einem früheren Lauf lagen sie bei «Reise → W6». Das ist Grafikprozess bzw. System
(belasteter Rechner), kein Script dieses Tickets; Karte stets `adaptiv 1.00, Umbauten 0`.

Befund und offen:

- **Abnahme 4×, Reise:** ohne Hänger über 100 ms und ohne eigenes Script-Stück über 60 ms: erfüllt. Die längsten
  Bilder (83–117 ms) sind Bilder, deren Zeichnen bei 4× allein 50–100 ms kostet (Ticket 11). Mehr Bilder über 33 ms
  (141 → 189–333): die Arbeit liegt in vielen kurzen Stücken statt in wenigen langen, bei Zeichnen von 30–60 ms je Bild.
- **Einstieg 4×:** Script kürzer (`loadLevel` 130 → 19–33 ms), aber die längsten Bilder bleiben 146–170 ms «ohne
  Script» (Grafikprozess beim ersten Zeichnen der neuen Elemente); vorher 155–217 ms. Nicht durch Teilen von Script zu
  lösen; für 11 bzw. die Schlussabnahme notiert. Ungedrosselt hat der Einstieg einzelne Bilder von 50–67 ms «ohne
  Script» (vorher 33 ms), ebenfalls Grafikprozess, Streuung nicht ausgeschlossen.
- **Ein Element** (`makeSource`, erstes Mal) kostet im Vorab-Bau bei 4× bis 66 ms in einem Häppchen (Geometrien,
  kalter Code), während der Reise, nicht im Bild des Abstiegs. Feiner ginge es nur innerhalb der Fabriken.
- **Poco, Handy-Durchlauf 2b** (Koordinator: Spiel 197,5 ms «Script 201 ms» kurz vor der Reise, Einstieg 69 ms,
  Reise 67 ms): In diesem Fenster läuft das Vorladen der nächsten Welt. Bei 4× auf der T2000 kam der Abschnitt Spiel
  davor nie über 133 ms (Script nie über 67 ms); 201 ms Script auf dem Poco entsprächen rund 680 ms bei 4×.
  Wahrscheinlich wartet dort Script auf den Grafikprozess (Abfrage in `getProgramParameter`, wenn der Treiber nicht
  wirklich parallel übersetzt; vorher die ganze Szene in beiden Fassungen auf einmal). Jetzt stösst jedes Häppchen nur
  ein Material und eine Fassung an, und nur die neuen Teile. Ob das die 197,5 ms ganz abdeckt, zeigt erst das Poco.

Tests: `node tests/logic.test.mjs` (2035; neu: Fische nach einer Pause, `warm` gleich dem ersten Bild, Abstandsfeld
in Häppchen), `node tests/golden.mjs`, `node tests/hall.test.mjs`, `tests/offline.mjs`, `tests/screenshot.mjs`,
`tests/leistung-probe.mjs` (`--fenster`, `--handy`; Fenster Desktop und Handy 4× mehrfach),
`tests/geschichte-probe.mjs` (`--start`, `--grad leicht --welten 2 --finale leicht`, `--handy`),
`tests/leerlauf-probe.mjs`, `tests/start-probe.mjs`: grün, keine Warnung «Weckstelle fehlt».

**01.11.2026, Review** (`ea64fbd`). Korrekt im Kern: Häppchen liefern dieselben Daten (Normalen, Hüllkugel, Index des
Wassers, Base64 geprüft gegen three bzw. vorher), Lichter beim Teil-Übersetzen über `traverseVisible` der ganzen Szene,
`prepareLevel` rein (`createBoard` und Fabriken ohne globalen Zustand ausser `game.board`/`hitProxies`, die
`buildElements` tauscht), ein nicht passendes vorbereitetes Level wird in `loadLevel` freigegeben, das alte Feld in den
nächsten Bildern. Ohne `KHR_parallel_shader_compile` keine Schleife (`if (!ext) return`). Selbst behoben:

- `compileParallel` mit `slices` lief nach einem Abbruch des Aufbaus weiter und übersetzte über die von `release`
  schon entsorgten Materialien in `offscreen` (Szene unter dem Wasser): three legte für sie neue Programme an, die nie
  mehr frei wurden. Ebenso `warmupShaders`, wenn das Level während der Häppchen wechselt. Neu `alive` (Skybox:
  `my === token`) und nur noch Objekte, die noch unter ihrer Wurzel hängen.
- Ohne die Erweiterung schaltete `run` jetzt `checkShaderErrors` ab (vorher nicht): Fehler im Shader blieben dort
  stumm. Wieder nur mit der Erweiterung.
- `skyUpload` (ImageBitmap): `imageOrientation: 'flipY'` übergehen ältere Browser still (darum prüft `skyBitmaps` das
  mit einem 1×2-Bild); ohne Prüfung stünde dort die Tiefe Kopf. Jetzt nur gekippt, wo `skyBitmaps.flipsOk()` es
  bestätigt, sonst wie bisher als Bild. Dazu: Textur während des Wartens freigegeben → nicht mehr hochladen (sonst
  GL-Textur ohne Besitzer) und das ImageBitmap schliessen.

Offen bzw. Hinweis: Ein vorbereitetes, nie geladenes Level (etwa zurück ins Menü und dort bleiben) bleibt bis zum
nächsten `prepareLevel`/`loadLevel` im Speicher (nur CPU, nie gezeichnet), höchstens eines. Beim Merge mit 17: in
`fishSchools` `sim.warm(…)` besser mit `sceneTime.at()` statt `clock.getElapsedTime()` (dieselbe Zeitbasis wie
`animate`; heute unkritisch, weil das erste `advance` Bilder später kommt und `sceneTime` nie rückwärts läuft). Testmerge
`feature/leistung` + 09 + 11 + 17: ohne Konflikte, `logic` grün; `SCENE_PREPASSES` (11) meldet sich am Ende des
Generators `waterSurface` an und bei `releaseTree` ab, passt zum Abbruch. Tests: `logic` (2035), `hall`, `golden`,
`geschichte-probe --grad leicht --welten 2 --finale leicht` grün (ohne `?t=`, also mit
`prepareLevel`). `--uebersicht --dorf`: einzig «Spiel → Übersicht» mit 2 Lücken über 100 ms (134 ms), ebenso am
Ausgangsstand `eb8105e` (117 ms) im selben Takt; ein erster Lauf bei belastetem Rechner hatte 7 solche Abschnitte, auch
in Menü ↔ Übersicht ohne jeden Aufbau.

**02.11.2026, Browser-Review** (Testmerge `leistung/09-einzelbilder` auf `feature/leistung` `7549329`, ohne Konflikte;
verglichen mit `7549329`; echtes Chrome-Fenster, T2000, `leise.sh` 100 %; der Rechner war durch andere Läufe stark
belastet, Takt zeitweise 56 Hz). Urteil: **in Ordnung**, ein kleiner Fund selbst behoben.

- **Optik:** alle 5 Reisen und 6 Einstiege per Screencast, Desktop und Handy (393 × 873, DPR 2,75): Helligkeit und
  Schärfe je Bild vorher/nachher gleich (dunkle Strecken nur in Planeten/Sterne, gleich lang), nichts ploppt, Elemente
  wachsen wie vorher ein, Strahlen und Lösung korrekt. Fische sind beim Einblenden des Meers schon als Schwarm im Wasser.
  `?t=12` mit Level vor Strand und Wüste (Desktop, Strand auch Handy): pixelgleich, der Weg über ImageBitmap ist dabei
  aktiv (`flipsOk` true, 6 Uploads als ImageBitmap), Ufer und Wasserkante stehen richtig.
- **Bildzeiten** (Referenzdurchlauf, je 2× abwechselnd; Reise max / >33): Handy ungedrosselt vorher 39,1/4 und
  443,3/2, nachher 37,6/5 und 25,5/0; Desktop vorher 109,3/8 und 19,9/0, nachher 512,0/5 und 43,5/2. Hänger mit Script
  in Reise/Spiel nur vorher (129 ms «Script 113 ms» Reise, 81 ms «Script 68 ms» Spiel), nachher keiner über 10 ms
  Script; die Stockungen von 200–920 ms «ohne Script» kamen in beiden Ständen und in allen Abschnitten vor (auch Prolog,
  Startbildschirm), also Last des Rechners. Karte stets `adaptiv 1.00, Umbauten 0` (Handy 4×: beide 0,50 / 2, CPU-Last).
- **Randfälle** (Desktop und Handy, je vorher/nachher): Menü bei «Gelöst» während des Vorladens, Esc während der Reise
  (ignoriert wie vorher), schnell Menü/Weiter, Esc gleich nach «Weiter» (Level wird vorab gebaut), Übersicht → anderes
  Level, während eines vorbereitet ist (`levelPrep` danach leer, Elemente vollständig), Tab während des Aufbaus 4 s
  verborgen, Neuladen mitten im Aufbau: nichts hängt, keine Konsolenmeldung, keine «Weckstelle fehlt». Speicher nach
  3 Reisen Meer ↔ Wald: Geometrien 140, Texturen 37/38, Programme 60 unverändert; Heap stabil 11,2–11,5 MB (vorher
  10,2–10,4 MB).
- **Selbst behoben** (`8572b87`): Mit Ticket 17 rechnet `animate` mit `sceneTime.at(ts)` (Zeitstempel des Bilds),
  `sim.warm` aber nach der Uhr; liegt das erste Bild nach `warm` etwas davor, begann `advance` neu und rechnete die
  150 Schritte doch im ersten Bild. Jetzt bleibt ein Rücksprung bis `CATCH` stehen (Test in `logic.test.mjs`).
- Tests auf dem Testmerge samt Fix: `logic` (2036), `golden`, `geschichte-probe --grad leicht --welten 2 --finale
  leicht` und `--handy`, `offline`: grün.
