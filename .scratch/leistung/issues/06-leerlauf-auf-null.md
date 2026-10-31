# 06: Leerlauf auf 0

**Spec:** ../spec.md

**Blocked by:** 02

**Status:** ready-for-agent

**What to build:** Wenn sich im Spiel nichts sichtbar bewegt, wird nicht gezeichnet. Bewegt sich nur wenig, wird nur so
oft gezeichnet, wie die Bewegung braucht, und zwar so billig wie möglich. Optisch ändert sich nichts. Ziel ist, dass
Akku und Lüfter geschont werden.

Heute fällt `frameRate.due()` (`index.html` 19351–19405) nie unter 30 fps. Im Ruhezustand rendert die volle Pipeline
also 30-mal pro Sekunde: Szene, Spiegelung, Bloom, Final-Pass, Körnung.

Ticket 02 hat Logik und Zeichnen in `frame()` getrennt und den Mechanismus für Ruhen und Aufwecken (`wake()`) gebaut.
Dieses Ticket benutzt ihn für das sichtbare Spiel und baut keinen zweiten.

- [x] **Bestandsaufnahme zuerst:** Was bewegt sich im Ruhezustand sichtbar, pro Skybox? Staubteilchen, Sterne,
      Funkeln, Himmel, Wasser, Körnung (`grain` im Final-Pass), Strahlen und Ziele, Partikel. Das Ergebnis mit Angabe
      «sichtbar ja/nein» kommt ins Ticket, bevor umgebaut wird.
- [x] Bewegt sich nichts Sichtbares: 0 gezeichnete Bilder, und die Schleife ruht ganz, sofern keine Logik ansteht
      (siehe 02). Aufgeweckt wird sie über `wake()` durch Eingaben, Tweens, Kamerabewegung, Überblendungen, Ladeende
      einer Skybox, Grössenänderung, Rückkehr aus `visibilitychange` usw.
- [x] Bewegt sich nur Ambient-Animation (z. B. Staub, Funkeln): den nötigen Takt bestimmen. Prüfen, ob dafür die ganze
      Pipeline nötig ist oder ob der unveränderte Teil zwischengespeichert werden kann, z. B. Szene ohne Staub einmal
      rendern und nur die bewegte Schicht neu. Das nur dort umsetzen, wo es messbar spart und gleich aussieht.
      Kornrauschen, das jedes Bild neu würfelt, gilt nicht als «muss weiterlaufen», wenn ein stehendes Korn nicht
      auffällt. Das mit Vergleich entscheiden und im Ticket begründen.
- [x] Ist der Tab nicht sichtbar oder das Fenster minimiert, ruhen auch Audio-Timer (z. B. das Glitzern), soweit kein
      hörbarer Ton weiterlaufen soll. Die Bühne von Prolog und Epilog ruht nach Ticket 04 schon, wenn sie ausgeblendet
      ist. Hier nur prüfen, dass sie bei verstecktem Tab ebenfalls ruht.
- [x] Kleine Dauerkosten pro Bild mitnehmen, wo sie ohnehin angefasst werden: neue Arrays pro Bild in `cullInstances`
      (9618), `dimmed`-Array und `Color.clone()` in `renderReflection` (19262).
- [x] Messen: Ruhezustand im Level (ohne Eingabe) mit gezeichneten Bildern pro Sekunde und Zeichenzeit, vorher und
      nachher. Dazu ein Durchlauf mit Eingaben, damit nichts träge wirkt: Die erste Reaktion auf eine Eingabe kommt im
      nächsten Frame.
- [ ] Tests grün (Tests, die auf laufende Bilder warten, auf den neuen Takt umstellen), Review des Diffs, Commit auf
      `feature/leistung`.

## Comments

**Bestandsaufnahme (31.10.2026, vor dem Umbau), Branch `leistung/06-leerlauf` ab `leistung/02-szene-ruht` eb1be8f.**

