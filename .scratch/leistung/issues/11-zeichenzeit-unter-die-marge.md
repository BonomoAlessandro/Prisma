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

**01.11.2026, Umsetzung** (Branch `leistung/11-zeichenzeit` ab `3fcafa0`, eine Massnahme je Commit, `APP_VERSION`
unverändert). Messung auf der T2000 im echten Chrome mit Fenster, `leise.sh` 100 %, Seite
`?perf&ersatzmass&nointro&noadapt`, Stand vor dem letzten Level der Welt, 4 s Ruhe, dann `leistung.dauerlast` (K = 20,
Median aus 5) mit GPU-Zeit (Timer) derselben Bilder; Handy-Emulation 393 × 873, DPR 2,75, Android-Kennung (gerendert
786 × 1746). Fassungen als Kopien (`_m11-a` = nur Messwerkzeug, `_m11-b` … `_m11-g` je eine Massnahme mehr), Skripte
und Rohdaten im Scratchpad des Agenten unter `11/` (`vergleich.mjs`/`.js`, `bilder.mjs`, `vergleiche.mjs`,
`out/*.json`).

*Vorsicht beim Lesen:* Die T2000 ist keine Kachel-GPU. Was auf dem Adreno Laden und Speichern von Kacheln spart, zeigt
sich hier kaum; dafür emuliert ANGLE/D3D11 das Auflösen von MSAA-Tiefe teuer (siehe 3). Die Poco-Zahlen sind
Schätzungen aus der Bandbreite (Adreno 730, 784 × 1478 = 1,16 Mio. Pixel; ein Vollbild RGBA16F + D24S8 laden und
speichern ≈ 28 MB ≈ 0,6–0,9 ms) und müssen in Handy-Durchlauf 3 bestätigt werden.

1. **Zerlegung erweitert** (`d575a06`): Dauerlast zusätzlich ohne Himmel (Kugel, Sterne, Planeten, Skybox mit allen
   Ebenen), ohne Wasser (samt Unterwasser-Pass), ohne Unterwasser-Pass (Fische), ohne Staub, ohne letzten Bildschritt.
   Karte: zweiter Block `-Himmel -Wasser -Unter -Staub -Final` (schmal `-Hi -Wa -Un -St -Fi`, 40 Zeichen); die Probe
   prüft die Werte. Pro Messpunkt jetzt 50 statt 25 Proben (Poco geschätzt 6–14 s statt 3–7 s). T2000,
   Handy-Emulation, GPU-Zeit (Timer) «ganz» und Anteile (ganz − ohne) vor den Massnahmen (Lauf a1, a2/a3 ähnlich):

   | Messpunkt | ganz | Spiegelung | Bloom | Netz | Himmel | Wasser | Unter | Staub | Final |
   |---|---|---|---|---|---|---|---|---|---|
   | Wald, Level | 3,8 | 2,1 | 0,9 | 0,2 | 1,0 | – | – | 0,0 | 0,5 |
   | Strand, Level | 4,9 | 2,0 | 0,8 | 0,7 | 2,0 | 1,1 | 0,3 | 0,1 | 0,4 |
   | Menü (Wald) | 0,86 | – | 0,43 | 0,09 | 0,27 | – | – | 0,0 | 0,16 |

   Am Strand ist der Himmel (Skybox mit Netz, Wasser, Palmen, Fischen) nach der Spiegelung der grösste Block, das
   Wasser allein ~1 ms. Auf dem Poco ordnet der nächste Durchlauf die ~8 ms damit zu.
2. **Unterwasser-Pass vor der Szene** (`d3ab55f`): Er lief in `onBeforeRender` des Wassers, also *mitten* im Pass der
   Szene. Auf einer Kachel-GPU heisst das: halbes Szenenbild samt Tiefe/Stencil speichern, Fische zeichnen, Szenenbild
   wieder laden. Jetzt zeichnet der Pass der Szene die Fische vorab (`SCENE_PREPASSES`); ausserhalb des Composers
   (Aufwärmen) wie bisher. T2000 (GPU, ganz): Strand 4,6–4,9 → 4,7 ms (in der Streuung, erwartet). **Poco
   (geschätzt): −0,5 bis −1 ms am Strand** (ein Speichern und Laden des Vollbilds weniger).
