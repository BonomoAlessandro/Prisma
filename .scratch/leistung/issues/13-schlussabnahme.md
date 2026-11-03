# 13: Schlussabnahme (Handy-Durchlauf 3)

**Spec:** ../spec.md

**Blocked by:** 08, 09, 10, 11, 12, 14, 15, 16, 17
(Fische pixelig?, Glühwürmchen beim Einflug in den Wald, Flackern in der ersten Noa-Szene, Fische ruckeln)

**Status:** ready-for-agent

**What to build:** Der Abschluss des Vorhabens Leistung: alles geprüft, der Stand auf dem Poco gemessen, die Doku
nachgeführt. Gebaut wird nichts Neues.

- [ ] Alle Tickets 08–12 (und die nachgetragenen) sind `resolved` oder `wontfix` mit Begründung.
- [ ] Alle Tests grün: `logic`, `golden`, `hall`, `beurteilung`, `generator`, `geschichte`, `offline`, `screenshot`,
      `start-probe`, `geschichte-probe` (`--start`, `--grad leicht --welten 2 --finale leicht`, `--handy`, `--ganz`),
      `leerlauf-probe`, `leistung-probe` (headless Desktop und `--handy`, `--ersatzmass`); keine Warnung «Weckstelle
      fehlt».
- [ ] Referenzdurchlauf im echten Chrome-Fenster auf dem Arbeitsrechner, ungedrosselt und mit Handy-Emulation 4× (und
      6× zur Information), dazu die Messprobe aller Bereiche aus 07 (alle sechs Welten, Reisen, Finale, Epilog, Menü,
      Übersicht, Feier, Kamera ziehen, Grösse/Drehen). Werte unter `## Comments`, Vergleich mit 07.
- [ ] `APP_VERSION` nachführen (`index.html` und `sw.js`), Stand auf `feature/leistung` pushen, unter `## Comments`
      **«bereit für Handy-Durchlauf 3 (Schluss), bitte auf Render deployen»**.
- [ ] Ergebniskarte vom Poco (Nutzer). Abnahme laut Spec: p95 ≤ 18,3 ms und kein Bild über 33 ms ausser markiertem
      Laden; Zeichnen (Dauerlast, 08) ≤ 8 ms; `adaptiv 1.00, Umbauten 0`; Spiegel und Skybox scharf (Nutzer).
      Dazu im Blick: Seitenstart (10), Reise und Einstieg (09), Menü «gez/s ruhig» 10.
      Nutzer achtet auf: Fische glatt **und ruhig** (14, 17 – 17 wird erst damit `resolved`), kein Flackern in der
      ersten Noa-Szene (16), Glühwürmchen beim Einflug in den Wald (15), auf der Karte kein «stetige 60 aus».
- [ ] Zeichnen am Strand (11): reicht es auf dem Poco nicht auf 8 ms, dem Nutzer Variante A (kleiner sichtbarer
      Abstrich: Bloom ab Viertelauflösung, Wasser in halber Auflösung, Pinsel bzw. Spiegel-MSAA auf dem Handy aus;
      Liste in Ticket 11, zweite Runde) gegen Variante B (stetige 30 im Level) mit Bildern nebeneinander vorlegen.
- [ ] Bekannte Lücken vom Arbeitsrechner prüfen und je als eigenes Ticket oder `wontfix` festhalten:
      `geschichte-probe --uebersicht --dorf` scheitert an «Spiel → Übersicht» > 100 ms (schon vor 08–17);
      Menü aus dem Spiel öffnen: Hänger 200–250 ms «ohne Script», vorher wie nachher (Befund Ticket 12).
- [ ] README (Messwerkzeug, Dauerlast-Mass) und PLAN.md nachführen; Tabelle der Tickets in `spec.md` mit dem Endstand.
- [ ] **Kein Merge nach `main`**, bis der Nutzer es sagt.

## Comments

### Stand 02.11.2026: bereit für Handy-Durchlauf 3 (Schluss), bitte auf Render deployen

