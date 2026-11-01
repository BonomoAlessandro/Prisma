# 08: Zeichenzeit ohne Halt messen (Dauerlast) und auf dem Poco zerlegen

**Spec:** ../spec.md

**Blocked by:** 07

**Status:** ready-for-agent

**What to build:** Ein Mass für die Zeichenzeit, das auf dem Poco (ohne `EXT_disjoint_timer_query_webgl2`) die
**GPU-Arbeit je Bild** abbildet und nicht die Wartezeit der Pipeline. Dazu eine Zerlegung nach Durchgängen, die auf dem
Poco selbst läuft. Ohne dieses Mass lässt sich die 8-ms-Marge der Spec nicht beurteilen (Messrunde 07). Optisch und im
Spiel ohne `?perf` ändert sich nichts.

**Befund aus 07 (Messwerte unter `## Comments` von 07):** Das heutige Ersatzmass (Beginn `frame()` bis nach einem
1-Pixel-`readPixels`, jedes 10. Bild) überschätzt die Zeichenzeit um ein Mehrfaches:

- Auf dem Poco lief das Spiel mit 60 gezeichneten Bildern/s und p95 16,6 ms (Einstieg, Reise). Die GPU schafft also
  im Mittel ein Bild in unter 16,6 ms. Das Ersatzmass zeigte dort p95 31–59 ms. Es misst die CPU-Zeit von `frame()`
  (Poco p95 7–11 ms), den Weg zum Grafikprozess und zurück und **alles, was vorher schon in der Warteschlange lag**:
  frühere Bilder, Uploads in Stücken (Menü 57,7 ms, während der Himmel schärft), das Zusammensetzen der Seite.
- Auf der T2000 im selben Bild verglichen (Handy-Emulation 786 × 1746, Level, ungedrosselt): Ersatzmass Median 11–18,
  p95 13–26 ms; GPU-Zeit desselben Bilds (Timer) 5,8–8,5 ms; **Dauerlast** (20 Bilder hintereinander in einer Aufgabe,
  zwischen zwei `readPixels`, Zeit je Bild) 3,3–5,5 ms. Ersatzmass p95 / Dauerlast = 2,9–6,6. Desktop (1536 × 729)
  ebenso: Ersatzmass 7,5–10,3 / GPU 3,4–4,9 / Dauerlast 3,1–4,8 ms.
- Auf dem Adreno (Kachel-GPU) ist der Halt eher noch teurer: `readPixels` erzwingt das Auflösen aller Kacheln und
  leert die Pipeline; die GPU taktet bei einem Bild zwischen Pausen tief.
- `fenceSync`/`getSyncParameter` ohne Warten taugt nicht als Mass: Chrome aktualisiert den Zustand erst nach einer
  Rückkehr in die Ereignisschleife; gemessen 6–20 ms, also nur «fertig vor dem nächsten Bild ja/nein».

**Vorschlag:**

- [ ] **Dauerlast-Mass** im Referenzdurchlauf, wenn die Timer-Erweiterung fehlt (bzw. mit `?ersatzmass`): An festen,
      ruhigen Messpunkten (Menü still, erstes Level nach 3 s Ruhe, Level nach der Reise) einmal `readPixels` (Pipeline
      leer), dann K = 20 Bilder hintereinander (`renderReflection` + `composer.render`) in einer Aufgabe, dann wieder
      `readPixels`; Zeit / K = Zeichenzeit je Bild bei voll hochgetakteter GPU. Je Messpunkt 5 Wiederholungen, Median.
      Danach ein normales Bild, damit auf dem Schirm nichts Halbes steht. Die CPU-Zeit je Bild der Schleife (ohne
      Warten) mitschreiben: Liegt sie nahe an der Zeit je Bild, ist die Probe CPU-gebunden und die GPU-Zeit höchstens
      so gross (Karte vermerkt das). Die Bildabstände der Probe (etwa 0,1–0,3 s) zählen nicht zu den sichtbaren.
- [ ] **Zerlegung durch Weglassen** am selben Messpunkt: dieselbe Dauerlast ohne Spiegelung (`QUALITY.reflections`),
      ohne Bloom (`bloomPass.enabled`), ohne das Netz des Panoramas, ohne Pinsel (Strand). Die Differenz zum Ganzen ist
      der Anteil des Teils. Am Ende alles zurück und ein normales Bild. Auf der T2000 gegen die GPU-Zeit je Durchgang
      (Timer) prüfen, dass die Differenzen stimmen (Zahlen aus 07 als Referenz, siehe unten).
