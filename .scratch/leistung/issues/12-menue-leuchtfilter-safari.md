# 12: Leuchtfilter im Menü auf die Umgebung der Linien begrenzen (Safari)

**Spec:** ../spec.md

**Blocked by:** 07

**Status:** ready-for-agent

**What to build:** Der Leuchtfilter des Menüs (`feGaussianBlur` 2,4, `index.html` um 16719) rechnet nur noch dort, wo
Licht ist, nicht über die ganze Fläche des Menüs. Das Bild bleibt pixelgleich. Gedacht für Safari (iOS rechnet
SVG-Filter auf der CPU), wird aber in Chrome abgenommen.

**Befund (07):** Der Filter hat `filterUnits="userSpaceOnUse"` mit `x=0 y=0 width=W height=H`, also die ganze Fläche des
Menü-SVG, und hängt an jeder leuchtenden Linie (`menue-licht`, je Grad eine) und am Zeichen der aktuellen Welt. Je
gefiltertem Element entsteht so eine Fläche in Bildschirmgrösse, die in den 3,2 s des Wachsens (`stroke-dashoffset`)
in jedem Bild neu weichgezeichnet wird. In Chrome auf dem Poco unauffällig (Menü p95 16,6 ms, max 49,5 ms; der
Handy-Durchlauf zeigt keinen Hänger beim Öffnen), in Safari bekannt teuer. Grund für die ganze Fläche ist vermutlich,
dass `objectBoundingBox` bei waagrechten oder senkrechten Linien (Höhe bzw. Breite 0) gar nichts zeichnet.

**Vorschlag:**

- [ ] Je gefiltertem Element einen eigenen Filter mit `userSpaceOnUse` und dem Hüllrechteck seiner Punkte plus Rand
      (3 × stdDeviation + halbe Strichbreite, also etwa 9 px) statt der ganzen Fläche; oder ein gemeinsamer Filter je
      Grad, wenn das einfacher ist.
- [ ] Pixelvergleich: Menü Desktop und Handy (frisch, mit Stand, geschafft), nach dem Wachsen und mitten drin: gleich
      (höchstens Rundung an den Rändern, keine abgeschnittenen Säume).
- [ ] Messen (Chrome): Menü öffnen und Wachsen, Desktop und Handy 4×, max und Bilder über 33 ms vorher/nachher; darf
      nicht schlechter werden.
- [ ] Tests grün (`geschichte-probe --menue`, Screenshots), Review, Commit.

**Abnahmekriterium:** Menü pixelgleich (Vergleich wie oben), Chrome nicht langsamer; die gefilterte Fläche je Element
höchstens Hüllrechteck plus Rand.

**Gewinn und Risiko:** Gewinn nur in Safari zu erwarten (nicht geprüft, Spec), klein in Chrome; Risiko klein
(abgeschnittener Saum, sichtbar im Pixelvergleich). Niedriger Rang; kann entfallen, wenn die Zeit knapp ist.

## Comments

### Umsetzung (Branch `leistung/12-menue-filter`, gemergt mit `feature/leistung` d088eb4 / 11b)

Nur `createMenu` → `zeichne()` (Menü-SVG); CSS unverändert. Statt eines Filters `${uid}-leuchten` über die ganze Fläche
(`userSpaceOnUse`, 0/0/W/H) bekommt jedes gefilterte Element einen eigenen Filter `${uid}-leuchten-<n>` mit
`filterUnits="userSpaceOnUse"` und dem Hüllrechteck seiner Punkte plus Rand: `LEUCHTEN_RAND` = ⌈3 σ⌉ + 1 = 9 px, dazu
die halbe Strichbreite (0,9) bei den Lichtwegen bzw. Scheibe/Zeichen (s2/2 + 3) beim Zeichen der aktuellen Welt.
`primitiveUnits` bleibt `userSpaceOnUse` (σ 2,4 wie bisher). Die Ecken liegen auf einem Raster von 8 Gerätepixeln
(`devicePixelRatio`): Ohne Raster wich das Handy (2,75) längs der Wege um bis 4/255 ab, weil Skia den Blur bei grossem σ
in Gerätepixeln (6,6) verkleinert rechnet und dieses Raster an der Ecke der Fläche beginnt; mit Raster höchstens 2/255.
`zeichne()` läuft bei jeder Grössenänderung (auch Zoom), die Flächen folgen also der Pixeldichte.