Methode (eigene Probe, headless mit GPU, 1440 × 900, `?nointro&sky=<id>`): erstes Level der Geschichte («Moospolster»)
bzw. das Menü nach dem Laden, Strahlen und Ziele ruhig (6 s), dann die Hauptschleife angehalten und von Hand gezeichnet
(`renderReflection`, `composer.render`, `readPixels` der ganzen Leinwand). Erst ein Bild zur Zeit T, dann je Bestandteil
nur dessen Zeit auf T + Δ gesetzt (Kamera `updateCamera`, Himmel `skyTheme.update`, Sterne, Korn `finalPass.uTime`,
Elemente `userData.update`, Fluss der Strahlen `beamMaterial.uTime`, Bodenglanz, Staub, Blitze und Lichtflecken
`beamView.tick`) und Pixel verglichen. Δ = 1/30 s ist ein Bild bei 30 Bildern/s. Angabe: Anteil der Pixel mit
Änderung > 6/255 und grösste Änderung (von 255); «–» heisst keine Änderung über 2/255. Gegenprobe «nichts geändert»:
überall 0.

**Im Level** (je Bild bei 30/s; in Klammern über 1 s):

| Bestandteil | Wald | Strand | Wüste | Vulkan | Sonnensystem | Milchstrasse | sichtbar |
|---|---|---|---|---|---|---|---|
| Kamera schwebt (ganzes Bild) | 0,5 % / 245 (10 %) | 0,06 % / 222 (4 %) | 0,03 % / 245 (10 %) | 0,15 % / 245 (9 %) | 0,5 % / 228 (7 %) | 0,2 % / 230 (3 %) | **ja**, ~5 px/s am Plattenrand |
| Ziele: Stein dreht und schwebt, Atmen, Ringe | 0 % / 212 (0,2 %) | 0 % / 245 (0,2 %) | 0 % / 245 (0,2 %) | 0 % / 245 (0,2 %) | 0,03 % / 245 (0,3 %) | 1,6 % / 221 (0,4 %) | **ja** |
| Himmel (Ebenen des Panoramas) | 0 % / 90 (0,7 % > 2; Glühwürmchen, Nebel) | 0,8 % / 164 (11 %; Wasser, Fische) | – | 0,5 % / 195 (4 %; Lava) | 0,7 % / 210 (2,6 %; Wolken, Strahlen) | – | **ja** ausser Wüste und Milchstrasse |
| Strahlen fliessen, Energiepakete | 5/255 (0,1 % / 17) | 5 (0,1 % / 16) | 4 (0,1 % / 14) | 5 (0,1 % / 15) | 5 (0,1 % / 16) | 5 (0,1 % / 17) | kaum (Pakete nur im Glow) |
| Staub im Strahl (Schweben, Funkeln) | 17 (0,02 % / 121) | 16 (0,01 % / 125) | 16 (0,01 % / 120) | 11 (0,01 % / 113) | 11 (0,02 % / 151) | 11 (0,02 % / 152) | **ja**, vereinzelte Funken |
| Blitze und Lichtflecken (Flackern) | 12 (0,02 % / 24) | 5 (0,03 % / 28) | 4 (0,02 % / 25) | 3 (0,03 % / 38) | 10 (0,01 % / 21) | 3 (0,04 % / 42) | schwach |
| Sterne (Hintergrund) | – | – | – | – | 1 (0,05 % / 26) | 1 (0,05 % / 26) | schwach |
| Bodenglanz | – | – | – | – | – | – | nein |
| Korn (`grain`, neu je Bild) | 1 % > 2, max 3 | 1,4 % > 2, max 3 | 1,6 % > 2, max 3 | 0,7 %, max 3 | 0,4 %, max 4 | 0,4 %, max 3 | **nein** (nie über 4/255) |
| alles zusammen | 0,5 % / 219 (12 %) | 0,9 % / 245 (14 %) | 0,04 % / 226 (11 %) | 0,6 % / 247 (11 %) | 1 % / 244 (7 %) | 1,8 % / 230 (4 %) | |

**Im Menü** (der Blick steht im Himmel, die Platte ist nicht im Bild), alle sechs Himmel: je Bild höchstens 5/255
(Wald, Kamera an einer Kante), sonst 1–4/255 (Sterne funkeln, Korn), kein Pixel über 6/255; über 1 s höchstens
0,05 % der Pixel über 6/255 (funkelnde Sterne, max 23–29). Die Ebenen der Panoramas (Wasser, Lava, Glühwürmchen,
Wolken) liegen unter dem Horizont und sind nicht im Bild. Bilder: Menü und Level je Himmel in der Probe (nicht
versioniert).