- [ ] Das alte Ersatzmass (`readPixels` jedes 10. Bild) entfällt; damit fällt auch der Sockel weg, den
      `adaptiveResolution.skip = 2` abfangen musste. `adaptiveResolution` darf die Probe nicht werten (`skip`, wie bei
      `wake()`).
- [ ] **Karte:** Zeile «Zeichenzeit» nennt das Mass («Dauerlast, K = 20, Median aus 5»). Neue Zeilen «Zeichnen
      (Dauerlast)» je Messpunkt mit ganz / ohne Spiegelung / ohne Bloom / ohne Netz / ohne Pinsel und CPU je Bild.
      Die Spalte «Zeichn» der Abschnitte bleibt nur, wo GPU-Zeit da ist (Desktop); sonst «–». Urteil
      «Zeichnen ≤ 8 ms» aus der Dauerlast «ganz».
- [ ] **«gez/s» ruhig:** Je Abschnitt zusätzlich die gezeichneten Bilder/s ohne laufende Tweens und ohne
      `skyTheme.moving` («ruhig»), damit das Menü nicht mehr wie in 07 mit 31/s erschrickt (siehe 07: Das sind die
      Fahrt des Blicks mit 60/s und das Einblenden des Himmels mit 30/s; still sind es 10/s).
- [ ] Probe `tests/leistung-probe.mjs --ersatzmass` prüft die neuen Zeilen; Karte auf dem Handy weiterhin ohne
      seitliches Wischen.
- [ ] Messung auf der T2000 (Fenster, Desktop und Handy-Emulation ungedrosselt): Dauerlast und Zerlegung gegen die
      GPU-Zeit (Timer) desselben Messpunkts; Abweichung je Teil höchstens 1 ms bzw. 20 %.
- [ ] Tests grün, Review des Diffs, Commit auf `feature/leistung`.

**Abnahmekriterium:** Auf der T2000 liegt die Dauerlast «ganz» innerhalb von 25 % der GPU-Zeit (Timer) bei voller
Last, die Zerlegung trifft die Anteile der Timer-Messung je Durchgang auf 1 ms. Der Referenzdurchlauf zeigt auf dem
Desktop und in der Handy-Emulation `adaptiv 1.00, Umbauten 0` (Emulation ungedrosselt), sichtbar ändert sich nichts.
Auf dem Poco liefert der nächste Handy-Durchlauf die Zahlen für Ticket 11.

**Hinweis für den Koordinator:** Ticket 11 braucht die Dauerlast-Zahlen vom Poco. Entweder ein zusätzlicher kurzer
Handy-Durchlauf nach 08 (nur der Referenzdurchlauf, «2b»), oder 11 entscheidet mit den Zahlen der Schlussabnahme
(dann ohne Gewissheit, ob die Marge hält). Empfehlung: Durchlauf 2b, er kostet den Nutzer etwa 3 Minuten.

## Comments

**01.11.2026, Umsetzung** (Branch `leistung/08-dauerlast` ab `5a0ffe9`; nur Messwerkzeug `leistung`, Karte, Probe,
README; dazu zwei kleine Helfer, die das Werkzeug fragt: `reflectionInView()` aus `renderReflection` herausgelöst und
`brushPass.painting()`. `APP_VERSION` unverändert):

- **Dauerlast** `leistung.dauerlast(id)`: je Probe (eine Aufgabe nach einem Display-Frame) `readPixels` (Pipeline leer),
  K = 20 Bilder `renderReflection()` + `composer.render(0)`, `readPixels`; Zeit / K. Teile abwechselnd ganz, ohne
  Spiegelung (`QUALITY.reflections`), ohne Bloom (`bloomPass.enabled`), ohne Netz (Mesh mit `renderOrder` −1000 der
  eingeblendeten Panorama-Skybox unsichtbar), ohne Pinsel (`brushPass.enabled`); nur Teile, die gerade etwas zeichnen
  (sonst «–»: Spiegelung nicht im Menü, Pinsel nur am Strand). 5 Wiederholungen, Median. CPU-Zeit je Bild der
  Schleife mit; ≥ 80 % der Zeit je Bild → «!» CPU-gebunden. Nach jeder Probe alles zurück und ein normales Bild.