**Pulsieren:** Die einzige endlose Animation im Menü ist `menue-puls` auf `.menue-hervor .menue-lampe::after`, also Opacity
auf einem HTML-Pseudoelement und nicht im SVG. Sie läuft auf dem Compositor und rechnet den Filter nicht neu. Im Trace
«ruhig» (3 s, Zustand «hervor», Puls läuft) gibt es 11–12 `Paint` und 5–6 `RasterTask` insgesamt, vorher wie nachher,
also kein Neuzeichnen je Bild. Darum nichts geändert. Neu gerechnet wird der Filter nur während der 3,2 s des Wachsens
(`stroke-dashoffset` an `.menue-licht`), und das ist die Fläche, die dieses Ticket verkleinert.

**Gefilterte Fläche** (Zustand «mit Stand»: drei begonnene Wege, ein geschaffter, Zeichen der Welt = 5 Filter):

| | vorher | nachher | Anteil |
|---|---|---|---|
| Desktop 1440 × 900, je Bild des Wachsens | 5 × 1 296 000 = 6,48 Mpx | 176×40 + 304×112 + 80×48 + 744×560 + 56×48 = 0,46 Mpx | 7,2 % |
| Handy 393 × 873 bei 2,75 (Gerätepixel) | 5 × 2,60 Mpx = 12,98 Mpx | 172 390 CSS-px² × 7,56 = 1,30 Mpx | 10,0 % |

Gut 90 % der Restfläche entfallen auf den langen, schrägen Weg eines geschafften Grads, dessen Hüllrechteck gross ist.
Ein Filter je Teilstück würde das weiter senken, ändert aber Stösse und Enden der Linie; nicht gemacht.

**Safari (nicht geprüft, Begründung):** WebKit rechnet SVG-Filter (`FEGaussianBlur`, drei Box-Durchgänge) auf der CPU
über ein Bild in der Grösse der Filterregion (in Gerätepixeln, geschnitten mit dem Sichtbaren). Die Arbeit je Bild des
Wachsens wächst mit der Fläche. Auf einem iPhone (393 × 852 bei 3) waren es vorher 5 × 3,0 Mpx ≈ 15 Mpx je Bild, nachher
etwa 1,5 Mpx, also rund ein Zehntel. Dazu kommt weniger Speicher für die Zwischenbilder (je Filter vorher etwa 12 MB RGBA).

**Bilder** (echtes Chrome-Fenster mit GPU, Himmel ausgeblendet, alle Animationen des Menüs angehalten auf t ms nach dem
Öffnen; je Datei vorher | nachher | Differenz × 16 in Rot) unter `tests/output/leistung/menue12/`:
`desktop-<zustand>.png` und `handy-<zustand>.png`, Zustände `frisch`, `mit-stand`, `hervor` (Puls), `geschafft` je bei
600, 1200, 2000 ms (Wachsen) und 5000 ms (fertig), dazu `hervor-6200-puls` (Puls bei 50 %), `mit-stand-5000-auswahl`
(Tastaturfokus), Desktop zusätzlich `mit-stand-5000-hover`, `hervor-1200-hover`.

- Desktop: in allen 20 Zuständen höchstens 3 Pixel mit höchstens 2/255 anders. Ebenso viel weicht der Zustand «frisch»
  ohne jeden Filter ab, das ist also das Rauschen des Prüfstands. Mit ganzzahligen Flächen ohne Raster: zweimal 0 Pixel.
- Handy: in allen Zuständen mit Licht höchstens 2/255 (Wege und Hof, gleichmässig, kein abgeschnittener Saum). Kontrolle
  vorher gegen vorher: 0. Bei normalem Abstand und auch im Zoom nicht zu sehen.