`APP_VERSION '2026-11-02 leistung-08'`. Alle Tickets 08–12, 14–16 `resolved` und gemergt; 17 gemergt, `resolved` erst mit
der Bestätigung «Fische ruhig» vom Poco. 11 (Strand ≤ 8 ms) entscheidet sich erst an der Poco-Karte (Schätzung nach der
zweiten Runde 10,5–11,5 ms; sonst Variante A gegen B, siehe oben).

**Tests auf dem Gesamtstand** (`GPU=1`, `leise.sh` 100 %), alle exit 0, nirgends «Weckstelle fehlt»: logic (2036), golden,
hall, beurteilung, ki-tester, levelliste, vorrat, wuerfelliste, generator, geschichte (35), offline, screenshot,
start-probe, leerlauf-probe (headless und `--fenster --handy`), geschichte-probe `--start`, `--grad leicht --welten 2
--finale leicht`, `--handy`, `--ganz`, leistung-probe headless Desktop und `--handy`, `--fenster --ersatzmass`, `--fenster
--handy --ersatzmass`, `--fenster --handy --drossel 4`. Fensterläufe `adaptiv 1.00, Umbauten 0`.

**Ausnahme:** `geschichte-probe --uebersicht --dorf` scheitert (Lücken > 100 ms bei Spiel/Menü ↔ Übersicht, längste
438–477 ms). Gegenprobe auf `leistung-07c` (68640a5) scheitert gleich (Menü → Übersicht 473 ms, Übersicht → Spiel 280 ms):
nicht durch 08–17 entstanden, bleibt offener Punkt (siehe Checkliste).

**Handy-Emulation im Fenster, `--ersatzmass`, je 2 Läufe im Wechsel gegen 07c** (T2000, Takt 56 Hz): Dauerlast «ganz»
Spiel 1,9–2,0 (07c 2,1–2,2), Menü still 0,9–1,0 (1,0–1,1), Spiel n. Reise 2,6–2,7 (3,0) ms; Menü ruhig 10 gez/s. Hänger
«ohne Script» von 250–480 ms im Prolog, Spiel und Startbildschirm in **beiden** Ständen (Grafikprozess dieses Rechners);
kein Rückschritt erkennbar.

**Für den Nutzer auf dem Poco:** Karte einfügen; achten auf Fische (glatt und ruhig), kein Flackern in der ersten
Noa-Szene, Glühwürmchen beim Einflug in den Wald, auf der Karte kein «stetige 60 aus».

### Handy-Durchlauf 3 (Poco F4 GT, 02.11.2026 07:14, `leistung-08`)

```
Rendern     784×1478 (Pixelverhältnis 2.00, adaptiv 1.00, Umbauten 0), Handy
Takt        60 Hz (Median der Bildabstände 16.60 ms)

Abschnitt       Bilder    p95    max  >33 Zeichn   CPU gez/s ruhig
Seitenstart*        16  329.1  329.1    7      – 337.1     1     1
Startbildschirm    691   16.6  115.2    4      –   9.2     0     0
Menü               487   16.6   32.9    0      –   6.1    22    11
Prolog            2674   16.6  115.2    7      –   6.7     0     0
Einstieg           374   16.6   32.9    0      –   8.9    60     –
Spiel             2454   16.6   32.9    0      –   8.1    62    62
Reise              810   16.6  148.2    2      –   7.3    60     –
Spiel n. Reise     120   16.6   49.3    1      –  11.4    84     –
Gesamt            7610   16.6  148.2   14      –

Messpunkt            ganz  -Spieg  -Bloom   -Netz -Pinsel     CPU
Spiel (1. Level)      7.4     6.7     6.1     7.5       –     2.8
Menü still            4.1       –     2.3     3.5       –     1.2
Spiel n. Reise       10.9     9.9     9.2     9.9    10.7     3.7

Messpunkt         -Himmel -Wasser  -Unter  -Staub  -Final
Spiel (1. Level)      6.0       –       –     7.7     6.9
Menü still            2.8       –       –     3.8     3.4
Spiel n. Reise        5.9     8.1    10.6    11.0    10.3

Flüssig:    nein (Startbildschirm, Prolog, Reise, Spiel n. Reise)
Zeichnen ≤ 8 ms: nein (Spiel n. Reise 10.9 ms) (Dauerlast ganz)

Hänger des Hauptthreads (long-animation-frame):
     340 ms  Seitenstart bei 0.9 s: FrameRequestCallback: Script 338 ms, Rendern 339 ms
     138 ms  Reise bei 120.7 s: FrameRequestCallback: Script 128 ms, Rendern 137 ms
     106 ms  Prolog bei 15.9 s: FrameRequestCallback → frame: Script 5 ms, Rendern 8 ms
     106 ms  Seitenstart bei 0.8 s: FrameRequestCallback: Script 73 ms, Rendern 90 ms
     101 ms  Startbildschirm bei 6.9 s: ohne Script, Rendern 2 ms
      79 ms  Seitenstart bei 0.5 s: MessagePort.onmessage: Script 51 ms, Rendern 1 ms
      71 ms  Reise bei 120.6 s: FrameRequestCallback: Script 60 ms, Rendern 66 ms
      69 ms  Prolog bei 28.2 s: ohne Script, Rendern 63 ms
```