3. **Tiefe und Stencil verwerfen** (`ec5e9e4`): `invalidateFramebuffer` für das Szenenbild nach Szene und Pinsel und für
   das Unterwasser-Bild; die Spiegelung löst beim MSAA nur noch die Farbe auf (`__ignoreDepthValues`). T2000: Wald
   4,5 (b) → 1,84 ms, Strand 4,67 → 2,83 ms; der Anteil der Spiegelung fällt von ~2 auf ~0,2 ms (ANGLE/D3D11 löst
   MSAA-Tiefe per Shader auf), auch das Leuchten wird billiger (0,7–0,9 → 0,1–0,5 ms). **Poco (geschätzt): −0,2 bis
   −0,5 ms** (Tiefe des Szenenbilds 4,6 MB nicht speichern, Spiegelung ohne Auflösen der MSAA-Tiefe; die Spiegelung
   kostete dort nur 0,3–1,0 ms, der grosse Gewinn der T2000 ist ANGLE-spezifisch, hilft aber Windows-Rechnern).
4. **Ziele des Leuchtens ohne Tiefenpuffer** (`715a274`): three legte für alle elf Ziele einen an, gelöscht und
   gespeichert in jedem der zwölf Pässe. T2000: Wald 1,84 → 1,90, Strand 2,83 → 2,81 ms (gleich). **Poco: −0,05 bis
   −0,15 ms**, dazu ~2 MB Grafikspeicher.
5. **Leuchten im letzten Bildschritt** (`963a548`): Der Kopier-Pass von UnrealBloom las und schrieb das ganze
   Szenenbild (HalfFloat, mit Tiefe/Stencil), nur um das Leuchten additiv dazuzulegen. Jetzt liest `FinalShader` das
   zusammengesetzte Leuchten selbst (gleicher B-Spline, gleiche Gewichtung mit dem Alpha der Stufen, auch an den Stellen
   der Aberration). T2000: Menü 0,83 → 0,83 ms (Final-Anteil 0,7 → 0,6 ms), Wald 1,90 → 1,91, Strand 2,81 → 2,77 ms.
   **Poco (geschätzt): −0,6 bis −1,0 ms an allen Messpunkten, auch im stillen Menü** (ein Vollbild laden und speichern
   weniger, ein Pass weniger); von den 2,2–2,3 ms des Leuchtens der grösste Einzelposten.
6. **Tiefenregel des Netzes am Strand** (`2b34b06`): Am Strand schreibt das Netz `gl_FragDepth` mit einer teuren Regel
   (vier Abtastungen der Tiefe, atan/acos/exp). Zeigt die Wassermaske Wasser, steht das Ergebnis fest; dort entfällt das
   Lesen der Tiefe. Gleiches Ergebnis. T2000: Anteil Netz am Strand 0,51 (e) → 0,50 ms, gegenüber vorher (a) 0,65 ms.
   **Poco (geschätzt): −0,3 bis −0,8 ms am Strand** (Netz dort 1,8 ms, im Wald mit gleich vielen Ecken 0,1 ms: Es ist
   die Regel, nicht die Geometrie).
7. **Bildschirm ohne Tiefe/Stencil** (`db9a402`): Auf den Bildschirm zeichnet nur der letzte Bildschritt (Rechteck,
   jetzt ohne Tiefentest). T2000 gleich (Wald 1,86 → 1,77–1,84, Strand 2,76 → 2,73–2,77). **Poco: −0,05 bis −0,2 ms**,
   4,6 MB Grafikspeicher.

**Zusammen** T2000, Handy-Emulation, GPU-Zeit «ganz» (a1–a3 → g1–g3): Wald 3,5–3,8 → 1,75–1,84 ms, Strand 4,6–4,9 →
2,73–2,77 ms, Menü 0,86 → 0,79 ms; Dauerlast «ganz» Wald 3,8–4,1 → 2,2–2,5 ms (jetzt CPU-gebunden, CPU 2,0 ms), Strand
4,9–5,6 → 3,0–3,1 ms. Desktop 1536 × 729 (a1/a2 → g1/g2): Wald 3,4–3,7 → 1,8 ms, Strand 4,4–4,5 → 2,7 ms, Menü 0,77 →
0,77 ms. **Poco erwartet zusammen:** Wald 8,6 → etwa 7–7,5 ms, Strand 13,4 → etwa 10–11,5 ms, Menü 4,6 → etwa
3,6–4 ms. Die Marge von 6 ms ist damit **voraussichtlich noch nicht** erreicht; was fehlt, zeigt der zweite Block der
Karte in Handy-Durchlauf 3 (Himmel, Wasser, Final auf dem Adreno).

