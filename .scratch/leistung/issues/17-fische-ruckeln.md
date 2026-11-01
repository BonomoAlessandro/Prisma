# 17: Fische glatt, aber ruckelig

**Spec:** ../spec.md

**Blocked by:** 14

**Status:** ready-for-human

**What to build:** Die Fische am Strand bewegen sich auf dem Handy gleichmässig. Beobachtung des Nutzers im
Handy-Durchlauf 2b (Poco F4 GT, Stand `leistung-07b`): «Die Fische waren glatt, aber ruckelig.» Seit Ticket 14 sind die
Kanten glatt, die Bewegung ruckelt. Die Karte zeigt «Spiel n. Reise» 56 gezeichnete Bilder/s, «Spiel» (Wald) 53/s, also
weder gleichmässig 60 noch 30.

- [x] Diagnose mit Beleg: Takt je rAF, Zeit `t`, Fischposition je Bild am Strand, mit und ohne Eingabe, ungedrosselt
      und 4×, Stand jetzt gegen 01c.
- [x] Zeitbasis: `t` aus dem rAF-Zeitstempel statt aus der Uhr beim Start des Callbacks (gebaut, siehe Comments).
- [ ] Abnahme auf dem Poco im nächsten Handy-Durchlauf: Fische bei normalem Abstand ohne Ruckeln, auch beim Tippen.
- [ ] Entscheid zum Takt im Level (30 ↔ 60, siehe «Vorschlag»), wenn das Ruckeln auf dem Poco bleibt.

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

## Vorschlag (falls das Ruckeln auf dem Poco nach dem Fix bleibt)

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
