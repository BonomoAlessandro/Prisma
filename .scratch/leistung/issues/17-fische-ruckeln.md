# 17: Fische glatt, aber ruckelig

**Spec:** ../spec.md

**Blocked by:** 14

**Status:** ready-for-human (Review erledigt, Abnahme auf dem Poco in Handy-Durchlauf 2c)

**What to build:** Die Fische am Strand bewegen sich auf dem Handy gleichmässig. Beobachtung des Nutzers im
Handy-Durchlauf 2b (Poco F4 GT, Stand `leistung-07b`): «Die Fische waren glatt, aber ruckelig.» Seit Ticket 14 sind die
Kanten glatt, die Bewegung ruckelt. Die Karte zeigt «Spiel n. Reise» 56 gezeichnete Bilder/s, «Spiel» (Wald) 53/s, also
weder gleichmässig 60 noch 30.

- [x] Diagnose mit Beleg: Takt je rAF, Zeit `t`, Fischposition je Bild am Strand, mit und ohne Eingabe, ungedrosselt
      und 4×, Stand jetzt gegen 01c.
- [x] Zeitbasis: `t` aus dem rAF-Zeitstempel statt aus der Uhr beim Start des Callbacks (gebaut, siehe Comments).
- [ ] Abnahme auf dem Poco im nächsten Handy-Durchlauf: Fische bei normalem Abstand ohne Ruckeln, auch beim Tippen.
- [x] Takt im Level (Entscheid Koordinator 01.11.2026, siehe «Takt je Welt» unter Comments): kein sichtbarer Wechsel
      30 ↔ 60, solange etwas im Bild ist, dem das Auge folgt; stetig 60 in Strand, Wald, Vulkan, Sonnensystem.
- [x] Review des Takts, Tests grün.

## Diagnose

Gemessen im echten Chrome mit Fenster auf der Quadro T2000, Handy-Emulation 393 × 873, DPR 2,75, Android-Kennung,
`?nointro&sky=beach`, `zeige(0)`, gerendert 786 × 1746, `adaptiv 1`. Probe (`takt.mjs`): Je rAF von `frame` werden
`ts`, der Verzug des Callbacks (`performance.now() − ts`), ob gezeichnet wurde, das `t` der Szene (`finalPass.uTime`),
die Zahl der Unterwasser-Pässe und die Bildschirmposition aller 57 Fische (aus `aPos`, mit der Kamera projiziert)
festgehalten. Drei Phasen: 10 s ohne Eingabe («still»), 10 s Tippen alle 0,4 s («tippen», `Input.dispatchTouchEvent` in
den Himmel), 15 s Tippen alle 3 s («wechsel», wie beim Spielen). «Gleichmass» = Schritt eines Fischs je Bild, geteilt
durch den Abstand der rAF-Zeitstempel, relativ zum gleitenden Median (± 6 Bilder) desselben Fischs: 1,00 heisst, der
Fisch bewegt sich genau im Takt der Bildschirmbilder.

| Lauf | Phase | gez/s | Abstände gez. Bilder (Display-Frames) | Verzug Callback p50 / p95 / max | Gleichmass p5 / p95 |
|---|---|---|---|---|---|
| jetzt 1× | still | 30,0 | 2: 299 | 0,4 / 1,2 / 2,5 ms | 0,97 / 1,04 |
| jetzt 1× | tippen | 60,0 | 1: 599 | 0,4 / 0,5 / 0,7 ms | 0,99 / 1,01 |
| jetzt 1× | wechsel | 45,7 | 1: 468, 2: 215 (9 Taktwechsel) | 0,4 / 0,6 / 3,3 ms | 0,99 / 1,01 |
| jetzt 4× | still | 30,0 | 2: 296, 3: 2 | 1,4 / 7,4 / 17,4 ms | 0,95 / 1,05 |
| jetzt 4× | tippen | 49,9 | 1: 401, 2: 92, 3: 4 | 7,7 / 16,8 / 22,0 ms | **0,71 / 1,60** |
| jetzt 4× | wechsel | 36,0 | 1: 213, 2: 292, 3: 34 | 5,5 / 16,4 / 23,9 ms | **0,65 / 1,41** |
| 01c 1× | wechsel | 45,7 | 1: 472, 2: 213 | 0,4 / 0,5 / 2,2 ms | 0,99 / 1,01 |
| 01c 4× | tippen | 41,5 | 1: 268, 2: 125, 3: 20 | 9,1 / 17,3 / 335 ms | **0,66 / 1,56** |
| 01c 4× | wechsel | 36,6 | 1: 234, 2: 278, 3: 34 | 4,4 / 15,8 / 19,5 ms | **0,71 / 1,52** |

