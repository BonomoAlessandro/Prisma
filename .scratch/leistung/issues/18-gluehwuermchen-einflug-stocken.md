# 18: Glühwürmchen ohne Stocken, Bühne ohne fehlenden Hintergrund

**Spec:** ../spec.md

**Blocked by:** 15 (Flug als Web Animation), 16 (Bühne in Abschnitten, Linien)

**Status:** bereit für den Handy-Durchlauf (Poco); offen: Öffnen der Bühne, erstes Bild nach dem Tippen

**What to build:** Zwei Befunde des Nutzers auf dem Poco F4 GT:

1. Handy-Durchlauf 3 (`leistung-08`): «Die Glühwürmchen stocken noch ein wenig beim Einflug in den Wald.»
   (Einstellung 6, «Denn Licht …», Fahrt 5,5 s.) Der Flug läuft seit Ticket 15 als Web Animation im Compositor; die
   rAF-Messung der Karte sieht ein Stocken dort womöglich nicht.
2. Nachtrag (`leistung-08d`, höherer Vorrang, weil sichtbar): «In der Szene, als die Glühwürmchen zu Noa fliegen,
   fehlten Teile des Hintergrunds.» (Einstellung 5, «Da blinkt …», Fahrt 4 s.)
3. Nachtrag (`leistung-09`): «Das Spiel mit 30 fps läuft super und glatt. Nur hatte ich in den Noa-Szenen noch immer ein
   paar Ruckler.» Gemeint ist die Bühne allgemein (60/s): ganzer Prolog, Kapitelszenen zwischen den Welten, Finale,
   Epilog. Reihenfolge: zuerst der fehlende Hintergrund, dann die Ruckler.

Karte Durchlauf 3, Prolog: Hänger 106 ms bei 15,9 s («FrameRequestCallback → frame: Script 5 ms, Rendern 8 ms»),
66 ms bei 22,9 s, 69 ms bei 28,2 s («ohne Script, Rendern 63 ms»); Startbildschirm 101 ms bei 6,9 s (ohne Script).
Karte 08d: Prolog p95 16,6 ms, max 65,7 ms bei 29,5 s, Hänger 64 ms bei 37,6 s (`DIV#story.onclick`, Script 44 ms).

**Vorgehen:** Trace im Fenster mit Handy-Emulation und Drossel 4: Compositor- und Raster-Ereignisse, Style/Layout im
Hauptthread während des Flugs, Animationen, die in den Hauptthread fallen, Ebenenwechsel und Rasterung der Wald-Ebene
beim Einflug, Tausch der Linien (`ruheNachHalt`, `.linie.aus`). Für den fehlenden Hintergrund dieselbe Szene mit
kleinem Budget der Grafik (`--force-gpu-mem-available-mb` 512, 384 und kleiner), Screencast-Einzelbilder, Vergleich mit
`leistung-07c` (`68640a5`).

- [x] Ursache des fehlenden Hintergrunds belegt (Trace, Einzelbilder) und behoben, ohne die Optik zu ändern.
- [x] Ruckler der Bühne (Prolog, Kapitelszenen, Finale, Epilog) mit Trace Handy ×4 gesucht: Compositor-Ausfälle,
      Raster, Neuaufbau von Ebenen, Style/Layout, Hänger wie `DIV#story.onclick`, Bild-Dekodierung, Shader im GPU-Prozess.
- [x] Ursache des Stockens belegt und behoben, ohne die Optik zu ändern; Vorher/Nachher-Einzelbilder und Trace.
- [ ] Desktop und Handy auch mit `--force-gpu-mem-available-mb=512`: keine Ebene fehlt, kein Flackern. (Handy erfüllt;
      Desktop maximiert 4K hält 512 MB weder vorher noch nachher, sein normales Budget ist 1024 MB.)
- [x] Tests grün: logic, golden, screenshot, `geschichte-probe --start` und `--handy`,
      `leistung-probe --fenster --handy --ersatzmass`; keine Warnung «Weckstelle fehlt».
