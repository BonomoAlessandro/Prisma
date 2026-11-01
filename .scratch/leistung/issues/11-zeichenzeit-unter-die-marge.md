# 11: Zeichenzeit unter die Marge (Spiegelung, Bloom, Panorama-Netz)

**Spec:** ../spec.md

**Blocked by:** 08 (und dessen Zahlen vom Poco, siehe Hinweis in 08)

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
