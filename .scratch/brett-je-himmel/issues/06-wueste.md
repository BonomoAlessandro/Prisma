# 06: Wüste

**Spec:** ../spec.md

**Blocked by:** 05

**Status:** resolved

**What to build:** Ein Brett für die Wüste.
Die Welt bekommt ihren eigenen Katalog mit 6 bis 8 völlig neuen Richtungen (wie Ticket 03), die dem
Strand nicht ähneln müssen (Entscheid des Nutzers vom 05.11.2026). Der Nutzer wählt eine, sie wird im Spiel gebaut,
fertig gemacht und abgenommen.

- [x] **Katalog:** Vorbilder suchen und eine Vorschauseite mit 6 bis 8 völlig verschiedenen Richtungen für die Wüste
      bauen, wie in Ticket 03: echte Spielbilder mit zur Laufzeit eingesetztem Brett, je 4 Ansichten, Vorbilder mit
      Link, Idee, Raster, Einlegelinie, Spiegelung, Lichtwelle und Kostenhinweise. Der Katalog darf vor Ticket 05
      entstehen (er fasst `index.html` nicht an).
- [x] **Wahl aus dem Katalog:** Der Nutzer wählt eine Richtung, eventuell mit Änderungswünschen. Die Wahl steht unter
      «Comments».
- [x] **Im Spiel:** Die gewählte Richtung wird eine Art von Brett, wie das Gezeitenbecken in Ticket 04. Der Nutzer gibt
      an Bildern Rückmeldungen, bis sie sitzt.