- [ ] Poco (nächster Handy-Durchlauf): Einstellungen 5 und 6 ohne fehlenden Hintergrund, Glühwürmchen ruhig.

## Comments

### 02.11.2026 – Fehlender Hintergrund (Branch `leistung/18-gluehwuermchen`, Fix `396b4b5`)

**Messaufbau:** echtes Chrome im Fenster, Quadro T2000, Handy-Emulation 393 × 873 (2,75, Android-Kennung), CPU 4×, ohne
`?perf`, Prolog wie ein neuer Spieler (2,5 s Lesezeit), Trace samt Screencast jedes Bildes; Budget der Grafik über
`--force-gpu-mem-available-mb`; «vorher» = `562995f`, Vergleich `leistung-07c` (`68640a5`). Skripte und Bilder im
Scratchpad unter `18/` (`prolog.mjs`, `fahrten.mjs`, `blatt2.mjs`, `schicht.mjs`, `achse.mjs`, Bilder in `18/out/`).

**Nachstellen:** Mit 512, 384, 256 und 192 MB fehlt in der Emulation in Einstellung 5 nichts, weder vorher noch in 07c
(auch nicht mit Software-Raster oder gemeldetem Speicherdruck). Erst mit 128 MB kommt genau das Bild des Nutzers: Im Flug
zu Noa fehlen ganze Rechtecke von Himmel und Bergwald (`out/blatt5-v-m128.png`), vorher sogar im Halt über Sekunden; 07c
bricht dort ebenso ein (`blatt5-c-m128.png`). Chrome auf Android gibt der Seite höchstens 256 MB für Kacheln und nutzt
davon im Normalfall nur einen Teil; Speicherdruck anderer Apps drückt das weiter. Die Bühne lag also auf dem Poco nahe an
dieser Grenze, und wann sie darüber kommt, hängt vom Gerät ab (in `08` nicht gesehen, in `08d` schon).

**Ursache, belegt mit Schnappschüssen des Compositors** (`schicht.mjs`, Kachelspeicher je Ebene): Chrome rastert eine
Ebene mit laufender transform-Animation nie unter Massstab 1, also in 1 Gerätepixel je Mass der Szene. Im Hochformat sind
die fernen Ebenen aber viel kleiner zu sehen (Himmel etwa 0,48, ferne Berge 0,5–0,6): Der Himmel allein belegte
56–67 MB (sichtbar nötig gut ein Viertel), die fernen Berge 28–44 MB. Kachelspeicher der Bühne Handy ×4: vorher
163–216 MB, 07c 151–213 MB.

**Fix:** Der Inhalt jeder Ebene liegt in `.inhalt`; für Himmel, ferne Berge und Bergwald (`MASSSTAB_P` = 0,5) ist er um
k verkleinert (kleinste Skalierung der Folge, `massstab`), und die Animation der Ebene skaliert um 1/k mehr (`pose`). Die
Animation fällt so nie unter 1, und Chrome rastert diese Ebenen in der grössten Auflösung, in der sie zu sehen sind. k
wird nur beim Anlegen der Folge gesetzt (verborgen oder nach Drehen). Die nahen Ebenen bleiben wie bisher: Mit k rasterte
Chrome dort die Teil-Ebenen (Überlappung) bei jedem Zoom einer Fahrt neu (Zwischenstand mit allen Ebenen: fehlende Kacheln
in den Fahrten Handy ×4 4–17 statt 1–5).

**Messung Handy ×4** (Kachelspeicher je Ruhepunkt R und mitten in der Fahrt F, MB):

| | R1 | F2 | R2 | F3 | R3 | F4 | R4 | F5 | R5 | F6 | R6 | Angebot |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| vorher | 215 | 216 | 164 | 184 | 173 | 183 | 202 | 202 | 182 | 202 | 203 | 203 |
| 07c | 210 | 213 | 159 | 155 | 151 | 166 | 192 | 192 | 176 | 192 | 194 | 194 |
| nachher | 127 | 124 | 97 | 122 | 108 | 107 | 126 | 126 | 113 | 137 | 114 | 114 |

