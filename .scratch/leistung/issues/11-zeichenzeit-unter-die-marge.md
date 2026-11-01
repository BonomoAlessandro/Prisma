# 11: Zeichenzeit unter die Marge (Spiegelung, Bloom, Panorama-Netz)

**Spec:** ../spec.md

**Blocked by:** 08 (erledigt, Zahlen vom Poco liegen vor)

**Status:** ready-for-agent

**What to build:** Die GPU-Arbeit je Bild im Spiel sinkt auf dem Poco auf p95 ≤ 8 ms (Dauerlast-Mass aus 08), ohne
dass ein Spieler einen Unterschied sieht. Erst die Zahlen vom Poco ansehen, dann nur so viel umbauen, wie nötig ist.
Ist die Marge mit den Zahlen aus 08 schon erfüllt, wird dieses Ticket mit Begründung `wontfix`.

**Messwerte (07), T2000 in Handy-Emulation (786 × 1746, Pixelverhältnis 2, Einstellungen des Handys), Level, ungedrosselt:**

Dauerlast (20 Bilder hintereinander, ms je Bild) ganz und mit weggelassenem Teil, daneben die GPU-Zeit (Timer) eines
Bilds derselben Variante:

| Welt | ganz | ohne Spiegelung | ohne Bloom | ohne Panorama-Netz (Ecken) |
|---|---|---|---|---|
| Wald | 4,0 / 4,2 | 1,8 / 1,6 | 3,0 / 2,8 | 3,7 / 3,4 (131 841) |
| Strand | 5,5 / 4,5 | 2,8 / 2,7 | 3,9 / 3,8 | 4,1 / 3,7 (131 841) |
| Wüste | 4,7 / 3,8 | 1,9 / 1,7 | 3,2 / 2,8 | 3,1 / 2,9 (525 825) |
| Vulkan | 5,6 / 4,9 | 3,4 / 3,3 | 4,4 / 4,3 | 5,1 / 4,6 (131 841) |

GPU-Zeit je Durchgang (Timer, Median über 40 Bilder): Spiegelung 1,4–2,3 ms, Szene 1,8–4,4, Bloom 0,65–1,6 (Menü
2,3), Final 0,15–0,5, Pinsel (Strand) 0,15 ms. Anteile also: **Spiegelung 40–60 %** (das zweite Rendern der Szene und
das Abtasten im Boden), **Bloom 20–30 %**, Panorama-Netz 7–33 % (Wüste mit viermal so vielen Ecken am meisten), der
Pinsel kaum.

Auf dem Poco gibt es diese Zerlegung erst mit 08. Grobe Schätzung aus Rechenleistung und Speicherbandbreite (Adreno
730 etwa halb so schnell wie die T2000, Kachel-GPU mit teuren Wechseln des Render-Targets): 8–12 ms je Bild, also um
die Marge herum. Das Ersatzmass der Karte (31–59 ms) taugt dafür nicht (siehe 08).

**Kandidaten, in dieser Reihenfolge prüfen (jeweils Dauerlast vorher/nachher auf T2000 und Poco, Bilder
nebeneinander auf dem Handy bei normalem Abstand):**

- [ ] **Spiegelung:** Zuerst zerlegen, was sie kostet (Rendern in die Spiegeltextur gegen Abtasten im Boden-Shader,
      Weichzeichnen, MSAA 2 auf dem Handy). Dann billiger ohne sichtbaren Unterschied, etwa: im Spiegelbild nur, was
      sich auf der Platte spiegeln kann (Elemente, Strahlen, Ziele; Hüllquader gegen das gespiegelte Sichtfeld), MSAA
      der Spiegeltextur auf dem Handy prüfen (die Textur wird ohnehin weich abgetastet), Abtastungen im Boden-Shader
      prüfen. **Nicht** die Auflösung der Spiegelung senken und nicht nur jedes zweite Bild rendern, ohne Vergleich auf
      dem Poco: Der Nutzer will ausdrücklich nichts Verpixeltes und keine nachlaufende Spiegelung.
- [ ] **Bloom:** Hochpass mit 16 Abtastungen je Bloom-Pixel (Handy) und fünf Stufen in HalfFloat. Prüfen: Stufen
      in `R11F_G11F_B10F` statt `RGBA16F` (halbe Bandbreite, wo `EXT_color_buffer_float` da ist), weniger Stufen, wo
      der Radius es zulässt. Das Leuchten dünner Strahlen darf nicht wieder in Perlen zerfallen (Kommentar in
      `createComposer`), Vergleich mit Bewegung der Kamera.
- [ ] **Panorama-Netz der Wüste** (525 825 Ecken, `panorama.depth.mesh`): auf dem Handy die Dichte nur dort, wo die
      Tiefe springt (Dünenkämme), sonst gröber; oder einseitig, wo die Rückseite nie zu sehen ist. Kämme dürfen nicht
      eckig werden.
- [ ] Nach jedem Kandidaten: Referenzdurchlauf Desktop und Handy 4×, `adaptiv 1.00, Umbauten 0` auf dem Desktop.
- [ ] Tests grün (`golden`, Screenshots der KI-Tester bei Plätzen mit Spiegelung und Bloom, `leistung-probe`), Review,
      Commit.