Nutzer: «Die Fische sind ruhig und glatt. Die erste Noa-Szene scheint gut zu sein. Die Glühwürmchen stocken noch ein
wenig beim Einflug in den Wald.»

**Auswertung:**
- p95 überall 16,6 ms (2c: Gesamt 16,6), `adaptiv 1.00, Umbauten 0`, kein «stetige 60 aus». Bilder > 33 ms ausserhalb
  des Ladens 14 (Durchlauf 2: 14, aber anders verteilt; Spiel und Einstieg jetzt 0).
- Zeichnen (Dauerlast): Wald 7,4 (2c 8,5) und Menü 4,1 (4,8) unter 8 ms; **Strand 10,9 (13,5)**, wie nach der zweiten
  Runde geschätzt. Anteile am Strand: Himmel 5,0 (davon Wasser 2,8, Netz 1,0), Bloom 1,7, Spiegelung 1,0, Final 0,6,
  Unter 0,3, Pinsel 0,2. Das Gerät hält am Strand trotzdem 60 (Spiel n. Reise p95 16,6, ein Bild > 33).
- Fische (14, 17): bestätigt → 17 `resolved`. Erste Noa-Szene (16): kein Flackern mehr.
- Glühwürmchen beim Einflug in den Wald stocken noch (15) → Ticket 18.
- Hänger mit Script: Seitenstart 338 ms in einem Bild (2c: 431), Reise bei 120,7 s 128 ms (neu sichtbar).

**Vorgabe des Nutzers (02.11.2026):** Die Geschichte (Bühne der Noa-Szenen, Glühwürmchen) wird immer mit 60 Bildern/s
gezeigt. `?takt=30` (Vergleich Variante B) wirkt nur auf das WebGL-Bild (Level, Menü, Reisen); der Versuch in
`leistung-08c`, auch die Browser-Animationen in 30er-Schritten zu stellen, ist zurückgenommen (`leistung-08d`).

### Poco, `leistung-08d` mit `?perf&takt=30` (02.11.2026 07:40)

`höchstens 30/s`, `adaptiv 1.00, Umbauten 0`. p95 überall 16,6 ms, Bilder > 33 ausserhalb des Ladens 8 (ohne Takt 30:
14). gez/s: Einstieg 30, Spiel 31, Reise 30, Spiel n. Reise 42. Zeichnen (Dauerlast) unverändert: Wald 7,7, Menü 4,0,
Strand 10,9 ms (die Probe misst die Zeichenzeit je Bild, nicht den Takt). Hänger mit Script: Seitenstart 246 ms in einem
Bild (ohne Takt 30: 338), Prolog 44 ms (`DIV#story.onclick`).

Nutzer: «In der Szene, als die Glühwürmchen zu Noa fliegen, fehlten Teile des Hintergrunds.» → Ticket 18 (Vorrang vor
dem Stocken). Urteil über 30 gegen 60 im Level steht noch aus.

### Entscheid: stetige 30 im Spiel (ADR 0006), `leistung-09`