Ganzer Speicher der Grafik (`used_bytes`) mit normalem Budget: vorher 390–469 MB, nachher 236–331 MB. Gerasterte Kacheln
in Fahrt 5/6: vorher 187/174, nachher 130/222; Bilder mit fehlenden Kacheln je Fahrt wie vorher (0–5).

**Budget 128 MB, Einstellung 5** (Screencast, `out/blatt5-*-m128.png`): vorher 65 gezeigte Bilder in der Fahrt, Himmel
und Bergwald fehlen über Sekunden, auch im Halt; nachher 230 Bilder, ganzes Bild bis auf einzelne Bilder am Start der
Fahrt. (128 MB liegt knapp unter dem, was die Bühne jetzt braucht; die Läufe streuen dort stark.)
**Budget 512 MB:** Handy ×4 alle sechs Einstellungen ohne auffälliges Bild (kein Bild dunkler als beide Nachbarn,
`out/blatt-n-h512-*.png`). Desktop maximiert (1536 × 729, 2,5; normales Budget dort 1024 MB) hält 512 MB weder vorher
noch nachher: vorher brechen Fahrt 2 und 5 ein (105 bzw. 60 Bilder), nachher Fahrt 6 (64 Bilder). Auf dem Desktop bringt
der Fix wenig (quer ist die Skalierung nahe 1), dort ändert sich nichts Wesentliches.

**Aussehen:** `buehne-messung bilder` (Ruhepunkte eingefroren, Desktop, Handy, quer, klein) vorher/nachher: höchstens
0,17 % der Pixel > 24/255 anders, mittlere Abweichung ≤ 0,36 (Ruhepunkte 6/7: Glühwürmchen); im echten Prolog
(Bildschirmfotos je Ruhepunkt nach dem Halt und 1,7 s danach, Handy, Fahrt mit Animation) Ruhepunkte 1–4 ≤ 0,12 %,
mittel ≤ 0,47; 5/6 bis 1,1 % (Glühwürmchen, Rauch, Funkeln zu anderer Zeit). Mit dreifachem Kontrast vergrössert
(`out/crop-1b.png`, `crop-4b.png`): Die kleinsten Sterne sind minimal weicher (vorher aus doppelter Auflösung
verkleinert, mit leichtem Treppenmuster in der Milchstrasse, das jetzt fehlt); bei normalem Abstand nicht zu sehen.

**Verworfen** (gemessen, ohne Nutzen): Satz und Hinweis dauerhaft als eigene Ebene (`will-change`), Flug der
Glühwürmchen schon ab dem Tippen aktiv statt ab dem Abflug. Die gemalten Bilder mitten in den Fahrten (0,6/0,9/1,7 s,
Ende der Übergänge von Satz und Hinweis) blieben, und die Kacheln dort sind das normale Nachrastern neuer Fläche.

**Tests** (gemergt mit `leistung-09`, `01e7447`): logic, golden, screenshot, `geschichte-probe --start`, `--handy`,
`leistung-probe --fenster --handy --ersatzmass`: alle exit 0, keine Warnung «Weckstelle fehlt».

### 02.11.2026 – Ruckler: Zwischenstand (Diagnose, Vorschlag)

**Glühwürmchen im Flug (Handy ×4, Trace):** Der Compositor zeigt in den Fahrten 5 und 6 jedes Bild (Abstand max 17,5 ms
vorher, 18,7 ms nachher, kein Abstand > 50 ms); keine Animation der Bühne fällt in den Hauptthread (einzige
`compositeFailed` sind die Uhren der Fahrten ohne Ziel). Im Hauptthread läuft jedes Bild ein BeginMainFrame (rAF des
Messwerkzeugs bzw. der Probe und die Tweens in `frame`): Stil der rund 90 laufenden Animationen, p50 22 ms vorher, 14 ms
nachher bei 4×; die meisten ohne Commit, für den Compositor folgenlos. In der Emulation ist also kein Stocken des Flugs zu
sehen; auf dem Poco dürfte es der Grafikprozess sein (Rastern auf dem Adreno neben dem Zeichnen), den dieser Fix entlastet
(Rasterfläche der fernen Ebenen etwa ein Viertel).