Die Fische ziehen mit 22–34 CSS-px/s (p95 bis 55) über den Schirm, je Bild bei 60/s also 0,4 CSS-px (1 Gerätepixel),
bei 30/s 0,9 CSS-px (2,5 Gerätepixel).

Zu den Kandidaten:

1. **Ungleichmässiger Takt: ja, zwei Ursachen.**
   - **Zeitbasis (Hauptbefund).** `animate` bekam `clock.getElapsedTime()`, also die Uhr beim *Start des Callbacks*,
     nicht den Zeitstempel des Bildschirmbilds (`ts`). Der Callback startet je nach Arbeit davor (Eingaben, Timer,
     Häppchen) verschieden spät: ungedrosselt 0,4–1,2 ms (p95), unter 4× CPU 7–17 ms (p95), bis 24 ms. Dann rechnen die
     Fische für ein Bild, das 16,7 ms nach dem vorigen kommt, mal 8 ms, mal 26 ms Bewegung: Schritte von 0,65× bis 1,6×
     des richtigen (4×, mit Eingabe). Das ist das sichtbare Ruckeln, und es betrifft alles, was mit `t` läuft (Kamera,
     Wasser, Fische); die Fische fallen nur am meisten auf, weil sie gleichmässig ziehen und das Auge ihnen folgt. Das
     Poco liegt näher an «4×» als an «1×»: Die Karte zeigt CPU p95 9,3–11,8 ms je `frame()` im Spiel, dazu Eingaben und
     Laden zwischen den Bildern.
   - **Wechsel 30 ↔ 60** (`frameRate.busy` / `idleFps`, Ticket 06 bestätigt): Ohne Eingabe zeichnet das Level jedes
     zweite Bildschirmbild (30/s, Screencast `still`: 300 Bilder in 10 s, alle im Abstand von 2 Display-Frames), mit
     Eingabe 1,5 s lang jedes (60/s). Beim Spielen wechselt das alle paar Sekunden (9 Wechsel in 15 s bei Tippen alle
     3 s); die Fische springen dann von 1 auf 2,5 Gerätepixel je Bild. Daher auch 53/56 gez/s auf der Karte: eine Mischung
     aus 60 (Eingabe) und 30 (Ruhe), keine ausgelassenen Bilder durch `due`. `due` selbst (10-%-Quantil) lässt kein
     Bild aus: ungedrosselt sind die Abstände exakt 1 bzw. 2 Display-Frames. Unter 4× kommen Abstände von 3 Frames
     dazu, weil die CPU den Takt nicht hält (rAF 44–51/s), mit wie ohne Fix.
2. **Simulation der Fische: in Ordnung.** `alpha` ist stetig (Mischung zwischen zwei 1/30-s-Schritten, Gleichmass
   1,00 ± 0,01 ungedrosselt bei 60/s). Mit stetigem `t` stetig; Neubeginn (WARM) nur bei `t` rückwärts oder einer Lücke
   über 5 s (Strand neu gewählt, nicht im Spiel). Sichtbar ruht die Schleife nur mit `?t=` (`ambient`), `t` springt im
   Spiel nach dem Ruhen also nicht; verdeckt läuft die Uhr weiter (beim Aufdecken ein Sprung um die verdeckte Zeit,
   wie gewollt). Proben-Pausen (08) setzen `t` nicht zurück.