Nutzer nach dem Spielen am Strand mit `?takt=30&sky=beach`: «läuft sauber». Gewählt: fest 30 Bilder/s im Level, im
Menü und auf Reisen; die Geschichte bleibt bei 60. Variante A entfällt. `?takt=60` stellt zum Vergleich das frühere
Verhalten her. Grenze der Zeichenzeit bei 30 Bildern/s: 16 ms (gleiche Reserve). Tests angepasst: leerlauf-probe
(Reaktion im nächsten *gezeichneten* Bild), leistung-probe (`--takt60`, Urteil ≤ 8 bzw. 16 ms). Grün: logic, offline,
screenshot, start-probe, leerlauf-probe (headless, `--fenster`, `--fenster --handy`), geschichte-probe `--start` und
`--handy`, leistung-probe `--handy` und `--fenster --handy --ersatzmass`.

Poco, `leistung-09`: «Das Spiel mit 30 fps läuft super und glatt. Nur hatte ich in den Noa-Szenen noch immer ein paar
Ruckler.» → Ticket 18 (Bühne der Geschichte, bei 60).

### `leistung-09b`: Ticket 18 gemergt, bereit für Handy-Durchlauf 4, bitte auf Render deployen

Ticket 18 umfasst:
- Bühne ohne fehlenden Hintergrund: ferne Ebenen in der Auflösung, in der sie zu sehen sind; Kachelspeicher 97–137
  statt 163–216 MB.
- Tippen und Halt gestaffelt.
- Strahl im Epilog vorbereitet.

Review ohne Befund, zwei kleine Lücken behoben (`2b3e01c`).

Tests auf dem Merge, alle exit 0 ohne «Weckstelle fehlt»: die ganze Reihe wie oben (logic … leistung-probe `--fenster
--handy --drossel 4`), nach dem Review-Fix nochmals geschichte-probe `--start`, `--handy`, `--grad leicht --welten 2
--finale leicht`, `--quer --grad leicht`. Ausnahme wie bisher: `--uebersicht --dorf` (älter als 08).

Für den Nutzer auf dem Poco:
- Einstellung 5 («Da blinkt …») ohne fehlenden Hintergrund.
- Glühwürmchen beim Flug zu Noa und in den Wald.
- Noa-Szenen ohne Ruckler.
- Epilog «Noa lacht …».
- Spiel weiter glatt mit 30.

### `leistung-10`: Ticket 18 vollständig gemergt, bereit für den Test des Nutzers auf Render

Inhalt seit `leistung-09b`:
- glatte Flugbahn der Glühwürmchen
- Ladesperre vor den Flügen
- Startzeiten auf der Zeitachse des Dokuments
- glatte Spuren
- Keile des Strahls in kleinerer Box
- **Massstab der Seite 2 auf Android-Chromium mit DPR > 2**, UI gleich gross über `body { zoom }`

Gemessen auf dem Poco (WLAN-Debugging, nur der Prisma-Tab), abgebrochene Bilder in F5/F6:
- bisher 23/45
- mit Seitenmassstab 2: 7/1–4, also 59–60 Bilder/s

Reviews ohne Befund, nur Chromium als Einschränkung nachgetragen.

Ganze Testreihe grün, ausser:
- `geschichte-probe --uebersicht --dorf` (älter)
- `--quer --dorf --dpr 2.75`: scheitert auf `leistung-09e` gleich
- `--ganz`: Lücken an wechselnden Stellen, neu 2 von 4 Läufen grün, alt 2 von 3

Das sind Hänger des Grafikprozesses auf dem Arbeitsrechner und kein Rückschritt.

### Test des Nutzers auf `leistung-10` (03.11. Abend, Render, ohne Zusatz)

- Glühwürmchen: ruckeln noch ein wenig, aber deutlich besser als vorher.
- Erste Noa-Szene: noch nicht ganz glatt.
- Andere Szenen: ganz kleine Stellen, die nicht ganz gleichmässig wirken.
- Schrift, Spiel und Schärfe: «super». Der Seitenmassstab 2 ist damit für Schrift und Schärfe abgenommen.

Nächster Schritt: alle Szenen der Geschichte auf dem Poco messen (nicht nur die Prolog-Flüge), Bild für Bild mit Trace,
und die übrigen Abbrüche und ungleichen Bildabstände je Szene zuordnen (Ticket 18).