**Stellen mit Last, die auch auf dem Poco sichtbar sein können:**
- **Tippen** (`DIV#story.onclick`, Poco 44 ms Script bei 37,6 s in 08d): Satz, `act` (Flüge der 16 Glühwürmchen als
  Keyframes, Spuren des Strahls) und `moveTo` in einer Aufgabe, bei 4× 460–630 ms; das erste Bild danach malt 46–72 ms
  (4×) und zeigt Bilder mit fehlenden Kacheln. Die Fahrt beginnt also verspätet und mit einem dicken Commit.
- **Halt** jeder Fahrt: Umstellen der Glühwürmchen und gestaffelte Linien/Abschnitte, Hauptbild bis 107 ms (4×, Paint 47).
- **Öffnen** der Bühne: GPU-Raster 54 ms und eine Lücke bis 350 ms beim ersten Bild (bekannt aus Ticket 16).
- Poco-Hänger aus Durchlauf 3: Der Prolog begann nach rund 691 Bildern Startbildschirm, etwa bei 12,5 s; 15,9 / 22,9 /
  28,2 s liegen so etwa 3,4 / 10,4 / 15,7 s danach, also in den Einstellungen 1–3, nicht im Einflug (Fahrt 6 beginnt bei
  normalem Lesen frühestens nach etwa 25 s). Der Hänger im Startbildschirm (6,9 s) liegt vor dem Prolog.

**Vorschlag (nächste Schritte):** (1) Auf dem Poco selbst messen: `chrome://inspect` → Performance-Trace eines Prologs
(Fahrten 1, 5, 6, Kapitelszene, Epilog), weil die Emulation auf der Quadro keine Ausfälle des Compositors zeigt. (2) Arbeit
beim Tippen aus dem Bild nehmen: Flüge und Spuren der nächsten Einstellung im Ruhepunkt davor gestaffelt vorbereiten
(angehalten), beim Tippen nur starten. (3) Den Halt entlasten (Umstellen der Glühwürmchen später, ausserhalb der ersten
Sekunde). (4) Kapitelszenen, Finale und Epilog mit derselben Probe (`prolog.mjs --epilog`, Kapitel noch zu bauen) Handy ×4
durchsuchen. Nicht erledigt in diesem Stand: Kapitelszenen, Finale, Epilog; Bild-Dekodierung und Shader im GPU-Prozess.

### 02.11.2026 – Review 396b4b5 und Ruckler, Zwischenstand 2 (`35f16dc`)

**Aus dem Review:** Kommentar in `massstab` richtiggestellt (im Himmel liegen die eigenen Ebenen von Funkeln und
Polarstern, keine aus Überlappung). k ändert erst, wenn es um mehr als 5 % abwiche (`MASSSTAB_TOLERANZ`): Adressleiste
ein/aus im Querformat malt die fernen Inhalte nicht mehr neu.

**1. Tippen.** Gemessen, wohin die Zeit geht (Wrapper um `act`, `moveTo`, `zeichne`, `flugAnlegen`; Mikromessung je
fünfmal, Median, Drossel 4): Beim Tippen in Einstellung 5/6 legt `zeichne` 16 Flüge an, je bis 180 Keyframes für Ort und
Grösse; zwei Drittel davon ist `element.animate` (Keyframes einlesen), der Rest das Rechnen. Das erste Bild danach startet
diese Animationen im Compositor (Malphase 46–72 ms). Vorbereiten im Ruhepunkt davor geht nicht genau: Die Keyframes hängen
über das Schwingen von der Zeit des Tippens ab, eine Verschiebung gäbe beim Halt einen Sprung. Stattdessen:
- **Grösse im Flug** als ein Keyframe-Paar mit `cubic-bezier(1/3, 0, 2/3, 1)`, das ist genau 3u² − 2u³ (`smooth01`), statt
  30 Keyframes je Sekunde: halbiert die Keyframes beim Sammeln.