Ergebnis: **Im Level bewegt sich immer sichtbar etwas**, in jeder Welt: Die Kamera schwebt (Sinus über 37–48 s, das
ganze Bild wandert langsam), die Ziele drehen sich, schweben und atmen, Staub funkelt, und vier der sechs Himmel leben
(Wasser, Lava, Glühwürmchen, Wolken). Das Kornrauschen ist mit höchstens 3–4/255 nicht zu sehen, die Pakete der
Strahlen kaum. **Im Menü und in der Übersicht steht das Bild fast still.** Ohne Bewegung ist die Szene nur mit `?t=`
(Zeit steht: Tests, KI-Tester).

**Entscheide**

- **Leerlauf auf 0 im Level: nicht möglich, ohne die Optik zu ändern.** Das Schweben der Kamera, die drehenden Ziele
  und die Himmel müssten dafür stehen bleiben; das fiele auf (die Szene «friert ein»). Die Schleife ruht sichtbar nur,
  wenn sich wirklich nichts bewegt (`sceneLoop.ambient()` falsch, also mit `?t=`, und `pending()` leer), sonst bleibt
  es bei 30 Bildern/s in Ruhe.
- **Takt der Umgebung im Level: 30 bleibt.** Pro Bild bei 30/s ändern sich durch das Schweben 0,03–0,5 % der Pixel um
  mehr als 6/255, an Kanten bis 245/255 (Kanten wandern um Bruchteile eines Pixels); bei 15/s (Δ = 1/15 s) doppelt so
  viel (Wald 1,15 %, Vulkan 0,5 %), dazu das Wasser am Strand (0,8 → 1,4 %) und die Lava. Bewegte Kanten, Wasser und
  Glühwürmchen in halber Rate ruckeln sichtbar; 20/s läge dazwischen und spart nur ein Drittel, mit unsicherem Urteil.
  Also wie bisher 30.
- **Unveränderten Teil zwischenspeichern (Szene ohne bewegte Schicht): nein.** Das Schweben der Kamera bewegt jedes
  Bild das ganze Bild (über 1 s 3–10 % der Pixel), es gibt keinen stehenden Teil, der sich zwischenspeichern liesse;
  dazu läuft Bloom über das ganze Bild (Strahlen und Ziele blühen). Lohnen würde es erst, wenn die Kamera stünde.
- **Korn:** neu je gezeichnetem Bild wie bisher; es zählt nicht als Bewegung (`ambient` fragt es nicht ab). Ruht die
  Schleife, steht das Korn des letzten Bilds; mit 3–4/255 ist es weder bewegt noch stehend zu sehen (Vergleich der
  Bilder oben: Korn allein ändert nie ein Pixel über 4/255). Kein Umbau nötig.
- **Menü und Übersicht: 10 statt 30 Bilder/s** (`frameRate.skyFps`, wenn `story.choosing`, der Blick ganz oben,
  keine Tweens und nicht hinter der Bühne). Begründung: Je Bild bei 30/s ändert sich nichts über 5/255; bei 10/s
  (Δ = 0,1 s) bleiben es nach den Messungen über 1/15 s und 1 s höchstens etwa 4–10/255 auf einzelnen Sternen
  (Funkeln mit höchstens 0,3 Hz). Das ist nicht zu sehen, die Stufen des Funkelns liegen unter 10 % der Helligkeit
  eines einzelnen Sterns. Ganz auf 0 gehen hiesse, das Funkeln anzuhalten, das liessen wir.
- **Spiegelung nur, wenn die Platte im Bild ist** (`renderReflection`: Hüllquader der Platte gegen das Sichtfeld der
  Kamera). Im Menü und in der Übersicht (Blick im Himmel) fällt so das zweite Rendern der Szene weg; taucht die Platte
  wieder auf, wird sie im selben Bild gespiegelt. Optisch gleich (nur die Platte zeigt die Spiegelung).
- **Spiegelung im Level nur jedes zweite Bild: nicht umgesetzt.** Sie zeigt Ziele, Staub und das Schweben der Kamera
  mit; mit 15/s liefe ihr Bild dem Hauptbild nach. Ob das auffällt und was es spart, ist nicht gemessen: Kandidat für
  die Messrunde (07), falls das Poco im Level zu viel zeichnet.