3. **Unterwasser-Pass: in Ordnung.** In jedem gezeichneten Bild genau einmal (`plane.onBeforeRender`, gezählt über
   `renderer.render` mit der Unterwasser-Szene: 1 je Bild in allen Läufen; die Spiegelung zeichnet das Wasser nicht).
   `frustumCulled` ist aus, `on` nur falsch, bis die Wasserkarte gelesen ist.
4. **Wasser und Brechung gegen die Fische:** Beide laufen mit demselben `t` (`uTime`) im selben Bild, kein eigener
   Takt.
5. **Seit wann: alt, nicht durch 03 oder 06.** 01c (`2455277`) misst gleich (Tabelle). Der Wechsel 30 ↔ 60 stand schon
   vor diesem Vorhaben in `main` (`idleFps: 30`), die Uhr beim Callback ebenso. Aufgefallen ist es erst mit Ticket 14:
   Im halb so grossen `under.target` sprangen die Fischkanten in Treppen von 2,75 Gerätepixeln, das überdeckte die
   kleinen ungleichen Schritte; mit glatten Kanten sieht man sie.

## Vorschlag (falls das Ruckeln auf dem Poco nach dem Fix bleibt; umgesetzt, siehe «Takt je Welt»)

Den Wechsel 30 ↔ 60 im Level am Strand vermeiden: Solange Fische im Bild sind, auch ohne Eingabe 60 Bilder/s (etwa ein
Merkmal je Skybox, das `frameRate` als `idleFps` 60 liest). Das widerspricht dem Entscheid aus 06 («30 bleibt») und
verdoppelt am Strand die GPU-Last in Ruhe (Poco heute 13,4 ms Dauerlast je Bild, also 80 % bei 60/s): erst nach
Ticket 11 (Ziel ≤ 6 ms) sinnvoll, Entscheid Nutzer bzw. Koordinator. Abnahmekriterium dafür: am Strand ohne und mit
Eingabe Abstände der gezeichneten Bilder ungedrosselt nur 1 Display-Frame, Poco-Dauerlast «Spiel n. Reise» ≤ 8 ms,
Nutzer sieht auf dem Poco kein Ruckeln.

## Comments

**Fix, 01.11.2026, Branch `leistung/17-fische-ruckeln` ab `3fcafa0`:** `sceneTime.at(ts)` ersetzt
`clock.getElapsedTime()` in `frame` (sichtbar und verdeckt): Zeit = rAF-Zeitstempel − Start der Uhr, nie rückwärts.
Aufwärmen (`sceneLoop.aufwaermen`) und Wecken der Strahlen (`recomputeBeams`) haben keinen Zeitstempel und nehmen
`performance.now()`; weil die Zeit nie rückwärts läuft, beginnt die Simulation der Fische danach nicht neu (sie täte es
bei `t` < ihrer Zeit). `?t=` (FIXED_TIME) unverändert.

Vorher/Nachher (gleiche Probe, vorher = `3fcafa0` als Kopie):

| | Phase | Verzug Callback p95 | `Δt − Δts` p5 / p95 | Gleichmass p5 / p95 |
|---|---|---|---|---|
| vorher 1× | still / tippen / wechsel | 1,2 / 0,5 / 0,6 ms | −1,2 / 1,2; −0,2 / 0,2; −0,2 / 0,2 ms | 0,97 / 1,04; 0,99 / 1,01; 0,99 / 1,01 |
| nachher 1× | still / tippen / wechsel | 1,0 / 0,5 / 0,6 ms | 0 / 0 | **1,00 / 1,00** in allen drei |
| vorher 4× | still / tippen / wechsel | 7,4 / 16,8 / 16,4 ms | −1,7 / 1,6; −8,6 / 9,9; −9,7 / 8,5 ms | 0,95 / 1,05; **0,71 / 1,60**; **0,65 / 1,41** |
| nachher 4× | still / tippen / wechsel | 11,7 / 17,9 / 16,1 ms | 0 / 0 | **1,00 / 1,00** in allen drei |