- **Flüge gestaffelt** (`flugStaffel`): beim Tippen nur die vier mit dem frühesten Abflug, die übrigen je vier pro Bild.
  Genau gleich, weil keines vor 0,3 s (Tragen) bzw. 0,6 s (Sammeln) abfliegt und ein Flug bis zum Abflug ohnehin an der
  Mitte seines ruhigen Orts steht. Im Screencast fliegen alle wie vorher (`out/blatt6-t-m1.png`).
- Mikromessung `act` (ms, Drossel 4, je zweimal): Sammeln 86 / 108 → 15 / 17, Tragen 105 / 116 → 25 / 26, Lampe 20 / 23 →
  17 / 19. Die übrige Arbeit verteilt sich auf die nächsten drei Bilder (je etwa 25 ms bei 4×).
- Ganzer Prolog mit Trace (Trace kostet bei Script viel; Aufgabe beim Tippen, ms): vorher Einstellung 5 332 / 430, 6 261 /
  270; nachher 74 / 80 im ruhigen Lauf (ein zweiter Lauf neben fremder Last: 222 / 130, dort waren auch die unveränderten
  Einstellungen 1–4 doppelt so lang). Der Compositor zeigt in den Fahrten 5/6 weiter jedes Bild (max 18,7 ms).
- Nicht erreicht: kein langes Bild mehr nach dem Tippen. Das erste Bild nach dem Tippen bleibt 30–90 ms (4×). Es startet
  die Fahrt der Ebenen im Compositor (`currentTime` der Folge, je Ebene Hunderte Keyframes) und die ersten Flüge. Weniger
  ginge nur mit weniger Keyframes der Kamerafahrt (Translate liesse sich mit den Kurven von `storyEase` genau in drei
  Keyframes je Fahrt fassen, der Zoom nicht; dafür bräuchte jede Ebene eine zweite animierte Ebene darin). Noch nicht
  gebaut.

**2. Halt.** Nach jeder Fahrt stellte `zeichne` alle 16 Glühwürmchen in einem Bild um (Flug weg, Schwingen neu, Ort).
Jetzt `wurmStaffel`: vier je Bild (die Flüge reichen `NACHLAUF` über die Ankunft). Längstes Hauptbild im Halt bis 0,6 s
danach, Drossel 4, je zwei Läufe: Einstellung 5 vorher 43 / 85, nachher 33 / 41 (bzw. 73 neben Last); 6 vorher 44 / 48,
nachher 40 / 58. Ziel ≤ 50 ms im ruhigen Lauf erreicht, unter Last nicht immer.

**3. Öffnen der Bühne** (dreimal vorher und nachher im Wechsel, Handy ×4, `oeffnen.mjs`): in beiden Ständen gleich:
GPU-Raster 35–64 ms beim ersten Bild, in einem von drei Läufen ein Present-Hänger im GPU-Prozess von 250–290 ms
(`DXGISwapChainImageBacking::Present`, die Grafikkarte ist mit dem ersten Rastern und Zeichnen der ganzen Bühne beschäftigt).
Sichtbar? Im Screencast steht das Menü bis 0,37 s nach dem Satz, dann folgt ein Stand von 300 ms, dann erscheint die Bühne
(Helligkeit 37 → 20 in einem Schritt). Der Hänger liegt also vor dem ersten Bild der Bühne. Zu sehen ist er als
verzögertes Öffnen (das Menü bleibt stehen), nicht als Ruckeln einer Fahrt. Nicht behoben. Vorschlag: Prüfen, ob der
Übergang Menü → Bühne (Leuchtfilter des Menüs aus Ticket 12 über der einblendenden Bühne) die Grafikkarte so belastet.