**Umsetzung**

- `sceneLoop` (Ticket 02) wiederverwendet, kein zweiter Mechanismus. Neu `ambient()` (läuft die Uhr, lebt die
  Umgebung) und `pending()` erweitert um alles, was in dt weich nachgeführt wird (Hover, Treffer, falsche Farbe,
  Aufblitzen und Bögen der Ziele). Sichtbar zählt `frame()` jetzt ebenfalls Schritte ohne Bewegung und ruht nach
  `REST_STEPS`, das letzte Bild bleibt stehen. `wake()` lässt das erste Bild nach dem Ruhen sofort zeichnen
  (`frameRate.skipped`, `prevTs`) und die Pause nicht als langsames Bild werten (`adaptiveResolution.skip`).
- Neue Weckpunkte: `pointermove` (Ziehen, Hover), `pointerup`, `setHovered`, `startPulse`, `rotateElement` (auch
  `__prismaDebug.loese`), `celebration.start`, `__prismaDebug.settle` (kalt). Bisher schon: Eingaben, Tweens, Himmel,
  Level, Grösse, `visibilitychange`.
- `frameRate.skyFps` = 10 und `skyOnly()` (Menü, Übersicht); `renderReflection` prüft die Platte im Bild.
- Dauerkosten: `cullInstances` ohne `map`/`every` je Bild (Auswahl in einem festen `Uint8Array` je Mesh),
  `renderReflection` ohne `dimmed`-Array und `Color.clone()` (Werte in `userData.reflectSave`, ein festes Feld).
- **Audio:** Der Zeitgeber des Glitzerns plant im verborgenen Tab und stumm nichts mehr und ruht ganz
  (`_shimmerResume`); `_sync` (bei `visibilitychange` und Ton an) plant wieder. Der Kontext wurde schon bisher
  angehalten. Die Bühne von Prolog und Epilog läuft über rAF (`createStoryScene`), das im verborgenen Tab nicht
  aufgerufen wird; ihre CSS-Animationen hält der Browser ebenso an. Unverändert (Ticket 04).
- Tests: `tools/ki-tester/shots.mjs` weckt die Schleife vor dem Warten auf Bilder (`rendered`: mit `?t=` ruht die Szene,
  nach `wake(true)` zeichnet sie wieder `REST_STEPS` Bilder). Neue Probe `tests/leerlauf-probe.mjs` (README): Menü,
  Ruhe im Level, Eingaben mit Reaktion; `--still` prüft 0 Bilder mit stehender Zeit.

**Messung (31.10.2026)**, Rechner der Agenten (Quadro T2000, Chrome im Fenster, `leise.sh`; andere Agenten liefen
gleichzeitig), `tests/leerlauf-probe.mjs --fenster` (Wald), vorher = eb1be8f als Kopie (`--seite`). Zeichnen = GPU-Zeit
je gezeichnetem Bild, GPU-Last = Mittel × gez/s.

Ungedrosselt (Desktop, maximiert):

| Abschnitt | vorher gez/s / Zeichnen p95 (Mittel) / GPU-ms je s / CPU p95 | nachher |
|---|---|---|
| Menü, 8 s ohne Eingabe | 30,1 / 8,2 (4,1) / **124** / 2,1 | **9,9** / 6,0 (4,7) / **47** / 1,6 |
| Level, 10 s ohne Eingabe | 30,0 / 10,0 (6,9) / 207 / 5,4 | 30,0 / 14,7 (6,7) / 200 / 5,2 |
| Eingaben (Hover, 3× drehen, ziehen) | 60,1 / 5,8 (4,2) / 253 / 3,2 | 60,1 / 9,8 (6,8) / 408 / 5,4 |
| sichtbar p95 / max (Level) | 17,1 / 17,5 | 17,1 / 17,4 |
| Reaktion (9 Eingaben) | alle im nächsten Bild | alle im nächsten Bild |

Handy-Emulation, CPU 4× gedrosselt (393 × 873, Pixeldichte 2,75):