*Geprüft und verworfen:*
- **Leuchten in `R11F_G11F_B10F`** (Versuch `_m11-x`): three r147 legt `RGBFormat` nicht mehr an (`glTexImage2D:
  Invalid combination of format, type and internalFormat`), ginge nur mit eigenem `texStorage2D`; dazu 5–6 Bit Mantisse
  (Blau 5) in einem weichen Verlauf, Gefahr von Stufen im Glühen. Gewinn höchstens ~0,2–0,4 ms. Nicht gebaut.
- **Weniger Stufen, kleinere untere Stufen, weniger Abtastungen im Hochpass:** ändern Radius bzw. lassen das Leuchten
  dünner Strahlen wieder in Perlen zerfallen (Kommentar in `createComposer`), also sichtbar. Nicht gebaut.
- **Panorama-Netz gröber oder einseitig:** Im Wald kostet das Netz auf dem Poco 0,1 ms bei gleich vielen Ecken wie am
  Strand; der Gewinn wäre klein, Kämme und Ränder an Tiefensprüngen würden sich ändern. Nicht gebaut.
- **Unterwasser-Pass nur mit Fischen im Bild:** Die Fische schwimmen in der Lagune ums Brett und sind im Spiel fast
  immer im Bild; der Pass kostet ~0,1–0,3 ms (T2000). Ein Hüllquader über Fische, Schatten und Versatz der Wellen wäre
  fehleranfällig (Fische, die am Rand aufploppen). Nicht gebaut.