**Tests** (`35f16dc`): logic, golden, screenshot, `geschichte-probe --start`, `--handy`, `leistung-probe --fenster --handy
--ersatzmass`: exit 0, keine Warnung «Weckstelle fehlt». Bildschirmfotos je Ruhepunkt vorher/nachher (Handy, echter
Prolog): Ruhepunkte 1–4 ≤ 0,05 % der Pixel anders, mittel ≤ 0,46; 5/6 ≤ 0,71 % (Glühwürmchen, Rauch zu anderer Zeit).

**Offen:** 4. Kapitelszenen, Finale, Epilog; das erste Bild nach dem Tippen; Öffnen.

### 02.11.2026 – Epilog und Abschluss

**Umfang (Reviewer):** Die Bühne nutzen nur Prolog und Epilog (`playScene`); Kapitelszenen und Finale nicht. Geprüft
also der Epilog, Handy ×4 mit Trace (`prolog.mjs --epilog`, vorher `e-v`, nachher `e-n…`).

**Befund:** Im Epilog fliegen keine Glühwürmchen (sie bleiben am Waldrand), Tippen und Halt sind klein (Aufgabe beim
Tippen 35–130 ms bei 4× unter Trace, Halt 20–51 ms). Auffällig war eine andere Stelle: Am Start der dritten Fahrt
(«Noa lacht …», `act answer`) hielt das Rastern im Grafikprozess die Anzeige 85–93 ms an (vorher und nach dem Fix des
Hintergrunds gleich, Viz-Lücke 77–96 ms). Ursache: Der Strahl (Kegel, Keile, Maske) wurde erst mit der Animation seiner
Kraft beim Tippen eine eigene Ebene und dann ganz gerastert. Die Länge zu setzen allein half nicht, und eine ganz
durchsichtige Ebene rastert Chrome nicht.

**Fix:** `sc.vorbereiten(name)`, aufgerufen von `playScene` im Ruhepunkt vor der Einstellung (nach `ruheNachHalt`):
Für `answer` bekommt der Strahl dort schon seine Länge und wird mit `.vor` (`will-change: opacity`) eine eigene Ebene mit
Deckkraft 0,002 (wie `.linie.bereit`). `act` und `reset` setzen die Kraft wie bisher über die Spur. Danach liegt das
Rastern (86–94 ms) im Ruhepunkt, wo nichts fährt; am Start der dritten Fahrt kein Raster über 18 ms und keine Viz-Lücke
mehr (zwei Läufe). Im Prolog hat die Lampe (Einstellung 3) dasselbe Muster schwächer (GPU-Raster 30–43 ms am Start der
Fahrt). Dort wächst der Strahl aus 0, eine Vorbereitung ginge nur mit anderer Optik am Anfang; nicht angefasst.

**Tests** (Stand mit Epilog-Fix): logic, golden, screenshot, `geschichte-probe --start`, `--handy`, `--grad leicht
--welten 2 --finale leicht` (bis in den Epilog), `leistung-probe --fenster --handy --ersatzmass`: alle exit 0, keine
Warnung «Weckstelle fehlt».

**Offene Punkte (bewusst nicht jetzt):** Öffnen der Bühne (Present-Hänger vor dem ersten Bild, vermutlich Leuchtfilter des
Menüs über der einblendenden Bühne); das erste Bild nach dem Tippen (Start der Kamerafahrt im Compositor, nur mit
zerlegter Fahrt kleiner, vom Koordinator zurückgestellt); Lampe im Prolog (siehe oben).

**Für den Nutzer auf dem Poco:** Einstellung 5 («Da blinkt …») ohne fehlenden Hintergrund, Glühwürmchen beim Flug zu Noa
und in den Wald ruhig, Noa-Szenen ohne Ruckler beim Tippen und im Halt, Epilog «Noa lacht …» ohne Stocken am Start.