| Abschnitt | vorher | nachher |
|---|---|---|
| Menü, 8 s ohne Eingabe | 30,0 / 13,4 (9,6) / **287** / 12,4 | **10,0** / 8,3 (8,2) / **82** / 9,4 |
| Level, 10 s ohne Eingabe | 28,5 / 25,3 (17,3) / 491 / 35,2 | 27,2 / 27,3 (17,4) / 472 / 38,7 |
| Eingaben | 37,7 / 24,1 (15,4) / 581 / 39,0 | 33,7 / 27,1 (17,3) / 582 / 43,2 |
| Reaktion (9 Eingaben) | alle im nächsten Bild | alle im nächsten Bild |

Lesart: Im Menü und in der Übersicht fällt die GPU-Last um 60–70 % (ein Drittel der Bilder, ohne Spiegelung). Im Level
ohne Eingabe bleibt sie gleich (30 Bilder/s, siehe Entscheide); die Unterschiede dort und bei den Eingaben liegen in den
Schwankungen der geteilten Maschine (gleiche Bilder je Sekunde, gleiche Pipeline; die Eingaben-Strecke ist kurz, ihre
Zeichenzeit hängt am Drehen und Ziehen). Die erste Reaktion kam in allen Läufen im nächsten Bildschirmbild nach dem
Ereignis (`pointerdown`/`pointerup`/`pointermove` → nächstes gezeichnetes Bild, 0 übersprungene); gedrosselt dauert der
Weg bis zum Zeichnen 40–120 ms, vorher wie nachher (die gedrosselte CPU). Mit `?t=` (`--still`): Menü und Level 0 Bilder
in 3 s, die Schleife ruht; Hover, Drehen und Ziehen wecken sie, Reaktion im nächsten Bild.

**Verborgener Tab** (eigene Probe, headless; `document.hidden` per Skript gesetzt, `visibilitychange`): sichtbar läuft
der Zeitgeber des Glitzerns, Kontext `running`; 8 s verborgen: kein Zeitgeber, Kontext `suspended`; wieder sichtbar:
Zeitgeber und Kontext laufen. Stumm 8 s: kein Zeitgeber; Ton an: läuft wieder. Konsole sauber.

Tests: `node tests/logic.test.mjs` (2033), `node tests/golden.mjs`, `node tests/hall.test.mjs` (6), `tests/offline.mjs`,
`tests/screenshot.mjs` (Bild wie vorher), `tests/leistung-probe.mjs` (headless Desktop und `--handy`),
`tests/leerlauf-probe.mjs` (headless, `--still --handy`, Fenster Desktop und `--handy --drossel 4`, je vorher und
nachher), `tests/geschichte-probe.mjs --start`, `--grad leicht --welten 2 --finale leicht` und `--handy`,
`tools/ki-tester/shots.mjs` (Plätze 1 und 12, Desktop und Handy, mit `?t=`: Szene wird ruhig, Bilder gleich): alle
grün. Offen: Review des Diffs, Merge nach `feature/leistung` (Koordinator).

**Code-Review (31.10.2026, `git diff eb1be8f 71978ac`, ohne Browser-Optik).** Korrekt; ein kleiner Fund behoben, ein
Hinweis an 02.

- Weckpunkte: Sichtbar ruht die Schleife nur mit `?t=` (`ambient()` ist ohne feste Zeit immer wahr), im echten Spiel
  kann sichtbar nichts einfrieren. Mit `?t=` alle Zustandsänderungen durchgesehen (Level, Drehen, Rückgängig/`C`,
  Treffer/falsche Farbe/Bögen über `recomputeBeams`, Hover, Puls, Feier, Kamera inkl. Nachziehen nach dem Loslassen
  über `cameraRig.settling`, Himmel, Grösse, `visibilitychange`, Bühne): keine Lücke gefunden; was ohne Weckruf per
  Skript geändert wird, braucht `wake(true)` (so `shots.mjs`, `settle`).
- `wake()`/`adaptiveResolution`: Die Pause wird nicht gewertet (`skip` ≥ 1, dazu `ms > 100`), `prevTs`/`skipped`
  zurückgesetzt. In Ordnung.