*Vergleichsbilder* (`?t=12`, Menü, Wald Level 0, Strand Level 0 mit Fischen, Spiegelung und Leuchten des Strahls;
Handy-Emulation und Desktop; links vorher `_m11-a`, rechts nachher `_m11-g`) im Scratchpad des Agenten unter
`11/bilder/` (`C:\Users\admin\AppData\Local\Temp\claude\C--workspace-Prisma\8b5e7724-0d5f-485c-bc5c-024f93a38529\scratchpad\11\bilder\`):
`v-{handy,desktop}-{menue,wald,strand}-nebeneinander.png`, Differenz ×8 `…-diff8.png`, Einzelbilder
`{handy,desktop}-{menue,wald,strand}-{vorher,nachher}.png`. Alle sechs Paare: 0,000 % der Pixel mit Abweichung > 2,
höchstens 1/255 (Rundung HalfFloat gegen float beim Auftragen des Leuchtens). Konsole ohne WebGL-Warnung.

*Berührungspunkte mit 09/16/15:* `waterSurface` (Unterwasser-Pass, `onBeforeRender`, `userData.dispose` meldet den
Vorlauf ab; Tiefenregel `skyDepth`), `createComposer` (Pass der Szene, Verwerfen, Bloom, `FinalShader`),
Renderer-Optionen (`depth: false, stencil: false`), `renderReflection`. Nicht berührt: `createPanoramaSky.build`,
`sliced`, `renderer.compile`, `loadLevel`, Prolog-Bühne. `skyWarmDraw` zeichnet das Wasser weiter über
`onBeforeRender` (andere Kamera) wie bisher.

*Risiken:* `invalidateFramebuffer` nur WebGL2 und ohne MSAA (`discardDepth` prüft das); wer künftig nach dem Pinsel
Tiefe oder Stencil des Szenenbilds braucht, muss den Pass `discard` verschieben. Ein neuer Pass zwischen Bloom und
Final, der das Szenenbild liest, sähe das Leuchten nicht mehr (es kommt erst im Final dazu). Der Bildschirm hat keine
Tiefe mehr: Wer direkt auf den Bildschirm in 3D zeichnen will, braucht ein eigenes Ziel. Die geschätzten Poco-Gewinne
sind nicht gemessen.

*Tests* (Stand `db9a402`, `GPU=1`, `leise.sh` 100 %): logic (2033), golden, hall, screenshot (Konsole ohne Meldungen),
offline, `leistung-probe` headless Desktop und `--handy`, im Fenster `--fenster`, `--fenster --handy`, je mit und ohne
`--ersatzmass`, `geschichte-probe --start` und `--handy`, `leerlauf-probe`: alle grün. Alle vier Fensterläufe
`adaptiv 1.00, Umbauten 0`. Karte `--fenster --handy --ersatzmass` (Dauerlast «ganz»): Spiel 2,3 ms (CPU-gebunden,
CPU 2,2), Menü still 1,0 ms, Spiel n. Reise 3,1 ms (08: 3,8–4,1 / 1,0–1,1 / 5,1–5,5 ms); zweiter Block mit `-Himmel …
-Final` vorhanden, Karte schmal 40 Zeichen. Beobachtung: Im Lauf `--fenster --handy` mit GPU-Zeit steht «Zeichnen ≤ 8 ms:
nein (Seitenstart)» (GPU p95 21,8 ms im Abschnitt Seitenstart, Laden); die Probe prüft das nicht, auf dem Poco gilt das
Urteil aus der Dauerlast. Nicht gegen den Stand vor 11 verglichen.

Scratchpad-Kopien der Fassungen (`_m11-a.html` … `_m11-g.html`, `_m11-x.html`) liegen unter `11/fassungen/` (zum
Messen in den Worktree kopieren, sie laden `vendor/` und `backgrounds/` relativ).

Offen für den Koordinator: Review; Handy-Durchlauf 3 mit `APP_VERSION` nachgeführt; dort die Spalten des zweiten
Blocks lesen, um den Rest bis 6 ms zuzuordnen (Himmel/Wasser am Strand, Final und Szene im Wald).

**Review (01.11.2026, Code):** `git diff 3fcafa0 HEAD` geprüft; logic (2033), golden, hall, screenshot (Konsole leer)
grün. Korrekt: Nach `discard` liest niemand Tiefe/Stencil des Szenenbilds (Pinsel davor, Bloom/Final nur Farbe, das
nächste Bild löscht); WebGL1/MSAA übergeht `discardDepth`, `__ignoreDepthValues` greift nur beim MSAA-Auflösen (nur
WebGL2). Auf den Bildschirm zeichnet nur `finalPass` (EffectComposer bindet am Ende wieder `null`, die `readPixels` der
Dauerlast lesen also den Bildschirm); kein Kontext-Neustart-Pfad. Bloom-`render` deckt sich mit r147 ohne Kopier-Pass;
Leuchten im Final = alte Mischung (SrcAlpha·opacity, Alpha unverändert, Aberration-Versatz aus unverändertem Alpha),
Desktop und Handy über `bloomOut`-Grösse; Bloom aus bzw. «-Bloom» → `uBloom = 0`. Vorlauf: Grösse = `readBuffer`,
Kamera-Matrix aktuell (render aktualisiert sie, Kamera ohne Eltern), Schattenkarte unberührt (Unterwasser-Szene ohne
Licht), Abmelden über `releaseTree` auch bei Abbruch; ohne Wasser kein Eintrag. Tiefenregel Strand logisch gleich.
*Gefixt* (`11f4073`): Ohne HDR (8-Bit-Ziele) begrenzte das alte Auftragen Szene + Leuchten auf 1, jetzt im Final
ebenso (`lit`). *Hinweis:* «-Final» zeichnet nichts auf den Bildschirm; ob das `readPixels` dann auch auf die
Offscreen-Pässe wartet, hängt am Treiber (Spalte -Fi auf dem Poco mit Vorsicht lesen). *Seitenstart:* `3fcafa0` im
Fensterlauf `--handy` (T2000, Rechner belastet) GPU-p95 37,9 ms im Seitenstart, also nicht neu durch 11 (Laden,
wenige Bilder); Vergleichslauf des neuen Stands blieb in der Sperre hängen.

**Review (01.11.2026, Browser und Optik):** Echtes Chrome mit Fenster und GPU (T2000), Desktop maximiert und
Handy-Emulation 393 × 873, DPR 2,75, Android; `3fcafa0` gegen HEAD (ab den Reisen, Proben und den Wiederholungen auf
`11f4073`). Skripte, Bilder und Logs im Scratchpad unter `11r/`. *Feste Zeit* (`?t=12`, gleiche Zustände, Pixelvergleich):
Menü (Wald, Strand, Vulkan), Übersicht, alle sechs Welten im Level, Aufleuchten nach dem Start (0,9 s, 1,5 s), Bloom-Puls,
Feier (`celebration.start`, 0,25–3 s), Grössenänderung (Desktop 1100 × 650 und zurück), Drehen des Handys (quer und
zurück). Bei gleichem Zustand höchstens 1/255 (Handy) bzw. 2–4/255 (Desktop). Am Strand auf dem Desktop 0,05 % einzelne
Pixel bis 7/255 im Rotkanal am linken Rand (Aberration), im Ausschnitt 3× nicht zu sehen. Glüh-Ausschnitte 3× (Strahl am
Sender, Ziel, Puls; Handy und Desktop, auch auf `11f4073`): max 1–2/255, kein Banding, keine Perlen. Grössere Abweichungen
stammen nur aus Echtzeit-Anteilen, die zwischen den Aufnahmen weiterlaufen: Funken und Ring der Feier, wachsende Elemente,
Laden der Vulkan-Skybox auf dem Handy (mit 8 s Wartezeit 0/255). *Echtzeit* mit einem Bildwächter (jedes Bild nach dem
letzten Bildschritt 9 Zeilen auslesen, Flackern = ein Bild deutlich dunkler oder heller als seine Nachbarn): Reise durch
alle Welten (Strand → Wüste → Vulkan → Planeten → Sterne → Wald), Handy und Desktop, vorher wie nachher 0 Flackern,
0 schwarze Bilder. `geschichte-probe` im Fenster (Handy: Prolog → Spiel → Wald → Reise ins Meer; `--finale leicht`
Handy und Desktop: Sterne, Feier, Epilog → Menü → Mittel mit Prolog) ohne Flackern. Die schwarzen Bilder im Finale (642
nachher, 645 vorher) zeigen den dunklen Sternhimmel hinter dem Menü. Bestanden, Konsole ohne Meldung (kein
`INVALID_OPERATION`, kein `invalidateFramebuffer`, keine «Weckstelle fehlt»). Ein Lauf `--finale` Desktop mit 371 ms Lücke
Epilog → Menü: Vorher hatte er dasselbe (497 ms). Die Lücke liegt ohne WebGL-Bild in der Lücke, der Rechner war belastet.
Die Wiederholung auf `11f4073` lief grün (89 ms). *Referenzdurchlauf* `--fenster --ersatzmass`: nachher 2× Desktop, 2×
Handy, vorher je 2×. Alle Karten zeigen `adaptiv 1.00, Umbauten 0`. Bilder > 33 ms gesamt: Handy nachher 15/15, vorher
22/20; Desktop nachher 20/22, vorher 17/20. Das liegt in der Streuung, die Hänger bis 500 ms («ohne Script») gibt es in
beiden Fassungen. Dauerlast «ganz»: Handy 2,0–2,3 / 1,0 / 3,0 ms (vorher 3,9 / 1,2 / 5,4), Desktop 2,2–2,3 / 1,0 /
2,9–3,0 ms (vorher 4,0 / 1,0 / 4,8). Die zweite Zerlegungszeile `-Hi -Wa -Un -St -Fi` ist auf 393 px lesbar und passt
ohne seitliches Wischen (`11r/lp/nachher/fenster-handy-ersatzmass-1-karte1.png`). **Urteil: ja**, bei normalem Abstand
kein Unterschied; keine Funde, nichts geändert.

**Handy-Durchlauf 2c, Poco F4 GT, 01.11.2026, vom Nutzer (Stand `leistung-07c` = 07b + 11 + 17):**

```
Rendern     784×1478 (Pixelverhältnis 2.00, adaptiv 1.00, Umbauten 0), Handy
Takt        61 Hz (Median der Bildabstände 16.50 ms)
Abschnitt       Bilder    p95    max  >33 Zeichn   CPU gez/s ruhig
Seitenstart*         8  427.6  427.6    3      –  39.2     1     1
Startbildschirm    232   16.6   33.4    1      –     –     0     0
Menü               485   16.6   49.4    1      –   6.3    23    11
Prolog            2244   16.6   82.3    6      –   4.4     1     1
Einstieg           373   16.6   82.3    2      –   8.5    59     –
Spiel             1367   16.6  197.3    1      –   8.7    62    62
Reise              810   16.6   49.4    2      –   6.7    60     –
Spiel n. Reise     122   16.6   49.4    1      –  12.0    84     –
Gesamt            5633   16.6  197.3   14      –

Messpunkt            ganz  -Spieg  -Bloom   -Netz -Pinsel     CPU
Spiel (1. Level)      8.5     7.3     6.6     8.2       –     2.9
Menü still            4.8       –     2.4     4.4       –     0.8
Spiel n. Reise       13.5    11.8    11.1    10.9    12.9     4.1
Messpunkt         -Himmel -Wasser  -Unter  -Staub  -Final
Spiel (1. Level)      6.5       –       –     8.7     8.0
Menü still            3.9       –       –     5.0     4.4
Spiel n. Reise        6.8    10.0    13.8    13.4    12.7
Zeichnen ≤ 8 ms: nein (Spiel (1. Level) 8.5 ms, Spiel n. Reise 13.5 ms)

Längste Bilder / Hänger:
   427.6 ms  Seitenstart bei 0.2 s (Script 431 ms)
   197.3 ms  Spiel bei 88.9 s (FrameRequestCallback: Script 191 ms) – Ticket 09 nicht in diesem Stand
   102 ms    Einstieg bei 51.0 s (→ frame: Script 94 ms)
    84 ms    Prolog bei 34.5 s (ohne Script)
```

**Auswertung (Koordinator):** Ticket 11 wirkt auf dem Poco nicht (8,6 → 8,5 ms, 13,4 → 13,5 ms); die Gewinne auf der
T2000 waren ANGLE/D3D11-spezifisch (MSAA-Tiefe), Load/Store-Ersparnis auf dem Adreno nicht messbar. Anteile auf dem Poco
(ms): Strand: Himmel 6,7 (davon Wasser 3,5, Netz 2,6), Bloom 2,4, Spiegelung 1,7, Final 0,8, Pinsel 0,6, Unterwasser
und Staub ~0; Wald: Himmel 2,0, Bloom 1,9, Spiegelung 1,2, Final 0,5, Netz 0,3, Rest (Brett, Elemente) ~2,9; Menü:
Bloom 2,4 von 4,8. Fische in voller Auflösung (Ticket 14) kosten nichts Messbares. «stetige 60 aus» erscheint nicht,
`adaptiv 1.00`. Ticket 11 bleibt offen.

**02.11.2026, zweite Runde «11b»** (Branch `leistung/11b-poco` ab `68640a5`, eine Massnahme je Commit, `APP_VERSION`
unverändert). Nur Einsparungen, die auf jeder GPU wirken: weniger Fragment-Arbeit, weniger Texturzugriffe, weniger
Abtastungen und Durchgänge. Kein Treiberkniff, keine Auflösung gesenkt, kein Grafikschalter.

*Messung:* T2000 im echten Chrome mit Fenster, Handy-Emulation in der Grösse des Poco (392 × 739, gerendert 784 × 1478),
Desktop 1536 × 729. GPU-Zeit (Timer) je Durchgang und je Objekt (Netz, Wasser: Abfrage um ihr Zeichnen), A/B in
derselben Sitzung (jede Massnahme zur Laufzeit zurückgeschaltet, 4 × abwechselnd, Median), weil die T2000 zwischen zwei
Taktstufen springt (dieselbe Messung schwankt sonst um den Faktor 2). *API-unabhängig:* Der Shader von Netz und Wasser
zählt jeden Texturzugriff mit (Hilfsfunktionen statt `texture2D`/`textureLod`/`textureGrad`, mit allen Verzweigungen,
verworfene Fragmente bis zum `discard`) und schreibt die Zahl additiv in ein Float-Ziel: Fragment-Aufrufe und
Texturzugriffe je Bild. Bloom: Abtastungen je Bild aus Shader und Zielgrössen, der Hochpass mit dem gemessenen Anteil
heller 2 × 2-Gruppen im Szenenbild. Skripte und Rohdaten im Scratchpad unter `11b/` (`probe.mjs`, `zeiten.js`,
`zaehle.js`, `var2.js`, `bloomzahl.js`, `lauf*.log`).

Am Strand (Handy, Level) bedeckt das Netz 100 % des Bilds (Überzeichnung 1,0), das Wasser 55,6 %, die Platte rund 35 %;
im Wald die Platte 44 %. Der Hochpass findet im Menü und im Wald fast keine hellen Gruppen (Wald 0,8 %), am Strand 48 %
(helles Wasser: Summe von 4 Bildpunkten ≥ 1).

| Massnahme (Commit) | API-unabhängig (Handy) | T2000 GPU, A/B | Poco geschätzt |
|---|---|---|---|
| Wasser: Brandung, Auflaufen, Schaum, Rinnen nur, wo sie wirken; Rauschen 2D (`05c153d`) | Texturzugriffe 13,9 → 10,3 Mio. je Bild (21,5 → 15,9 je Pixel) | Wasser 0,84 → 0,68 ms (Handy), 0,45 → 0,36 (Desktop) | Strand −0,6 bis −0,8 ms |
| Netz rechnet hinter der Platte nichts (`636dc25`) | Strand 6,0 → 3,5 Mio., Wald 1,16 → 0,65 Mio. Zugriffe | Netz Strand 0,49 → 0,31, Wald 0,27 → 0,20 ms | Strand −0,8 bis −1,0, Wald −0,1 |
| Tiefenregel: zwei Matrix-Vektor- statt Matrix-Matrix-Produkt (`c5ceb4f`) | 48 Multiply-Adds weniger je Netz-Pixel am Strand | Netz −0,03 ms | Strand −0,1 bis −0,2 |
| Bloom-Hochpass prüft je 2 × 2 Bildpunkte vorab (`5730854`) | 4,6 → 1,2 Mio. Abtastungen (Menü, Wald), 3,4 Mio. (Strand) | in der Streuung (Bloom 0,3–0,6 ms) | Menü/Wald −0,3 bis −0,5, Strand −0,1 bis −0,2 |
| Spiegelung: Mipmaps nur bis Stufe 4 (`a52547a`) | 5–6 kleine Durchgänge weniger je Bild | in der Streuung | −0,05 bis −0,15 (Wald, Strand) |
| Bloom: paarweise Weichzeichnen mit bilinearer Abtastung (`b1965b7`) | 4,9 → 3,3 Mio. Abtastungen | in der Streuung | −0,15 bis −0,3 überall |
| Bloom: Stufen in zwei Schritten zusammensetzen (`ee00e02`) | 4,9 → 2,4 Mio. Abtastungen, ein Durchgang (0,07 Mpx) mehr | in der Streuung | −0,2 bis −0,4 überall |

Bloom zusammen (ohne das Auftragen im letzten Bildschritt): 14,4 → 6,9 Mio. Abtastungen je Bild im Menü und im Wald,
→ 9,1 Mio. am Strand. Begründungen der Gleichheit stehen in den Kommentaren am Code: Was übersprungen wird, ist dort
genau 0 (Gewicht `smoothstep(1.8, 0.9, Tiefe)`, `share = 0` ab 0,7 m, Schaumdichte 0, `hug = 0` ohne Fels, Summe der
Helligkeiten unter der Schwelle). Die Platte ist undurchsichtig, steht fest und wird nach dem Netz gezeichnet; das Netz
verwirft nur Pixel, deren Strahl die Platte (um 1 cm kleiner) vor dem Netz trifft, nach den Ableitungen.

**Poco erwartet zusammen** (aus seinen Anteilen): Strand 13,5 → etwa 10,5–11,5 ms, Wald 8,5 → etwa 7,2–7,8 ms, Menü
still 4,8 → etwa 3,8–4,2 ms. **≤ 8 ms am Strand ohne sichtbaren Unterschied ist damit nicht realistisch.** Was dort
bleibt: Wasser ~2,7, Netz ~1,4, Spiegelung ~1,6, Bloom ~1,8, Final 0,8, Pinsel 0,6, Szene ~2. Massnahmen mit kleinem,
aber sichtbarem Unterschied (Entscheid Nutzer), geschätzt am Strand:
- Bloom auf dem Handy ab Viertelauflösung (`bloomDiv` 2 wie Desktop): −0,8 bis −1,2 ms, überall. Risiko: Leuchten
  dünner Strahlen zerfällt wieder in Perlen (der Grund für `bloomDiv` 1), weicheres Glühen.
- Pinsel auf dem Handy aus: −0,6 ms (nur Strand), Palmen weniger gemalt.
- Spiegelung auf dem Handy ohne MSAA: −0,1 bis −0,3 ms, Kanten im Spiegelbild etwas härter.
- Wasser in halber Auflösung mit kantenerhaltendem Vergrössern: −1,2 bis −1,8 ms, Glitzern und Schaumkanten weicher.
Erst alle vier zusammen kämen am Strand voraussichtlich in die Nähe von 8 ms. Noch unsichtbar möglich, aber nicht
gebaut: die Spiegelung nur im Bildausschnitt der Platte rendern (Scissor mit Rand für die Mipmaps), geschätzt −0,2 bis
−0,4 ms.

*Vergleich* (feste Zeit `?t=12`, `11r/det.mjs`, vorher `68640a5`, nachher `ee00e02`; Handy 393 × 873 und Desktop):
Menü (Wald, Strand, Vulkan), Übersicht, alle sechs Welten im Level, Aufleuchten, Puls, Feier, Drehen, Grössenänderung.
Menü, Übersicht: 0/255. Strand: Wasser und Ufer max 1/255, um die Platte nichts. Leuchten am Strahl 3×: max 9/255 auf
0,6 % der Pixel (Handy), 5/255 (Desktop), keine Perlen, kein Banding. Grössere Abweichungen nur an Echtzeit-Anteilen:
schwebendes Ziel, Funken der Feier, Lava des Vulkans (dieselbe Fassung gegen sich selbst weicht dort gleich stark ab:
7,3 % der Pixel). Bilder unter `11b/bilder/` (Einzelbilder) und `11b/bilder/v/` (`…-nebeneinander.png`,
`…-diff8.png`, Ausschnitte `handy-beach-level-strahl3x`, `-wasser`, `-ufer`, `-platte`). Konsole leer.

*Tests* (Stand `ee00e02`, `GPU=1`, `leise.sh` 100 %): logic (2033), golden, hall, screenshot (Konsole leer), offline,
`leistung-probe` headless Desktop und `--handy`, im Fenster `--fenster --ersatzmass` und `--fenster --handy
--ersatzmass` («in Ordnung», `adaptiv 1.00, Umbauten 0`, Dauerlast ganz Handy 2,6 / 0,9 / 2,8 ms, Desktop 1,8 / 0,9 /
2,5 ms), `geschichte-probe --start` und `--handy`, `leerlauf-probe`: alle grün. Die Karten zeigen «Flüssig: nein» mit
p95 18,4–18,6 ms und Hängern «ohne Script» (Prolog, Menü), der Rechner war durch parallele Läufe belastet; die GPU-Zeit
ist dort klein.

*Berührungspunkte:* `skyPanoramaMaterial` (Fragment-Shader des Netzes: Plattentest vor dem Abtasten; nicht `build`,
nicht `sliced`), Tiefenregel in `waterSurface` (`cutAt`), Fragment-Shader des Wassers, `createComposer` (Hochpass,
`bloom.render`, neue Materialien `pairBlur`, `compositeCoarse`, `compositeFine`; `renderTargetsHorizontal[1]` dient
jetzt als Zwischenbild), `renderReflection` (`limitReflectionMips`). Für 09 (Aufbau des Himmels): Die neuen
Bloom-Programme übersetzen beim ersten Bild mit Bloom, wie vorher das Zusammensetzen; wer Programme vorab übersetzt,
sollte sie mitnehmen.

*Risiken:* Plattentest setzt voraus, dass die Platte (`floorTop`, `plateSides`) fest steht, undurchsichtig ist und
gezeichnet wird; wer sie bewegt, ausblendet oder durchsichtig macht, muss `PLATE_LO/HI` anpassen. Der Hochpass setzt
nicht-negative Farben im Szenenbild voraus (geprüft: keine). `TEXTURE_MAX_LEVEL` der Spiegelung wird je Bild gesetzt;
liest der Boden einmal tiefer als Stufe 4, bleibt er bei Stufe 4. Die Poco-Gewinne sind Schätzungen; die
Load/Store-Seite des Adreno zeigt erst der nächste Handy-Durchlauf.