- **Messpunkte** (nur ohne Timer bzw. mit `?ersatzmass`, nur im Referenzdurchlauf): erstes Level nach 3 s Ruhe (keine
  Fahrt, Himmel steht, nichts gezogen; spätestens nach 15 s), Menü nach dem Lösen 1 s still (`frameRate.skyOnly`;
  «Weiter zur Reise»/«Auswerten» erscheinen erst danach), Spiel n. Reise, sobald der neue Himmel ganz steht
  (`skyTheme.ready`, höchstens 10 s), danach bis 6 s auffüllen. Die Anzeige sagt solange «Zeichenzeit messen, kurz
  nichts tippen». Dauer je Messpunkt: 25 Proben in 25 Display-Frames, auf dem Poco
  (geschätzt 20 × 5–12 ms je Probe) etwa 3–7 s.
- **Keine Wirkung auf die Messung und die Absenkung:** Bildabstände, die eine Probe überschneiden, zählen nicht (Zeile
  «Proben … nicht gezählt»; Überschneidung statt «Ende im Abstand», weil der Zeitstempel nach einem langen Task der
  letzte Vsync vor dem Ende sein kann, headless gesehen), Hänger und Longtasks in Proben ebenso nicht.
  `adaptiveResolution.skip = 2` nach jeder Probe. Das alte Ersatzmass (`readPixels` jedes 10. Bild,
  `MESS_ERSATZ_JEDES`) ist weg, damit auch sein Sockel. Ohne `?perf` läuft nichts davon (`laufTick` nur im Durchlauf).
- **Vergleich im selben Lauf:** Mit `?ersatzmass` auf einem Gerät mit Timer misst jede Probe danach dieselben K Bilder
  noch einmal mit GPU-Zeit je Bild; die Karte zeigt darunter «GPU (Timer)». Auf dem Poco fehlt der Timer, die Zeile auch.
- **Karte:** «Zeichenzeit  Dauerlast, K = 20, Median aus 5 (an Messpunkten, siehe unten)»; Block «Zeichnen (Dauerlast …),
  ms je Bild» mit `ganz -Spieg -Bloom -Netz -Pinsel CPU` je Messpunkt (schmal: `-Sp -Bl -Nz -Pi`, 40 Zeichen); Spalte
  «Zeichn» nur mit GPU-Zeit, sonst «–»; neue Spalte **«gez/s ruhig»** (gezeichnete Bilder/s, solange `story.tweens`
  leer und nicht `skyTheme.moving`; unter 0,5 s Ruhe «–»); Urteil «Zeichnen ≤ 8 ms: … (Dauerlast ganz)». Daten:
  `__prisma.leistung.daten().dauerlast`, je Abschnitt `gezeichnetRuhigJeS`.
- **Probe** `tests/leistung-probe.mjs`: wartet ohne Timer auf die Messpunkte, prüft drei Messpunkte mit Werten,
  Spiegelung nur ausserhalb des Menüs, Spalte «Zeichn» leer, Urteil aus der Dauerlast, Spalte «gez/s ruhig» (immer)
  und im Fenster ungedrosselt `adaptiv 1.00, Umbauten 0`.

**Messung auf der T2000** (Fenster, ungedrosselt, `leise.sh` 100 %). Referenzdurchlauf `--fenster --ersatzmass`, Dauerlast
gegen GPU-Zeit (Timer) derselben Bilder, ms je Bild; Anteil = ganz − ohne (DL / Timer):

| Messpunkt | ganz DL / Timer | Spiegelung | Bloom | Netz | Pinsel | CPU |
|---|---|---|---|---|---|---|
| Desktop 1536 × 729: Spiel (Wald) | 3,8 / 3,4 (+12 %) | 2,1 / 1,8 | 0,6 / 0,8 | 0,2 / 0,3 | – | 2,0 |
| Desktop: Menü still | 0,9 / 0,8 | – | 0,3 / 0,4 | 0,1 / 0,2 | – | 0,3 |
| Desktop: Spiel n. Reise (Strand) | 5,0 / 4,6 (+9 %) | 2,3 / 1,9 | 0,7 / 0,7 | 0,7 / 0,7 | 0,6 / 0,3 | 2,2 |
| Handy-Emulation 786 × 1746: Spiel | 4,1 / 3,7 (+11 %) | 2,4 / 2,1 | 0,1 / 0,3 | 0,1 / 0,1 | – | 2,1 |
| Handy-Emulation: Menü still | 1,2 / 0,8 | – | 0,6 / 0,4 | 0,2 / 0,0 | – | 0,3 |
| Handy-Emulation: Spiel n. Reise | 5,2 / 5,3 (−2 %) | 2,5 / 2,5 | 0,5 / 1,3 | 0,4 / 0,9 | 0,3 / 0,9 | 2,0 |