- [x] **Eigene Lichtwelle:** Das Brett bekommt seine eigene Lichtwelle aus seiner Welt, wie die Blumen beim
      Moospolster: Wo der Ring vorbeizieht, passiert etwas auf dem Brett und kommt danach wieder zur Ruhe.
      Die Karte hatte nur warmes Abendlicht, das in den Rillen mitläuft. Das reicht nicht. Zeig dem Nutzer
      Vorschläge, zum Beispiel: Die Strausseneier auf den Türmchen glühen auf, Staub rieselt aus den Rillen, die
      Palmholzbalken werfen kurz lange Schatten, oder ein Schwarm Schwalben steigt auf.
      Die Bildfolge vom 06.11.2026 zeigt den heutigen Stand: https://claude.ai/artifact/SobbUb4scUxKp3dH7FVfqM.
      Wunsch des Nutzers (06.11.2026): Die Lichtwelle soll **nach Sand aussehen**. Zum Beispiel zieht eine Sandwelle oder
      Verwehung über das Feld, Körner wirbeln im Licht auf und rieseln zurück, oder Rippel entstehen und glätten sich
      wieder. Zeig ihm 2 bis 3 Varianten als Bildfolge.
      **Gewählt (06.11.2026): Sandverwehung** (Variante A der Vorschau https://claude.ai/artifact/JpN1KG6cNopn4wGAZrYJ8v).
      Eine Sandfahne treibt in Schlieren nach aussen und lässt Sandzungen zurück, die fortwehen. Am Gesims rieselt Sand
      hinunter. Gesteuert wird alles über die Ankunft des Rings, nicht über seine Stärke. Rund 4000 Körner, geschätzt
      0,6 bis 1,2 ms je Bild auf dem Handy, das wird gemessen. Vorlage: `lichtwelle/varianten/w1-verwehung.js` mit
      `1-welle.js` und `lichtwelle/bretter.js`. Die Ideen mit Strausseneiern, Schatten und Schwalben fallen weg.
      Sie kommt als Bildfolge oder kurzes Video auf die Vorschauseite.
- [x] **Bilder und Leistung:** eine Vorschauseite mit denselben Ansichten wie in Ticket 04 auf Desktop und Handy
      (Spielansicht, flach, ganz heraus, Fall des Lichts beim Einstieg in die Wüste, Lösen). Dazu kommen die Messwerte
      des Bretts, verglichen mit dem Steinbrett.
- [x] **Brett-Angabe:** Die Werte stehen in der Brett-Angabe der Wüste. Das Register wird nur in der Brett-Angabe
      nachgeführt, und das Prüfwerkzeug kennt die Werte.
- [x] **Übergänge:** Auf der Reise vom Meer in die Wüste und von der Wüste zum Vulkan (dieser vorerst mit Steinbrett)
      und beim Wiederholen über diese Weltgrenzen bleibt alles ohne Steinbrett, ohne Löcher und ohne Ruckeln.
- [x] **Leistung:** Die Bildzeit steigt nicht messbar, und der Grafikspeicher bleibt etwa wie heute.
- [x] **Abnahme:** Der Nutzer nimmt über eine Vorschauseite ab, erst dann wird committet.
- [x] Alle Tests sind grün (Logik, offline, Geschichte-Probe), und das Review nach dem Ticket ist gelaufen.

## Hinweise

- **Die Wüste:**
  - Weiche Dünen im Anime-Stil, mit Windrippeln nah am Brett und Schatten in Rosa-Lila.
  - Die Sonne steht flach, bei etwa 17°.
  - Der Grund liegt 4 m unter dem Brett. Die nahen Dünen sind ein 3D-Netz (`bakedMesh` dunes), das in den Sand des
    Panoramas übergeht.
  - Weiter weg liegen die Oase und die Pyramiden.
- Die Wüste lädt ihr Bild erst beim Gebrauch (`vorab: false`). Eine Form aus Blender belastet deshalb die Grenze für
  das vorab Gespeicherte nicht, wohl aber das Budget der Skybox (sie liegt schon nahe an 300 MB Grafikspeicher).

## Comments

**Erste Runde, verworfen (05.11.2026):** Vier Varianten der Rinnen-Idee vom Strand (Wadi mit rieselndem Sand, Oase,
Salzpfanne, Tempelbecken): https://claude.ai/artifact/UeqkywwPtPK2k2rDt7ccHq. Der Nutzer war nicht zufrieden und will
für jede Welt etwas komplett Neues, das dem Strand nicht ähneln muss. Die Dateien sind nicht im Repo,
die Seite bleibt unter dem Link.

**Zweite Runde (06.11.2026):** acht völlig neue Richtungen, https://claude.ai/artifact/18PvQpJeqFYvQZbDkyDR8j:
Fliegender Kelim, Lehmterrasse, Geode, Yardang, Tempelboden, Playa, Meteoreisen und Sandmandala. Quelle, Bilder und
die Skripte, die die Bretter zur Laufzeit bauen (nur gegen 6f322ce), liegen in `katalog-wueste/`.

**Wahl des Nutzers (06.11.2026): Lehmterrasse** (Karte 2), ohne Änderungswünsche:

- Das Brett ist das Dach eines Lehmbaus wie die Moschee von Djenné.
- Das Feld ist glatter Lehmputz mit feinen Rillen als Raster und einer hellen Kalklinie als Einlegelinie.
- Im Rand schauen Ziegel hervor, wo der Putz abgeplatzt ist.
- Unter einem Gesims steht eine eingezogene Lehmwand, aus der Balken aus Palmholz ragen (22 cm).
- Auf den Ecken stehen Spitztürmchen mit einem Straussenei.
- Es gibt keine Spiegelung, Lehm ist matt.
- Die Lichtwelle ist warmes Abendlicht, das in den Rillen des Rasters mitläuft.
- Vorlage: `katalog-wueste/bretter/varianten-wueste2/2-lehm.js` mit `0-hilfe.js` und `bretter.js`. Übernommen werden die
  Formeln und Farben, nicht der Aufbau, wie beim Gezeitenbecken (Ticket 04).
- Zu messen: Balken und Türmchen als Instanzen auf dem Handy.

**Umsetzung (06.11.2026, Branch `feature/brett-06-wueste` im Worktree `prisma-brett-06`, von `feature/brett-je-himmel`
d48d4b1, nicht committet, Review offen)**

- **Art `clay`** (`index.html`, eigener Block «Lehmterrasse» im Brett-Teil nach `stoneBoard`):
  - `BOARD_TYPES = { stone, clay }`. Masse in `CLAY`, Werte in `CLAY_VALUES`.
  - Die Texturen rechnet `clayData` im Hintergrund-Thread (`createClayTextures`, wie beim Steinbrett, ohne Worker im
    Hauptthread). Formeln und Farben stammen aus `2-lehm.js`, die Höhen sind ungerundet:
    - Feld 1024² mit Farbe und Normalen: Putz in zwei Tönen, Kellenstriche, Stroh, im Rand abgeplatzter Putz mit
      Ziegeln und Fugen.
    - Wand 1024 × 128: Putz mit Regenrinnen.
    - Ein Rauheitsbild gibt es nicht, der Katalog hatte überall 0,92.
  - Die Oberfläche nutzt `FLOOR_DETAIL_GLSL` mit breiterer Kalklinie (`iw` 0,02). Es gibt keine Spiegelung
    (`mirror: null`), darum entfällt `renderReflection`, solange nur die Lehmterrasse steht.
  - Gesims über die ganze Breite (9 cm), eingezogene Wand 9,3 × 0,34 m. Instanzen: 132 Balken aus Palmholz, 4
    Spitztürmchen, 4 Strausseneier. Wegen three 0.147 nie aussortiert (`frustumCulled = false`).
  - **Kernquader:** der Quader der Wand (±4,65 m, y −0,433 … 0).
  - **Überblenden** (`setFade`, `fadeVariants`) wie beim Steinbrett:
    - Kommt die Lehmterrasse hinzu, liegt sie oben, durchsichtig, ohne Tiefe, mit `polygonOffset` und `renderOrder −1`.
    - Geht sie, bleiben Feld, Gesims und Wand deckend, bis sie weg ist (sie decken den Kernquader). Türmchen, Eier und
      Balken blenden aus.
- **Lichtwelle «Sandverwehung»**, 1:1 aus `w1-verwehung.js`:
  - Die Uhr (`uWave`) stellt die Oberfläche in `onBeforeRender` aus `shockUniforms`. Solange der Ring läuft, folgt sie
    seinem Radius (auch dem langsameren Ring der Geschichte, `story.shock`), danach läuft sie in Sekunden weiter.
    Gesteuert wird alles über die Ankunft (Abstand / `CELEBRATE.shockSpeed`).
  - Sandzungen und Fahne rechnet der Shader der Oberfläche, nur in ihrem Zeitfenster (Zungen bis 2,5 s nach der
    Ankunft, Fahne bis 0,4 s).
  - Körner (`clayGrains`): 2600 hüpfen mit der Fahne, 1408 rieseln über das Gesims. Gezeichnet werden sie nur, solange
    die Welle läuft (unter 3,2 s), in Ruhe gar nicht.
- **Brett-Angabe:**
  - `tools/blender/szenen/desert/skybox.json`: `board` mit `type: 'clay'` und neun Farben in sRGB 0 … 1 (`plaster` und
    `brick` je zwei Töne, `straw`, `joint`, `gully`, `inlay`, `wood`, `egg`, `sand`). Die Shaderfarben des Katalogs
    (Kalklinie, Sand) sind dafür nach sRGB umgerechnet.
  - Register mit `node tools/blender/pack.mjs --brett desert` nachgeführt (Register `8b66d926` in `sw.js`).
  - `tools/sky-schema.mjs`: `BOARD_PARAMS.clay` (`isSrgb`, `isSrgbPair`), Kopf beschrieben.
- **Schalter `?brett=<art>`** (`BOARD_URL` nach `BOARD_TYPES`, ausgewertet in `boardTheme.prepare`): Unter jedem Himmel
  steht diese Art, mit den Werten des ersten Himmels, der sie hat. Name wie in Ticket 04 (dort `BOARD_URL`, aber in
  `acquire` und ohne Werte), beim Zusammenführen nur eine Fassung behalten. Er fällt mit Ticket 10 weg.
- **Proben:** `brettPasst` in `tests/brett-probe.mjs` und `tests/geschichte-probe.mjs` vergleicht jetzt auch `art` mit
  der Brett-Angabe des Himmels im Register (`soll` im Protokoll je Bild). `brettDerWelt` prüft die Art ebenso, und der
  Netz-Teil der `brett-probe` lädt die echte Lehmterrasse der Wüste.
- `APP_VERSION` `2026-11-06 brett-wueste` (`index.html`, `sw.js`).

**Abnahme des Nutzers (06.11.2026)** über die Vorschauseite https://claude.ai/artifact/3EvUrtRjgyyadrGvWUVbGX. Sie
zeigt Desktop und Handy (Spielansicht, flach, ganz heraus) gegen das Steinbrett und das Katalogbild, die Sandverwehung
und den Fall des Lichts als Film in Echtzeit, das Überblenden und die Messwerte.

- «die bilder und videos aus dem dokument sehen gut aus»
- Die Texturen bleiben bei 1024², die Sandverwehung bleibt, wie sie ist.
- Überblenden: Kommt die Lehmterrasse über einem Steinbrett hinzu, steckt ihre eingezogene Wand mit den Balken bis zum
  Schluss hinter den dunklen Seiten des Steinbretts und erscheint im letzten Bild. Das löst Ticket 05 für alle Formen
  (Vorschlag angenommen).

**Messwerte** (headless mit Grafikkarte, Messwerkzeug `?perf`, Wüste):

- Der Rechner war unruhig: Dieselbe Ansicht schwankte in einer Seite zwischen 8,4 und 11,2 ms Zeichenzeit. Unterschiede
  unter etwa 1 ms sind hier nicht messbar.
- **Im Wechsel in einer Seite** (Median, Lehm / Stein; Ruhe 6 Runden zu 3 s, Welle 3 Lösungen zu 3 s ab dem Start des
  Rings):

  | Ansicht | Ruhe GPU | Ruhe CPU | Welle GPU | Welle CPU |
  |---|---|---|---|---|
  | Desktop 1440 × 900 | 9,25 / 8,91 | 2,53 / 4,12 | 10,34 / 9,86 | 1,92 / 2,37 |
  | Handy 393 × 873, Dichte 2,75, CPU 4× | 9,98 / 9,64 | 37,9 / 46,2 | 12,81 / 10,94 | 30,5 / 34,2 |

  Unterschied der Zeichenzeit in Ruhe je Runde im Median: Desktop +0,32 ms, Handy −0,22 ms. Die CPU-Zeit sinkt, weil
  nichts gespiegelt wird.
- **Leerlauf-Probe** (getrennte Seiten, `--sky "desert&brett=stone"` zum Vergleich), Abschnitt Ruhe, Zeichenzeit
  Mittel / p95 in ms:
  - Desktop: Lehm 9,75 / 11,8 und 9,73 / 11,8, Stein 8,47 / 11,0 und 8,03 / 10,4.
  - Handy mit CPU 4×: Lehm 10,45 / 14,8 und 7,44 / 10,6, Stein 7,39 / 10,3 und 10,44 / 14,6.
  - Die Reaktionsprüfung scheitert headless bei beiden gleich (bekannt seit Ticket 02).
- **Welle stehend** (Desktop, zwei Runden, Lehm / Stein, ms):
  - bei 0,5 s, die Fahne mitten im Feld: 10,2 · 10,4 / 9,0 · 8,9
  - bei 1,0 s, am Rand: 9,9 · 9,7 / 8,8 · 9,3
  - in Ruhe: 9,5 · 9,7 / 9,5 · 9,3

  An ihrer stärksten Stelle kostet die Verwehung also gut 1 ms, für rund 3 s.
- **Grafikspeicher:** Die Lehmterrasse belegt 11,3 MB:
  - Feld, Farbe und Normalen, je 5,3 MB mit Mipmaps
  - Wand 0,7 MB
  - Netze 0,14 MB

  Das Steinbrett hat 16,0 MB und bleibt immer. In der Wüste kommen also 11,3 MB dazu, im Rahmen der drei Bretter der
  Spec.
- **Hochladen:** in 9 Häppchen an ruhigen Stellen.
- **Überblenden** mit Blick aufs Brett (Himmel gesetzt, 2,4 s, wie beim Wiederholen über eine Weltgrenze):
  - Strand → Wüste: längste Lücke 67 ms. Wüste → Vulkan: 97 ms.
  - Keine Löcher im Himmel, unter dem Wüstenhimmel nur die Lehmterrasse.
  - Die Übersicht selbst (`--uebersicht`) prüft nur Wald → Strand.
- **Fall des Lichts beim Einstieg** (Leicht, Platz 20):
  - Der Blick senkt sich 5,6 s (Desktop) bzw. 5,1 s (Handy) nach «Weiter».
  - Im Blick steht nur die Lehmterrasse.

**Tests:**

- `node tests/logic.test.mjs`: 2040 bestanden. Neu ist der Test «Wüste mit der Lehmterrasse (clay); die Prüfung lehnt
  ungültige und fehlende Farben ab» (Farbe über 1, unter 0, zwei Werte, Putz ohne zwei Töne, drei Ziegeltöne, fehlende
  Farbe, unbekannter Wert).
- `tests/offline.mjs`: bestanden. Die Wüste meldet online und offline `clay`.
- `tests/brett-probe.mjs`: Netz und Menü bestanden.
  - Netz: Die Wüste lädt ihre Lehmterrasse, `art` wie im Register. Der Blick senkte sich 11,6 s nach «Weiter» auf das
    bereite Brett; der Himmel war nach 8 s noch nicht ganz da.
  - In der Mechanik scheitert weiter die Lückenprüfung «Brett laden und überblenden» (Wald → Strand mit dem
    Probe-Brett, das erste Bild des Strand-Panoramas), wie schon im Review von Ticket 02 (107 / 103 ms). In fünf
    Läufen: 109, 164, 115, 103 und 115 ms. HEAD als Kopie: 67, 97, 85 und 91 ms.
  - Die Lehmterrasse wird in diesem Teil nicht gebaut: Eine Kopie mit einer Meldung in `clayBoard` blieb stumm und
    mass 48 ms. Alle übrigen 19 Prüfungen sind grün, auch mit `art`.
- Geschichte-Probe `--grad leicht --welten 3` (GPU): bestanden. Die Wüste zeigt in jedem Level die Lehmterrasse, und
  die Reise zum Vulkan läuft mit.
- Zusätzlich Geschichte-Probe `--ganz --grad leicht` (Reisen mit Bildzeiten und Neuladen in der Wüste):
  - **Erster Lauf:** alle Prüfungen zum Brett grün, auch `art`. Lücken über 100 ms gab es beim Einstieg in den Wald
    (111 ms), auf der Reise ans Meer (294 ms), auf der Reise in die Wüste (103 ms, beim Herauswachsen des Levels,
    Blick noch im Himmel) und bei Epilog → Menü (109 ms).
  - **Zweiter Lauf:** bestanden. Reise in die Wüste 48 ms, Neuladen in der Wüste 12 ms, Reise zum Vulkan 73 ms.
  - **HEAD als Kopie im Vergleich:** scheiterte selbst an der Reise zum Vulkan (210 ms). Die Lücken schwanken auf
    diesem Rechner in beiden Fassungen.
- Zeilenenden CRLF wie zuvor, `git diff --stat` ohne ganze Dateien.

**Offen:**

- **Schatten der Türmchen:** Die Türmchen werfen keinen Schatten aufs Brett, anders als im Katalog. Schatten werden
  nur bei `markShadowsDirty` neu gerechnet. Instanzen mit `castShadow` bräuchten ein eigenes Tiefenprogramm, das erst
  beim Schattenbild übersetzt würde. Der Nutzer hat dazu nichts gesagt, also bleibt es vorerst ohne Schatten.
- Die eingezogene Wand erscheint beim Überblenden über einem Steinbrett erst im letzten Bild (Ticket 05).
- Die Kosten auf dem echten Handy, vor allem die der Welle (Körner), misst der Poco-Test am Ende (Ticket 10).

**Review (06.11.2026, unabhängig, gegen d48d4b1):** passt, keine Auflagen.

- **Lücke «Brett laden und überblenden» (brett-probe, Mechanik):** Sie kommt nicht von diesem Ticket.
  - Abwechselnd gemessen, dieselbe Probe gegen je eine Kopie von HEAD und dieser Fassung: HEAD 115, 115 und 61 ms,
    Lehmterrasse 109, 97 und 73 ms, im Worktree dazu einmal 127 ms. Die Streuung ist in beiden Fassungen gleich gross,
    die tieferen HEAD-Werte des Umsetzers waren Zufall.
  - Die Lücke liegt in beiden Fassungen an derselben Stelle, 1,3 bis 1,4 s nach dem Tor, in den ersten Bildern, in
    denen das Strand-Panorama zu sehen ist (Anteil 0,015 → 0,057). Das Brett ist da längst hochgeladen.
  - Ursache laut Profil: Das Wasser des Strands rechnet in diesem Moment den Ersatz für verdeckten Grund
    (`groundShift`, waterSurface, `ctx.later`). Einzelne Schritte dauern weit über `SLICE_MS` (6 ms), unter der
    CPU-Grenze von `leise.sh` zusammen 60 bis 90 ms. Das gehört zur Skybox des Strands, nicht zum Brett.
- **Geprüft:**
  - Das Steinbrett ist unverändert, nur `BOARD_TYPES` ist erweitert.
  - Kernquader ±4,65 m, y −0,433 … 0, innerhalb des Umrisses (±4,9 m). Wand (Seiten, Boden), Gesims und Oberfläche
    decken ihn. Der Spalt von 3 mm zwischen Oberfläche und Gesims liegt über dem um 1 cm verkleinerten Quader.
  - Eigene Bilder in der Wüste, ganz flach und ganz heraus (Azimut 0 und 0,8): keine Löcher, nur die Lehmterrasse.
  - Freigeben: alle Geometrien (auch Instanzen und Körner), sieben Materialien, drei Texturen samt den eigenen
    WebGL-Texturen aus `boardTextureUpload`.
  - Ruhe: Die Körner sind in Ruhe aus, 0,5 s nach `story.shock` an und nach 4,5 s wieder aus (in der Seite geprüft).
    Die Welle in der Oberfläche liegt hinter einer Bedingung auf Uniforms.
  - Vorab übersetzt wird alles, auch Unsichtbares und die Instanzen (mit Instancing). Die durchsichtigen Programme der
    Fassung «oben» decken auch das Ausblenden von Türmchen, Eiern und Balken.
  - Register: `pack.mjs --brett desert` in einer Kopie ergibt dasselbe `skies.js` und `SKIES` `8b66d926`. Neu ist nur
    `board` der Wüste. `boardTypes` liest `stone, clay`, `APP_VERSION` ist an beiden Stellen gleich.
  - Proben: `soll` und `art` in `brettPasst` und `brettDerWelt` stimmen, auch unter Milchstrasse und Sonnensystem.
- **Behoben:** `sw.js` (ganz LF) und `tools/blender/szenen/desert/skybox.json` (gemischt) haben wieder CRLF wie die
  übrigen Dateien. Inhaltlich ist nichts geändert.
- **Hinweise:**
  - `createClayTextures` ist fast eine Kopie von `createStoneTextures` (Worker, Texturen, Notfall). Mit jeder Art
    kommt eine dazu. Nach dem Zusammenführen von 04 und 06 lohnt sich ein gemeinsamer Helfer.
  - Wird die Lehmterrasse freigegeben, bevor der Worker fertig ist, rechnet er weiter, weil `dispose` ihn nicht
    beendet. Das ist harmlos, kostet auf dem Handy aber unnötig Zeit. Auch das gehört in den gemeinsamen Helfer.
  - `FLOOR_DETAIL_GLSL.replace('float iw = 0.011;', …)` wirkt nicht mehr, ohne zu melden, wenn sich die Zeile beim
    Steinbrett ändert.
- **Tests im Review:**
  - Logik: 2040 bestanden. KI-Tester: 84 bestanden.
  - Offline: bestanden, die Wüste meldet `clay`.
  - Geschichte-Probe mit GPU, `--grad leicht --welten 3`: bestanden.
  - Brett-Probe: Netz und Menü bestanden (der Blick senkt sich nach 7,6 s auf die bereite Lehmterrasse). In der
    Mechanik ist alles grün bis auf die vorbestehende Lücke von oben (127 ms).