- `skyOnly()`: **behoben** (0dc642e). Lädt, schärft oder blendet der Himmel unter dem Menü ein bzw. über (etwa das
  Panorama nach dem Start, das unter dem Menü fertig lädt), lief das mit 10 Bildern/s stufig. Neu `skyTheme.moving`
  (Überblenden, Vorschau, Einblenden, Schärfen), `skyOnly` verlangt `!skyTheme.moving`; `skyTheme.busy` = `moving`
  + Freigabe ausgeblendeter Hintergründe wie bisher.
- `renderReflection`: `Frustum.intersectsBox` ist konservativ (nie falsch negativ), die Spiegelung liest nur
  `floorTop` (Platte bei y = 0, unverschoben). Ohne Platte im Bild fällt auch `onBeforeRender` weg, das schadet nicht.
  Nebenwirkung: Ist die Platte beim ersten Zeichnen nicht im Bild (Menü nach dem Start), wird das Render-Target der
  Spiegelung erst beim Absenken des Blicks erstmals belegt; ein einzelner längerer Bild-Zeitpunkt mitten im Schwenk
  ist möglich (Optik-Review/07 beobachten).
- `cullInstances` (`Uint8Array`) und `renderReflection` (`reflectSave`): gleiches Ergebnis wie vorher.
- Audio: `_shimmerResume` ohne doppelte Zeitgeber, ruht verborgen/stumm, `_sync` plant wieder. In Ordnung.
- Hinweis zu 101443b (aus 02, hier gemergt): In `recomputeBeams` steht die Prüfung `sceneLoop.last === null` *vor*
  `sceneLoop.wake()`. Ist `recomputeBeams` selbst der Weckruf (ruhende Schleife, kein Ereignis davor, etwa
  `loadLevel` hinter der Bühne oder per Skript), ist `last` noch gesetzt und `beamView.time` wird nicht
  nachgezogen. Robuster: erst `wake()`, dann prüfen (nach `wake()` ist `last` genau dann null, wenn die Schleife ruhte
  oder seit dem Wecken noch keinen Schritt gemacht hat). Nicht selbst geändert, weil der Entwickler gerade in
  `index.html` arbeitet.
- Läufe: `logic` (2033), `golden`, `hall` (6) grün.

**Nach dem Review (31.10.2026).**

- 101443b und den Abschluss von 02 (dc33566) gemergt. `recomputeBeams`: erst `wake()`, dann `last === null` prüfen
  (Fund oben). Probe (eigene, headless): sichtbare Schleife künstlich ruhen lassen (`ambient` aus), 3 s warten, dann
  drehen (`rotateElement`) bzw. nur `recomputeBeams` als Weckruf: Der alte Strahl blendet von 0,99 an aus, der neue
  wächst von 0 bis zur vollen Länge (je etwa 130 Bilder, 2,4 s wach), Konsole sauber.
- **Sicherheitsnetz** `sceneLoop.guard()`: Solange die Schleife ruht, alle 350 ms `pending()` (sichtbar dazu die
  Umgebung) fragen; steht doch etwas an, `console.warn('sceneLoop: Weckstelle fehlt – … ansteht: <was>')` und wecken.
  `pending()` gibt dafür zurück, was ansteht (Text). Mit `?t=` läuft das Netz nicht. `tests/leerlauf-probe.mjs` und
  `tests/geschichte-probe.mjs` melden solche Warnungen als «WARNUNG: n× fehlende Weckstelle».
- **«Überspringen»** (`story.update` schaltet `#btn-skip`): `pending()` hält die Schleife wach, solange
  `skippable()` vom angezeigten Stand abweicht oder die Pause nach dem Einstieg ins Dorf (`skipRuhe`, endlich) läuft.
  Andere DOM-Zustände aus `animate`: «Gelöst» kommt aus der Feier (ansteht), `updateFlow` blendet nur in `in`/`out`
  (ansteht), Treffer-Töne über die Strahlen (ansteht). Keine weitere Lücke.

**Review Nachtrag (31.10.2026, `git diff 5109561 1caaacd`).** In Ordnung, nichts geändert. `recomputeBeams` weckt
jetzt zuerst, damit ist der Hinweis zu 101443b erledigt. `guard()` beendet seine Kette, sobald die Schleife wach ist,
und läuft mit `?t=` nicht. Zeitabhängig kann `pending()` beim Ruhen nur über `skipRuhe` wahr werden, und diese Zeile
deckt das ab; sonst ändert sich nichts ohne Weckruf, Fehlalarme sind also nicht zu erwarten. `skippable()` hat keine
Nebenwirkungen und gleicht sich in `story.update` in einem Schritt an, die verdeckte Schleife bleibt also nicht dauernd
wach. `golden`, `hall` (6), `logic` (2033) grün.