Beide Karten: `adaptiv 1.00, Umbauten 0`, 63 Bildabstände der Proben nicht gezählt, keine Probe unter den längsten
Bildern oder Hängern, «Zeichnen ≤ 8 ms: ja (Dauerlast ganz)». Menü «gez/s» 28–29, «ruhig» 10–11 (07: «31/s» war die
Fahrt). Im Menü still (unter 1 ms) ist «ganz» +0,1 bzw. +0,4 ms über dem Timer; die 25 % gelten für volle Last.

Gegenprobe je Welt im Level (Scratchpad `08-mess/vergleich.mjs`: Seite `?perf&ersatzmass&nointro&noadapt`, Stand vor
dem letzten Level, 4 s Ruhe, dann `leistung.dauerlast` und GPU-Zeit je Durchgang über 40 normale Bilder):

| Welt | Desktop: ganz DL / Timer; Spiegelung, Bloom, Netz (DL / Timer der Varianten) | Handy-Emulation: dito |
|---|---|---|
| Wald | 3,70 / 3,28 (+13 %); 1,88/1,53, 0,49/0,54, 0,39/0,26 | 3,83 / 3,46 (+11 %); 2,20/1,81, 0,42/0,61, 0,22/0,22 |
| Strand | 4,58 / 4,02 (+14 %); 1,97/1,39, 0,67/0,47, 0,66/0,67; Pinsel 0,40/0,20 | 5,07 / 4,36 (+16 %); 2,43/1,62, 0,74/0,51, 0,77/0,53; Pinsel 0,62/0,19 |
| Wüste | 3,54 / 3,47 (+2 %); 1,63/1,64, 0,17/0,60, 0,44/0,84 | 4,11 / 3,80 (+8 %); 2,31/2,06, 0,60/0,92, 0,73/0,82 |
| Vulkan | 4,33 / 3,76 (+15 %); 2,02/1,47, 0,44/0,65, 0,47/0,22 | 5,28 / 4,85 (+9 %); 1,95/1,55, 0,49/0,69, 0,04/0,09 |

GPU-Zeit je Durchgang in normalen Bildern (Timer, nicht volle Last), Desktop/Handy: Spiegelung 1,1–1,6 / 1,5–1,7,
Szene 1,7–3,0, Bloom 0,4–1,0 / 0,45–0,9, Pinsel 0,1–0,2, Final 0,1. Die Anteile der Dauerlast liegen auch dagegen
innerhalb von 0,8 ms (Spiegelung, Strand Handy 2,43 gegen 1,66) bzw. 0,6 ms (Bloom).

**Abnahme:** «ganz» innerhalb von 25 % des Timers bei voller Last (+2 bis +16 %, die Dauerlast liegt systematisch
etwas darüber: Weg zum Grafikprozess und das Auflösen in `readPixels`), Zerlegung je Teil höchstens 0,81 ms vom
Timer (Strand, Spiegelung, Handy-Emulation), sonst ≤ 0,6 ms. `adaptiv 1.00, Umbauten 0` auf Desktop und in der
Handy-Emulation. Optisch ändert sich ohne `?perf` nichts. Nach der Probe steht immer ein normales Bild.

Hinweis für den Poco: Die GPU-Zeit der Messrunde 07 (5,8–8,5 ms in einzelnen Bildern) lag über der Dauerlast, weil
die GPU zwischen Pausen tiefer taktet. Die Dauerlast misst die hochgetaktete GPU: Für die 8-ms-Marge ist das der
günstigere Fall, die Marge muss also mit Abstand halten. Auf dem Poco liefert Durchlauf 2b die Zahlen für 11.

Tests grün: logic (2033), golden, hall, `geschichte-probe --start`, `leistung-probe` headless (Desktop, `--handy`,
`--ersatzmass`) und im Fenster (`--fenster`, `--fenster --handy`, je mit und ohne `--ersatzmass`). Im Fenster mit
GPU-Zeit ändert sich nur die Spalte «ruhig» (Menü gez/s 35–36, ruhig 10); `adaptiv 1.00, Umbauten 0` in allen vier
Fensterläufen. Headless senkt die Auflösung wie bisher (virtueller rAF-Takt, Ticket 01). Offen für den Review: die
schmale Karte auf dem Poco ansehen (Probe prüft die Breite); Durchlauf 2b auf dem Poco (Entscheid Koordinator).