Die Fische bewegen sich jetzt in jedem gezeichneten Bild genau um die Zeit zwischen den Bildschirmbildern weiter, auch
wenn der Callback bis 26 ms spät startet. Was bleibt, ist der Takt selbst: 30/60-Wechsel (gewollt, siehe Vorschlag)
und unter 4× Abstände von 3 Frames, weil die CPU den Takt nicht hält (vorher wie nachher).

Proben und Daten im Scratchpad des Agenten
(`C:\Users\admin\AppData\Local\Temp\claude\C--workspace-Prisma\8b5e7724-0d5f-485c-bc5c-024f93a38529\scratchpad\17\`):
`takt.mjs` (Probe), `auswerten.mjs` (Auswertung), `cast.mjs` (Abstände im Screencast); Daten `out/*.json`
(`jetzt-1x`, `vorher-4x`, `nachher-1x`, `nachher-4x`, `v01c-1x`, `v01c-4x`); Screencasts jedes Bilds
`out/jetzt-1x-cast/` (still, 300 Bilder in 10 s, alle 2 Display-Frames) und `out/vorher-4x-cast/` (wechsel, 539 Bilder in 15 s, Abstände 1: 221, 2: 276, 3: 40, 4: 1 Display-Frames, passend zu
den gezeichneten Bildern der Probe).

Tests: `logic` (2033), `golden`, `screenshot` (Konsole ohne Meldungen), `leerlauf-probe` (Fenster Desktop; Reaktion
aller 9 Eingaben im nächsten Bild) und `--still --handy` (0 Bilder in Ruhe), `geschichte-probe --start`,
`leistung-probe --handy` (headless mit GPU) und `--fenster --handy`: grün.

Berührungspunkte: Ticket 11 (Unterwasser-Pass, GPU-Last; bei 60/s in Ruhe am Strand doppelt), Ticket 09 (Einschwimmen
beim Neubeginn: `createFishSim` unverändert, `t` läuft jetzt aus `ts`, nie rückwärts).

**Takt je Welt, 01.11.2026 (Auftrag Koordinator: kein sichtbarer Wechsel 30 ↔ 60 im Level, solange etwas im Bild ist,
dem das Auge folgt).**

Methode (`welten.mjs`): echtes Chrome mit Fenster, T2000, Handy-Emulation 393 × 873, DPR 2,75, `?nointro&sky=<welt>`,
Level 0, 8 s warten, Hauptschleife anhalten, dann an 6 Zeitpunkten je ein Bild bei T und T + 0,2 s rendern (`animate`
wie im Spiel, mit Kamera). Blöcke von 8 × 8 CSS-px mit Änderung und Muster werden im zweiten Bild gesucht (± 20 px,
kleinste Summe der Helligkeitsunterschiede; nur wenn die Verschiebung die Änderung mindestens halbiert, sonst ist es
Flackern). Tempo = Versatz / 0,2 s; die Auflösung ist 5 CSS-px/s (1 px), über 100 px/s liegt am Suchrand. Ortsangaben
aus dem Raster (`welten-orte.mjs`). Schritt je Bild = Tempo / Bilder je s; auf dem Poco 2,75 Gerätepixel je CSS-px.

| Welt | Was bewegt sich (Ort) | bewegte Blöcke (6 Paare) | ≥ 20 / ≥ 40 px/s | schnellstes (p99) | Schritt bei 30/s | Entscheid |
|---|---|---|---|---|---|---|
| Strand | Wasser und Fische (oberes Drittel, 30–54 px/s im Median) | 566 | 477 / 270 | 108 px/s | 3,6 CSS-px = 10 Gerätepx | **stetig 60** (Fische, Auslöser) |
| Wald | Glühwürmchen (oben und rechts unten, 56–112 px/s), Nebel langsam (10–20) | 61 | 21 / 15 | 112 px/s | 3,7 CSS-px | **stetig 60** |
| Vulkan | Funken und Spritzer (bis über 100 px/s), Lava-Platten langsam (Median 5–11) | 2841 | 609 / 180 | 95 px/s (18 am Suchrand) | 3,2 CSS-px | **stetig 60** |
| Sonnensystem | Planeten auf ihren Bahnen, Monde, Korona (oben bis 127 px/s) | 494 | 111 / 43 | 100 px/s | 3,3 CSS-px | **stetig 60** |
| Wüste | nur das Schweben der Kamera (5–15 px/s) | 45 | 5 / 2 | 75 px/s (2 Einzelblöcke, Fehlzuordnung) | Kamera 0,2–0,5 CSS-px | **30 wie bisher** |
| Milchstrasse | nur das Schweben der Kamera (5 px/s), Funkeln der Sterne | 282 | 3 / 2 | 25 px/s | 0,2–0,8 CSS-px | **30 wie bisher** |

Rechnerisch dazu (Shader und Code): Fische 0,55–0,7 m/s, Glühwürmchen bis etwa 0,5 m/s im Ring 7–28 m (kurz an,
lange aus, von 50 sind ständig einige an), Funken steigen mit 1,1–5,6 m/s, Spritzer mit 4,6–6,6 m/s, Planeten
0,24–0,8 m/s (Merkur 7,6 m Bahn in 60 s, Erde 0,55 m/s). In Strand, Wald, Vulkan und Sonnensystem bewegt sich also ständig
etwas mindestens so schnell wie die Fische, deren Schritt von 2,5 Gerätepixeln bei 30/s der Nutzer gesehen hat; dort
gilt **stetig 60** (`activeFps`). In Wüste und Milchstrasse bewegt sich nur die Kamera, mit 5 px/s ist ihr Schritt bei
30/s unter einem Gerätepixel: Weder die 30/s noch der Wechsel auf 60 bei Eingaben springen dort sichtbar. Dort bleibt
es bei 30 in Ruhe und 60 bei Eingabe (Ziehen und Drehen brauchen die 60 ohnehin).

Umsetzung: Merkmal `userData.fluid` je Ebene (`fishSchools`, `glowParticles`, `lavaPool`), `fluid: true` im Modul des
Sonnensystems; das Panorama meldet `fluid`, sobald es steht und eine Ebene das Merkmal trägt, `skyTheme.fluid` fragt
den gewählten Himmel. `frameRate.fluid()` = nicht hinter der Bühne, nicht unter Menü oder Übersicht
(`story.choosing`), nicht im Startbildschirm, und `skyTheme.fluid`; `due` nimmt dann `activeFps`. Menü und Übersicht
(10/s) bleiben unverändert.

Nachher (`takt.mjs`, ungedrosselt, gez/s und Abstände der gezeichneten Bilder in Display-Frames, still / Tippen alle
0,4 s / Tippen alle 3 s):

| Welt | still | tippen | wechsel |
|---|---|---|---|
| Strand | 57,8, fast alle 1 | 58,9 | 58,7, kein Wechsel auf 2 |
| Wald | 59,0 | 58,6 | 58,1 |
| Vulkan (2. Lauf) | 60,0, 1: 600 | 60,0 | 60,0, 1: 899 |
| Sonnensystem (2. Lauf) | 59,4 | 60,0 | 60,0, 1: 900 |
| Wüste | 29,6, 2: 288 | 57,4 | 44,8 (1: 461, 2: 196; gewollt) |
| Milchstrasse | 30,0, 2: 298 | 59,9 | 45,6 (1: 468, 2: 215; gewollt) |

Im ersten Lauf von Strand, Wald, Vulkan und Sonnensystem kamen einzelne Aussetzer der Maschine dazu (rAF bis 80–400 ms,
andere Agenten); der zweite Lauf von Vulkan und Sonnensystem ist sauber (keine Lücke, adaptiv 1). Das Sonnensystem
sank im ersten, gestörten Lauf auf `adaptiv 0.75`, im zweiten und in allen Referenzdurchläufen nicht.

Leerlauf-Probe (`--fenster --handy`): Wald Menü 10 / Ruhe **60** / Eingabe 60 gez/s; Strand 10 / **60** / 60; Wüste
10 / **30** / 60; Desktop (Wald) 10 / **60** / 60. Reaktion aller Eingaben im nächsten Bild. GPU-Last in Ruhe
(Mittel × gez/s) steigt damit z. B. im Wald (Handy-Emulation) auf 555 ms je s, Zeichenzeit je Bild gleich.

Referenzdurchlauf `--fenster --handy` (GPU-Zeit), je 2 Läufe, vorher = `3fcafa0` (Kopie), nachher = dieser Branch:

| | vorher 1 / 2 | nachher 1 / 2 |
|---|---|---|
| Rendern | adaptiv 1.00, Umbauten 0 | adaptiv 1.00, Umbauten 0 |
| «Spiel» gez/s (ruhig) | 56 (56) / 56 (56) | **60 (60) / 60 (60)** |
| «Spiel n. Reise» gez/s (ruhig) | 37 (31) / 37 (31) | **60 (60) / 60 (60)** |
| «Spiel n. Reise» Zeichn p95 | 14,8 / 13,6 ms | 15,5 / 15,0 ms |
| «Menü» gez/s (ruhig) | 35 (9) / 35 (10) | 36 (10) / 36 (10) |

Dauerlast (`--fenster --handy --ersatzmass`, ms je Bild, «ganz»), je 2 Läufe:

| Messpunkt | vorher 1 / 2 | nachher 1 / 2 |
|---|---|---|
| Spiel (1. Level) | 4,3 / 4,3 | 4,3 / 4,5 |
| Menü still | 1,1 / 1,2 | 1,1 / 1,0 |
| **Spiel n. Reise** | **5,2 / 5,8** | **5,4 / 5,4** |

Die Last je Bild bleibt gleich (Unterschiede in der Streuung), nur die Bilder je Sekunde steigen. Karte überall
`adaptiv 1.00, Umbauten 0`. (Die gez/s im Durchlauf mit Dauerlast zählen deren Probebilder mit: «Spiel n. Reise» 57/58
vorher, 74 nachher.)

Risiko: Auf dem Poco zeichnet das Spiel in diesen vier Welten jetzt auch in Ruhe 60/s bei 8,6–13,4 ms Dauerlast je Bild
(Durchlauf 2b). Hält es den Takt nicht, misst `adaptiveResolution` gegen 16,7 ms statt 33 ms und könnte absenken; mit
Eingaben lief es dort schon so (Karte 2b «Spiel» 53 gez/s, `adaptiv 1.00`). Abnahme im nächsten Handy-Durchlauf:
Fische, Glühwürmchen, Funken und Planeten ohne Ruckeln, Karte `adaptiv 1.00, Umbauten 0`; Ticket 11 senkt die Last je
Bild.

Daten: `out/welt-*.json`, `out/takt-*.json`, `out/takt2-*.json`, `out/leistung-*.log`, `out/dauer-*.log` im Scratchpad
(Pfad oben). `tests/leerlauf-probe.mjs` prüft jetzt im Fenster ungedrosselt den Takt: Menü ≤ 12 gez/s, Level in Ruhe
60 ± 3 mit `frameRate.fluid()`, sonst 30 ± 3.

Tests (Takt): `logic` (2033), `golden`, `screenshot` (Konsole ohne Meldungen), `leerlauf-probe` headless und
`--still --handy`, im Fenster `--handy` mit Wald, Strand, Wüste und Desktop (Takt geprüft), `geschichte-probe --start`
und `--handy`, `leistung-probe --handy` headless, `--fenster --handy` und `--ersatzmass` je zweimal: grün.

**Review Takt, 01.11.2026 (Reviewer):** Code in Ordnung: `sceneTime.at` nie rückwärts (`Math.max`, `clock.startTime`
aus `performance.now`, gleiche Zeitbasis wie rAF), `?t=`, `aufwaermen`, `recomputeBeams`, Ruhen/Wecken, verdeckt,
Tab, Proben der Dauerlast unberührt; `fluid` nur mit Fischen/Glühwürmchen/Lava als Ebene oder Sonnensystem, Wüste und
Milchstrasse `false`, Menü/Übersicht 10, Bühne/Startbildschirm nicht. Optik (Handy-Emulation, Screencast jedes Bilds):
Strand still/tippen/Tippen alle 3 s und Wald still alle Abstände 1 Display-Frame, Gleichmass der Fische 1,00/1,00;
Wüste→Strand 30 → 60 ohne Taktwechsel, nur ein Aufbaubild von 36 ms beim ersten Unterwasser-Pass (Ticket 09).

Absenkung unter GPU-Last (Kopie mit Vollbild-Pass je Bild, Strand, 90 s je Stufe, Tippen alle 3 s in jedem dritten
10-s-Stück; GPU-Zeit per Timer, Mittel): 13,5–14,3 ms und 15,5–16,4 ms: Anteil langsamer Bilder je 2-s-Fenster
0–16 %, keine Absenkung; 19,2 ms: 51 gez/s, 2–27 %, keine Absenkung; doppelt so viel Last: 100 % im ersten Fenster →
`adaptiv 0.75`. Referenzdurchlauf `--fenster --handy` mit Last (Spiel 17,5 / Spiel n. Reise 16,5 ms p95): `adaptiv
1.00, Umbauten 0`. Die Absenkung greift also erst, wenn über 30 % der Bilder einen Bildschirmtakt verpassen; auf der
T2000 ist das ein Kipppunkt weit über 16,7 ms.

Abhilfe gebaut (klein): Hält das Gerät die stetigen 60 nicht (Überlast > 0,3, `frameRate.fluid()`), verzichtet
`adaptiveResolution` zuerst auf sie (`frameRate.fluidAus`, bis zum Neuladen; in Ruhe wieder 30 wie vor 17) statt die
Auflösung zu senken; erst danach senkt sie wie bisher. Karte und Anzeige zeigen «stetige 60 aus». Mit doppelter Last:
erst `fluidAus`, Absenkung erst später beim Tippen (60/s wie vor 17). `leerlauf-probe`: Soll am gemessenen
Bildschirmtakt (die T2000 lief zeitweise mit 56,7 Hz, die feste 60/30-Prüfung schlug fehl).

Tests nach der Abhilfe: `logic` (2033), `golden`, `screenshot`, `leerlauf-probe` im Fenster `--handy` Wald/Strand/Wüste
(60/60/30 in Ruhe), headless und `--still --handy`, `leistung-probe --fenster --handy` und zweimal `--ersatzmass`
(`adaptiv 1.00, Umbauten 0`, Dauerlast ganz 4,1–4,6 / 5,1–5,4 ms), `geschichte-probe --start`: grün. Auf dem Poco auf
der Karte prüfen: kein «stetige 60 aus»; steht es da, hielt das Poco die 60 nicht (Ticket 11).

**Handy-Durchlauf 2c (Koordinator, 01.11.2026):** Stand `leistung-07c` = 07b + Ticket 11 (Zeichenzeit) + Ticket 17
(Zeitbasis, stetige 60). Nicht dabei: 09, 10, 12, 15, 16 (Schlussdurchlauf). Tests grün (alle Unit-Tests, generator,
offline, screenshot, start-probe, geschichte-probe `--start`/`--handy`/`--grad leicht --welten 2 --finale leicht`,
leerlauf-probe headless und `--fenster --handy`, leistung-probe headless und `--fenster --handy --ersatzmass`:
`adaptiv 1.00, Umbauten 0`, Dauerlast ganz 2,5 / 3,0 ms in der Emulation). Auf dem Poco prüfen: Fische ohne Ruckeln
(auch beim Tippen), Karte ohne «stetige 60 aus», Dauerlast «ganz» ≤ 6 ms (Ticket 11), Zerlegung `-Hi -Wa -Un -St -Fi`.

**bereit für Handy-Durchlauf 2c, bitte auf Render deployen**