**Browser-Review (31.10.2026, Stand `ff7f764`, vorher `eb1be8f`).** Echtes Chrome im Fenster auf der GPU (Quadro
T2000, 60 Hz), Desktop maximiert und Handy-Emulation (393 × 873, Pixeldichte 2,75, CPU 4× gedrosselt). Eigene Probe:
Pixeländerung je gezeichnetem Bild (`readPixels`), Display-Abstände, gezeichnete Bilder, Spiegelung je Bild gegen
eine unabhängige Prüfung «Platte im Bild» (Raster 11 × 11 projiziert), Reaktion je Eingabe. Urteil: **in Ordnung**,
nichts geändert.

| | vorher | nachher |
|---|---|---|
| Menü, gez/s (alle 6 Welten) | 30 | 10 |
| Menü Desktop, Änderung je Bild (max) | 3–8/255 | 4–6/255 (Wald 21/255 auf 0,002 % der Pixel) |
| Menü Handy, Änderung je Bild (max) | 6–8/255, dazu Umbauten der Auflösung (ganzes Bild) | 5–11/255 (Wald 78/255 auf ~7 Pixeln) |
| Spiegelung fehlt, obwohl Platte im Bild (Menü↔Level, Übersicht, Feier; davon 10–52 Bilder mit Platte teilweise im Bild) | 0 | 0 |
| Reaktion Klick/Taste → erstes gezeichnetes Bild | im nächsten Bild | im nächsten Bild |
| Menü→Level Desktop, Display max | 33,4 / 18,4 ms | 33,5 / 33,3 ms |
| Level→Menü Desktop, Display max | 17,2 ms | 32,6 / 33,4 ms |
| Menü→Level erneut (erster Blick auf die Platte, Spiegelung wieder an) | 17,3 ms | 17,2 / 17,3 ms |
| Referenzdurchlauf Desktop | adaptiv 1.00, Umbauten 0 | adaptiv 1.00, Umbauten 0 |
| Referenzdurchlauf Desktop, max Spiel / Einstieg / Reise | 33,9 / 116,8 / 100,1 ms | 20,1 / 50,1 / 50,1 ms |
| Referenzdurchlauf Handy 4× | adaptiv 1.00, Umbauten 2 | adaptiv 1.00, Umbauten 2 |

- Optik: Im Menü und in der Übersicht ruckelt bei 10/s nichts sichtbar. Der einzige grössere Ausschlag (Wald, Handy)
  ist ein einzelner Lichtpunkt, der mit etwa 1 Gerätepixel je 0,1 s wandert. Das ist keine Stufe, die man sieht.
  Start→Menü (Frage a): Solange `skyTheme.moving` gilt, zeichnet das Menü mit 30/s, danach mit 10/s. Je Bild ändert
  sich höchstens 23/255, auf weniger als 0,01 % der Pixel. Die Überblendung bleibt flüssig.
- Spiegelung (Frage b): Sie fehlt in keinem Bild. Kehrt die Platte ins Bild zurück, entsteht kein langes Bild.
- Konsole (Frage c): In keinem Lauf «Weckstelle fehlt» (Desktop und Handy, alle Übergänge), auch keine Fehler.
- Umbauten 2 im gedrosselten Handy-Durchlauf gibt es vorher und nachher gleich. Ursache ist die 4×-Drosselung, nicht
  Ticket 06. Abgenommen wird auf dem Poco.
- Beobachtung, kein Fund: In der offenen Übersicht (10/s) fiel auf dem Desktop in 2 von 3 Läufen gelegentlich ein
  einzelnes Display-Bild aus (33 ms, 1–3 in 3 s), vorher nie. Das Öffnen und Schliessen der Übersicht hängt vorher wie
  nachher 50–100 ms (DOM, nicht 06). Vermutlich taktet die GPU bei wenig Last herunter. Sichtbar ist es nicht, weil
  sich dahinter nichts bewegt. Für 07 im Auge behalten.