**Abnahmekriterium:** Auf dem Poco Dauerlast «ganz» ≤ 8 ms an allen Messpunkten von 08 (Schlussabnahme bzw.
Durchlauf 2b), Karte `adaptiv 1.00, Umbauten 0`; Bilder vorher/nachher nebeneinander auf dem Poco ohne Unterschied
(Nutzer). Auf der T2000 (Handy-Emulation) mindestens die Hälfte des Gewinns, den der Poco-Durchlauf nötig macht.

**Risiko:** mittel. Jede Änderung an Spiegelung und Bloom ist sichtbar, wenn sie zu weit geht; darum Kandidat für
Kandidat mit Vergleich, und Abbruch, sobald die Marge erreicht ist.

## Comments

**Handy-Durchlauf 2b (Koordinator, 01.11.2026):** Stand `leistung-07b` = 07 + Ticket 08 (Dauerlast) + Ticket 14 (Fische
voll). Tests grün (logic, golden, hall, beurteilung, geschichte, ki-tester, levelliste, vorrat, wuerfelliste, generator,
offline, screenshot, start-probe, geschichte-probe `--start`/`--handy`, leerlauf-probe, leistung-probe headless und
`--fenster --handy --ersatzmass`: `adaptiv 1.00, Umbauten 0`, Dauerlast ganz 4,0 / 5,5 ms). Entscheid nach der Poco-Karte:
Dauerlast «ganz» ≤ 5–6 ms → Ticket 11 `wontfix` (Reserve für tieferen Takt und Compositing, Review 08); darüber nach der
Zerlegung, voraussichtlich Spiegelung zuerst.

**bereit für Handy-Durchlauf 2b, bitte auf Render deployen**

**Handy-Durchlauf 2b, Poco F4 GT, 01.11.2026, vom Nutzer:**

```
Version     2026-11-01 leistung-07b
Rendern     784×1478 (Pixelverhältnis 2.00, adaptiv 1.00, Umbauten 0), Handy
Abschnitt       Bilder    p95    max  >33 Zeichn   CPU gez/s ruhig
Seitenstart*         8  428.2  428.2    4      –  19.9     1     1
Startbildschirm    205   16.6  131.6    2      –     –     0     0
Menü               446   16.6   65.9    1      –   6.8    23    11
Prolog            2460   16.6   82.3    9      –   5.0     1     1
Einstieg           374   16.6   49.5    2      –   8.6    60     –
Spiel             1339   16.6  197.5    3      –   9.3    53    52
Reise              813   16.6   49.3    1      –   6.6    60     –
Spiel n. Reise     122   16.6   49.4    1      –  11.8    56     –
Gesamt            5759   16.6  197.5   19      –

Zeichnen (Dauerlast, K = 20, Median aus 5), ms je Bild:
Messpunkt            ganz  -Spieg  -Bloom   -Netz -Pinsel     CPU
Spiel (1. Level)      8.6     8.3     6.4     8.5       –     2.7
Menü still            4.6       –     2.3     4.9       –     0.8
Spiel n. Reise       13.4    12.4    11.1    11.6    13.1     3.4
Zeichnen ≤ 8 ms: nein (Spiel (1. Level) 8.6 ms, Spiel n. Reise 13.4 ms) (Dauerlast ganz)

Längste Bilder / Hänger:
   428.2 ms  Seitenstart bei 0.8 s (490 ms ohne Script, Rendern 3 ms)
   312.3 ms  Seitenstart bei 0.3 s (Script 303 ms)
   197.5 ms  Spiel bei 86.8 s (FrameRequestCallback: Script 201 ms, Rendern 207 ms)
   131.6 ms  Startbildschirm bei 1.2 s
    82.3 ms  Prolog bei 35.3 s (ohne Script, Rendern 8 ms)
    82.2 ms  Prolog bei 23.6 s (FrameRequestCallback: Script 86 ms)
      69 ms  Einstieg bei 53.8 s (→ frame: Script 63 ms); 67 ms Reise bei 93.2 s (→ frame: Script 56 ms)
```

**Entscheid (Koordinator):** Ticket 11 wird gebaut. Dauerlast «ganz» 8,6 ms (Wald) und 13,4 ms (Strand) liegen über
der Marge, und die Dauerlast misst laut Review 08 eher zu tief. Auf dem Adreno ist die Rangfolge anders als auf der
T2000: **Bloom** 2,2–2,3 ms (auch im stillen Menü), **Netz** 1,8 ms am Strand, **Spiegelung** 0,3–1,0 ms, Pinsel 0,3 ms.
Am Strand bleiben rund 8 ms, die keine Spalte erklärt (Szene, Wasser, Unterwasser-Pass aus Ticket 14 in voller
Grösse, Himmel). Zuerst die Zerlegung um diese Teile erweitern, dann in der Reihenfolge der Poco-Anteile vorgehen.
Ziel: «ganz» ≤ 6 ms an allen Messpunkten auf dem Poco (Reserve für tieferen Takt und Compositing), Abnahme in
Handy-Durchlauf 3; ohne sichtbaren Unterschied, Auflösung nicht senken, Fische bleiben glatt.