- Einzelne Läufe zeigten in einem Zustand grössere, flächige Abweichungen (Ringe im Verlauf von `.menue::before`, bis
  35/255). Sie traten auch ohne Filter auf und kamen nicht wieder: Rauschen des Prüfstands (Kachel neu gerastert).

**Trace** (Chrome im Fenster mit GPU, Menü öffnen und 3,6 s Wachsen bzw. 3 s ruhig mit Puls, je 4 Läufe vorher/nachher
abwechselnd, Mittel; ms Summe / Anzahl / längster Einzelwert; gemergter Stand mit 11b; Dateien
`tests/output/leistung/menue12/desktop-trace.txt`, `handy-drossel4-trace.txt`):

| Wachsen | Desktop vorher | Desktop nachher | Handy 4× vorher | Handy 4× nachher |
|---|---|---|---|---|
| GPU `DoEndRasterCHROMIUM::Flush` (hier läuft der Blur) | 451 / 407 / 250,5 | 385 / 411 / 14,1 | 486 / 430 / 222,3 | 329 / 437 / 5,1 |
| GPU `RendererRasterWorker` | 1053 / 146 / 263,5 | 977 / 160 / 31,8 | 907 / 131 / 308,0 | 676 / 116 / 35,6 |
| GPU `DoRasterCHROMIUM` | 585 / 407 / 8,2 | 576 / 411 / 15,6 | 404 / 430 / 8,0 | 334 / 437 / 4,6 |
| Renderer `Paint` | 22 / 188 / 2,0 | 23 / 190 / 1,3 | 143 / 196 / 4,1 | 130 / 199 / 3,8 |
| Renderer `RasterTask` | 32 / 407 / 4,4 | 33 / 411 / 0,5 | 24 / 430 / 0,6 | 21 / 437 / 5,1 |

Ruhig (Puls): `Flush` Desktop 22,9 → 13,2 ms (5 → 5 Mal), Handy 35,4 → 16,3 ms (19 → 6 Mal); `Paint` 0,6 → 0,6 bzw.
4,5 → 3,9 ms. Die Rasterarbeit der GPU für das Leuchten sinkt um 15 % (Desktop) bzw. 32 % (Handy). Die einzelnen langen
Raster beim ersten Zeichnen eines Zustands (250 bzw. 222 ms) fallen auf 14 bzw. 5 ms. Paint im Renderer bleibt gleich
(die Aufzeichnung ist billig, gerechnet wird beim Rastern).
Bildzeiten des Wachsens (rAF der Seite) streuen in beiden Ständen stark, weil die Maschine geteilt ist (Takt 56 Hz).
Desktop max vorher 338/460/176/88, nachher 159/477/478/124 ms; Handy 4× vorher 304/107/161/162, nachher
36/429/108/178 ms; p95 überall 18,2–18,6 (vorher Handy einmal 36,5). Nicht schlechter, aber kein klarer Gewinn in den
Bildzeiten. Den Gewinn zeigt die Rasterzeit.

**Tests (gemergter Stand):** `logic` 2033 grün, `golden` grün, `screenshot` grün (Konsole leer), `leerlauf-probe` OK,
`geschichte-probe --start` bestanden, `leistung-probe --fenster --handy --ersatzmass` dreimal «in Ordnung»: Menü ruhig
9/10/11 gez/s, immer `adaptiv 1.00, Umbauten 0`. Der Hänger beim Öffnen des Menüs aus dem Spiel (rund 200–250 ms «ohne
Script, Rendern 0 ms») kommt auch vorher vor (Gegenprobe vor dem Merge: vorher 424 und 19 ms, nachher 249 und 216 ms)
und hängt nicht an diesem Ticket. Er gehört eher zu 13 bzw. 09.

**Berührungspunkte:** Ticket 10 wärmt das Menü über `menu.vorwaermen` → `zeichne()` vor. Schnittstelle und Ablauf sind
unverändert, nur die Filter-Ids im SVG heissen jetzt `${uid}-leuchten-<n>`; wer sie per Selektor sucht, muss das wissen
(im Code tut das niemand). Ticket 16 (Prolog-Bühne) wird nicht berührt.
